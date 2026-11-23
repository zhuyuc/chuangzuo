const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DATA = process.env.LY_DATA_DIR || path.join(ROOT, "data");
const ACCOUNTS_DIR = path.join(DATA, "accounts");
const SESSIONS_FILE = path.join(DATA, "sessions.json");
const INDEX_FILE = path.join(DATA, "accounts-index.json");
const MASTER_KEY_FILE = path.join(DATA, "master.key");
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

function ensureBase() {
  fs.mkdirSync(ACCOUNTS_DIR, { recursive: true });
  if (!fs.existsSync(MASTER_KEY_FILE)) {
    fs.writeFileSync(MASTER_KEY_FILE, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
    try { fs.chmodSync(MASTER_KEY_FILE, 0o600); } catch (error) { /* Windows 权限模型差异，只告警不阻断 */ }
  }
}
function masterKey() {
  ensureBase();
  return Buffer.from(fs.readFileSync(MASTER_KEY_FILE, "utf8").trim(), "hex");
}
function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${enc.toString("hex")}`;
}
function decryptSecret(payload) {
  if (!payload) return "";
  const [, iv, tag, data] = String(payload).split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(data, "hex")), decipher.final()]).toString("utf8");
}
function maskSecret(key) {
  if (!key) return "";
  return key.length <= 8 ? "****" : `${key.slice(0, 3)}****${key.slice(-4)}`;
}
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) { return fallback; }
}
function writeJsonAtomic(file, value) {
  const tmp = `${file}.tmp`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, file);
}
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}
function loadIndex() { ensureBase(); return readJson(INDEX_FILE, {}); }
function saveIndex(index) { writeJsonAtomic(INDEX_FILE, index); }

function accountDir(accountId) { return path.join(ACCOUNTS_DIR, accountId); }
function workDir(accountId, workId) { return path.join(accountDir(accountId), "works", workId); }
function safeId(value) { return /^[A-Za-z0-9_-]{1,64}$/.test(String(value || "")); }

// 账户标识：邮箱按小写归一，用户名保留原样大小写
function normalizeAccount(raw) {
  const value = String(raw || "").trim();
  return value.includes("@") ? value.toLowerCase() : value;
}
function isValidAccount(value) {
  const v = String(value || "").trim();
  if (!v) return false;
  if (v.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  return v.length >= 2 && v.length <= 32 && !/\s/.test(v);
}

function createAccount(email, password, profile) {
  ensureBase();
  const index = loadIndex();
  const key = normalizeAccount(email);
  if (index[key]) return { error: "exists" };
  const accountId = `acc_${crypto.randomBytes(6).toString("hex")}`;
  const salt = crypto.randomBytes(8).toString("hex");
  const account = {
    id: accountId,
    email: key,
    name: profile?.name || key.split("@")[0],
    penName: String(profile?.penName || "").trim(),
    revision: 0,
    createdAt: new Date().toISOString(),
    password: { salt, hash: hashPassword(password, salt) },
    ai: { enabled: true, configured: true, provider: "OpenAI 兼容", model: "longyin-mock-1", baseUrl: "", includeText: true, apiKeyEnc: "" }
  };
  fs.mkdirSync(accountDir(accountId), { recursive: true });
  writeJsonAtomic(path.join(accountDir(accountId), "account.json"), account);
  index[key] = accountId;
  saveIndex(index);
  return { account };
}
function findAccountByEmail(email) {
  const index = loadIndex();
  const accountId = index[normalizeAccount(email)];
  if (!accountId) return null;
  const account = readJson(path.join(accountDir(accountId), "account.json"), null);
  return account && account.id === accountId ? account : null;
}
function getAccount(accountId) {
  if (!safeId(accountId)) return null;
  return readJson(path.join(accountDir(accountId), "account.json"), null);
}
function verifyPassword(account, password) {
  return account?.password && hashPassword(password, account.password.salt) === account.password.hash;
}
function updateAccount(accountId, patch) {
  const account = getAccount(accountId);
  if (!account) return null;
  Object.assign(account, patch);
  writeJsonAtomic(path.join(accountDir(accountId), "account.json"), account);
  return account;
}

function createSession(accountId) {
  ensureBase();
  const sessions = readJson(SESSIONS_FILE, {});
  const token = crypto.randomBytes(24).toString("hex");
  sessions[token] = { accountId, expiresAt: Date.now() + SESSION_TTL_MS };
  writeJsonAtomic(SESSIONS_FILE, sessions);
  return token;
}
function sessionAccount(token) {
  const sessions = readJson(SESSIONS_FILE, {});
  const entry = sessions[token];
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.accountId;
}
function destroySession(token) {
  const sessions = readJson(SESSIONS_FILE, {});
  if (sessions[token]) { delete sessions[token]; writeJsonAtomic(SESSIONS_FILE, sessions); }
}

function chapterFile(accountId, workId, chapterId) {
  return path.join(workDir(accountId, workId), "chapters", `${chapterId}.md`);
}
function readWork(accountId, workId) {
  if (!safeId(workId)) return null;
  const project = readJson(path.join(workDir(accountId, workId), "project.json"), null);
  if (!project || !project.data) return null;
  const text = {};
  for (const chapter of project.data.chapters || []) {
    if (!safeId(chapter.id)) continue;
    const file = chapterFile(accountId, workId, chapter.id);
    text[chapter.id] = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  }
  project.data.text = text;
  return project;
}
function persistWork(accountId, workId, work) {
  const dir = workDir(accountId, workId);
  fs.mkdirSync(path.join(dir, "chapters"), { recursive: true });
  const data = { ...work.data };
  const hasText = Object.prototype.hasOwnProperty.call(data, "text");
  const text = data.text || {};
  delete data.text;
  const chapterIds = new Set();
  for (const chapter of data.chapters || []) {
    if (!safeId(chapter.id)) continue;
    chapterIds.add(chapter.id);
    if (hasText) fs.writeFileSync(chapterFile(accountId, workId, chapter.id), String(text[chapter.id] ?? ""), "utf8");
  }
  for (const file of fs.readdirSync(path.join(dir, "chapters"))) {
    if (file.endsWith(".md") && !chapterIds.has(file.slice(0, -3))) fs.rmSync(path.join(dir, "chapters", file));
  }
  writeJsonAtomic(path.join(dir, "project.json"), { ...work, id: workId, data });
}
function syncWorkOrder(accountId, workId, mode) {
  const file = path.join(accountDir(accountId), "works", "order.json");
  const current = readJson(file, []);
  const list = Array.isArray(current) ? current.filter(id => safeId(id) && id !== workId) : [];
  if (mode === "add") list.push(workId);
  writeJsonAtomic(file, list);
}
function revisionGuard(accountId, expected) {
  const account = getAccount(accountId);
  if (!account) return { error: "no-account" };
  const revision = Number(account.revision || 0);
  if (expected !== undefined && expected !== null && Number(expected) !== revision) return { error: "conflict", revision };
  return { account, revision };
}
function commitRevision(accountId, account) {
  const nextRevision = Number(account.revision || 0) + 1;
  writeJsonAtomic(path.join(accountDir(accountId), "account.json"), { ...account, revision: nextRevision });
  return nextRevision;
}
function loadWorkResource(accountId, workId) {
  const work = readWork(accountId, workId);
  return work ? { work, revision: Number(getAccount(accountId)?.revision || 0) } : null;
}
function saveWorkResource(accountId, workId, work, expectedRevision) {
  const guard = revisionGuard(accountId, expectedRevision);
  if (guard.error) return guard;
  if (!work || typeof work !== "object" || !work.data || !Array.isArray(work.data.chapters)) return { error: "invalid-work" };
  persistWork(accountId, workId, work);
  syncWorkOrder(accountId, workId, "add");
  return { ok: true, revision: commitRevision(accountId, guard.account), savedAt: new Date().toISOString() };
}
function deleteWorkResource(accountId, workId, expectedRevision) {
  const guard = revisionGuard(accountId, expectedRevision);
  if (guard.error) return guard;
  if (!safeId(workId)) return { error: "invalid-work" };
  fs.rmSync(workDir(accountId, workId), { recursive: true, force: true });
  syncWorkOrder(accountId, workId, "remove");
  return { ok: true, revision: commitRevision(accountId, guard.account), savedAt: new Date().toISOString() };
}
function saveChapterResource(accountId, workId, chapterId, text, expectedRevision) {
  const guard = revisionGuard(accountId, expectedRevision);
  if (guard.error) return guard;
  const project = readJson(path.join(workDir(accountId, workId), "project.json"), null);
  if (!project?.data || !(project.data.chapters || []).some(chapter => chapter.id === chapterId)) return { error: "no-chapter" };
  fs.mkdirSync(path.join(workDir(accountId, workId), "chapters"), { recursive: true });
  fs.writeFileSync(chapterFile(accountId, workId, chapterId), String(text ?? ""), "utf8");
  return { ok: true, revision: commitRevision(accountId, guard.account), savedAt: new Date().toISOString() };
}
function deleteChapterResource(accountId, workId, chapterId, expectedRevision) {
  const guard = revisionGuard(accountId, expectedRevision);
  if (guard.error) return guard;
  const project = readJson(path.join(workDir(accountId, workId), "project.json"), null);
  if (!project?.data) return { error: "no-work" };
  const chapters = (project.data.chapters || []).filter(chapter => chapter.id !== chapterId);
  if (chapters.length === (project.data.chapters || []).length) return { error: "no-chapter" };
  project.data.chapters = chapters;
  project.data.openTabs = (project.data.openTabs || []).filter(id => id !== chapterId);
  if (project.data.currentChapter === chapterId) project.data.currentChapter = chapters[0]?.id || null;
  fs.rmSync(chapterFile(accountId, workId, chapterId), { force: true });
  writeJsonAtomic(path.join(workDir(accountId, workId), "project.json"), project);
  return { ok: true, revision: commitRevision(accountId, guard.account), savedAt: new Date().toISOString() };
}
function loadLibraryResource(accountId) {
  return { library: readJson(path.join(accountDir(accountId), "library.json"), []), revision: Number(getAccount(accountId)?.revision || 0) };
}
function saveLibraryResource(accountId, library, expectedRevision) {
  const guard = revisionGuard(accountId, expectedRevision);
  if (guard.error) return guard;
  if (!Array.isArray(library)) return { error: "invalid-library" };
  writeJsonAtomic(path.join(accountDir(accountId), "library.json"), library);
  return { ok: true, revision: commitRevision(accountId, guard.account), savedAt: new Date().toISOString() };
}
function loadAccountPayload(accountId) {
  const account = getAccount(accountId);
  if (!account) return null;
  const worksRoot = path.join(accountDir(accountId), "works");
  const works = [];
  if (fs.existsSync(worksRoot)) {
    const order = readJson(path.join(worksRoot, "order.json"), null);
    const dirs = fs.readdirSync(worksRoot, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name);
    const ordered = order ? order.filter(safeId).filter(id => dirs.includes(id)).concat(dirs.filter(id => !order.includes(id))) : dirs;
    for (const workId of ordered) {
      const project = readJson(path.join(worksRoot, workId, "project.json"), null);
      if (!project || !project.data) continue;
      const text = {};
      const chaptersDir = path.join(worksRoot, workId, "chapters");
      for (const chapter of project.data.chapters || []) {
        const file = chapterFile(accountId, workId, chapter.id);
        text[chapter.id] = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      }
      project.data.text = text;
      works.push(project);
    }
  }
  const library = readJson(path.join(accountDir(accountId), "library.json"), []);
  const ai = account.ai || {};
  return {
    profile: { id: account.id, email: account.email, name: account.name, penName: account.penName || "", createdAt: account.createdAt },
    ai: { enabled: ai.enabled !== false, configured: ai.configured !== false, provider: ai.provider || "OpenAI 兼容", model: ai.model || "longyin-mock-1", baseUrl: ai.baseUrl || "", includeText: ai.includeText !== false, hasKey: Boolean(ai.apiKeyEnc), apiKeyMasked: maskSecret(ai.apiKeyEnc ? decryptSecret(ai.apiKeyEnc) : "") },
    library,
    works,
    revision: Number(account.revision || 0)
  };
}
function saveAccountPayload(accountId, payload) {
  const account = getAccount(accountId);
  if (!account) return { error: "no-account" };
  const revision = Number(account.revision || 0);
  if (payload.revision !== undefined && payload.revision !== null && Number(payload.revision) !== revision) {
    return { error: "conflict", revision };
  }
  const base = accountDir(accountId);
  if (Array.isArray(payload.library)) writeJsonAtomic(path.join(base, "library.json"), payload.library);
  const worksRoot = path.join(base, "works");
  fs.mkdirSync(worksRoot, { recursive: true });
  const incoming = Array.isArray(payload.works) ? payload.works : [];
  const keep = new Set();
  for (const work of incoming) {
    if (!work || !safeId(work.id) || !work.data) continue;
    keep.add(work.id);
    persistWork(accountId, work.id, work);
  }
  for (const dirName of fs.readdirSync(worksRoot, { withFileTypes: true })) {
    if (dirName.isDirectory() && !keep.has(dirName.name)) fs.rmSync(path.join(worksRoot, dirName.name), { recursive: true, force: true });
  }
  writeJsonAtomic(path.join(worksRoot, "order.json"), incoming.map(work => work.id).filter(safeId));
  const latest = getAccount(accountId);
  const nextRevision = Number(latest?.revision || 0) + 1;
  if (latest) writeJsonAtomic(path.join(accountDir(accountId), "account.json"), { ...latest, revision: nextRevision });
  return { ok: true, revision: nextRevision, savedAt: new Date().toISOString() };
}
function setAiSettings(accountId, settings) {
  const account = getAccount(accountId);
  if (!account) return null;
  const ai = account.ai || {};
  if (settings.provider !== undefined) ai.provider = String(settings.provider);
  if (settings.model !== undefined) ai.model = String(settings.model);
  if (settings.baseUrl !== undefined) ai.baseUrl = String(settings.baseUrl);
  if (settings.includeText !== undefined) ai.includeText = Boolean(settings.includeText);
  if (settings.enabled !== undefined) ai.enabled = Boolean(settings.enabled);
  if (settings.apiKey !== undefined) {
    if (settings.apiKey === "__clear__") ai.apiKeyEnc = "";
    else if (settings.apiKey !== "") ai.apiKeyEnc = encryptSecret(String(settings.apiKey));
  }
  account.ai = ai;
  writeJsonAtomic(path.join(accountDir(accountId), "account.json"), account);
  return ai;
}
function getAiRuntime(accountId) {
  const account = getAccount(accountId);
  const ai = account?.ai || {};
  return { enabled: ai.enabled !== false, provider: ai.provider, model: ai.model, baseUrl: ai.baseUrl || "", includeText: ai.includeText !== false, apiKey: ai.apiKeyEnc ? decryptSecret(ai.apiKeyEnc) : "" };
}

module.exports = {
  ROOT, DATA, ensureBase, readJson, writeJsonAtomic,
  createAccount, findAccountByEmail, getAccount, verifyPassword, updateAccount,
  normalizeAccount, isValidAccount,
  createSession, sessionAccount, destroySession,
  loadAccountPayload, saveAccountPayload, setAiSettings, getAiRuntime, maskSecret,
  loadWorkResource, saveWorkResource, deleteWorkResource,
  saveChapterResource, deleteChapterResource,
  loadLibraryResource, saveLibraryResource
};
