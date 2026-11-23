const contracts = require("../../shared/contracts");
const repository = require("../repositories/account");

function load(accountId) {
  return repository.loadPayload(accountId);
}

function mapResult(result, notFoundMessage) {
  if (result?.error === "conflict") {
    return { error: { status: 409, message: "数据已在其他设备更新，请刷新页面后再保存。", details: { revision: result.revision } } };
  }
  if (result?.error === "no-account") return { error: { status: 404, message: "账户不存在。" } };
  if (result?.error === "no-work") return { error: { status: 404, message: "作品不存在。" } };
  if (result?.error === "no-chapter") return { error: { status: 404, message: "章节不存在。" } };
  if (result?.error) return { error: { status: 400, message: notFoundMessage || "数据结构不正确。" } };
  return { value: result };
}

function loadWork(accountId, workId) {
  const result = repository.loadWork(accountId, workId);
  return result ? { value: result } : { error: { status: 404, message: "作品不存在。" } };
}

function saveWork(accountId, workId, body) {
  if (!body?.work || typeof body.work !== "object") return { error: { status: 400, message: "作品数据结构不正确。" } };
  if (body.work.id && body.work.id !== workId) return { error: { status: 400, message: "作品标识不一致。" } };
  return mapResult(repository.saveWork(accountId, workId, { ...body.work, id: workId }, body.revision));
}

function deleteWork(accountId, workId, body) {
  return mapResult(repository.deleteWork(accountId, workId, body?.revision));
}

function saveChapter(accountId, workId, chapterId, body) {
  if (typeof body?.text !== "string") return { error: { status: 400, message: "章节正文格式不正确。" } };
  if (body.text.length > 20 * 1024 * 1024) return { error: { status: 413, message: "章节正文过大。" } };
  return mapResult(repository.saveChapter(accountId, workId, chapterId, body.text, body.revision), "章节正文保存失败。");
}

function deleteChapter(accountId, workId, chapterId, body) {
  return mapResult(repository.deleteChapter(accountId, workId, chapterId, body?.revision));
}

function loadLibrary(accountId) {
  return { value: repository.loadLibrary(accountId) };
}

function saveLibrary(accountId, body) {
  if (!Array.isArray(body?.library)) return { error: { status: 400, message: "共享设定数据结构不正确。" } };
  return mapResult(repository.saveLibrary(accountId, body.library, body.revision), "共享设定保存失败。");
}

function updatePenName(accountId, rawPenName) {
  const penName = String(rawPenName ?? "").trim();
  if (penName.length > contracts.limits.penNameMax) return { error: { status: 400, message: contracts.messages.penNameTooLong } };
  if (/[\r\n]/.test(penName)) return { error: { status: 400, message: contracts.messages.penNameNewline } };
  const profile = repository.updateProfile(accountId, { penName });
  if (!profile) return { error: { status: 404, message: "账户不存在。" } };
  return { value: { profile } };
}

module.exports = {
  load, loadWork, saveWork, deleteWork, saveChapter, deleteChapter,
  loadLibrary, saveLibrary, updatePenName
};