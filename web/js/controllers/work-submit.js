import { render } from "../app/render.js";
import { markDirty } from "../core/persistence.js";
import { state, works } from "../core/store.js";
import { notify } from "../core/utils.js";
import { buildBlankWorkData, loadWorkData } from "../domain/works.js";





/* 龙吟写作 · 作品表单提交 */
export function workSubmit(event) {
  if (event.target.id !== "new-work-form" && event.target.id !== "edit-work-form") return false;
  event.preventDefault();
  const form = event.target;
  const name = form.elements.workName.value.trim();
  if (!name) { form.querySelector("[data-work-error]").textContent = "请输入作品名称。"; return true; }
  const workForm = form.elements.form.value;
  const workGenre = form.elements.genre.value;
  if (event.target.id === "edit-work-form") {
    const target = works.find(item => item.id === state.workEditId);
    if (!target) { state.dialog = null; render(); return true; }
    Object.assign(target, { name, form: workForm, genre: workGenre });
    markDirty();
    state.dialog = null;
    state.workEditId = null;
    render();
    notify(`已更新作品：${name}`);
    return true;
  }
  const id = `work-${Date.now()}`;
  works.unshift({ id, name, current: "第一卷 · 第一章 未命名章节", words: "0 字", time: "刚刚", progress: 0, form: workForm, genre: workGenre, data: buildBlankWorkData(id) });
  markDirty();
  state.dialog = null;
  state.page = "writing";
  state.outlineView = "overview";
  state.character = null;
  state.material = null;
  state.weapon = null;
  state.mapPoint = null;
  state.relationship = null;
  loadWorkData(id);
  render();
  notify(`已创建作品：${name}`);
  return true;
}