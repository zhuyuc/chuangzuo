import { pages } from "../app/render.js";
import { navigate } from "../app/router.js";
import { chapters, materials, places, state } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { openEntityDialog } from "../dialogs/index.js";
import { openDialog } from "../dialogs/index.js";
import { aiOn } from "../domain/ai/labels.js";
import { runAI } from "../domain/ai/runtime.js";
import { storyEntities } from "../domain/entities.js";
import { activeData } from "../domain/works.js";
import { exportCurrentWork } from "../features/backup.js";





/* 龙吟写作 · 命令面板 */
    function commandResults(query) {
      const q = query.trim().toLowerCase();
      const actions = [
        { group: "操作", label: "新建作品", detail: "创建一部全新的小说", kind: "新", action: "new:work" },
        { group: "操作", label: "新建章节", detail: "在当前作品下创建章节", kind: "新", action: "new:chapter" },
        { group: "操作", label: "新建人物", detail: "创建人物档案", kind: "新", action: "new:character" },
        { group: "操作", label: "新建世界观设定", detail: "创建人物、地点、势力、种族、事件或规则", kind: "界", action: "new:world-entry" },
        ...(aiOn() ? [
          { group: "AI", label: "AI 续写下一段", detail: "基于本章正文与引用", kind: "AI", action: "ai:nextpara" },
          { group: "AI", label: "AI 本章小结", detail: "在场人物、地点与未收线索", kind: "AI", action: "ai:summary" },
          { group: "AI", label: "AI 上下文问答", detail: "谁在场、是否与设定冲突", kind: "AI", action: "ai:qa" },
          { group: "AI", label: "AI 世界一致性审查", detail: "动机、摘要、代价缺口", kind: "AI", action: "ai:world-audit" }
        ] : []),
        { group: "操作", label: "新建武器/防具", detail: "创建一个装备条目", kind: "新", action: "new:item" },
        { group: "操作", label: "导出当前作品", detail: "生成 Markdown 文件", kind: "出", action: "export:work" },
        { group: "操作", label: "打开共享设定库", detail: "跨作品复用的设定原件", kind: "库", action: "page:library" },
        { group: "操作", label: "打开服务器与备份", detail: "备份、导出与恢复", kind: "存", action: "page:storage" }
      ];
      const pages = [
        ["writing", "写作"], ["outline", "大纲"], ["characters", "世界观"], ["materials", "素材库"], ["inspiration", "灵感"], ["maps", "地图"], ["weapons", "装备"]
      ].map(([page, label]) => ({ group: "前往", label: `打开${label}`, detail: "当前作品", kind: "往", action: `page:${page}` }));
      const entityResults = storyEntities().map(item => ({ group: "实体", label: item.name, detail: `${item.label} · ${item.subtitle || item.summary || ""}`, kind: item.label.slice(0, 1), action: `entity:${item.type}:${item.id}` }));
      const chapterResults = chapters.map(chapter => ({ group: "章节", label: chapter.title, detail: `${chapter.state} · ${chapter.words} 字`, kind: "章", action: `chapter:${chapter.id}` }));
      const materialResults = materials.map(material => ({ group: "素材", label: material.title, detail: `${material.type} · ${material.note || ""}`, kind: "材", action: `material:${material.id}` }));
      return [...actions, ...pages, ...entityResults, ...chapterResults, ...materialResults].filter(item => !q || `${item.label} ${item.detail}`.toLowerCase().includes(q));
    }

    export function updateCommandResults() {
      const box = document.getElementById("command-results");
      if (!box) return;
      const results = commandResults(state.commandQuery);
      let currentGroup = "";
      box.innerHTML = results.slice(0, 28).map((item, index) => {
        const group = item.group !== currentGroup ? `<div class="command-group">${item.group}</div>` : "";
        currentGroup = item.group;
        return `${group}<button class="command-item ${index === 0 ? "active" : ""}" data-command-action="${escapeHtml(item.action)}"><span class="command-kind">${item.kind}</span><span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.detail)}</small></span></button>`;
      }).join("") || '<div class="command-empty">没有找到匹配的实体、章节或操作。</div>';
    }

    export function openCommand(initial = "") {
      state.commandOpen = true;
      state.commandQuery = initial;
      const root = document.getElementById("command-root");
      root.innerHTML = `<div class="command-screen"><section class="command-palette"><div class="command-input-wrap"><span>⌕</span><input id="command-input" value="${escapeHtml(initial)}" placeholder="搜索人物、地点、装备、设定、章节、素材，或输入操作"><kbd>Esc</kbd></div><div class="command-results" id="command-results"></div></section></div>`;
      updateCommandResults();
      setTimeout(() => { const input = document.getElementById("command-input"); if (input) { input.focus(); input.select(); } }, 20);
    }

    export function closeCommand() {
      state.commandOpen = false;
      document.getElementById("command-root").innerHTML = "";
    }

    export function runCommand(action) {
      closeCommand();
      if (action === "new:work") { openDialog("new-work"); return; }
      if (action === "new:chapter") { openEntityDialog("chapter"); return; }
      if (action === "new:character") { openEntityDialog("character"); return; }
      if (action === "new:world-entry") { openDialog("new-world-entry"); return; }
      if (action === "new:item") { openEntityDialog("item"); return; }
      if (action === "export:work") { exportCurrentWork(); return; }
      if (action.startsWith("ai:")) { runAI(action.slice(3)); return; }
      if (action.startsWith("page:")) { const page = action.slice(5); navigate(page); return; }
      if (action.startsWith("chapter:")) { const id = action.slice(8); state.chapter = id; if (!activeData().openTabs.includes(id)) activeData().openTabs.push(id); activeData().currentChapter = id; navigate("writing"); return; }
      if (action.startsWith("material:")) { state.material = action.slice(9); navigate("materials"); return; }
      if (action.startsWith("entity:")) {
        const [, type, id] = action.split(":");
        if (type === "character") { state.character = id; state.worldEntity = id; state.worldView = "network"; state.worldType = "character"; navigate("characters"); }
        if (type === "place") { const place = places.find(item => item.id === id); if (place) { if (place.mapId) state.mapId = place.mapId; state.mapPoint = place.name; } navigate("maps"); }
        if (type === "item") { state.weapon = id; navigate("weapons"); }
        if (["faction", "species", "event", "rule"].includes(type)) { state.worldEntity = id; state.worldType = type; state.worldView = "network"; navigate("characters"); }
      }
    }
