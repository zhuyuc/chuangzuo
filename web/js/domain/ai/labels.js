import { state } from "../../core/store.js";

/* 龙吟写作 · AI 指令标签与选择条 */
    export const AI_BASEURL_PRESETS = { "OpenAI 兼容": "https://api.openai.com/v1", "Anthropic 兼容": "https://api.anthropic.com/v1", "本地 Ollama": "http://127.0.0.1:11434/v1", "自定义 baseURL": "" };

    export const AI_REGISTRY = window.LongyinAIActions || { actions: {} };

    export const AI_LABELS = Object.fromEntries(Object.entries(AI_REGISTRY.actions || {}).map(([id, action]) => [id, action.label]));

    export function aiOn() { return state.ai.enabled && state.ai.configured; }

    export function aiButton(action, target) {
      return `<button class="button ai" data-ai="${action}" ${target ? `data-ai-target="${target}"` : ""} ${aiOn() ? "" : "disabled"} title="${aiOn() ? AI_LABELS[action] : "未配置或未启用 AI"}">${AI_LABELS[action]}</button>`;
    }

    export function refreshAISelStrip() {
      const box = document.getElementById("ai-sel-strip");
      if (!box) return;
      if (!state.aiSel || !aiOn()) { box.innerHTML = ""; return; }
      box.innerHTML = `<span>选中 ${state.aiSel.text.length} 字</span><span class="spacer"></span>${["continue", "polish", "rewrite", "expand", "compress"].map(action => aiButton(action)).join("")}`;
    }