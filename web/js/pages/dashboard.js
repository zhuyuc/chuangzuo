import { authorPenName, workCoverVars, workTypeLabel } from "../core/state.js";
import { chapters, outlineData, state, works } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { currentChapter } from "../domain/entities.js";
import { activeWork } from "../domain/works.js";





/* 龙吟写作 · 工作台 */
    export function chapterTree() {
      return `<div class="chapter-tree">${outlineData.volumes.map(volume => { const list = chapters.filter(item => item.volumeId === volume.id); const collapsed = state.collapsedVolumes.includes(volume.id); return `<div class="tree-volume"><button class="tree-caret ${collapsed ? "collapsed" : ""}" data-volume-toggle="${volume.id}" aria-label="${collapsed ? "展开" : "收起"}${escapeHtml(volume.title)}"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg></button><span class="tree-volume-title">${escapeHtml(volume.title)} ${escapeHtml(volume.subtitle || "")}</span><button class="tree-rename" data-entity-edit="volume:${volume.id}" title="修改卷名">改</button></div>${collapsed ? "" : list.map(item => `<button class="chapter-item ${state.chapter === item.id ? "selected" : ""}" data-chapter="${item.id}"><span class="chapter-dot ${item.state === "已完成" ? "done" : ""}"></span><span>${escapeHtml(item.title)}</span></button>`).join("")}`; }).join("")}</div>`;
    }

    export function dashboardPage() {
      const sortedWorks = [...works].sort((a, b) => state.workSort === "name" ? a.name.localeCompare(b.name, "zh-CN") : state.workSort === "progress" ? b.progress - a.progress : 0);
      const penName = authorPenName();
      const current = activeWork();
      const currentChapterItem = currentChapter();
      const currentWords = chapters.reduce((sum, item) => sum + Number(String(item.words).replace(/[^\d]/g, "") || 0), 0);
      const chapterWords = Number(String(currentChapterItem?.words || "0").replace(/[^\d]/g, "") || 0);
      const volumeTargets = (outlineData?.volumes || []).reduce((sum, volume) => sum + Number(volume.target || 0), 0);
      const progress = volumeTargets ? Math.min(100, currentWords / volumeTargets * 100) : 0;
      const progressLabel = !volumeTargets ? "未设目标" : progress < 1 ? (currentWords ? "<1%" : "待落笔") : `${Math.round(progress)}%`;
      const progressWidth = progress ? Math.max(progress, .8) : 0;
      const summary = currentChapterItem?.summary || "把这一章的下一步写下来，故事就会继续向前。";
      return `<section class="page padded dashboard-page">
        <div class="dashboard-inner">
          <div class="page-title dashboard-title">
            <div><h1>我的作品</h1><p>回到正在写的故事，或从书架里翻开另一本书。</p></div>
          </div>
          <section class="desk-hero">
            <div class="desk-hero-glow"></div>
            <span class="desk-hero-mark" aria-hidden="true">墨</span>
            <div class="desk-hero-copy">
              <div class="desk-overline"><i></i><span>当前创作</span></div>
              <h2>${escapeHtml(current.name)}</h2>
              <p class="desk-location">${escapeHtml(current.current)}</p>
              ${penName ? `<p class="desk-author">作者 · ${escapeHtml(penName)}</p>` : ""}
              <p class="desk-summary">${escapeHtml(summary)}</p>
              <div class="desk-actions"><button class="button hero-write" data-work-open="${current.id}">继续写作 <span>→</span></button><button class="button" data-work-jump="outline:${current.id}">查看大纲</button></div>
            </div>
            <div class="desk-stats">
              <div><strong>${currentWords.toLocaleString()}</strong><span>全书字数</span></div>
              <div><strong>${chapterWords.toLocaleString()}</strong><span>本章字数</span></div>
              <div><strong>${chapters.length}</strong><span>已建章节</span></div>
              <div><strong>${volumeTargets ? `${Math.round(volumeTargets / 10000)} 万` : "—"}</strong><span>全书目标</span></div>
              <div class="desk-progress"><div><span>全书完成</span><b>${progressLabel}</b></div><div class="desk-progress-line"><i style="width:${progressWidth}%"></i></div></div>
            </div>
            <button class="hero-book" data-work-open="${current.id}" data-book-tilt style="${workCoverVars(current)}" aria-label="继续写作：${escapeHtml(current.name)}">
              <span class="hero-book-face">
                <span class="hero-book-kind">${escapeHtml(workTypeLabel(current))}</span>
                <span class="hero-book-rule"></span>
                <strong>${escapeHtml(current.name)}</strong>
                <span class="hero-book-sub">${escapeHtml(current.current)}</span>
                <span class="hero-book-seal">${escapeHtml(current.name.slice(0, 1) || "书")}</span>
                <span class="hero-book-foot"><i style="width:${progressWidth}%"></i></span>
              </span>
            </button>
          </section>
          <div class="shelf-head">
            <div><h2>作品书架</h2></div>
            <div class="work-toolbar"><div class="search-box">⌕ <input id="work-search" placeholder="搜索作品名称或最近章节"></div><select class="dialog-select" id="work-sort" aria-label="作品排序"><option value="recent" ${state.workSort === "recent" ? "selected" : ""}>最近编辑</option><option value="name" ${state.workSort === "name" ? "selected" : ""}>按名称</option><option value="progress" ${state.workSort === "progress" ? "selected" : ""}>按进度</option></select><span>${works.length} 部作品</span></div>
          </div>
          <div class="work-list book-shelf"><button type="button" class="book-card new-work-card" data-dialog="new-work"><span class="new-work-plus">＋</span><strong>新建作品</strong><small>从一张空白书页开始</small></button>${sortedWorks.map(work => `<div class="work-row book-card ${work.id === current.id ? "current" : ""}" data-work-open="${work.id}" data-work-search="${escapeHtml(`${work.name} ${work.current}`.toLowerCase())}" style="${workCoverVars(work)}"><div class="book-mini" data-book-tilt><span>${escapeHtml(workTypeLabel(work))}</span><strong>${escapeHtml(work.name)}</strong><i>${escapeHtml(work.name.slice(0, 1) || "书")}</i></div><div class="work-card-body"><div class="work-main"><strong>${escapeHtml(work.name)}</strong><span>${escapeHtml(work.current)}</span>${penName ? `<span class="work-author">作者 · ${escapeHtml(penName)}</span>` : ""}</div><div class="work-progress"><span>${work.words}</span><div class="progress"><i style="width:${work.progress}%"></i></div></div><div class="work-card-foot"><span class="work-time">${work.time}</span><div class="work-row-actions"><button type="button" data-work-edit="${work.id}">编辑</button><button type="button" data-work-jump="outline:${work.id}">大纲</button><button type="button" data-work-jump="writing:${work.id}">写作</button></div></div></div></div>`).join("")}</div>
        </div>
      </section>`;
    }
