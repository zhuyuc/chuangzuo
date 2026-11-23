const { ok, fail, readBody } = require("../http");
const accountService = require("../services/account");

const WORK_ROUTE = /^\/api\/works\/([A-Za-z0-9_-]{1,64})$/;
const CHAPTER_ROUTE = /^\/api\/works\/([A-Za-z0-9_-]{1,64})\/chapters\/([A-Za-z0-9_-]{1,64})$/;

async function handle({ req, res, route, account }) {
  if (route === "/api/account") {
    if (req.method !== "GET") { fail(res, 405, "请使用资源级接口保存作品、章节或共享设定。"); return true; }
    const payload = accountService.load(account.id);
    if (!payload) { fail(res, 404, "账户不存在。"); return true; }
    ok(res, payload);
    return true;
  }
  if (route === "/api/account/profile") {
    if (req.method !== "PUT") { fail(res, 405, "请求方法不支持。"); return true; }
    const body = await readBody(req);
    const result = accountService.updatePenName(account.id, body.penName);
    if (result.error) { fail(res, result.error.status, result.error.message); return true; }
    ok(res, result.value);
    return true;
  }
  if (route === "/api/library") {
    if (req.method === "GET") { ok(res, accountService.loadLibrary(account.id).value); return true; }
    if (req.method === "PUT") {
      const result = accountService.saveLibrary(account.id, await readBody(req));
      if (result.error) { fail(res, result.error.status, result.error.message, result.error.details); return true; }
      ok(res, result.value);
      return true;
    }
    fail(res, 405, "请求方法不支持。");
    return true;
  }
  const chapterMatch = route.match(CHAPTER_ROUTE);
  if (chapterMatch) {
    const [, workId, chapterId] = chapterMatch;
    if (req.method === "PUT") {
      const result = accountService.saveChapter(account.id, workId, chapterId, await readBody(req));
      if (result.error) { fail(res, result.error.status, result.error.message, result.error.details); return true; }
      ok(res, result.value);
      return true;
    }
    if (req.method === "DELETE") {
      const result = accountService.deleteChapter(account.id, workId, chapterId, await readBody(req));
      if (result.error) { fail(res, result.error.status, result.error.message, result.error.details); return true; }
      ok(res, result.value);
      return true;
    }
    fail(res, 405, "请求方法不支持。");
    return true;
  }
  const workMatch = route.match(WORK_ROUTE);
  if (workMatch) {
    const workId = workMatch[1];
    if (req.method === "GET") {
      const result = accountService.loadWork(account.id, workId);
      if (result.error) { fail(res, result.error.status, result.error.message); return true; }
      ok(res, result.value);
      return true;
    }
    if (req.method === "PUT") {
      const result = accountService.saveWork(account.id, workId, await readBody(req));
      if (result.error) { fail(res, result.error.status, result.error.message, result.error.details); return true; }
      ok(res, result.value);
      return true;
    }
    if (req.method === "DELETE") {
      const result = accountService.deleteWork(account.id, workId, await readBody(req));
      if (result.error) { fail(res, result.error.status, result.error.message, result.error.details); return true; }
      ok(res, result.value);
      return true;
    }
    fail(res, 405, "请求方法不支持。");
    return true;
  }
  return false;
}

module.exports = { handle };