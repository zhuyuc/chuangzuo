/* 龙吟写作 · 排版预览弹窗 */
import { chapterText } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { currentChapter } from "../domain/entities.js";
import { isStructuralBlock, splitParagraphs } from "../domain/typography.js";

function paragraphMarkup(block) {
  const structural = isStructuralBlock(block);
  const body = escapeHtml(block).replace(/\n/g, "<br>");
  return `<p class="${structural ? "prose-structural" : ""}">${body}</p>`;
}

export function renderTypographyDialog(root) {
  const chapter = currentChapter();
  const text = chapter ? chapterText[chapter.id] || "" : "";
  const paragraphs = splitParagraphs(text);
  const content = paragraphs.length
    ? `<article class="chapter-prose">${paragraphs.map(paragraphMarkup).join("")}</article>`
    : '<div class="empty-state compact"><strong>还没有正文</strong><p>先写下一段文字，再回来查看排版效果。</p></div>';
  root.innerHTML = `<div class="dialog-screen"><section class="dialog-card dialog-xl typography-dialog"><div class="dialog-header"><div><h1>排版预览</h1><p>首行缩进与行宽由版式生成，不会写入正文；标点校正才会修改正文。</p></div><button class="dialog-close" data-dialog-close>×</button></div><div class="dialog-body typography-body">${content}</div><div class="dialog-actions"><button class="button" data-typography-correct>标点校正</button><button class="button" data-typography-copy>复制排版文本</button><button class="button primary" data-dialog-close>关闭</button></div></section></div>`;
}