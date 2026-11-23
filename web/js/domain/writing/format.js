import { markDirty } from "../../core/persistence.js";
import { chapterText, chapters, state } from "../../core/store.js";
import { notify } from "../../core/utils.js";
import { currentChapter } from "../entities.js";
import { scanChapterReferences } from "../reference-scan.js";
import { updateWorkSummary } from "../works.js";
import { pushManuscriptUndoPoint } from "./history.js";
import { refreshWritingReference } from "./references.js";





/* 龙吟写作 · 查找替换与中文排版 */
    export function findCurrentMatch() {
      const query = document.getElementById("find-query").value;
      const output = document.getElementById("find-result");
      const editor = document.getElementById("manuscript");
      if (!query) { output.textContent = "请输入内容"; return; }
      const text = editor.value;
      const count = text.split(query).length - 1;
      if (!count) { output.textContent = "没有匹配"; return; }
      let index = text.indexOf(query, editor.selectionEnd || 0);
      if (index < 0) index = text.indexOf(query);
      editor.focus();
      editor.setSelectionRange(index, index + query.length);
      output.textContent = `${count} 处匹配`;
    }

    export function replaceInAllChapters() {
      const query = document.getElementById("find-query").value;
      const replacement = document.getElementById("replace-query").value;
      const output = document.getElementById("find-result");
      if (!query) { output.textContent = "请输入查找内容"; return; }
      let count = 0;
      chapters.forEach(chapter => {
        const text = chapterText[chapter.id] || "";
        const matches = text.split(query).length - 1;
        if (matches) {
          chapterText[chapter.id] = text.split(query).join(replacement);
          chapter.words = chapterText[chapter.id].replace(/\s/g, "").length.toLocaleString();
          count += matches;
        }
      });
      if (!count) { output.textContent = "没有匹配"; return; }
      const editor = document.getElementById("manuscript");
      pushManuscriptUndoPoint(editor);
      editor.value = chapterText[state.chapter] || "";
      document.getElementById("chapter-word-count").textContent = `本章 ${currentChapter().words} 字`;
      document.getElementById("book-word-count").textContent = `全书 ${chapters.reduce((sum, item) => sum + Number(String(item.words).replace(/[^\d]/g, "") || 0), 0).toLocaleString()} 字`;
      chapters.forEach(item => scanChapterReferences(item, { refresh: false }));
      if (state.page === "writing") refreshWritingReference();
      updateWorkSummary();
      markDirty();
      output.textContent = `已替换 ${count} 处`;
      notify(`全书替换完成，共 ${count} 处`);
    }