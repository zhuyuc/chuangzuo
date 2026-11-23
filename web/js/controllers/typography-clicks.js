/* 龙吟写作 · 排版预览操作 */
import { askConfirm, renderDialog } from "../dialogs/index.js";
import { chapterText } from "../core/store.js";
import { notify, notifyError } from "../core/utils.js";
import { currentChapter } from "../domain/entities.js";
import { indentForExport, normalizePunctuation } from "../domain/typography.js";
import { pushManuscriptUndoPoint, snapshotCurrentChapter } from "../domain/writing/history.js";

function correctionSummary(result) {
  const parts = [];
  if (result.punctuation) parts.push(`${result.punctuation} 处标点`);
  if (result.blankLines) parts.push(`${result.blankLines} 处多余空行`);
  return parts.length ? parts.join("、") : "文首尾空白";
}

function correctTypography() {
  const chapter = currentChapter();
  if (!chapter) return;
  const original = chapterText[chapter.id] || "";
  const result = normalizePunctuation(original);
  if (result.text === original) { notify("正文标点与空行已经规范"); return; }
  const summary = correctionSummary(result);
  askConfirm(`将校正 ${summary}，不改变段落缩进。是否应用？`, () => {
    const editor = document.getElementById("manuscript");
    snapshotCurrentChapter();
    if (editor) {
      pushManuscriptUndoPoint(editor);
      editor.value = result.text;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      chapterText[chapter.id] = result.text;
    }
    notify(`已校正${summary}`);
    renderDialog();
  });
}

function fallbackCopy(text) {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    notify("已复制排版文本");
  } catch (error) {
    notifyError("复制失败，请检查浏览器剪贴板权限");
  }
}

function copyTypography() {
  const chapter = currentChapter();
  if (!chapter) return;
  const text = indentForExport(chapterText[chapter.id] || "");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => notify("已复制排版文本")).catch(() => fallbackCopy(text));
    return;
  }
  fallbackCopy(text);
}

export function typographyClicks(event, target) {
  if (target.hasAttribute("data-typography-correct")) { correctTypography(); return true; }
  if (target.hasAttribute("data-typography-copy")) { copyTypography(); return true; }
  return false;
}