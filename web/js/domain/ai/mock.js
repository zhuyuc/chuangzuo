import { chapterText, characters, outlineData, relationships, state, weapons, worldEntries, worldOverview } from "../../core/store.js";
import { chapterRefIds, currentChapter, currentMaterial, currentWeapon, storyEntities, storyEntityById } from "../entities.js";
import { currentPlace } from "../maps/model.js";
import { MAP_TERRAINS } from "../maps/terrain.js";
import { activeData } from "../works.js";
import { aiTargetEntity } from "./context.js";





/* 龙吟写作 · AI 离线模拟结果 */
    export function mockAIResult(action) {
      const chapter = currentChapter();
      const text = chapter ? chapterText[chapter.id] || "" : "";
      const sel = state.aiSel?.text || "";
      const refNames = group => chapter ? chapterRefIds(chapter, group).map(id => storyEntityById(id)?.name).filter(Boolean) : [];
      const people = refNames("character");
      const placeNames = refNames("place");
      const target = aiTargetEntity();
      const conflict = (worldOverview.intro || "").split("\n")[0] || "尚未填写的核心冲突";
      switch (action) {
        case "continue": return { kind: "text", body: `${people[0] || "他"}没有回答，只是把视线移向门外。脚步声停在檐下，又踏着水洼远了。` };
        case "polish": return { kind: "text", body: sel.replace(/\s+/g, "").replace(/，([^，]+)$/, "，却$1") };
        case "rewrite": { const parts = sel.split("，"); return { kind: "text", body: parts.length > 1 ? `${parts.slice(1).join("，")}，${parts[0]}。` : sel }; }
        case "expand": return { kind: "text", body: `${sel} 指腹擦过纸面的旧痕，他想起三年前那个雨夜，也是这样的墨色。` };
        case "compress": return { kind: "text", body: `${sel.split("，")[0]}。` };
        case "nextpara": return { kind: "text", body: `门外的脚步声停了片刻。${placeNames[0] ? `${placeNames[0]}方向传来更夫敲梆的声响，一下，两下。` : "巷口传来更夫敲梆的声响，一下，两下。"}` };
        case "summary": return { kind: "text", body: `本章在场：${people.join("、") || "未识别"}；地点：${placeNames.join("、") || "未识别"}；推进：${chapter?.summary || "未填写章节梗概"}。未收线索：写信人身份、腰牌刻痕。` };
        case "qa": return { noAdopt: true, kind: "text", body: `上一章在场：${people.join("、") || "未识别"}；提及物品：${refNames("item").join("、") || "无"}。与「${conflict}」不冲突；注意${people[0] || "主角"}的未公开秘密尚未在本章呼应。` };
        case "volumes": return { kind: "list", rows: [
          { main: "第三卷 · 断线", sub: `目标：旧案名单流出，${people[0] || "主角"}与对立势力正面冲突。`, apply: () => outlineData.volumes.push({ id: `v-${Date.now()}`, title: "第三卷", subtitle: "断线", goal: `旧案名单流出，${people[0] || "主角"}与对立势力正面冲突。`, target: 120000 }) },
          { main: "第四卷 · 燃灯", sub: `目标：真相公开，代价是失去现有身份；呼应主题「${(worldOverview.intro || "").split("\n")[0] || "未填"}」。`, apply: () => outlineData.volumes.push({ id: `v-${Date.now() + 1}`, title: "第四卷", subtitle: "燃灯", goal: "真相公开，代价是失去现有身份。", target: 100000 }) }
        ] };
        case "check-outline": {
          const rows = [];
          outlineData.volumes.forEach((volume, index) => { if (!volume.goal || !volume.goal.trim()) rows.push({ main: `${volume.title} 缺少本卷目标`, sub: "没有目标的卷容易写成场景堆砌。", jump: () => { state.outlineView = "volumes"; state.outlineVolume = volume.id; } }); });
          if (!(outlineData.worldRules || "").trim()) rows.push({ main: "缺少世界运行基础规则", sub: "规则是一致性检查与 AI 上下文的依据。", jump: () => { state.outlineView = "overview"; } });
          if (!rows.length) rows.push({ main: "未发现明显结构问题", sub: "卷目标与世界运行基础规则已填写。", jump: null });
          return { kind: "list", rows };
        }
        case "fill-entry": {
          if (!target) return { kind: "text", body: "请先在右侧选择一条设定。" };
          const record = target.record;
          const fields = {};
          if (target.type === "character") { if (!record.goal) fields.goal = `守住${record.location || "当前所在"}，并查清与自身有关的旧账。`; if (!record.weakness) fields.weakness = "无法对熟悉口音的人设防。"; }
          if (target.type === "place") { if (!record.terrain) fields.terrain = "河谷台地"; if (!record.danger) fields.danger = "入夜后巡防换岗间隔极短，外人容易暴露。"; }
          if (target.type === "item") { if (!record.drawback) fields.drawback = "每次使用都会留下可被追踪的气机痕迹。"; }
          if (["faction", "species", "event", "rule"].includes(target.type)) {
            const defs = { faction: [["goal", `维持自身秩序，并封住${conflict.slice(0, 6)}继续扩散。`], ["weakness", "内部已被旧案渗透。"]], species: [["habitat", "山南道深处"], ["taboo", "不可向外人透露地脉之声。"]], event: [["cause", "一份涉及山门的名单流出。"], ["impact", `直接引发${conflict.slice(0, 8)}。`]], rule: [["cost", "越阶使用会造成不可逆损伤。"], ["exception", "存在一件已知例外装备。"]] }[target.type] || [];
            defs.forEach(([key, value]) => { if (!record.fields?.[key]) (fields.fields = fields.fields || { ...record.fields })[key] = value; });
          }
          if (!record.summary) fields.summary = `${record.name}是${worldOverview.genre || "这个世界"}中推动${conflict.slice(0, 8)}的关键${target.entity?.label || "设定"}。`;
          return { kind: "text", body: Object.entries(fields).map(([key, value]) => `${key === "fields" ? Object.entries(value).map(([k, v]) => `${k}：${v}`).join("\n") : `${key}：${value}`}`).join("\n") || "该设定字段已完整，无需补全。", fields };
        }
        case "rel-suggest": {
          const entities = storyEntities();
          const rows = [];
          entities.slice(0, 6).forEach((a, i) => {
            const b = entities.find(item => item.id !== a.id && !relationships.some(rel => (rel.from === a.id && rel.to === item.id) || (rel.to === a.id && rel.from === item.id)));
            if (b && rows.length < 3) rows.push({ main: `${a.name} → ${b.name} · ${a.type === b.type ? "同源" : "牵制"}`, sub: `${a.label}与${b.label}之间缺少显式关系，建议补一条可随剧情变化的牵制线。`, apply: () => relationships.push({ id: `rel-${Date.now()}-${i}`, from: a.id, to: b.id, type: a.type === b.type ? "同源" : "牵制", state: "当前", scope: "work", stage: "当前剧情", note: "AI 建议，待作者确认。", source: "AI 关系建议" }) });
          });
          return { kind: "list", rows: rows.length ? rows : [{ main: "暂无新增关系建议", sub: "现有实体之间的关系已经较完整。", apply: null }] };
        }
        case "world-audit": {
          const rows = [];
          characters.forEach(person => { if (!person.goal || !person.goal.trim()) rows.push({ main: `「${person.name}」缺少人物动机`, sub: "没有动机的人物很难推动剧情。", jump: () => { state.page = "characters"; state.worldView = "network"; state.worldEntity = person.id; state.worldType = "character"; state.graphType = "character"; state.graphLayer = "entity"; } }); });
          worldEntries.forEach(entry => { if (!entry.summary) rows.push({ main: `「${entry.name}」缺少一句话摘要`, sub: "摘要会进入 @ 选择器与 AI 上下文。", jump: () => { state.page = "characters"; state.worldView = "library"; state.worldEntity = entry.id; } }); });
          weapons.forEach(item => { if (!item.drawback) rows.push({ main: `「${item.name}」缺少代价`, sub: "无代价的能力会破坏世界规则。", jump: () => { state.page = "weapons"; state.weapon = item.id; } }); });
          if (!rows.length) rows.push({ main: "未发现明显设定缺口", sub: "动机、摘要与代价均已填写。", jump: null });
          return { kind: "list", rows };
        }
        case "map-name": {
          const place = currentPlace();
          const terrain = (() => { if (!place) return "草地"; const ownerMap = (activeData().maps || []).find(item => item.id === place.mapId); const wm = ownerMap && ownerMap.worldMap; if (!wm || !Array.isArray(wm.grid)) return "草地"; const cx = Math.max(0, Math.min(wm.cols - 1, Math.floor(place.x / (720 / wm.cols)))); const cy = Math.max(0, Math.min(wm.rows - 1, Math.floor(place.y / (500 / wm.rows)))); return (MAP_TERRAINS[wm.grid[cy * wm.cols + cx]] || MAP_TERRAINS[3]).label; })();
          return { kind: "text", body: `${terrain === "深水" || terrain === "浅水" ? "沉沙渡" : terrain === "山地" || terrain === "雪地" ? "雾岭驿" : "青禾驿"}` };
        }
        case "map-desc": {
          const place = currentPlace();
          return { kind: "text", body: `${place?.type || "地点"}边缘的旧补给点，只有一条季节性路线可达；旧巡防记号仍刻在内墙。` };
        }
        case "balance": {
          const item = currentWeapon();
          if (!item) return { kind: "text", body: "请先选择一件装备。" };
          return { kind: "text", body: `能力「${item.ability || "未填"}」缺少使用上限。建议代价：每次使用都会失去一小段温度感知，连续三次后暂时握不住${item.kind || "兵器"}。`, drawback: "每次使用都会失去一小段温度感知，连续三次后暂时握不住兵器。" };
        }
        case "mat-tags": {
          const material = currentMaterial();
          if (!material) return { kind: "text", body: "请先选择一条素材。" };
          const tags = [...new Set([...(material.tags || []), material.type === "网页剪藏" ? "剪藏" : "笔记", ...((material.title || "").slice(0, 2) ? [material.title.slice(0, 2)] : [])])];
          return { kind: "text", body: `摘要：${(material.note || material.title).slice(0, 24)}……可用于推演场景路线与时代细节。\n标签：${tags.join("、")}`, tags, summary: `${(material.note || material.title).slice(0, 24)}……可用于推演场景路线与时代细节。` };
        }
        default: return { kind: "text", body: "模拟结果。" };
      }
    }