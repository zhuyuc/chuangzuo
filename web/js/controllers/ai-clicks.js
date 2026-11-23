import { render } from "../app/render.js";
import { api } from "../core/api.js";
import { state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { openDialog, renderDialog } from "../dialogs/index.js";
import { aiOn } from "../domain/ai/labels.js";
import { applyAIResult } from "./ai-apply.js";
import { runAI } from "../domain/ai/runtime.js";
import { renderAccountMenu } from "../ui/shell.js";





/* 龙吟写作 · AI 操作点击 */
export function aiClicks(event, target) {
  if (target.dataset.ai) { if (!aiOn()) return true; state.aiTarget = target.dataset.aiTarget || null; runAI(target.dataset.ai); return true; }
  if (target.hasAttribute("data-ai-adopt")) { applyAIResult(state.aiAction, state.aiResult); return true; }
  if (target.dataset.aiAdoptRow !== undefined) { applyAIResult(state.aiAction, state.aiResult, Number(target.dataset.aiAdoptRow)); return true; }
  if (target.dataset.aiJump !== undefined) { const row = state.aiResult?.rows?.[Number(target.dataset.aiJump)]; if (row?.jump) row.jump(); state.dialog = null; state.aiResult = null; render(); return true; }
  if (target.dataset.aiDropRow !== undefined) { state.aiResult?.rows?.splice(Number(target.dataset.aiDropRow), 1); renderDialog(); return true; }
  if (target.hasAttribute("data-ai-copy")) { navigator.clipboard?.writeText(state.aiResult?.body || ""); notify("已复制 AI 结果"); return true; }
  if (target.hasAttribute("data-ai-retry")) { runAI(state.aiAction); return true; }
  if (target.hasAttribute("data-ai-settings")) {
    state.accountMenuOpen = false;
    renderAccountMenu();
    api("/ai/settings").then(data => { Object.assign(state.ai, data); openDialog("ai-settings"); }).catch(() => openDialog("ai-settings"));
    return true;
  }
  if (target.hasAttribute("data-ai-clear-key")) { state.aiClearKey = true; notify("保存后将清除已保存的密钥"); return true; }
  if (target.hasAttribute("data-ai-test")) {
    const form = document.getElementById("ai-settings-form");
    const status = document.getElementById("ai-test-status");
    if (!form || !status) return true;
    status.textContent = "测试中…";
    status.className = "ai-test";
    api("/ai/test", { method: "POST", body: JSON.stringify({ baseUrl: form.elements.baseUrl.value.trim(), model: form.elements.model.value.trim(), apiKey: form.elements.apiKey.value.trim() }) })
      .then(data => { status.textContent = data.message || (data.mock ? "未填访问地址：将使用离线模拟。" : "连接成功。"); status.className = `ai-test ${data.ok === false ? "fail" : data.mock ? "" : "ok"}`; })
      .catch(error => { status.textContent = `连接失败：${error.message}`; status.className = "ai-test fail"; });
    return true;
  }
  return false;
}