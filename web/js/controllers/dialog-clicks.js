import { render } from "../app/render.js";
import { chapterText, historySnapshots, state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { closeDialog, openDialog, renderDialog } from "../dialogs/index.js";
import { currentChapter } from "../domain/entities.js";
import { updateWorkSummary } from "../domain/works.js";
import { snapshotCurrentChapter } from "../domain/writing/history.js";





/* 龙吟写作 · 弹窗与历史版本点击 */
export function dialogClicks(event, target) {
  if (target.dataset.dialog) { if (target.dataset.dialog === "history") snapshotCurrentChapter(); if (target.dataset.dialog === "inspiration") state.inspirationEditId = null; openDialog(target.dataset.dialog); return true; }
  if (target.hasAttribute("data-dialog-close")) { state.confirm = null; closeDialog(); return true; }
  if (target.hasAttribute("data-confirm-ok")) { const onOk = state.confirm?.onOk; state.confirm = null; state.dialog = state.dialogBeforeConfirm || null; state.dialogBeforeConfirm = null; renderDialog(); if (onOk) onOk(); return true; }
  if (target.dataset.historyVersion) { state.historyVersion = target.dataset.historyVersion; renderDialog(); return true; }
  if (target.hasAttribute("data-history-restore")) { const history = historySnapshots.filter(item => item.chapterId === state.chapter); const snapshot = history.find(item => item.id === state.historyVersion) || history[0]; if (snapshot) { chapterText[state.chapter] = snapshot.text; currentChapter().words = snapshot.text.replace(/\s/g, "").length.toLocaleString(); updateWorkSummary(); state.dialog = null; render(); notify(`已恢复到 ${snapshot.time} 的版本`); } return true; }
  return false;
}