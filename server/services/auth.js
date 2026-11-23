const crypto = require("crypto");
const contracts = require("../../shared/contracts");
const seed = require("../seed");
const repository = require("../repositories/account");

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

function validateCredentials(accountName, password) {
  if (!repository.isValidAccount(accountName)) return contracts.messages.invalidAccount;
  if (password.length < contracts.limits.passwordMin) return contracts.messages.invalidPassword;
  return "";
}

function rateKey(accountName, clientKey) {
  return `${repository.normalizeAccount(accountName)}|${clientKey || "local"}`;
}

function isLocked(key) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > ATTEMPT_WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > ATTEMPT_WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
}

function register(accountName, password) {
  const invalid = validateCredentials(accountName, password);
  if (invalid) return { error: { status: 400, message: invalid } };
  const created = repository.createAccount(accountName, password);
  if (created.error === "exists") return { error: { status: 409, message: "该账户已注册，请直接登录。" } };
  if (!created.account) return { error: { status: 500, message: "账户创建失败，请稍后重试。" } };
  const blank = seed.buildBlankWork(`work_${crypto.randomBytes(4).toString("hex")}`, "未命名作品");
  repository.savePayload(created.account.id, { library: [], works: [blank], revision: 0 });
  return {
    token: repository.createSession(created.account.id),
    profile: repository.publicProfile(repository.getAccount(created.account.id))
  };
}

function login(accountName, password, clientKey) {
  const invalid = validateCredentials(accountName, password);
  if (invalid) return { error: { status: 400, message: invalid } };
  const key = rateKey(accountName, clientKey);
  if (isLocked(key)) return { error: { status: 429, message: "登录尝试过多，请 15 分钟后再试。" } };
  const account = repository.findAccount(accountName);
  if (!account || !repository.verifyPassword(account, password)) {
    recordFailure(key);
    return { error: { status: 401, message: "账户或密码不正确。" } };
  }
  attempts.delete(key);
  return { token: repository.createSession(account.id), profile: repository.publicProfile(account) };
}

function sessionAccount(token) {
  return token ? repository.sessionAccount(token) : null;
}

function profileOf(account) {
  return account ? repository.publicProfile(account) : null;
}

function logout(token) {
  if (token) repository.destroySession(token);
}

module.exports = { register, login, sessionAccount, profileOf, logout };