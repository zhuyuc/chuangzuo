import { chapterText, historySnapshots, state } from "../../core/store.js";
import { refreshAISelStrip } from "../ai/labels.js";
import { currentChapter } from "../entities.js";





/* 龙吟写作 · 正文历史与撤销 */
    const manuscriptUndoHistory = new Map();

    export function snapshotCurrentChapter() {
      const chapter = currentChapter();
      if (!chapter) return;
      const text = chapterText[chapter.id] || "";
      const same = historySnapshots.find(item => item.chapterId === chapter.id && item.text === text);
      if (same) { state.historyVersion = same.id; return; }
      const count = text.replace(/\s/g, "").length;
      const snapshot = { id: `snap-${Date.now()}`, chapterId: chapter.id, time: "刚刚", words: `${count.toLocaleString()} 字`, summary: "当前版本", text };
      historySnapshots.unshift(snapshot);
      if (historySnapshots.length > 20) historySnapshots.pop();
      state.historyVersion = snapshot.id;
    }

    export function manuscriptHistoryState(editor) {
      const chapter = currentChapter();
      if (!editor || !chapter) return null;
      if (!manuscriptUndoHistory.has(chapter.id)) manuscriptUndoHistory.set(chapter.id, { stack: [], redo: [], lastType: null, lastAt: 0 });
      return manuscriptUndoHistory.get(chapter.id);
    }

    export function pushManuscriptUndoPoint(editor) {
      const history = manuscriptHistoryState(editor);
      if (!history) return;
      history.stack.push({ text: editor.value, start: editor.selectionStart, end: editor.selectionEnd });
      if (history.stack.length > 100) history.stack.shift();
      history.redo = [];
      history.lastType = null;
      history.lastAt = 0;
    }

    function applyManuscriptSnapshot(editor, snapshot) {
      const scrollTop = editor.scrollTop;
      editor.value = snapshot.text;
      editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: null }));
      editor.focus();
      const start = Math.min(snapshot.start, editor.value.length);
      const end = Math.min(snapshot.end, editor.value.length);
      editor.setSelectionRange(start, end);
      editor.scrollTop = scrollTop;
    }

    export function stepManuscriptUndo(redo = false) {
      const editor = document.getElementById("manuscript");
      if (!editor || document.activeElement !== editor) return false;
      const history = manuscriptHistoryState(editor);
      if (!history) return false;
      const source = redo ? history.redo : history.stack;
      const snapshot = source.pop();
      if (!snapshot) return false;
      const opposite = redo ? history.stack : history.redo;
      opposite.push({ text: editor.value, start: editor.selectionStart, end: editor.selectionEnd });
      if (opposite.length > 100) opposite.shift();
      history.lastType = null;
      history.lastAt = 0;
      applyManuscriptSnapshot(editor, snapshot);
      return true;
    }

    export function trackManuscriptSelection(event) {
      if (event.target.id !== "manuscript") return;
      const start = event.target.selectionStart;
      const end = event.target.selectionEnd;
      const next = start !== end ? { start, end, text: event.target.value.slice(start, end) } : null;
      const same = JSON.stringify(next) === JSON.stringify(state.aiSel);
      if (!same) { state.aiSel = next; refreshAISelStrip(); }
    }

    export function playCompletionSeal() {
      const shell = document.querySelector(".editor-shell");
      if (!shell) return;
      shell.querySelectorAll(".completion-seal").forEach(node => node.remove());
      const seal = document.createElement("span");
      seal.className = "completion-seal";
      seal.textContent = "完";
      seal.setAttribute("aria-hidden", "true");
      shell.appendChild(seal);
      setTimeout(() => seal.remove(), 2100);
    }