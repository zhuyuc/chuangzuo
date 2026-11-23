import { render } from "../app/render.js";
import { navigate } from "../app/router.js";
import { state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { openDialog } from "../dialogs/index.js";
import { activeWork, loadWorkData } from "../domain/works.js";





/* 龙吟写作 · 作品切换与编辑点击 */
export function booksClicks(event, target) {
  if (target.dataset.switchWork) { state.dialog = null; state.outlineView = "overview"; state.character = null; state.material = null; state.weapon = null; state.mapPoint = null; state.relationship = null; loadWorkData(target.dataset.switchWork); navigate("dashboard"); notify(`已切换到：${activeWork().name}`); return true; }
  const workJump = target.closest("[data-work-jump]");
  if (workJump) {
    const [jumpPage, jumpId] = workJump.dataset.workJump.split(":");
    state.character = null; state.material = null; state.weapon = null; state.mapPoint = null; state.relationship = null;
    loadWorkData(jumpId); navigate(jumpPage); notify(`已打开作品：${activeWork().name}`); return true;
  }
  const workEdit = target.closest("[data-work-edit]");
  if (workEdit) { state.workEditId = workEdit.dataset.workEdit; openDialog("edit-work"); return true; }
  const workRow = target.closest("[data-work-open]");
  if (workRow) { state.character = null; state.material = null; state.weapon = null; state.mapPoint = null; state.relationship = null; loadWorkData(workRow.dataset.workOpen); navigate("writing"); notify(`已打开作品：${activeWork().name}`); return true; }
  if (target.dataset.referenceWork) { state.dialog = null; state.page = "writing"; state.character = null; state.material = null; state.weapon = null; state.mapPoint = null; state.relationship = null; loadWorkData(target.dataset.referenceWork); render(); notify(`已切换到：${activeWork().name}`); return true; }
  return false;
}