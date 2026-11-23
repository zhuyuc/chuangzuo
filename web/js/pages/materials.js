import { chapters, materials, state } from "../core/store.js";
import { escapeHtml, safeUrl } from "../core/utils.js";
import { aiButton } from "../domain/ai/labels.js";
import { currentMaterial } from "../domain/entities.js";
import { pageTitle } from "../ui/shell.js";
import { scopeTag } from "./library.js";





/* 龙吟写作 · 素材库 */
    function materialMatchTag(item) { return !state.materialTag || (item.tags || []).includes(state.materialTag); }

    function materialMatchQuery(item) {
      const q = (state.materialQuery || "").trim().toLowerCase();
      return !q || `${item.title} ${item.note || ""} ${item.source || ""}`.toLowerCase().includes(q);
    }

    function visibleMaterialsList() {
      return materials.filter(item => (state.materialType === "全部" || item.type === state.materialType) && materialMatchTag(item) && materialMatchQuery(item));
    }

    function materialListMarkup() {
      const list = visibleMaterialsList();
      return `<div class="list-header"><span>${state.materialType === "全部" ? "全部素材" : state.materialType}${state.materialTag ? ` · #${escapeHtml(state.materialTag)}` : ""}</span><span>${list.length} 条</span></div>${list.map(item => `<button class="material-row ${state.material === item.id ? "selected" : ""}" data-material="${item.id}"><div class="material-type">${item.type.slice(0, 1)}</div><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.note || "")}</p><span>${item.type} · ${item.updated}${item.sharedRef ? " · 共享引用" : ""}</span></div></button>`).join("") || (materials.length ? '<div class="empty-state compact"><strong>没有匹配的素材</strong><p>换个关键词，或清除类型与标签筛选。</p></div>' : '<div class="empty-state compact"><strong>还没有素材</strong><p>可以直接新建笔记，或把图片、文档拖进来。</p><button class="button primary" data-material-note>新建笔记</button></div>')}`;
    }

    export function refreshMaterialList() {
      const box = document.querySelector(".material-list");
      if (box) box.innerHTML = materialListMarkup();
    }

    export function materialsPage() {
      const material = currentMaterial();
      const visibleMaterials = visibleMaterialsList();
      const types = ["全部", "网页剪藏", "资料笔记", "图片", "文档"];
      const allTags = [...new Set(materials.flatMap(item => item.tags || []))];
      const materialChapters = material ? chapters.filter(chapter => chapter.materialIds.includes(material.id)) : [];
      const sourceUrl = material ? safeUrl(material.sourceUrl) : null;
      const attachmentUrl = material?.attachmentData || null;
      return `<section class="page">
        ${pageTitle("素材库", "直接记录笔记、导入图片或文档、剪藏网页，不再在创建时选择资料渠道。", `<button class="button" data-material-clip>网页剪藏</button><label class="button" style="display:inline-flex;align-items:center;margin:0">导入文件<input id="material-file" type="file" accept="image/*,.txt,.md,.pdf,.doc,.docx,.epub" style="display:none"></label><button class="button primary" data-material-note>新建笔记</button>`)}
        <div class="materials-layout content-fill">
          <aside class="inner-sidebar"><div class="search-box">⌕ <input id="material-search" value="${escapeHtml(state.materialQuery || "")}" placeholder="搜索素材标题与笔记"></div><div class="panel-label">素材类型</div>${types.map(type => `<button class="filter-row ${state.materialType === type ? "selected" : ""}" data-material-type="${type}">${type}${type === "全部" ? `  ${materials.filter(materialMatchTag).length}` : `  ${materials.filter(item => item.type === type && materialMatchTag(item)).length}`}</button>`).join("")}<div class="panel-label spaced">标签筛选</div><div class="tag-cloud">${allTags.map(tag => `<button class="tag tag-button ${state.materialTag === tag ? "active" : ""}" data-material-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("") || '<span class="muted">暂无标签</span>'}</div></aside>
          <div class="material-list">${materialListMarkup()}</div>
          ${material ? `<aside class="material-detail"><div class="detail-top"><div><span class="tag">${material.type}</span>${material.sharedRef ? `${scopeTag("shared")}<span class="muted">来自共享库</span>` : ""}</div><button class="button" data-entity-edit="material:${material.id}">编辑</button></div><div class="ai-strip">${aiButton("mat-tags", `material:${material.id}`)}</div><h2>${material.title}</h2><label class="field-label">来源</label><p class="source-box">${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(material.source || sourceUrl)} ↗</a>` : escapeHtml(material.source || "手动整理")}</p>${material.attachmentName ? `<label class="field-label">附件</label><a class="linked-card" href="${escapeHtml(attachmentUrl || "#")}" download="${escapeHtml(material.attachmentName)}"><strong>${escapeHtml(material.attachmentName)}</strong><span>下载原始文件 →</span></a>` : ""}<label class="field-label">素材笔记</label><p class="detail-copy">${escapeHtml(material.note || "")}</p>${material.aiSummary ? `<label class="field-label">AI 摘要</label><p class="detail-copy">${escapeHtml(material.aiSummary)}</p>` : ""}<label class="field-label">标签</label><div class="tag-cloud">${material.tags.map(tag => `<button class="tag tag-button ${state.materialTag === tag ? "active" : ""}" data-material-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}</div><label class="field-label">引用章节</label>${materialChapters.map(chapter => `<button class="linked-card" data-chapter-nav="${chapter.id}"><strong>${chapter.title}</strong><span>在写作中引用 →</span></button>`).join("") || '<p class="muted">尚未被章节引用。写正文时提及素材标题会自动关联。</p>'}<button class="button" data-entity-edit="material:${material.id}" style="margin-top:20px">编辑素材内容</button></aside>` : '<aside class="material-detail"><div class="empty-state"><strong>选择一条素材</strong><p>或新建素材开始整理资料。</p></div></aside>'}
        </div>
      </section>`;
    }
