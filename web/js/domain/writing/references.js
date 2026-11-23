import { markDirty } from "../../core/persistence.js";
import { REFERENCE_TABS, REFERENCE_TAB_HINTS, REF_GROUP_DEFS, REF_TAB_GROUP, WORLD_ENTITY_DEFS } from "../../core/state.js";
import { chapterText, chapters, materials, outlineData, places, state } from "../../core/store.js";
import { escapeHtml } from "../../core/utils.js";
import { chapterRefIds, currentChapter, entityRefGroup, isChapterRef, itemOwnerName, splitEntityAliases, storyEntities } from "../entities.js";
import { activeData, updateWorkSummary } from "../works.js";
import { pushManuscriptUndoPoint } from "./history.js";





/* 龙吟写作 · 写作页引用面板 */
    export function referenceMark(entity) {
      if (entity.type === "character" || entity.type === "place" || entity.type === "item") return entity.name.slice(0, 1);
      return WORLD_ENTITY_DEFS[entity.type]?.mark || "设";
    }

    export function referenceSearchText(entity) {
      const record = entity.record || {};
      const extra = [record.alias, record.role, record.faction, record.location, record.goal, record.ability, record.state, record.owner, record.powers, record.danger, record.category, record.kind].filter(Boolean).join(" ");
      return `${entity.name} ${entity.label} ${entity.subtitle || ""} ${entity.summary || ""} ${extra} ${JSON.stringify(record.fields || {})}`.toLowerCase();
    }

    function referenceFacts(entity) {
      const record = entity.record || {};
      if (entity.type === "character") return [["身份", record.role], ["别名", record.alias], ["位置", record.location], ["势力", record.faction], ["弱点", record.weakness], ["能力", record.ability]].filter(([, value]) => value);
      if (entity.type === "place") {
        const parent = record.parentId ? places.find(item => item.id === record.parentId) : null;
        return [["别名", record.alias], ["类型", record.type], ["父级", parent?.name], ["地貌", record.terrain], ["气候", record.climate], ["控制", record.powers], ["危险", record.danger]].filter(([, value]) => value);
      }
      if (entity.type === "item") return [["别名", record.alias], ["分类", record.category], ["类型", record.kind], ["持有", itemOwnerName(record)], ["状态", record.state], ["能力", record.ability], ["代价", record.drawback]].filter(([, value]) => value);
      const fieldLabels = {
        faction: [["kind", "类型"], ["leader", "领袖"], ["goal", "目标"], ["resource", "资源"], ["weakness", "弱点"]],
        species: [["habitat", "栖息地"], ["lifespan", "寿命"], ["society", "社会结构"], ["gift", "天赋"], ["taboo", "禁忌"]],
        event: [["era", "纪元"], ["year", "年份"], ["importance", "影响"], ["cause", "起因"], ["impact", "后果"]],
        rule: [["domain", "领域"], ["law", "法则"], ["cost", "代价"], ["exception", "例外"], ["status", "状态"]]
      }[entity.type] || [];
      return [["别名", record.alias], ...fieldLabels.map(([key, label]) => [label, record.fields?.[key]])].filter(([, value]) => value);
    }

    function referenceDetailMarkup(entity, chapter, group) {
      const inChapter = isChapterRef(chapter, group, entity.id);
      const facts = referenceFacts(entity);
      const record = entity.record || {};
      const secrets = entity.type === "character" ? (record.secrets || []).filter(secret => !secret.isPublic) : [];
      return `<div class="ref-detail"><div class="ref-detail-head"><span class="ref-mark">${referenceMark(entity)}</span><div><strong>${escapeHtml(entity.name)}</strong><small>${entity.label}</small></div>${inChapter ? `<button class="button" data-ref-remove="${entity.type}:${entity.id}">移除本章</button>` : `<button class="button" data-ref-toggle="${entity.type}:${entity.id}">加入本章</button>`}</div>${facts.length ? `<div class="ref-facts">${facts.map(([label, value]) => `<span>${label}</span><strong>${escapeHtml(value)}</strong>`).join("")}</div>` : ""}${entity.summary ? `<p>${escapeHtml(entity.summary)}</p>` : ""}${secrets.length ? `<p><strong>未公开秘密 ${secrets.length} 条</strong><br>${escapeHtml(secrets[0].text)}</p>` : ""}${entity.type !== "character" && record.fields?.body ? `<p>${escapeHtml(record.fields.body)}</p>` : ""}${record.body && entity.type !== "character" ? `<p>${escapeHtml(record.body)}</p>` : ""}</div>`;
    }

    function entityReferenceContent(tab) {
      const chapter = currentChapter();
      const group = REF_TAB_GROUP[tab];
      const def = REF_GROUP_DEFS[group];
      if (!chapter || !def) return '<div class="reference-content"><p class="muted">当前没有可引用的内容。</p></div>';
      const entities = storyEntities().filter(item => entityRefGroup(item.type) === group);
      const castIds = chapterRefIds(chapter, group);
      const scope = state.referenceScope === "all" ? "all" : "chapter";
      const scoped = scope === "chapter" ? entities.filter(item => castIds.includes(item.id)) : entities;
      const query = (state.referenceQuery || "").trim().toLowerCase();
      const list = query ? scoped.filter(item => referenceSearchText(item).includes(query)) : scoped;
      if (scope === "chapter" && !castIds.length) state.referenceEntity = null;
      let selected = list.find(item => `${item.type}:${item.id}` === state.referenceEntity) || list[0] || null;
      if (!selected) state.referenceEntity = null;
      else state.referenceEntity = `${selected.type}:${selected.id}`;
      const emptyText = scope === "chapter" ? `本章还没有引用${def.label}。正文输入 @，或切到“全部”手动加入。` : `还没有${def.label}资料。`;
      return `<div class="reference-content entity-reference"><div class="ref-scope-row"><div class="scope-tabs"><button class="${scope === "chapter" ? "active" : ""}" data-ref-scope="chapter">本章</button><button class="${scope === "all" ? "active" : ""}" data-ref-scope="all">全部</button></div><span class="ref-count">本章 ${castIds.length} · 全部 ${entities.length}</span></div>${group === "world" ? '<p class="muted reference-hint">设定条目：规则、势力、事件等设定，点击查看详情并加入本章。</p>' : ""}<div class="search-box">⌕ <input data-ref-search value="${escapeHtml(state.referenceQuery || "")}" placeholder="搜索${def.label}"></div>${list.length ? `<div class="ref-entity-list">${list.map(item => `<button class="ref-row ${state.referenceEntity === `${item.type}:${item.id}` ? "selected" : ""}" data-ref-entity="${item.type}:${item.id}" data-ref-search-text="${escapeHtml(referenceSearchText(item))}"><span class="ref-mark">${referenceMark(item)}</span><span class="ref-main"><strong>${escapeHtml(item.name)}</strong><small>${item.label}${item.subtitle ? ` · ${escapeHtml(item.subtitle)}` : ""}</small></span>${castIds.includes(item.id) ? '<span class="ref-badge">本章</span>' : ""}</button>`).join("")}</div><div class="ref-empty" data-ref-filter-empty hidden>没有匹配的${def.label}。</div>` : `<div class="ref-empty">${emptyText}</div>`}${selected ? referenceDetailMarkup(selected, chapter, group) : ""}</div>`;
    }

    export function deleteRefMentions(chapter, entity) {
      let text = chapterText[chapter.id] || "";
      refMentionNames(entity).forEach(name => { text = text.split(name).join(""); });
      chapterText[chapter.id] = text;
      chapter.words = text.replace(/\s/g, "").length.toLocaleString();
      updateWorkSummary();
      const editor = document.getElementById("manuscript");
      if (editor && state.page === "writing") {
        pushManuscriptUndoPoint(editor);
        editor.value = text;
        const chapterCount = document.getElementById("chapter-word-count");
        const bookCount = document.getElementById("book-word-count");
        if (chapterCount) chapterCount.textContent = `本章 ${chapter.words} 字`;
        if (bookCount) bookCount.textContent = `全书 ${chapters.reduce((sum, item) => sum + Number(String(item.words).replace(/[^\d]/g, "") || 0), 0).toLocaleString()} 字`;
      }
    }

    export function refreshWritingReference() {
      const aside = document.querySelector(".writing-reference");
      if (!aside) return;
      const scrollTop = aside.scrollTop;
      aside.innerHTML = `<div class="reference-tabs">${REFERENCE_TABS.map(tab => `<button class="${state.rightTab === tab ? "active" : ""}" data-reference-tab="${tab}" title="${REFERENCE_TAB_HINTS[tab] || ""}">${tab}</button>`).join("")}</div>${referenceContent()}`;
      aside.scrollTop = scrollTop;
      markDirty();
    }

    export function referenceContent() {
      const chapter = currentChapter();
      if (!chapter) return '<div class="reference-content"><p class="muted">当前没有章节。</p></div>';
      if (REF_TAB_GROUP[state.rightTab]) return entityReferenceContent(state.rightTab);
      if (state.rightTab === "素材") {
        const q = (state.referenceQuery || "").trim().toLowerCase();
        const all = materials.filter(item => !q || `${item.title} ${item.type || ""}`.toLowerCase().includes(q));
        return `<div class="reference-content"><div class="ref-scope-row"><span class="ref-count">本章 ${chapter.materialIds.length} · 全部 ${materials.length}</span></div><div class="search-box">⌕ <input data-ref-search value="${escapeHtml(state.referenceQuery || "")}" placeholder="搜索素材"></div><div class="ref-entity-list">${all.map(item => `<button class="ref-entity" data-ref-material="${item.id}"><div class="ref-detail-head"><span class="ref-mark">素</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type || "素材")}</small></div>${chapter.materialIds.includes(item.id) ? '<span class="tag">本章</span>' : ""}</div></button>`).join("") || '<p class="muted">还没有素材，去素材库记一条。</p>'}</div><p class="muted" style="margin-top:10px">点条目加入或移出本章引用。</p></div>`;
      }
      const volume = outlineData.volumes.find(item => item.id === chapter.volumeId);
      return `<div class="reference-content"><div class="panel-label">世界规则</div><p>${escapeHtml((outlineData.worldRules || "").slice(0, 60) || "尚未填写世界运行基础规则。")}${(outlineData.worldRules || "").length > 60 ? "…" : ""}</p><div class="panel-label spaced">${volume ? `${volume.title}目标` : "本卷目标"}</div><p>${escapeHtml(volume?.goal || "尚未填写本卷目标。")}</p><div class="panel-label spaced">本章进度</div><p>${chapter.state} · ${chapter.words} / ${Number(chapter.targetWords || 4000).toLocaleString()} 字</p><button class="button" data-page="outline">打开大纲</button></div>`;
    }

    function refMentionNames(entity) { return [entity.name, ...splitEntityAliases(entity.record)].filter(Boolean); }

    export function countRefMentions(chapter, entity) {
      const text = chapterText[chapter.id] || "";
      return refMentionNames(entity).reduce((sum, name) => sum + (text.split(name).length - 1), 0);
    }

    export function rememberRecentRef(entity) {
      const data = activeData();
      data.recentRefIds = [entity.id, ...(data.recentRefIds || []).filter(id => id !== entity.id)].slice(0, 20);
    }