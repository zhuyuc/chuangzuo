const { ok, fail, readBody, requireAccount, tokenOf } = require("../http");
const authService = require("../services/auth");

async function handle({ req, res, route }) {
  if (route === "/api/auth/register") {
    if (req.method !== "POST") { fail(res, 405, "请求方法不支持。"); return true; }
    const body = await readBody(req);
    const result = authService.register(body.email, String(body.password || ""));
    if (result.error) { fail(res, result.error.status, result.error.message); return true; }
    ok(res, result);
    return true;
  }
  if (route === "/api/auth/login") {
    if (req.method !== "POST") { fail(res, 405, "请求方法不支持。"); return true; }
    const body = await readBody(req);
    const clientKey = req.socket.remoteAddress || "";
    const result = authService.login(body.email, String(body.password || ""), clientKey);
    if (result.error) { fail(res, result.error.status, result.error.message); return true; }
    ok(res, result);
    return true;
  }
  if (route === "/api/auth/logout") {
    if (req.method !== "POST") { fail(res, 405, "请求方法不支持。"); return true; }
    authService.logout(tokenOf(req));
    ok(res, { loggedOut: true });
    return true;
  }
  if (route === "/api/auth/me") {
    if (req.method !== "GET") { fail(res, 405, "请求方法不支持。"); return true; }
    const account = requireAccount(req, res);
    if (!account) return true;
    ok(res, { profile: authService.profileOf(account) });
    return true;
  }
  return false;
}

module.exports = { handle };