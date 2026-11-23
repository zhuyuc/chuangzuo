const http = require("http");
const os = require("os");
const storage = require("./storage");
const seed = require("./seed");
const contracts = require("../shared/contracts");
const { PORT, HOST } = require("./config");
const { ok, fail, requireAccount, normalizeApiRoute, serveStatic } = require("./http");
const authRoutes = require("./routes/auth");
const accountRoutes = require("./routes/account");
const aiRoutes = require("./routes/ai");

function ensureDemoAccount() {
  const email = "demo@longyin.local";
  if (!storage.findAccountByEmail(email)) {
    const created = storage.createAccount(email, "demo1234", { name: "演示作者" });
    if (created.account) {
      storage.saveAccountPayload(created.account.id, seed.buildDemoPayload());
      storage.updateAccount(created.account.id, { name: "林墨" });
    }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (!url.pathname.startsWith("/api/")) { serveStatic(req, res, url.pathname); return; }
    const route = normalizeApiRoute(url.pathname);

    if (route === "/api/health") {
      ok(res, { status: "ok", pid: process.pid, port: PORT, apiVersion: contracts.apiVersion, time: new Date().toISOString() });
      return;
    }
    if (await authRoutes.handle({ req, res, route })) return;

    const account = requireAccount(req, res);
    if (!account) return;
    if (await accountRoutes.handle({ req, res, route, account })) return;
    if (await aiRoutes.handle({ req, res, route, account })) return;
    fail(res, 404, "接口不存在。");
  } catch (error) {
    if (error.statusCode === 413) { fail(res, 413, "请求内容过大。"); return; }
    if (error.statusCode === 400) { fail(res, 400, "请求数据格式不正确。"); return; }
    console.error("[server]", error);
    fail(res, 500, "服务器处理请求时发生错误。");
  }
});

function displayHost(host) {
  return String(host).includes(":") ? `[${host}]` : host;
}

function lanUrls() {
  if (!["0.0.0.0", "::"].includes(HOST)) return [];
  const addresses = Object.values(os.networkInterfaces()).flat()
    .filter(item => item && !item.internal && (item.family === "IPv4" || item.family === 4))
    .map(item => item.address)
    .filter(address => !address.startsWith("169.254."));
  return [...new Set(addresses)].map(address => `http://${address}:${PORT}`);
}

storage.ensureBase();
ensureDemoAccount();
server.listen(PORT, HOST, () => {
  const localHost = HOST === "0.0.0.0" ? "127.0.0.1" : HOST === "::" ? "::1" : HOST;
  const urls = lanUrls();
  console.log("龙吟写作服务器已启动");
  console.log(`  API 版本：v${contracts.apiVersion}`);
  console.log(`  本机访问：http://${displayHost(localHost)}:${PORT}`);
  urls.forEach(url => console.log(`  局域网访问：${url}`));
  if (HOST === "0.0.0.0" && !urls.length) console.log("  局域网访问：未检测到可用 IPv4 地址，请检查网络连接");
  console.log(`  监听地址：${displayHost(HOST)}:${PORT}${HOST === "0.0.0.0" ? "（局域网可访问）" : ""}`);
  console.log("  演示账户：demo@longyin.local / demo1234");
  console.log(`  数据目录：${storage.DATA}`);
  if (HOST === "0.0.0.0") console.log("  提示：若局域网设备无法连接，请允许 Node.js 通过系统防火墙的专用网络。");
});