/* 龙吟写作 · AI 结果采纳用例 */
import { render } from "../app/render.js";
import { chapterText, state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { currentChapter, currentMaterial, currentWeapon, invalidateRefIndex } from "../domain/entities.js";
import { currentPlace } from "../domain/maps/model.js";
import { aiTargetEntity } from "../domain/ai/context.js";
import { refreshAISelStrip } from "../domain/ai/labels.js";
import { pushManuscriptUndoPoint } from "../domain/writing/history.js";

export function applyAIResult(action, result, rowIndex) {
  const chapter = currentChapter();
  const target = aiTargetEntity();
  if (["continue", "nextpara", "polish", "rewrite", "expand", "compress", "summary"].includes(action) && chapter) {
    const editor = document.getElementById("manuscript");
    let text = chapterText[chapter.id] || "";
    const replaceSel = ["polish", "rewrite", "expand", "compress"].includes(action) && state.aiSel;
    if (editor) {
      const start = replaceSel ? state.aiSel.start : editor.selectionStart;
      const end = replaceSel ? state.aiSel.end : editor.selectionStart;
      text = replaceSel ? text.slice(0, start) + result.body + text.slice(end) : text.slice(0, end) + "\n" + result.body + text.slice(end);
      pushManuscriptUndoPoint(editor);
      editor.value = text;
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: result.body }));
    } else {
      chapterText[chapter.id] = replaceSel ? text : `${text}\n${result.body}`;
    }
    state.aiSel = null;
    refreshAISelStrip();
  }
  if (action === "fill-entry" && target && result.fields) {
    if (result.fields.fields) { target.record.fields = { ...target.record.fields, ...result.fields.fields }; delete result.fields.fields; }
    Object.assign(target.record, result.fields);
    invalidateRefIndex();
  }
  if (action === "volumes" && rowIndex !== undefined) result.rows[rowIndex].apply?.();
  if (action === "rel-suggest" && rowIndex !== undefined) result.rows[rowIndex].apply?.();
  if (action === "map-name" && chapter) { const place = currentPlace(); if (place) place.name = result.body; state.mapPoint = place.name; invalidateRefIndex(); }
  if (action === "map-desc" && chapter) { const place = currentPlace(); if (place) place.desc = result.body; }
  if (action === "balance") { const item = currentWeapon(); if (item) item.drawback = result.drawback; }
  if (action === "mat-tags") { const material = currentMaterial(); if (material) { material.tags = result.tags; material.aiSummary = result.summary; } }
  state.dialog = null;
  state.aiResult = null;
  render();
  notify("已采纳 AI 结果");
}