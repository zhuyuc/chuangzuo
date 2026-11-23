const { ok, fail, readBody } = require("../http");
const aiService = require("../services/ai");

async function handle({ req, res, route, account }) {
  if (route === "/api/ai/settings") {
    if (req.method === "GET") { ok(res, aiService.getSettings(account.id)); return true; }
    if (req.method === "PUT") {
      const body = await readBody(req);
      aiService.saveSettings(account.id, body);
      ok(res, aiService.getSettings(account.id));
      return true;
    }
    fail(res, 405, "请求方法不支持。");
    return true;
  }
  if (route === "/api/ai/test") {
    if (req.method !== "POST") { fail(res, 405, "请求方法不支持。"); return true; }
    ok(res, await aiService.test(account.id, await readBody(req)));
    return true;
  }
  if (route === "/api/ai/run") {
    if (req.method !== "POST") { fail(res, 405, "请求方法不支持。"); return true; }
    ok(res, await aiService.run(account.id, await readBody(req)));
    return true;
  }
  return false;
}

module.exports = { handle };