import { render } from "../app/render.js";
import { saveAccountNow } from "../core/persistence.js";
import { inspirations, state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { richTextToPlain, sanitizeRichText } from "../domain/rich-text.js";
import { activeData } from "../domain/works.js";





/* 龙吟写作 · 灵感表单提交 */
export function inspirationSubmit(event) {
  if (event.target.id !== "inspiration-form") return false;
  event.preventDefault();
  const form = event.target;
  const editor = form.querySelector("[data-rich-input]");
  const html = sanitizeRichText(editor?.innerHTML || "");
  const text = richTextToPlain(html);
  if (!text) { form.querySelector("[data-error-for=text]").textContent = "灵感内容不能为空。"; editor?.focus(); return true; }
  const categoryChoice = form.elements.categorySelect.value;
  const category = (categoryChoice === "__new" ? form.elements.categoryNew.value : categoryChoice).trim();
  if (categoryChoice === "__new" && !category) { form.querySelector("[data-error-for=category]").textContent = "请输入新分类名称。"; form.elements.categoryNew.focus(); return true; }
  const existing = state.inspirationEditId ? inspirations.find(entry => entry.id === state.inspirationEditId) : null;
  if (existing) {
    Object.assign(existing, { text, html, category });
  } else {
    inspirations.unshift({ id: `insp-${Date.now()}`, text, html, category, createdAt: new Date().toISOString() });
    activeData().inspirations = inspirations;
  }
  state.dialog = null;
  state.inspirationEditId = null;
  render();
  saveAccountNow();
  notify(existing ? "灵感已更新" : "已收进灵感");
  return true;
}