const repository = require("../repositories/account");
const registry = require("../../shared/ai-actions");

function messagesFor(body) {
  if (Array.isArray(body.messages) && body.messages.length) return body.messages;
  return registry.buildMessages(body.action, body.context);
}

async function run(accountId, body) {
  const runtime = repository.getAiRuntime(accountId);
  const messages = messagesFor(body || {});
  if (!runtime.enabled || !runtime.baseUrl || !runtime.apiKey) return { mock: true, model: runtime.model };
  if (!messages) return { error: "未知的 AI 指令。" };
  const url = `${runtime.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${runtime.apiKey}` },
      body: JSON.stringify({ model: body.model || runtime.model, messages, temperature: 0.7 }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!response.ok) return { error: `provider 返回 HTTP ${response.status}` };
    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content || "";
    if (!text.trim()) return { error: "provider 返回空内容。" };
    return { text, model: json.model || runtime.model };
  } catch (error) {
    clearTimeout(timer);
    return { error: error.name === "AbortError" ? "provider 60 秒超时。" : `provider 请求失败：${error.message}` };
  }
}

async function test(accountId, body) {
  const runtime = repository.getAiRuntime(accountId);
  const baseUrl = String((body.baseUrl !== undefined ? body.baseUrl : runtime.baseUrl) || "").trim();
  const apiKey = body.apiKey ? String(body.apiKey) : runtime.apiKey;
  const model = String((body.model !== undefined ? body.model : runtime.model) || "").trim();
  if (!baseUrl) return { mock: true, message: "未填访问地址：将使用离线模拟。" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: controller.signal
    });
    clearTimeout(timer);
    if (response.ok) return { ok: true, message: `连接成功（HTTP ${response.status}）。模型 ${model || "未填写"} 将在首次调用时校验。` };
    return { ok: false, message: `连接失败：HTTP ${response.status}。请检查地址与密钥权限。` };
  } catch (error) {
    clearTimeout(timer);
    return { ok: false, message: error.name === "AbortError" ? "连接失败：6 秒超时。" : `连接失败：${error.message}。浏览器直连受跨域限制时，本测试由本地服务器代发。` };
  }
}

function getSettings(accountId) {
  return repository.getAiSettings(accountId);
}

function saveSettings(accountId, settings) {
  return repository.setAiSettings(accountId, settings || {});
}

module.exports = { run, test, getSettings, saveSettings };