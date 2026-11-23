import { WORK_FORMS, WORK_GENRES } from "../core/state.js";
import { state } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { entityRecord, selectOptions } from "./entity-config.js";





/* 龙吟写作 · 实体表单与作品表单 */
    export function renderEntityDialog(config) {
      return `<div class="dialog-screen"><section class="dialog-card dialog-md entity-dialog"><div class="dialog-header"><div><h1>${config.title}</h1><p>${config.description}</p></div><button class="dialog-close" data-dialog-close>×</button></div>${config.blocked ? '<div class="ownership-note if flush-bottom"><div>人物数量不足，创建人物后再建立关系。</div></div>' : `<form id="entity-form" novalidate><div class="dialog-body">${config.fields.map(field => `<div class="form-field"><label for="entity-${field.name}">${field.label}</label>${field.type === "textarea" ? `<textarea class="auth-input textarea-sm" id="entity-${field.name}" name="${field.name}" placeholder="${field.placeholder || ""}">${escapeHtml(field.value || "")}</textarea>` : field.type === "select" ? `<select class="dialog-select" id="entity-${field.name}" name="${field.name}">${selectOptions(field.options, field.value)}</select>` : field.type === "datalist" ? `<input class="auth-input" id="entity-${field.name}" name="${field.name}" list="dl-entity-${field.name}" value="${escapeHtml(field.value ?? "")}" placeholder="${field.placeholder || ""}"><datalist id="dl-entity-${field.name}">${(field.options || []).map(option => `<option value="${escapeHtml(option[0])}"></option>`).join("")}</datalist>` : `<input class="auth-input" id="entity-${field.name}" name="${field.name}" type="${field.type || "text"}" value="${escapeHtml(field.value ?? "")}" placeholder="${field.placeholder || ""}">`}<div class="field-error" data-error-for="${field.name}"></div></div>`).join("")}</div><div class="dialog-actions"><button type="button" class="button" data-dialog-close>取消</button><button class="button primary" type="submit">${state.entityId ? "保存修改" : "创建"}</button></div></form>`}</section></div>`;
    }

    export function workFormMarkup(target = null) {
      const editing = Boolean(target);
      const form = target?.form || WORK_FORMS[0];
      const genre = target?.genre || WORK_GENRES[0];
      return `<div class="dialog-screen"><section class="dialog-card"><div class="dialog-header"><div><h1>${editing ? "编辑作品" : "新建作品"}</h1><p>${editing ? "修改作品名称、篇幅与类型，不会改变已写的章节内容。" : "创建后会直接进入这部作品的写作页。"}</p></div><button class="dialog-close" data-dialog-close>×</button></div><form id="${editing ? "edit-work-form" : "new-work-form"}" novalidate><div class="dialog-body"><div class="form-field"><label for="work-name">作品名称</label><input class="auth-input" id="work-name" name="workName" value="${escapeHtml(target?.name || "")}" placeholder="输入作品名称" autofocus><div class="field-error" data-work-error></div></div><div class="form-field"><label for="work-form">篇幅</label><select class="dialog-select" id="work-form" name="form">${WORK_FORMS.map(item => `<option value="${item}" ${item === form ? "selected" : ""}>${item}</option>`).join("")}</select></div><div class="form-field"><label for="work-genre">类型</label><select class="dialog-select" id="work-genre" name="genre">${WORK_GENRES.map(item => `<option value="${item}" ${item === genre ? "selected" : ""}>${item}</option>`).join("")}</select></div></div><div class="dialog-actions"><button type="button" class="button" data-dialog-close>取消</button><button class="button primary" type="submit">${editing ? "保存修改" : "创建并打开"}</button></div></form></section></div>`;
    }
