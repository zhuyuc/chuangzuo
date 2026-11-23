import { render } from "../app/render.js";
import { navigate } from "../app/router.js";
import { saveAccountNow } from "../core/persistence.js";
import { inspirations, state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { openEntityDialog } from "../dialogs/index.js";
import { askConfirm, renderDialog } from "../dialogs/index.js";





/* 龙吟写作 · 素材、灵感与装备点击 */
export function materialClicks(event, target) {
  if (target.dataset.material) { state.material = target.dataset.material; render(); return true; }
  if (target.dataset.weapon) { state.weapon = target.dataset.weapon; render(); return true; }
  if (target.dataset.itemCategory) { state.itemCategory = target.dataset.itemCategory; render(); return true; }
  if (target.dataset.inspirationEdit) { state.inspirationEditId = target.dataset.inspirationEdit; state.dialog = "inspiration"; renderDialog(); return true; }
  if (target.dataset.inspirationDelete) { const item = inspirations.find(entry => entry.id === target.dataset.inspirationDelete); if (!item) return true; askConfirm("删除这条灵感？删除后不可恢复。", () => { inspirations.splice(inspirations.indexOf(item), 1); render(); saveAccountNow(); notify("已删除这条灵感"); }, true); return true; }
  if (target.dataset.materialType) { state.materialType = target.dataset.materialType; state.materialQuery = ""; render(); return true; }
  if (target.dataset.materialTag) { state.materialTag = state.materialTag === target.dataset.materialTag ? null : target.dataset.materialTag; state.materialQuery = ""; render(); return true; }
  if (target.hasAttribute("data-item-image")) { state.itemImageTarget = state.weapon; const input = document.getElementById("item-image-file"); if (input) input.click(); return true; }
  if (target.hasAttribute("data-material-note")) { state.materialPresetType = "资料笔记"; openEntityDialog("material"); return true; }
  if (target.hasAttribute("data-material-clip")) { state.materialPresetType = "网页剪藏"; openEntityDialog("material"); return true; }
  if (target.dataset.materialNav) { state.material = target.dataset.materialNav; navigate("materials"); return true; }
  if (target.dataset.weaponNav) { state.weapon = target.dataset.weaponNav; navigate("weapons"); return true; }
  return false;
}