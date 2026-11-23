import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function readSourceTree(dir, extensions = null) {
  if (!fs.existsSync(dir)) return "";
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).map(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return readSourceTree(full, extensions);
    if (extensions && !extensions.includes(path.extname(entry.name))) return "";
    return fs.readFileSync(full, "utf8");
  }).join("\n");
}
function pickFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const port = probe.address().port;
      probe.close(() => resolve(port));
    });
  });
}
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

function moduleCycles(dir) {
  const files = listFiles(dir);
  const graph = new Map();
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const edges = [];
    for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const target = path.resolve(path.dirname(file), match[1]);
      if (fs.existsSync(target)) edges.push(target);
    }
    graph.set(file, edges);
  }
  let index = 0;
  const stack = [];
  const onStack = new Set();
  const indices = new Map();
  const lows = new Map();
  const cycles = [];
  function visit(node) {
    indices.set(node, index);
    lows.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);
    for (const next of graph.get(node) || []) {
      if (!indices.has(next)) { visit(next); lows.set(node, Math.min(lows.get(node), lows.get(next))); }
      else if (onStack.has(next)) lows.set(node, Math.min(lows.get(node), indices.get(next)));
    }
    if (lows.get(node) === indices.get(node)) {
      const component = [];
      let current;
      do { current = stack.pop(); onStack.delete(current); component.push(current); } while (current !== node);
      if (component.length > 1) cycles.push(component.map(item => path.relative(dir, item)));
    }
  }
  for (const file of files) if (!indices.has(file)) visit(file);
  return cycles;
}

const PORT = await pickFreePort();
const BASE = `http://127.0.0.1:${PORT}`;
const LAN_IP = Object.values(os.networkInterfaces()).flat().find(item => item && !item.internal && (item.family === "IPv4" || item.family === 4) && !item.address.startsWith("169.254."))?.address;
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "longyin-verify-"));
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

async function waitHealth() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) {
        const payload = await res.json();
        if (payload?.data?.pid === server.pid) return true;
      }
    } catch (error) { /* 服务尚未就绪 */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return false;
}

async function api(pathname, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${pathname}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
}

const server = spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
  env: { ...process.env, LY_PORT: String(PORT), LY_HOST: "0.0.0.0", LY_DATA_DIR: DATA_DIR },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverLog = "";
server.stdout.on("data", chunk => { serverLog += chunk; });
server.stderr.on("data", chunk => { serverLog += chunk; });

try {
  if (!(await waitHealth())) throw new Error("服务器未能在 10 秒内启动");

  const health = await api("/api/health");
  check("健康检查返回信封", health.status === 200 && health.payload?.code === 200);
  const versionedHealth = await api("/api/v1/health");
  check("版本化 API v1 可用", versionedHealth.status === 200 && versionedHealth.payload?.data?.apiVersion === 1);
  const sharedContract = await fetch(`${BASE}/shared/contracts.js`);
  const sharedContractText = await sharedContract.text();
  check("共享契约可由前后端读取", sharedContract.status === 200 && sharedContractText.includes("/api/v1") && sharedContractText.includes("penNameMax"));

  if (LAN_IP) {
    const lanHealth = await fetch(`http://${LAN_IP}:${PORT}/api/health`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    check("局域网地址可访问服务", Boolean(lanHealth?.ok), `http://${LAN_IP}:${PORT}`);
  } else {
    check("局域网地址可访问服务", true, "未检测到局域网 IPv4，跳过连接测试");
  }

  const badLogin = await api("/api/auth/login", { method: "POST", body: { email: "demo@longyin.local", password: "wrong-pass" } });
  check("错误密码返回 401 与人话消息", badLogin.status === 401 && Boolean(badLogin.payload?.message));

  const login = await api("/api/auth/login", { method: "POST", body: { email: "demo@longyin.local", password: "demo1234" } });
  const token = login.payload?.data?.token;
  check("演示账户登录成功", login.status === 200 && Boolean(token));

  const account = await api("/api/account", { token });
  const work = account.payload?.data?.works?.[0];
  const baseRevision = account.payload?.data?.revision;
  check("账户载荷包含作品与正文", Boolean(work?.data?.text?.[work.data.currentChapter]?.length));
  check("账户载荷包含数据版本", Number.isInteger(baseRevision));

  const penNameUpdate = await api("/api/account/profile", { token, method: "PUT", body: { penName: "门禁作者" } });
  const penNameReload = await api("/api/account", { token });
  check("作者笔名保存并持久化", penNameUpdate.status === 200 && penNameUpdate.payload?.data?.profile?.penName === "门禁作者" && penNameReload.payload?.data?.profile?.penName === "门禁作者");
  const penNameTooLong = await api("/api/account/profile", { token, method: "PUT", body: { penName: "笔".repeat(25) } });
  check("作者笔名长度受限", penNameTooLong.status === 400);

  const chapterId = work.data.currentChapter;
  const workResource = await api(`/api/works/${work.id}`, { token });
  check("作品资源接口返回正文", workResource.status === 200 && Boolean(workResource.payload?.data?.work?.data?.text?.[chapterId]));
  work.data.text[chapterId] += "\n门禁写入测试。";
  const saved = await api(`/api/works/${work.id}`, { token, method: "PUT", body: { work, revision: baseRevision } });
  check("作品资源保存返回 200", saved.status === 200);
  check("保存后数据版本递增", saved.payload?.data?.revision === baseRevision + 1);
  const staleSave = await api(`/api/works/${work.id}`, { token, method: "PUT", body: { work, revision: baseRevision } });
  check("过期数据版本被拒绝", staleSave.status === 409);

  const chapterSaved = await api(`/api/works/${work.id}/chapters/${chapterId}`, { token, method: "PUT", body: { text: `${work.data.text[chapterId]}\n章节资源写入。`, revision: saved.payload.data.revision } });
  check("章节正文资源保存返回 200", chapterSaved.status === 200 && chapterSaved.payload?.data?.revision === saved.payload.data.revision + 1);

  const mdFile = path.join(DATA_DIR, "accounts", account.payload.data.profile.id, "works", work.id, "chapters", `${chapterId}.md`);
  const md = fs.readFileSync(mdFile, "utf8");
  check("正文以 md 主副本落盘", md.includes("门禁写入测试。") && md.includes("章节资源写入。"));

  const librarySaved = await api("/api/library", { token, method: "PUT", body: { library: account.payload.data.library, revision: chapterSaved.payload.data.revision } });
  check("共享设定资源保存返回 200", librarySaved.status === 200 && librarySaved.payload?.data?.revision === chapterSaved.payload.data.revision + 1);

  const reload = await api("/api/account", { token });
  check("重新读取包含写入内容", (reload.payload.data.works[0].data.text[chapterId] || "").includes("章节资源写入。"));

  const register = await api("/api/auth/register", { method: "POST", body: { email: "verify@longyin.local", password: "verify1234" } });
  const newToken = register.payload?.data?.token;
  check("注册新账户成功", register.status === 200 && Boolean(newToken));
  const newAccount = await api("/api/account", { token: newToken });
  check("新账户数据隔离（空库 + 空白作品）", newAccount.payload.data.library.length === 0 && newAccount.payload.data.works.length === 1 && newAccount.payload.data.works[0].name === "未命名作品");
  const cross = await api("/api/account", { token: newToken });
  check("新账户看不到演示作品", !cross.payload.data.works.some(item => item.id === work.id));
  const blankWork = newAccount.payload.data.works[0];
  const deletedWork = await api(`/api/works/${blankWork.id}`, { token: newToken, method: "DELETE", body: { revision: newAccount.payload.data.revision } });
  const afterDelete = await api("/api/account", { token: newToken });
  check("作品资源可删除且版本递增", deletedWork.status === 200 && deletedWork.payload?.data?.revision === newAccount.payload.data.revision + 1 && afterDelete.payload.data.works.length === 0);

  const userReg = await api("/api/auth/register", { method: "POST", body: { email: "verify_user", password: "verify1234" } });
  check("用户名（非邮箱）注册成功", userReg.status === 200 && Boolean(userReg.payload?.data?.token));
  const userLogin = await api("/api/auth/login", { method: "POST", body: { email: "verify_user", password: "verify1234" } });
  check("用户名可登录", userLogin.status === 200 && Boolean(userLogin.payload?.data?.token));
  const shortPw = await api("/api/auth/register", { method: "POST", body: { email: "short@longyin.local", password: "12345" } });
  check("5 位密码被拒且提示 6 位下限", shortPw.status === 400 && String(shortPw.payload?.message || "").includes("6"));
  const badName = await api("/api/auth/register", { method: "POST", body: { email: "a", password: "verify1234" } });
  check("1 位用户名被拒", badName.status === 400);
  for (let i = 0; i < 10; i += 1) await api("/api/auth/login", { method: "POST", body: { email: "rate-limit@longyin.local", password: "wrong-pass" } });
  const rateLimited = await api("/api/auth/login", { method: "POST", body: { email: "rate-limit@longyin.local", password: "wrong-pass" } });
  check("登录失败限流生效", rateLimited.status === 429);

  const settingsRaw = await fetch(`${BASE}/api/ai/settings`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ provider: "OpenAI 兼容", model: "verify-model", baseUrl: "", includeText: true, enabled: true, apiKey: "sk-verify1234567890" }) });
  const settings = { status: settingsRaw.status, payload: await settingsRaw.json().catch(() => null) };
  if (settings.status !== 200) console.log("SETTINGS RAW", settings.status, JSON.stringify(settings.payload), "BASE", BASE, "serverPid", server.pid);
  check("AI 设置保存后密钥脱敏", settings.status === 200 && settings.payload?.data?.hasKey === true && String(settings.payload?.data?.apiKeyMasked || "").includes("****") && !JSON.stringify(settings.payload).includes("sk-verify1234567890"), `status=${settings.status} message=${settings.payload?.message || ""}`);
  const aiTest = await api("/api/ai/test", { token, method: "POST", body: { baseUrl: "", model: "verify-model" } });
  check("空地址测试返回离线模拟说明", aiTest.status === 200 && aiTest.payload?.data?.mock === true, `status=${aiTest.status} message=${aiTest.payload?.message || ""}`);
  const aiRun = await api("/api/ai/run", { token, method: "POST", body: { action: "summary", context: { intro: "门禁上下文" } } });
  check("未配置 baseURL 时 AI 返回 mock 标记", aiRun.payload.data.mock === true);
  const sharedAiActions = await fetch(`${BASE}/shared/ai-actions.js`);
  const sharedAiText = await sharedAiActions.text();
  check("AI 指令注册表由共享层提供", sharedAiActions.status === 200 && sharedAiText.includes("buildMessages") && sharedAiText.includes("续写") && sharedAiText.includes("只输出 JSON"));

  const logout = await api("/api/auth/logout", { token: newToken, method: "POST" });
  const afterLogout = await api("/api/account", { token: newToken });
  check("退出后会话失效", logout.status === 200 && afterLogout.status === 401);

  const webIndex = fs.readFileSync(path.join(ROOT, "web", "index.html"), "utf8");
  const frontendCss = readSourceTree(path.join(ROOT, "web", "styles"), [".css"]);
  const frontendJs = readSourceTree(path.join(ROOT, "web", "js"), [".js"]);
  const dialogSource = readSourceTree(path.join(ROOT, "web", "js", "dialogs"), [".js"]);
  const writingPageSource = fs.readFileSync(path.join(ROOT, "web/js/pages/writing.js"), "utf8");
  const dashboardSource = fs.readFileSync(path.join(ROOT, "web/js/pages/dashboard.js"), "utf8");
  const inspirationPageSource = fs.readFileSync(path.join(ROOT, "web/js/pages/inspiration.js"), "utf8");
  const inspirationSubmitSource = fs.readFileSync(path.join(ROOT, "web/js/controllers/inspiration-submit.js"), "utf8");
  const richTextSource = fs.readFileSync(path.join(ROOT, "web/js/domain/rich-text.js"), "utf8");
  const formatSource = fs.readFileSync(path.join(ROOT, "web/js/domain/writing/format.js"), "utf8");
  const typographySource = fs.readFileSync(path.join(ROOT, "web/js/domain/typography.js"), "utf8");
  const typographyCss = fs.readFileSync(path.join(ROOT, "web/styles/typography.css"), "utf8");
  const web = `${webIndex}\n${frontendCss}\n${frontendJs}`;
  const sharedCode = readSourceTree(path.join(ROOT, "shared"), [".js"]);
  const serverCode = readSourceTree(path.join(ROOT, "server"), [".js"]) + sharedCode;
  const seedCode = fs.readFileSync(path.join(ROOT, "server", "seed.js"), "utf8");
  check("默认允许局域网访问并打印地址", serverCode.includes('process.env.LY_HOST || "0.0.0.0"') && serverCode.includes("局域网访问："));
  check("主线阶段与重复分卷入口已移除", !web.includes("主线阶段") && !web.includes("outlineData.stages") && !web.includes("data-stage") && !seedCode.includes("stages:") && !web.includes("查看分卷结构"));
  check("前端无 window.confirm", !web.includes("window.confirm"));
  check("前端无假写作指标", !web.includes("1,286") && !web.includes("连续写作 12 天"));
  const dialogCards = dialogSource.split(/\r?\n/).filter(line => line.includes('class="dialog-card'));
  check("弹窗统一布局与尺寸档位", dialogCards.length >= 15 && dialogCards.every(line => ["dialog-header", "dialog-body", "dialog-actions"].every(token => line.includes(token))) && ["dialog-sm", "dialog-md", "dialog-lg", "dialog-xl"].every(size => dialogSource.includes(`dialog-card ${size}`)) && !dialogSource.includes('style="width:') && !dialogSource.includes('style="height:') && !dialogSource.includes('style="margin-right:auto"') && web.includes(".dialog-card.dialog-sm { width: 440px; }") && web.includes(".dialog-card.dialog-md { width: 560px; }") && web.includes(".dialog-card.dialog-lg { width: 620px; }") && web.includes(".dialog-card.dialog-xl { width: 760px; }") && web.includes(".dialog-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; }") && web.includes(".dialog-actions { flex: 0 0 auto;"));
  check("章节标签横向滚动容器存在", web.includes("document-tabs-scroll"));
  check("新建分卷/章节并排吸底存在", web.includes(".writing-tree .chapter-tree") && web.includes(".tree-actions { flex: 0 0 auto") && web.includes("data-entity-add=\"volume\""));
  check("设计 token 集中于 :root", web.includes("--accent-line:") && !/\.button \{[^}]*#[0-9a-f]{6}/.test(web));
  const styleFiles = fs.readdirSync(path.join(ROOT, "web/styles")).filter(file => file.endsWith(".css") && file !== "tokens.css");
  const styleCss = styleFiles.map(file => fs.readFileSync(path.join(ROOT, "web/styles", file), "utf8")).join("\n");
  const tokenCss = fs.readFileSync(path.join(ROOT, "web/styles/tokens.css"), "utf8");
  check("全局字体字号字重引用 token", !/font-size:\s*(?:clamp\(|\d)/.test(styleCss) && !/font-weight:\s*\d/.test(styleCss) && !/font-family:\s*(?!\s*(?:var\(|inherit))/.test(styleCss) && ["--font-mono", "--text-10", "--text-30", "--weight-semibold", "--weight-bold"].every(token => tokenCss.includes(`${token}:`)));
  check("页面标题字号字重一致", styleCss.includes(".page-title h1 { font-family: var(--font-display); font-size: var(--text-page-title); font-weight: var(--weight-semibold);") && !styleCss.includes(".padded .page-title h1") && !frontendJs.includes("style=\"margin:0 0 8px;font-size:10px\"") && !frontendJs.includes("style=\"margin-top:10px;font-size:11px\""));
  check("页面标题区高度与按钮对齐一致", tokenCss.includes("--page-head-h: 112px;") && styleCss.includes(".page-title { min-height: var(--page-head-h); display: flex; align-items: flex-end;") && styleCss.includes(".padded .page-title { min-height: var(--page-head-h); align-items: flex-end; padding: 15px 0;") && styleCss.includes(".page.padded { padding: 0 clamp(24px, 3.4vw, 52px) 44px;") && !styleCss.includes(".dashboard-page .dashboard-title"));
  check("侧栏作品卡与页面标题底线对齐", styleCss.includes("--nav-top: 17px;") && styleCss.includes(".current-work { position: relative; width: 100%; height: calc(var(--page-head-h) - var(--nav-top));"));
  check("AI 采纳制文案存在", web.includes("采纳前不会写入任何数据") && web.includes('label.replace(/^AI\\s+/, "")'));
  check("灵感模块 AI 入口已移除", !web.includes("insp-beats") && !web.includes("inspiration-beats") && sharedCode.includes("AI 摘要 / 标签"));
  check("前端不再内置种子数据", !web.includes("changyeChapters") && !web.includes("work-changye"));
  check("账户字段支持邮箱或用户名且密码下限共享", web.includes("邮箱或用户名") && web.includes("APP_CONTRACTS.limits.passwordMin") && !web.includes("至少 8 个字符") && web.includes("isValidAccountName") && sharedCode.includes("passwordMin: 6"));
  check("命名与入口收敛", !web.includes("兵器库") && !web.includes("本章关联资料") && !web.includes("灵感广场"));
  check("多地图册交互存在", web.includes("新建地图") && web.includes("data-map-select") && web.includes("buildBlankWorkData") && web.includes("未放置"));
  check("菜单深链路由存在", web.includes("ROUTE_PAGES") && web.includes("syncRouteHash") && web.includes("hashchange"));
  check("交互样式二批存在", web.includes("longyin.ui") && web.includes("dialogBeforeConfirm") && web.includes("prefers-reduced-motion") && web.includes("dialog-in"));
  check("丝滑动效与黑暗模式存在", web.includes("--ease-settle") && web.includes("ripple") && web.includes("--glider-y") && web.includes('data-theme="dark"') && web.includes("theme-mode"));
  check("作品卡快捷跳转、完整编辑、分类、专注与快捷键存在", web.includes("data-work-jump") && web.includes("data-work-edit") && web.includes("edit-work-form") && web.includes("workFormMarkup") && !web.includes("data-work-rename") && web.includes("WORK_GENRES") && web.includes("focus-exit") && web.includes('event.key === "f"'));
  const switchWorkLine = fs.readFileSync(path.join(ROOT, "web/js/controllers/books-clicks.js"), "utf8").split(/\r?\n/).find(line => line.includes("dataset.switchWork")) || "";
  check("切换作品后返回工作台", switchWorkLine.includes('navigate("dashboard")') && !switchWorkLine.includes('state.page = "writing"'));
  check("章节层级与灵感自定义分类存在", web.includes("padding: 8px 8px 8px 34px") && web.includes('name="categorySelect"') && web.includes('name="categoryNew"') && web.includes('value="__new"') && web.includes("data-inspiration-category") && web.includes(".inspiration-toolbar .dialog-select { flex:0 0 132px") && !web.includes("已经用进正文或设定") && !web.includes("标记已用") && !web.includes("data-inspiration-toggle") && !web.includes("inspirationFilter") && web.includes("delete item.used") && !seedCode.includes("used: false"));
  check("专注模式同底满幅且保留章节状态", web.includes(".writing-page.focus-mode { padding: 0; gap: 0; background:") && web.includes(".writing-layout.focus .editor-shell { width: 100%; max-width: none;") && web.includes(".writing-page.focus-mode .editor-heading,") && web.includes(".writing-page.focus-mode .editor-status") && !web.includes(".writing-page.focus-mode .editor-heading { display: none") && !web.includes("0 34px 100px rgba(0,0,0,.48)"));
  check("正文编辑器聚焦不显示边框", web.includes(".manuscript:focus, .manuscript:focus-visible { border: 0; outline: 0; box-shadow: none; }"));
  check("章节状态与字数同处底部状态栏", writingPageSource.includes('<div class="editor-status"><div class="editor-meta-controls">') && !writingPageSource.includes('aria-label="章节标题"></div><div class="editor-meta-controls">') && web.includes(".editor-meta-controls { gap: 6px; color: var(--tertiary); font-size: var(--text-10);") && web.includes(".editor-status { display: flex; align-items: center; flex-wrap: nowrap; gap: 10px;"));
  check("写作页不再显示卷名眉标", !writingPageSource.includes("${volume ?") && !writingPageSource.includes("chapter.volume}</span>"));
  check("排版预览与标点校正分离", !formatSource.includes("formatCurrentChapter") && !formatSource.includes("　　") && typographySource.includes("splitParagraphs") && typographySource.includes("normalizePunctuation") && typographySource.includes("indentForExport") && writingPageSource.includes('data-dialog="typography"') && fs.readFileSync(path.join(ROOT, "web/js/dialogs/typography-dialog.js"), "utf8").includes("data-typography-correct") && fs.existsSync(path.join(ROOT, "web/js/controllers/typography-clicks.js")));
  check("阅读排版使用 CSS 生成缩进与行宽", typographyCss.includes("text-indent: var(--reading-indent)") && typographyCss.includes("max-width: var(--reading-measure)") && typographyCss.includes("text-justify: inter-character") && typographyCss.includes("line-break: strict") && typographyCss.includes("@supports (text-autospace: normal)") && webIndex.includes("styles/typography.css"));
  check("保存排队与灵感即时落库存在", web.includes("let persistQueued = false") && web.includes("if (persisting) { persistQueued = true; return; }") && /state\.inspirationEditId = null;[\s\S]{0,80}saveAccountNow\(\)/.test(web));
  check("灵感使用真实创建时间", web.includes("function inspirationTimeLabel") && web.includes('createdAt: new Date().toISOString()') && !web.includes('createdAt: "刚刚"') && !seedCode.includes('createdAt: "今天'));
  check("灵感改为富文本并去除标签", dialogSource.includes('data-rich-editor') && dialogSource.includes('data-rich-command') && !dialogSource.includes('name="tags"') && inspirationPageSource.includes("inspirationRichHtml(item)") && !inspirationPageSource.includes("item.tags") && inspirationSubmitSource.includes("sanitizeRichText") && inspirationSubmitSource.includes("richTextToPlain") && !inspirationSubmitSource.includes("form.elements.tags") && richTextSource.includes("export function sanitizeRichText") && richTextSource.includes("export function richTextToPlain") && frontendCss.includes(".rich-input {") && frontendCss.includes(".rich-toolbar {") && frontendJs.includes("delete item.tags;") && !seedCode.includes('tags: ["线索"'));
  check("正文应用级撤销与重做存在", web.includes("const manuscriptUndoHistory = new Map()") && web.includes("function stepManuscriptUndo") && web.includes("beforeinput") && web.includes("stepManuscriptUndo(event.shiftKey)") && web.includes("stepManuscriptUndo(true)"));
  check("墨光书房工作台与书封存在", web.includes("desk-hero") && web.includes("hero-book") && web.includes("workCoverVars") && web.includes("data-book-tilt"));
  check("工作台去除英文眉标并前置新建入口", !dashboardSource.includes("私人书房") && !dashboardSource.includes("BOOK SHELF") && dashboardSource.indexOf("new-work-card") >= 0 && dashboardSource.indexOf("new-work-card") < dashboardSource.indexOf("sortedWorks.map"));
  check("稿纸写作与完成印章存在", web.includes("writing-page.focus-mode") && web.includes("completion-seal") && web.includes("--font-reading"));
  check("登录舞台与模块面板层级存在", web.includes("auth-stage") && web.includes("auth-intro") && web.includes(".materials-layout > *, .library-layout > *"));
  check("作者笔名设置与工作台署名存在", web.includes("data-pen-name") && web.includes("pen-name-form") && web.includes("function authorPenName") && web.includes("desk-author") && web.includes("work-author") && serverCode.includes("/api/account/profile"));
  check("世界观简介使用块级纸面布局", web.includes(".overview-field { display: block;") && web.includes('aria-label="作品简介"') && web.includes(".world-overview-page .overview-field.wide:focus-within") && web.includes('rows="3" data-world-field="intro"') && web.includes(".world-overview-page .overview-field.wide { padding: 12px 14px;") && web.includes(".world-overview-page .overview-field.wide textarea { display: block; min-height: 80px;"));
  check("分卷展开按钮使用居中 SVG 图标", web.includes(".tree-caret.collapsed svg") && web.includes('<svg viewBox="0 0 12 12" aria-hidden="true">') && !web.includes(">⌄</button>") && web.includes('<button class="tree-rename" data-entity-edit="volume:${volume.id}" title="修改卷名">改</button></div>'));
  check("大纲页减少嵌套层级与颜色", web.includes(".outline-overview-inner { max-width: 980px; margin: 0 auto; padding: 30px 34px 34px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); box-shadow: none;") && web.includes(".outline-overview .overview-field { padding: 18px 0; border: 0; border-top: 1px solid var(--line); border-radius: 0; background: transparent;") && web.includes(".volume-outline-card { position: relative; overflow: hidden; padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: transparent; box-shadow: none;") && !web.includes("linear-gradient(180deg, var(--accent), var(--gold))"));
  check("空状态结构统一并带下一步入口", web.includes(".inspiration-empty { gap: 7px; }") && web.includes(".map-empty { min-height: 160px; padding: 16px 6px; }") && web.includes(".world-empty { margin-top: 18px; }") && web.includes('class="empty-state compact inspiration-empty"') && web.includes('data-dialog="inspiration">新增灵感</button>') && web.includes('class="empty-state compact map-empty"') && web.includes('data-map-place-mode>添加地点</button>') && web.includes('class="empty-state compact world-empty"') && !web.includes("这张图还没有地点。</p>") && !web.includes("灵感还是空的。点“新增灵感”"));
  const frontendFiles = [
    "web/js/app.js", "web/js/core/store.js", "web/js/core/persistence.js", "web/js/core/api.js",
    "web/js/controllers/session-clicks.js", "web/js/controllers/entity-submit.js", "web/js/controllers/map-pointer.js",
    "web/js/dialogs/index.js", "web/js/dialogs/entity-config.js", "web/js/domain/maps/terrain.js",
    "web/js/domain/writing/mention.js", "web/js/domain/ai/runtime.js", "web/js/domain/typography.js", "web/js/events/click.js",
    "web/js/dialogs/typography-dialog.js", "web/js/controllers/typography-clicks.js", "web/js/pages/dashboard.js", "web/js/pages/writing.js", "web/js/app/render.js"
  ];
  const backendFiles = [
    "server/http.js", "server/config.js", "server/routes/auth.js", "server/routes/account.js", "server/routes/ai.js",
    "server/services/auth.js", "server/services/account.js", "server/services/ai.js", "server/repositories/account.js",
    "shared/contracts.js", "shared/ai-actions.js"
  ];
  const removedMonoliths = ["web/js/domain/maps.js", "web/js/domain/writing.js", "web/js/domain/ai.js", "web/js/ui/dialogs.js", "web/js/events/editor.js", "web/js/events/change.js", "web/js/events/pointer.js"];
  check("前后端功能目录与模块文件存在", frontendFiles.every(file => fs.existsSync(path.join(ROOT, file))) && backendFiles.every(file => fs.existsSync(path.join(ROOT, file))));
  check("旧单体模块已移除", removedMonoliths.every(file => !fs.existsSync(path.join(ROOT, file))));
  check("前端入口使用原生 ES Modules", webIndex.includes('<script type="module" src="js/app.js">') && !webIndex.includes('src="js/core/state.js"') && frontendFiles.filter(file => file.endsWith(".js")).every(file => /(^|\n)\s*(import|export)\s/.test(fs.readFileSync(path.join(ROOT, file), "utf8"))));
  check("事件层按功能控制器分发", ["click", "submit"].every(name => fs.readFileSync(path.join(ROOT, `web/js/events/${name}.js`), "utf8").split(/\r?\n/).length < 60) && fs.readdirSync(path.join(ROOT, "web/js/controllers")).length >= 15);
  check("显式 store 管理可变状态", fs.existsSync(path.join(ROOT, "web/js/core/store.js")) && fs.readFileSync(path.join(ROOT, "web/js/core/store.js"), "utf8").includes("export let works") && !fs.readFileSync(path.join(ROOT, "web/js/core/state.js"), "utf8").includes("const state = {"));
  check("前端持久化使用资源级接口", ["/works/", "/chapters/", "/library", 'method: "DELETE"'].every(token => frontendJs.includes(token)) && !frontendJs.includes('api("/account", { method: "PUT"'));
  check("前端不再持有 AI 指令提示词", !frontendJs.includes("aiInstruction") && !frontendJs.includes("buildAIMessages") && frontendJs.includes("buildAIContext") && frontendJs.includes('api("/ai/run"'));
  check("后端提供作品、章节与共享库资源路由", serverCode.includes("CHAPTER_ROUTE") && serverCode.includes("WORK_ROUTE") && serverCode.includes('"/api/library"') && serverCode.includes("saveChapterResource") && serverCode.includes("saveLibraryResource"));
  check("后端 AI 指令由共享注册表构建", serverCode.includes("registry.buildMessages") && sharedAiText.includes("buildMessages(action, context)"));
  check("前端模块依赖无循环", moduleCycles(path.join(ROOT, "web", "js")).length === 0, moduleCycles(path.join(ROOT, "web", "js")).map(cycle => cycle.join(" -> ")).join(" | "));
  check("传输层与会话用例分离", !fs.readFileSync(path.join(ROOT, "web/js/core/api.js"), "utf8").includes("app/render") && !fs.readFileSync(path.join(ROOT, "web/js/core/api.js"), "utf8").includes("persistence") && fs.readFileSync(path.join(ROOT, "web/js/app/session.js"), "utf8").includes("export async function loadAccount") && fs.readFileSync(path.join(ROOT, "web/js/app/session.js"), "utf8").includes("export function logoutLocal"));
  check("前端入口不再承载内联业务代码", !webIndex.includes("<style>") && !webIndex.includes("let works =") && webIndex.includes('src="/shared/contracts.js"') && webIndex.includes("js/app.js"));
  check("前端使用版本化 API 与共享契约", frontendJs.includes("APP_CONTRACTS.apiPrefix") && frontendJs.includes("${API_PREFIX}${path}") && frontendJs.includes("revision: accountRevision"));
  check("后端按路由、服务、仓储分层", serverCode.includes("authRoutes.handle") && serverCode.includes("accountRoutes.handle") && serverCode.includes("aiRoutes.handle") && serverCode.includes("aiService.run") && serverCode.includes("repository.savePayload"));
} catch (error) {
  check("门禁执行异常", false, error.message);
  console.log(serverLog.slice(-2000));
} finally {
  server.kill();
  await new Promise(resolve => setTimeout(resolve, 400));
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
}

const failed = results.filter(item => !item.ok);
for (const item of results) console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.name}${item.detail ? ` · ${item.detail}` : ""}`);
console.log(failed.length ? `\n门禁未通过：${failed.length} 项` : "\n门禁全部通过");
process.exit(failed.length ? 1 : 0);
