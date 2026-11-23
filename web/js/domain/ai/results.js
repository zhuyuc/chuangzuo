import { outlineData, relationships, state } from "../../core/store.js";
import { storyEntities } from "../entities.js";
import { AI_REGISTRY } from "./labels.js";





/* 龙吟写作 · AI 结果解析与采纳 */
    function repairJSON(text) {
      let candidate = String(text).trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
      const start = candidate.search(/[[{]/);
      if (start > 0) candidate = candidate.slice(start);
      const end = Math.max(candidate.lastIndexOf("]"), candidate.lastIndexOf("}"));
      if (end >= 0) candidate = candidate.slice(0, end + 1);
      try { return JSON.parse(candidate); } catch (error) {
        try { return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1")); } catch (second) { return null; }
      }
    }

    export function parseAIResult(action, text) {
      const output = AI_REGISTRY.actions?.[action]?.output;
      const listActions = ["volumes", "check-outline", "rel-suggest", "world-audit"];
      const objectActions = ["balance", "mat-tags", "fill-entry"];
      if (output === "list" || (!output && listActions.includes(action))) {
        const parsed = repairJSON(text);
        if (Array.isArray(parsed)) return { kind: "list", rows: parsed.map(row => ({ main: String(row.main || row.title || "").trim(), sub: String(row.sub || row.goal || row.reason || "").trim(), target: row.target || "" })).filter(row => row.main) };
        return { kind: "list", rows: [{ main: "模型返回无法解析为列表", sub: text.slice(0, 120), target: "" }] };
      }
      if (output === "object" || (!output && objectActions.includes(action))) {
        const parsed = repairJSON(text);
        if (parsed && typeof parsed === "object") {
          if (action === "balance") return { kind: "text", body: parsed.body || text, drawback: parsed.drawback || "" };
          if (action === "mat-tags") return { kind: "text", body: `摘要：${parsed.summary || ""}\n标签：${(parsed.tags || []).join("、")}`, tags: parsed.tags || [], summary: parsed.summary || "" };
          return { kind: "text", body: text, fields: parsed };
        }
      }
      return { kind: "text", body: text };
    }

    export function attachServerApplies(action, result) {
      if (result.kind !== "list") return result;
      result.rows.forEach(row => {
        if (action === "volumes") row.apply = () => outlineData.volumes.push({ id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: row.main.split("·")[0].trim() || `第${outlineData.volumes.length + 1}卷`, subtitle: row.main.split("·")[1]?.trim() || "", goal: row.sub.replace(/^目标：/, ""), target: 100000 });
        if (action === "rel-suggest") row.apply = () => { const match = row.main.match(/^(.+?)\s*→\s*(.+?)\s*·\s*(.+)$/); const from = match && storyEntities().find(item => item.name === match[1].trim()); const to = match && storyEntities().find(item => item.name === match[2].trim()); if (from && to) relationships.push({ id: `rel-${Date.now()}`, from: from.id, to: to.id, type: match[3].trim(), state: "当前", scope: "work", stage: "当前剧情", note: row.sub, source: "AI 关系建议" }); };
        if (action === "check-outline") row.jump = () => { const volume = outlineData.volumes.find(item => (item.subtitle && row.main.includes(item.subtitle)) || row.main.includes(item.title)); state.outlineView = "volumes"; if (volume) state.outlineVolume = volume.id; };
        if (action === "world-audit") row.jump = () => { const entity = storyEntities().find(item => item.name === row.target) || storyEntities().find(item => row.main.includes(item.name)); if (entity) { state.page = entity.type === "item" ? "weapons" : entity.type === "place" ? "maps" : "characters"; state.worldView = "network"; state.worldEntity = entity.id; if (entity.type === "item") state.weapon = entity.id; if (entity.type === "place") state.mapPoint = entity.record.name; state.graphLayer = "entity"; state.graphType = entity.type; } };
      });
      return result;
    }
