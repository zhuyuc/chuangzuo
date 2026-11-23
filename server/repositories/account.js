const storage = require("../storage");
const contracts = require("../../shared/contracts");

function publicProfile(account) {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    penName: account.penName || "",
    createdAt: account.createdAt
  };
}

function normalizeAccount(accountName) {
  return storage.normalizeAccount(accountName);
}

function isValidAccount(accountName) {
  return storage.isValidAccount(accountName);
}

function findAccount(accountName) {
  return storage.findAccountByEmail(accountName);
}

function createAccount(accountName, password) {
  return storage.createAccount(accountName, password, { name: accountName });
}

function verifyPassword(account, password) {
  return storage.verifyPassword(account, password);
}

function getAccount(accountId) {
  return storage.getAccount(accountId);
}

function updateProfile(accountId, patch) {
  const account = storage.updateAccount(accountId, patch);
  return account ? publicProfile(account) : null;
}

function loadPayload(accountId) {
  const payload = storage.loadAccountPayload(accountId);
  if (!payload) return null;
  payload.schemaVersion = contracts.dataVersion;
  return payload;
}

function savePayload(accountId, payload) {
  return storage.saveAccountPayload(accountId, payload);
}

function loadWork(accountId, workId) {
  return storage.loadWorkResource(accountId, workId);
}

function saveWork(accountId, workId, work, revision) {
  return storage.saveWorkResource(accountId, workId, work, revision);
}

function deleteWork(accountId, workId, revision) {
  return storage.deleteWorkResource(accountId, workId, revision);
}

function saveChapter(accountId, workId, chapterId, text, revision) {
  return storage.saveChapterResource(accountId, workId, chapterId, text, revision);
}

function deleteChapter(accountId, workId, chapterId, revision) {
  return storage.deleteChapterResource(accountId, workId, chapterId, revision);
}

function loadLibrary(accountId) {
  return storage.loadLibraryResource(accountId);
}

function saveLibrary(accountId, library, revision) {
  return storage.saveLibraryResource(accountId, library, revision);
}

function createSession(accountId) {
  return storage.createSession(accountId);
}

function sessionAccount(token) {
  return storage.sessionAccount(token);
}

function destroySession(token) {
  storage.destroySession(token);
}

function getAiSettings(accountId) {
  const payload = storage.loadAccountPayload(accountId);
  return payload ? payload.ai : null;
}

function setAiSettings(accountId, settings) {
  return storage.setAiSettings(accountId, settings);
}

function getAiRuntime(accountId) {
  return storage.getAiRuntime(accountId);
}

module.exports = {
  publicProfile,
  normalizeAccount,
  isValidAccount,
  findAccount,
  createAccount,
  verifyPassword,
  getAccount,
  updateProfile,
  loadPayload,
  savePayload,
  loadWork,
  saveWork,
  deleteWork,
  saveChapter,
  deleteChapter,
  loadLibrary,
  saveLibrary,
  createSession,
  sessionAccount,
  destroySession,
  getAiSettings,
  setAiSettings,
  getAiRuntime
};