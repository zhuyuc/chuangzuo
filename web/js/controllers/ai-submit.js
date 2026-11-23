import { render } from "../app/render.js";
import { api } from "../core/api.js";
import { state } from "../core/store.js";
import { notify } from "../core/utils.js";





/* 龙吟写作 · AI 设置表单提交 */
export function aiSubmit(event) {
  if (event.target.id !== "ai-settings-form") return false;
  event.preventDefault();
  const form = event.target;
  const payload = {
    provider: form.elements.provider.value,
    model: form.elements.model.value.trim() || "longyin-mock-1",
    baseUrl: form.elements.baseUrl.value.trim(),
    includeText: form.elements.includeText.checked,
    enabled: form.elements.enabled.checked,
    apiKey: state.aiClearKey ? "__clear__" : form.elements.apiKey.value.trim()
  };
  state.aiClearKey = false;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "保存中…";
  api("/ai/settings", { method: "PUT", body: JSON.stringify(payload) })
    .then(data => { Object.assign(state.ai, data); state.dialog = null; render(); notify(state.ai.enabled ? "设置已保存" : "AI 已关闭"); })
    .catch(error => { submitButton.disabled = false; submitButton.textContent = "保存"; notify(`保存失败：${error.message}`); });
  return true;
}