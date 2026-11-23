import { render } from "../app/render.js";
import { libraryItems, state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { invalidateRefIndex } from "../domain/entities.js";
import { activeData, updateWorkSummary } from "../domain/works.js";

/* 龙吟写作 · 共享设定库点击 */
function referenceSharedToWork(sharedId) {
  const shared = libraryItems.find(item => item.id === sharedId);
  if (!shared) return;
  const data = activeData();
  let target = null;
  if (shared.kind === "人物") target = data.characters.find(item => item.sharedRef === sharedId);
  if (shared.kind === "地点") target = data.places.find(item => item.sharedRef === sharedId);
  if (shared.kind === "武器") target = data.items.find(item => item.sharedRef === sharedId);
  if (shared.kind === "素材") target = data.materials.find(item => item.sharedRef === sharedId);
  if (!target) {
    target = { id: `shared-ref-${Date.now()}`, sharedRef: shared.id };
    if (shared.kind === "人物") Object.assign(target, { name: shared.name, role: shared.summary || "共享人物", location: "未指定", goal: shared.extension || "", background: shared.base || "", color: "blue" });
    if (shared.kind === "地点") Object.assign(target, { name: shared.name, type: "共享地点", desc: shared.base || shared.summary || "", x: 360, y: 250 });
    if (shared.kind === "武器") Object.assign(target, { name: shared.name, category: "武器", kind: shared.summary || "共享装备", owner: "未指定", state: "未指定", chapter: "未出场", ability: shared.base || "", duration: "", drawback: "", desc: shared.extension || shared.summary || "" });
    if (shared.kind === "素材") Object.assign(target, { title: shared.name, type: "资料笔记", source: "共享设定库", sourceUrl: "", tags: [], note: shared.base || shared.summary || "", updated: "刚刚" });
    if (shared.kind === "人物") { data.characters.push(target); state.character = target.id; state.page = "characters"; }
    if (shared.kind === "地点") { if (!target.mapId) target.mapId = data.maps && data.maps.length ? data.maps[0].id : null; data.places.push(target); state.mapPoint = target.name; state.page = "maps"; }
    if (shared.kind === "武器") { data.items.unshift(target); state.weapon = target.id; state.page = "weapons"; }
    if (shared.kind === "素材") { data.materials.unshift(target); state.material = target.id; state.page = "materials"; }
    updateWorkSummary();
  } else {
    if (shared.kind === "人物") { state.character = target.id; state.page = "characters"; }
    if (shared.kind === "地点") { state.mapPoint = target.name; state.page = "maps"; }
    if (shared.kind === "武器") { state.weapon = target.id; state.page = "weapons"; }
    if (shared.kind === "素材") { state.material = target.id; state.page = "materials"; }
  }
  invalidateRefIndex();
  render();
  notify(target.sharedRef && shared.kind ? `已引用“${shared.name}”到当前作品` : `已引用“${shared.name}”到当前作品`);
}

export function libraryClicks(event, target) {
  if (target.dataset.libraryType) { state.libraryType = target.dataset.libraryType; render(); return true; }
  if (target.dataset.libraryItem) { state.libraryItem = target.dataset.libraryItem; render(); return true; }
  if (target.dataset.sharedReference) { referenceSharedToWork(target.dataset.sharedReference); return true; }
  return false;
}