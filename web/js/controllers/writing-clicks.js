import { render } from "../app/render.js";
import { navigate } from "../app/router.js";
import { markDirty } from "../core/persistence.js";
import { saveUiPrefs } from "../core/state.js";
import { chapters, outlineData, state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { askConfirm, renderDialog } from "../dialogs/index.js";
import { addChapterRef, currentChapter, entityRefGroup, isChapterRef, removeChapterRef, storyEntityById } from "../domain/entities.js";
import { scanChapterReferences } from "../domain/reference-scan.js";
import { activeData } from "../domain/works.js";
import { findCurrentMatch, replaceInAllChapters } from "../domain/writing/format.js";
import { deleteRefMentions, refreshWritingReference, rememberRecentRef } from "../domain/writing/references.js";





/* 龙吟写作 · 章节、大纲与引用点击 */
export function writingClicks(event, target) {
  if (target.dataset.volumeToggle) { const id = target.dataset.volumeToggle; state.collapsedVolumes = state.collapsedVolumes.includes(id) ? state.collapsedVolumes.filter(item => item !== id) : [...state.collapsedVolumes, id]; render(); return true; }
  if (target.dataset.outlineView) { state.outlineView = target.dataset.outlineView; render(); return true; }
  if (target.hasAttribute("data-add-beat")) { const chapter = currentChapter(); if (chapter) { chapter.beats.push("新场景节拍"); render(); } return true; }
  if (target.dataset.removeBeat !== undefined) { const chapter = currentChapter(); if (chapter) { chapter.beats.splice(Number(target.dataset.removeBeat), 1); render(); } return true; }
  if (target.dataset.deleteVolume) { const volume = outlineData.volumes.find(item => item.id === target.dataset.deleteVolume); if (!volume) return true; if (chapters.some(chapter => chapter.volumeId === volume.id)) { notify("请先移动或删除该卷中的章节"); return true; } if (outlineData.volumes.length === 1) { notify("至少保留一个分卷"); return true; } askConfirm(`删除「${volume.title} ${volume.subtitle || ""}」？该卷下没有章节，删除后不可恢复。`, () => { outlineData.volumes = outlineData.volumes.filter(item => item.id !== volume.id); state.outlineVolume = outlineData.volumes[0].id; render(); notify("已删除分卷"); }, true); return true; }
  if (target.dataset.closeTab) { const id = target.dataset.closeTab; if (activeData().openTabs.length <= 1) { notify("请至少保留一个章节标签"); return true; } activeData().openTabs = activeData().openTabs.filter(tabId => tabId !== id); if (state.chapter === id) { state.chapter = activeData().openTabs[activeData().openTabs.length - 1]; activeData().currentChapter = state.chapter; } render(); return true; }
  if (target.dataset.chapter) { state.chapter = target.dataset.chapter; if (!activeData().openTabs.includes(state.chapter)) activeData().openTabs.push(state.chapter); activeData().currentChapter = state.chapter; render(); return true; }
  if (target.hasAttribute("data-find")) { findCurrentMatch(); return true; }
  if (target.hasAttribute("data-replace-all")) { replaceInAllChapters(); return true; }
  if (target.dataset.chapterNav) { state.chapter = target.dataset.chapterNav; if (!activeData().openTabs.includes(state.chapter)) activeData().openTabs.push(state.chapter); activeData().currentChapter = state.chapter; navigate("writing"); return true; }
  if (target.dataset.referenceTab) { state.rightTab = target.dataset.referenceTab; state.referenceScope = "chapter"; state.referenceQuery = ""; state.referenceEntity = null; refreshWritingReference(); saveUiPrefs(); return true; }
  if (target.dataset.refScope) { state.referenceScope = target.dataset.refScope; state.referenceQuery = ""; state.referenceEntity = null; refreshWritingReference(); saveUiPrefs(); return true; }
  if (target.dataset.refEntity) { state.referenceEntity = target.dataset.refEntity; refreshWritingReference(); return true; }
  if (target.dataset.refRemove) { state.removeRefKey = target.dataset.refRemove; state.dialog = "remove-ref"; renderDialog(); return true; }
  if (target.dataset.removeRef) {
    const [type, ...idParts] = String(state.removeRefKey || "").split(":");
    const id = idParts.join(":");
    const group = entityRefGroup(type);
    const chapter = currentChapter();
    const entity = storyEntityById(id);
    if (chapter && entity) {
      if (target.dataset.removeRef === "text") deleteRefMentions(chapter, entity);
      removeChapterRef(chapter, group, id);
      scanChapterReferences(chapter, { refresh: false });
    }
    state.dialog = null;
    state.removeRefKey = null;
    renderDialog();
    refreshWritingReference();
    return true;
  }
  if (target.dataset.refMaterial) {
    const chapter = currentChapter();
    if (!chapter) return true;
    const id = target.dataset.refMaterial;
    chapter.materialIds = chapter.materialIds || [];
    if (chapter.materialIds.includes(id)) chapter.materialIds = chapter.materialIds.filter(item => item !== id);
    else chapter.materialIds.push(id);
    markDirty();
    refreshWritingReference();
    return true;
  }
  if (target.dataset.refToggle) {
    const [type, ...idParts] = target.dataset.refToggle.split(":");
    const id = idParts.join(":");
    const group = entityRefGroup(type);
    const chapter = currentChapter();
    const entity = storyEntityById(id);
    if (chapter && entity) {
      if (isChapterRef(chapter, group, id)) removeChapterRef(chapter, group, id);
      else { addChapterRef(chapter, group, id); rememberRecentRef(entity); }
      refreshWritingReference();
    }
    return true;
  }
  return false;
}