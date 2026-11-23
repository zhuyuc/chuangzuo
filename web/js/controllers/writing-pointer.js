import { state } from "../core/store.js";
import { closeMention, selectMention } from "../domain/writing/mention.js";





/* 龙吟写作 · @ 引用选择器指针交互 */
export function attachWritingPointerEvents() {
  document.addEventListener("pointerdown", event => {
    if (!state.mentionOpen) return;
    const row = event.target.closest("[data-mention-key]");
    if (row) { event.preventDefault(); selectMention(row.dataset.mentionKey); return; }
    if (event.target.closest("#mention-popup")) return;
    closeMention();
  });
}