import { api } from "../../core/api.js";
import { state } from "../../core/store.js";
import { renderDialog } from "../../dialogs/index.js";
import { buildAIContext } from "./context.js";
import { aiOn } from "./labels.js";
import { mockAIResult } from "./mock.js";
import { attachServerApplies, parseAIResult } from "./results.js";





/* 龙吟写作 · AI 运行入口 */
    export function runAI(action) {
      if (!aiOn()) return;
      state.aiAction = action;
      state.aiResult = { loading: true };
      state.dialog = "ai";
      renderDialog();
      clearTimeout(window.aiTimer);
      window.aiTimer = setTimeout(async () => {
        let result = null;
        if (state.ai.baseUrl) {
          try {
            const data = await api("/ai/run", { method: "POST", body: JSON.stringify({ action, context: buildAIContext() }) });
            if (data && data.text) result = attachServerApplies(action, parseAIResult(action, data.text));
            else if (data && data.mock) result = null;
            else if (data && data.error) result = { kind: "text", body: `AI 调用失败：${data.error}`, error: true };
          } catch (error) {
            result = { kind: "text", body: `AI 调用失败：${error.message}`, error: true };
          }
        }
        if (!result) result = mockAIResult(action);
        state.aiResult = result;
        renderDialog();
      }, state.ai.baseUrl ? 120 : 650);
    }