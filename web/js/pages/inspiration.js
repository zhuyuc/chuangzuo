import { inspirations, state } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { inspirationRichHtml } from "../domain/rich-text.js";
import { activeWork } from "../domain/works.js";
import { pageTitle } from "../ui/shell.js";





/* 龙吟写作 · 灵感 */
    function inspirationTimeLabel(item) {
      const raw = String(item?.createdAt || "").trim();
      const parsed = raw && raw !== "刚刚" ? Date.parse(raw) : NaN;
      const idTimestamp = String(item?.id || "").match(/^insp-(\d{12,})$/);
      const timestamp = Number.isFinite(parsed) ? parsed : idTimestamp ? Number(idTimestamp[1]) : NaN;
      if (!Number.isFinite(timestamp)) return raw && raw !== "刚刚" ? raw : "时间未记录";
      const date = new Date(timestamp);
      const now = new Date();
      const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      if (date.toDateString() === now.toDateString()) return `今天 ${time}`;
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return `昨天 ${time}`;
      if (date.getFullYear() === now.getFullYear()) return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    export function inspirationPage() {
      const categories = [...new Set(inspirations.map(item => String(item.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
      if (!["all", "uncategorized", ...categories].includes(state.inspirationCategory)) state.inspirationCategory = "all";
      const visible = inspirations.filter(item => {
        const category = String(item.category || "").trim();
        return state.inspirationCategory === "all" || (state.inspirationCategory === "uncategorized" ? !category : category === state.inspirationCategory);
      });
      const cards = visible.map(item => `<article class="inspiration-note-card" data-inspiration-search-text="${escapeHtml(`${item.text} ${item.category || ""}`.toLowerCase())}"><div><div class="inspiration-note-text">${inspirationRichHtml(item)}</div><div class="inspiration-note-meta">${item.category ? `<span class="tag inspiration-category">${escapeHtml(item.category)}</span>` : ""}<span>${escapeHtml(inspirationTimeLabel(item))}</span></div></div><div class="inspiration-note-actions"><button data-inspiration-edit="${item.id}">编辑</button><button class="danger" data-inspiration-delete="${item.id}">删除</button></div></article>`).join("");
      const empty = inspirations.length
        ? `<div class="empty-state compact inspiration-empty"><strong>这个筛选下没有记录</strong><p>换一个分类看看，或者把分类切回“全部分类”。</p></div>`
        : `<div class="empty-state compact inspiration-empty"><strong>灵感还是空的</strong><p>先收下一句话、一个画面或一个反转，需要时再回来找它。</p><button class="button primary" data-dialog="inspiration">新增灵感</button></div>`;
      return `<section class="page padded inspiration-page">${pageTitle("灵感", `${activeWork().name} 的随手记录。先收下一句话、一个画面或一个反转，需要时再回来找它。`, `<button class="button primary" data-dialog="inspiration">新增灵感</button>`)}<div class="inspiration-shell"><div class="inspiration-toolbar"><div class="search-box">⌕ <input data-inspiration-search placeholder="搜索记录、分类与标签"></div><select class="dialog-select inspiration-category-filter" data-inspiration-category aria-label="按分类筛选"><option value="all">全部分类</option>${categories.map(category => `<option value="${escapeHtml(category)}" ${state.inspirationCategory === category ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}<option value="uncategorized" ${state.inspirationCategory === "uncategorized" ? "selected" : ""}>未分类</option></select><span class="inspiration-count">显示 <span data-inspiration-visible>${visible.length}</span> 条</span></div><div class="inspiration-list" data-inspiration-list>${cards || empty}</div></div></section>`;
    }
