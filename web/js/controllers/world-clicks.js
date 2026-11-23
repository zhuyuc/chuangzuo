import { render } from "../app/render.js";
import { navigate } from "../app/router.js";
import { state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { openEntityDialog } from "../dialogs/index.js";
import { askConfirm, closeDialog, renderDialog } from "../dialogs/index.js";
import { currentCharacter, storyEntityById } from "../domain/entities.js";





/* 龙吟写作 · 世界观、关系图与实体点击 */
export function worldClicks(event, target) {
  if (target.dataset.graphNode) {
    const entity = storyEntityById(target.dataset.graphNode);
    if (!entity) return true;
    state.worldEntity = entity.id;
    state.worldType = entity.type;
    state.graphType = entity.type;
    state.graphLayer = "entity";
    if (entity.type === "character") state.character = entity.id;
    render();
    return true;
  }
  if (target.dataset.graphEntity) {
    const entity = storyEntityById(target.dataset.graphEntity);
    if (!entity) return true;
    state.worldEntity = entity.id;
    state.worldType = entity.type;
    if (entity.type === "character") state.character = entity.id;
    render();
    return true;
  }
  if (target.dataset.worldEntity) { state.graphLayer = "entity"; const entity = storyEntityById(target.dataset.worldEntity); if (!entity) return true; state.worldEntity = entity.id; if (entity.type === "character") state.character = entity.id; render(); return true; }
  if (target.dataset.worldNetwork) { const entity = storyEntityById(target.dataset.worldNetwork); if (!entity) return true; state.worldEntity = entity.id; state.worldType = entity.type; state.graphType = entity.type; state.graphLayer = "entity"; if (entity.type === "character") state.character = entity.id; state.worldView = "network"; render(); return true; }
  if (target.dataset.graphLayer) { state.graphLayer = target.dataset.graphLayer; if (state.graphLayer === "type" && !state.graphType) state.graphType = storyEntityById(state.worldEntity)?.type || "character"; render(); return true; }
  if (target.dataset.graphDial) { state.graphType = target.dataset.graphDial; state.graphLayer = "type"; render(); return true; }
  if (target.hasAttribute("data-graph-replay")) { render(); return true; }
  if (target.hasAttribute("data-graph-pause")) { state.graphPaused = !state.graphPaused; render(); return true; }
  if (target.dataset.worldView) { state.worldView = target.dataset.worldView; render(); return true; }
  if (target.dataset.worldOpen) { state.page = "characters"; state.worldView = target.dataset.worldOpen; render(); return true; }
  if (target.dataset.worldLibraryType) { state.worldType = target.dataset.worldLibraryType; state.worldView = "library"; render(); return true; }
  if (target.dataset.worldType) { state.worldType = target.dataset.worldType; render(); return true; }
  if (target.dataset.newWorldKind) { closeDialog(); openEntityDialog(target.dataset.newWorldKind); return true; }
  if (target.dataset.entityAdd) { openEntityDialog(target.dataset.entityAdd); return true; }
  if (target.dataset.relationshipFrom) { state.relationshipSource = target.dataset.relationshipFrom; openEntityDialog("relationship"); return true; }
  if (target.hasAttribute("data-secret-add")) { const person = currentCharacter(); if (!person) return true; person.secrets = person.secrets || []; state.secretId = null; state.dialog = "secret"; renderDialog(); return true; }
  if (target.dataset.secretEdit) { state.secretId = target.dataset.secretEdit; state.dialog = "secret"; renderDialog(); return true; }
  if (target.dataset.secretDelete) { const person = currentCharacter(); if (!person) return true; askConfirm("删除这个秘密？删除后不可恢复。", () => { person.secrets = (person.secrets || []).filter(item => item.id !== target.dataset.secretDelete); render(); notify("秘密已删除"); }, true); return true; }
  if (target.dataset.entityEdit) { const [kind, id] = target.dataset.entityEdit.split(":"); openEntityDialog(kind, id); return true; }
  if (target.dataset.character) { state.character = target.dataset.character; state.worldEntity = target.dataset.character; state.worldType = "character"; render(); return true; }
  if (target.dataset.characterView) { state.characterView = target.dataset.characterView; render(); return true; }
  if (target.dataset.relationScope) { state.relationScope = target.dataset.relationScope; render(); return true; }
  if (target.dataset.relation) { state.relationship = target.dataset.relation; render(); return true; }
  if (target.dataset.relationEdit) { openEntityDialog("relationship", target.dataset.relationEdit); return true; }
  if (target.dataset.characterNav) { state.character = target.dataset.characterNav; state.worldEntity = target.dataset.characterNav; state.worldType = "character"; state.graphType = "character"; state.graphLayer = "entity"; state.worldView = "network"; navigate("characters"); return true; }
  return false;
}