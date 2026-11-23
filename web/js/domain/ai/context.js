import { chapterText, inspirations, materials, state, worldOverview } from "../../core/store.js";
import { escapeHtml } from "../../core/utils.js";
import { chapterRefIds, currentChapter, storyEntityById } from "../entities.js";





/* 龙吟写作 · AI 上下文组装 */
    export function aiTargetEntity() {
      if (!state.aiTarget) return null;
      const [type, ...rest] = state.aiTarget.split(":");
      if (type === "material") return materials.find(item => item.id === rest.join(":")) ? { type: "material", record: materials.find(item => item.id === rest.join(":")) } : null;
      if (type === "inspiration") return { type: "inspiration", record: inspirations.find(item => item.id === rest.join(":")) };
      const entity = storyEntityById(rest.join(":"));
      return entity ? { type: entity.type, record: entity.record, entity } : null;
    }

    export function buildAIContext() {
      const chapter = currentChapter();
      const refs = chapter
        ? ["character", "place", "item", "world"].flatMap(group => chapterRefIds(chapter, group).map(id => storyEntityById(id))).filter(Boolean).map(item => ({ label: item.label, name: item.name }))
        : [];
      const target = aiTargetEntity();
      return {
        intro: worldOverview.intro || "",
        refs,
        includeText: Boolean(state.ai.includeText),
        textTail: chapter ? (chapterText[chapter.id] || "").slice(-1800) : "",
        selectedText: state.aiSel?.text || "",
        chapter: chapter ? { title: chapter.title, summary: chapter.summary || "" } : null,
        target: target ? { name: target.record?.name || "", fields: target.record?.fields || target.record || {} } : null
      };
    }

    export function aiContextChips(extra = []) {
      const ctx = [];
      if (worldOverview.intro) ctx.push("作品简介");
      const chapter = currentChapter();
      if (chapter) {
        const refs = ["character", "place", "item", "world"].reduce((sum, group) => sum + chapterRefIds(chapter, group).length, 0);
        if (refs) ctx.push(`本章引用 ${refs} 项`);
      }
      if (state.aiSel) ctx.push(`选中 ${state.aiSel.text.length} 字`);
      if (state.ai.includeText && chapter) ctx.push("正文片段");
      return [...ctx, ...extra].map(item => `<span class="tag">${escapeHtml(item)}</span>`).join("");
    }