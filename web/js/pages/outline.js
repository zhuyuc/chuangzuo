import { chapters, outlineData, state } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { pageTitle } from "../ui/shell.js";





/* 龙吟写作 · 大纲 */
    export function outlinePage() {
      const tabs = `<div class="page-subtabs">${[["overview", "故事总纲"], ["volumes", "分卷结构"]].map(([id, label]) => `<button class="${state.outlineView === id ? "active" : ""}" data-outline-view="${id}">${label}</button>`).join("")}</div>`;
      const title = pageTitle("大纲", "全书和分卷负责方向；章节保持轻量，创建后直接进入正文。");
      if (state.outlineView === "overview") {
        return `<section class="page">${title}${tabs}<div class="outline-overview"><div class="outline-overview-inner"><div class="overview-fields stack"><div class="overview-field"><span>世界运行基础规则</span><textarea rows="4" data-outline-field="worldRules" placeholder="力量体系、社会秩序、因果法则等世界底层运行逻辑">${escapeHtml(outlineData.worldRules || "")}</textarea></div><div class="overview-field"><span>世界地形地貌</span><textarea rows="4" data-outline-field="worldTerrain" placeholder="大陆、山脉、水系、气候带等地理格局">${escapeHtml(outlineData.worldTerrain || "")}</textarea></div></div></div></div></section>`;
      }
      return `<section class="page">${title}${tabs}<div class="volume-stage"><div class="volume-stage-inner"><div class="section-heading"><h2>全书分卷</h2><span>${outlineData.volumes.length} 卷 · ${chapters.length} 章</span></div><div class="volume-outline-list"><button class="volume-outline-card volume-outline-add" data-entity-add="volume"><strong>＋ 新建分卷</strong><small>规划下一阶段的故事方向</small></button>${outlineData.volumes.map((volume, index) => { const list = chapters.filter(item => item.volumeId === volume.id); const done = list.reduce((sum, item) => sum + Number(String(item.words).replace(/[^\d]/g, "") || 0), 0); return `<article class="volume-outline-card"><div class="volume-outline-head"><span class="volume-index">${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(volume.title)} · ${escapeHtml(volume.subtitle || "未命名卷")}</strong><small>${escapeHtml(volume.goal || "尚未填写本卷目标")}</small></div><div class="volume-outline-actions"><button data-entity-edit="volume:${volume.id}">编辑</button><button class="danger" data-delete-volume="${volume.id}">删除</button></div></div><div class="volume-outline-stats"><span>${list.length} 章</span><span>${done.toLocaleString()} 字</span><span>目标 ${Math.round(volume.target / 10000)} 万字</span></div></article>`; }).join("")}</div><p class="volume-outline-note">大纲只负责卷级方向；章节在写作页创建、排序与写作。</p></div></div></section>`;
    }
