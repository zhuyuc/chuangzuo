const fs = require("fs");
const path = require("path");
const storage = require("./storage");
const { WEB_DIR, SHARED_DIR, MAX_BODY } = require("./config");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8"
};

function send(res, code, payload) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

function ok(res, data) { send(res, 200, { code: 200, data }); }
function fail(res, code, message, details) { send(res, code, { code, message, details }); }

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error("body too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(Object.assign(new Error("bad json"), { statusCode: 400 })); }
    });
    req.on("error", reject);
  });
}

function tokenOf(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function requireAccount(req, res) {
  const token = tokenOf(req);
  const accountId = token ? storage.sessionAccount(token) : null;
  if (!accountId) { fail(res, 401, "登录已失效，请重新登录。"); return null; }
  const account = storage.getAccount(accountId);
  if (!account) { fail(res, 401, "账户不存在，请重新登录。"); return null; }
  return account;
}

function normalizeApiRoute(pathname) {
  if (pathname === "/api/v1") return "/api";
  if (pathname.startsWith("/api/v1/")) return `/api/${pathname.slice(8)}`;
  return pathname;
}

function serveStatic(req, res, urlPath) {
  const shared = urlPath.startsWith("/shared/");
  const base = shared ? SHARED_DIR : WEB_DIR;
  const relative = urlPath === "/" ? "/index.html" : shared ? urlPath.slice(7) : urlPath;
  const file = path.join(base, path.normalize(relative).replace(/^([.][.][/\\])+/, ""));
  if (!file.startsWith(base)) { fail(res, 403, "禁止访问该路径。"); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { fail(res, 404, "资源不存在。"); return; }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": [".html", ".js", ".css"].includes(ext) ? "no-store" : "public, max-age=300",
    "X-Content-Type-Options": "nosniff"
  });
  fs.createReadStream(file).pipe(res);
}

module.exports = { send, ok, fail, readBody, tokenOf, requireAccount, normalizeApiRoute, serveStatic };