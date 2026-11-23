import { libraryItems, state, works } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { invalidateRefIndex } from "../domain/entities.js";
import { activeData, updateWorkSummary } from "../domain/works.js";
import { pageTitle } from "../ui/shell.js";





/* 龙吟写作 · 共享设定库 */
    export function scopeTag(scope) {
      return scope === "shared" ? '<span class="scope-tag">共享</span>' : '<span class="scope-tag work">仅本作品</span>';
    }
                function sharedUsedWorks(sharedId) {
      return works.filter(work => [work.data.characters, work.data.places, work.data.items, work.data.materials].some(list => list.some(item => item.sharedRef === sharedId)));
    }

    export function libraryPage() {
      if (!libraryItems.length) return `<section class="page">${pageTitle("共享设定库", "账户内跨作品复用的设定原件。", `<button class="button primary" data-entity-add="shared">新建共享设定</button>`)}<div class="empty-state"><strong>共享设定库为空</strong><p>新建人物、地点、武器或素材，供多部作品共同引用。</p><button class="button primary" data-entity-add="shared">新建共享设定</button></div></section>`;
      const visible = libraryItems.filter(item => state.libraryType === "全部" || item.kind === state.libraryType);
      const selected = libraryItems.find(item => item.id === state.libraryItem) || visible[0] || libraryItems[0];
      const usedWorks = sharedUsedWorks(selected.id);
      const referencedCurrent = usedWorks.some(work => work.id === state.currentWork);
      return `<section class="page">
        ${pageTitle("共享设定库", "账户级设定原件，可引用到当前作品；作品内的状态与剧情扩展独立保存。", `<button class="button primary" data-entity-add="shared">新建共享设定</button>`)}
        <div class="library-layout content-fill">
          <aside class="inner-sidebar">
            <div class="panel-label">设定类型</div>
            ${["全部", "人物", "地点", "武器", "素材"].map(type => `<button class="filter-row ${state.libraryType === type ? "selected" : ""}" data-library-type="${type}">${type === "全部" ? "全部设定" : type}</button>`).join("")}
            <div class="ownership-note"><div><strong>账户共享</strong>共享内容只维护一份，引用后在各作品内补充状态。</div></div>
          </aside>
          <div class="library-list">
            <div class="library-list-header"><strong>${state.libraryType === "全部" ? "全部设定" : state.libraryType}</strong><span class="muted">${visible.length} 项</span></div>
            ${visible.map(item => { const usage = sharedUsedWorks(item.id); return `<button class="library-row ${selected.id === item.id ? "selected" : ""}" data-library-item="${item.id}"><span class="library-kind">${item.kind.slice(0, 1)}</span><div><strong>${item.name}</strong><small>${item.summary}</small></div><span class="library-usage">${usage.length ? `${usage.length} 部作品引用` : "尚未引用"}</span><span class="tag">${item.kind}</span></button>`; }).join("") || '<p class="detail-copy" style="padding:20px">当前筛选下没有设定。</p>'}
          </div>
          <aside class="library-detail">
            <div><span class="scope-tag">共享设定</span></div><h2>${selected.name}</h2><p class="subline">${selected.kind}</p><p class="detail-copy" style="margin-top:9px">${escapeHtml(selected.summary || "")}</p>
            <div class="data-section"><span>共享原件</span><div class="data-box">${escapeHtml(selected.base || "")}</div></div>
            <div class="data-section"><span>作品内扩展方式</span><div class="data-box">${escapeHtml(selected.extension || "")}</div></div>
            <div class="data-section"><span>引用作品${usedWorks.length ? ` · ${usedWorks.length}` : ""}</span>${usedWorks.map(work => `<button class="linked-card" data-reference-work="${work.id}"><strong>${work.name}</strong><span>已引用 →</span></button>`).join("") || '<p class="muted">尚未被作品引用</p>'}</div>
            <div class="dialog-actions" style="justify-content:flex-start"><button class="button" data-entity-edit="shared:${selected.id}">编辑设定</button><button class="button primary" data-shared-reference="${selected.id}" ${referencedCurrent ? "disabled" : ""}>${referencedCurrent ? "已引用到当前作品" : "引用到当前作品"}</button></div>
          </aside>
        </div>
      </section>`;
    }
