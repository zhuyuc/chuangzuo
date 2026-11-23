import { REFERENCE_TABS, REFERENCE_TAB_HINTS } from "../core/state.js";
import { chapterText, chapters, state } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { currentChapter } from "../domain/entities.js";
import { scanChapterReferences } from "../domain/reference-scan.js";
import { activeData, activeWork } from "../domain/works.js";
import { referenceContent } from "../domain/writing/references.js";
import { pageTitle } from "../ui/shell.js";
import { chapterTree } from "./dashboard.js";





/* 龙吟写作 · 写作页 */
    export function writingPage() {
      const chapter = currentChapter();
      if (!chapter) return `<section class="page">${pageTitle("写作", "当前作品还没有章节。", `<button class="button primary" data-entity-add="chapter">新建章节</button>`)}<div class="empty-state"><strong>还没有章节</strong><p>建立第一章后即可开始写作。</p><button class="button primary" data-entity-add="chapter">新建章节</button></div></section>`;
      if (state.referenceChapter !== chapter.id) {
        state.referenceChapter = chapter.id;
        state.referenceScope = "chapter";
        state.referenceEntity = null;
        state.referenceQuery = "";
        state.aiSel = null;
      }
      scanChapterReferences(chapter, { refresh: false });
      const openTabs = activeData().openTabs.filter(id => chapters.some(item => item.id === id));
      if (!openTabs.includes(chapter.id)) openTabs.push(chapter.id);
      const totalWords = chapters.reduce((sum, item) => sum + Number(String(item.words).replace(/[^\d]/g, "") || 0), 0);
      return `<section class="writing-page ${state.focus ? "focus-mode" : ""}">${state.focus ? '<button class="focus-exit" data-toggle="focus" title="Esc">退出专注</button>' : ""}<div class="document-tabs"><div class="document-tabs-scroll">${openTabs.map(id => { const item = chapters.find(entry => entry.id === id); return `<div class="document-tab ${state.chapter === item.id ? "active" : ""}"><button class="tab-label" data-chapter="${item.id}">${escapeHtml(item.title)}</button><button class="tab-close" data-close-tab="${item.id}" aria-label="关闭 ${escapeHtml(item.title)}">×</button></div>`; }).join("")}<button class="new-tab" data-entity-add="chapter" title="新建章节">＋</button></div><div class="editor-actions"><button class="button" data-toggle="search" title="Ctrl+F">查找替换</button><button class="button" data-dialog="typography" title="阅读版式预览、标点校正">排版</button><button class="button" data-dialog="history">历史版本</button><button class="button ${state.focus ? "active" : ""}" data-toggle="focus">专注模式</button></div></div>${state.searchOpen ? `<div class="replace-bar"><input id="find-query" placeholder="查找内容" aria-label="查找内容"><input id="replace-query" placeholder="替换为" aria-label="替换内容"><button class="button" data-find>查找</button><button class="button" data-replace-all>全书替换</button><span class="find-result" id="find-result"></span><button data-toggle="search" aria-label="关闭查找">×</button></div>` : ""}<div class="writing-layout ${state.focus ? "focus" : ""}">${state.focus ? "" : `<aside class="inner-sidebar writing-tree"><div class="tree-heading"><span>作品目录</span><strong>${escapeHtml(activeWork().name)}</strong></div>${chapterTree()}<div class="tree-actions"><button class="button" data-entity-add="volume">＋ 新建分卷</button><button class="button" data-entity-add="chapter">＋ 新建章节</button></div></aside>`}<div class="editor-shell"><div class="editor-heading"><div><input class="editor-title-input" data-chapter-field="title" value="${escapeHtml(chapter.title)}" aria-label="章节标题"></div></div><div class="ai-strip" id="ai-sel-strip"></div><textarea class="manuscript" id="manuscript" placeholder="从这里开始写作……输入 @ 可引用人物、地点、装备与设定" aria-label="正文编辑器">${escapeHtml(chapterText[state.chapter] || "")}</textarea><div class="editor-status"><div class="editor-meta-controls"><select class="meta-select" data-chapter-field="state" aria-label="章节状态">${["待写作", "写作中", "已完成"].map(status => `<option ${chapter.state === status ? "selected" : ""}>${status}</option>`).join("")}</select><span>目标</span><input class="meta-input" type="number" min="0" step="500" data-chapter-field="targetWords" value="${chapter.targetWords || 4000}" aria-label="目标字数"><span>字</span><span id="autosave-label">自动保存</span></div><span id="chapter-word-count">本章 ${chapter.words} 字</span><span id="book-word-count">全书 ${totalWords.toLocaleString()} 字</span></div></div>${state.focus ? "" : `<aside class="writing-reference"><div class="reference-tabs">${REFERENCE_TABS.map(tab => `<button class="${state.rightTab === tab ? "active" : ""}" data-reference-tab="${tab}" title="${REFERENCE_TAB_HINTS[tab] || ""}">${tab}</button>`).join("")}</div>${referenceContent()}</aside>`}</div></section>`;
    }
