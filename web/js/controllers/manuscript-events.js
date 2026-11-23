import { markDirty } from "../core/persistence.js";
import { chapterText, state } from "../core/store.js";
import { currentChapter } from "../domain/entities.js";
import { autoAssociateChapter } from "../domain/reference-scan.js";
import { updateWorkSummary } from "../domain/works.js";
import { manuscriptHistoryState, trackManuscriptSelection } from "../domain/writing/history.js";
import { closeMention, getTextareaCaretPosition, positionMentionPopup, updateMentionFromEditor } from "../domain/writing/mention.js";





/* 龙吟写作 · 正文编辑器事件 */
export function attachManuscriptEvents() {
  document.addEventListener("beforeinput", event => {
    if (event.target.id !== "manuscript" || !event.isTrusted) return;
    const history = manuscriptHistoryState(event.target);
    if (!history) return;
    const now = performance.now();
    const inputType = event.inputType || "";
    const typingType = ["insertText", "insertCompositionText", "insertLineBreak"].includes(inputType);
    const grouped = typingType && history.lastType === inputType && now - history.lastAt < 1000;
    if (!grouped) {
      history.stack.push({ text: event.target.value, start: event.target.selectionStart, end: event.target.selectionEnd });
      if (history.stack.length > 100) history.stack.shift();
      history.redo = [];
    }
    history.lastType = typingType ? inputType : null;
    history.lastAt = now;
  });

  document.addEventListener("input", event => {
    if (event.target.id !== "manuscript") return;
    chapterText[state.chapter] = event.target.value;
    const count = event.target.value.replace(/\s/g, "").length;
    currentChapter().words = count.toLocaleString();
    updateWorkSummary();
    document.getElementById("chapter-word-count").textContent = `本章 ${count.toLocaleString()} 字`;
    const autosave = document.getElementById("autosave-label");
    if (autosave) autosave.textContent = "正在保存…";
    clearTimeout(window.saveTimer);
    window.saveTimer = setTimeout(() => {
      autoAssociateChapter(currentChapter());
      if (autosave) autosave.textContent = "已保存";
    }, 500);
    markDirty();
    if (!event.isComposing) updateMentionFromEditor();
  });

  document.addEventListener("compositionend", event => {
    if (event.target.id === "manuscript") updateMentionFromEditor();
  });

  document.addEventListener("keyup", trackManuscriptSelection);

  document.addEventListener("mouseup", trackManuscriptSelection);

  document.addEventListener("scroll", event => {
    if (!state.mentionOpen || !event.target || event.target.id !== "manuscript") return;
    requestAnimationFrame(() => {
      const editor = document.getElementById("manuscript");
      if (!editor || !state.mentionOpen) return;
      const rect = editor.getBoundingClientRect();
      const caret = getTextareaCaretPosition(editor);
      if (caret.bottom < rect.top || caret.top > rect.bottom) closeMention();
      else positionMentionPopup();
    });
  }, true);
}