import { WORLD_ENTITY_DEFS } from "../core/state.js";
import { chapters, places, relationships, state, weapons, worldOverview } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { aiButton } from "../domain/ai/labels.js";
import { chapterRefIds, entityRelationsMarkup, itemOwner, storyEntities, storyEntityById } from "../domain/entities.js";
import { graphColor, graphRelsOf, graphTypeLabel } from "../domain/relationships.js";
import { activeWork } from "../domain/works.js";
import { pageTitle } from "../ui/shell.js";
import { scopeTag } from "./library.js";





/* 龙吟写作 · 世界观 */
    export function charactersPage() {
      const allWorldEntities = storyEntities();
      const worldTabs = `<div class="page-subtabs">${[["overview", "世界总览"], ["library", "设定库"], ["network", "关系网络"]].map(([id, label]) => `<button class="${state.worldView === id ? "active" : ""}" data-world-view="${id}">${label}</button>`).join("")}</div>`;
      const worldTitle = pageTitle("世界观", `${activeWork().name} 独有的世界背景、设定条目与关系。`, `<button class="button primary" data-dialog="new-world-entry">新增设定</button>`);
      const worldTypeOptions = [["all", "全部"], ["character", "人物"], ["place", "地点"], ["item", "装备"], ["faction", "势力"], ["species", "种族"], ["event", "事件"], ["rule", "规则"]];
      const countType = type => type === "all" ? allWorldEntities.length : allWorldEntities.filter(item => item.type === type).length;
      if (state.worldView === "overview") {
        return `<section class="page">${worldTitle}${worldTabs}<div class="world-overview-page"><div class="section-heading" style="margin:0 0 10px"><h2>作品简介</h2><span>全书一致性参照，也作为 AI 上下文</span></div><label class="overview-field wide"><textarea rows="3" data-world-field="intro" aria-label="作品简介" placeholder="用一段话介绍这部作品的世界：时代、地理、力量体系与核心矛盾……">${escapeHtml(worldOverview.intro || "")}</textarea></label>${allWorldEntities.length ? `<div class="section-heading"><h2>世界构成</h2><button class="text-button" data-world-view="library">进入设定库</button></div><div class="world-type-cards">${[["character", "人物"], ["place", "地点"], ["faction", "势力"], ["species", "种族"], ["item", "装备"], ["event", "事件"], ["rule", "规则"]].map(([type, label]) => `<button data-world-library-type="${type}"><strong>${countType(type)}</strong><span>${label}</span></button>`).join("")}</div><div class="section-heading"><h2>最近设定</h2><button class="text-button" data-world-view="network">查看关系网络</button></div><div class="world-recent-grid">${allWorldEntities.slice(-6).reverse().map(item => `<button data-world-network="${item.id}"><span class="world-mini-type">${item.label[0]}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.summary || item.subtitle || "")}</small></span></button>`).join("")}</div>` : `<div class="empty-state compact world-empty"><strong>还没有设定条目</strong><p>作品简介可以先写。人物、地点、势力与规则，想到哪条就补哪条。</p><button class="button primary" data-dialog="new-world-entry">新增第一条设定</button></div>`}</div></section>`;
      }
      if (state.worldView === "library") {
        const libraryEntities = allWorldEntities.filter(item => state.worldType === "all" || item.type === state.worldType);
        return `<section class="page">${worldTitle}${worldTabs}<div class="world-library-view"><div class="world-library-toolbar"><div class="search-box">⌕ <input data-world-search="library" placeholder="搜索名称、摘要和设定字段"></div><div class="world-type-tabs">${worldTypeOptions.map(([id, label]) => `<button class="${state.worldType === id ? "active" : ""}" data-world-type="${id}">${label} ${countType(id)}</button>`).join("")}</div></div><div class="world-result-count"><span data-world-visible>${libraryEntities.length}</span> 条设定</div><div class="world-card-grid">${libraryEntities.map(item => `<article class="world-entity-card" data-world-search-text="${escapeHtml(`${item.name} ${item.summary || ""} ${item.subtitle || ""} ${JSON.stringify(item.record.fields || {})}`.toLowerCase())}"><button class="world-card-main" data-world-network="${item.id}"><span class="world-card-kind">${item.label}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.summary || item.subtitle || "尚未补充摘要")}</p><small>${relationships.filter(relation => relation.from === item.id || relation.to === item.id).length} 条关系</small></button><button class="world-card-edit" data-entity-edit="${item.type}:${item.id}">编辑</button></article>`).join("") || '<div class="empty-state"><strong>这个分类还没有设定</strong><p>点击“新增设定”开始创建。</p></div>'}</div></div></section>`;
      }
      if (!allWorldEntities.length) return `<section class="page">${worldTitle}${worldTabs}<div class="empty-state"><strong>这部作品还没有世界观条目</strong><p>先写世界总纲，再创建人物、地点、势力或规则。</p><button class="button primary" data-dialog="new-world-entry">新增设定</button></div></section>`;
      const visibleEntities = allWorldEntities.filter(item => state.worldType === "all" || item.type === state.worldType);
      const selectedWorld = storyEntityById(state.worldEntity) || storyEntityById(state.character) || allWorldEntities[0];
      const selectedEntity = selectedWorld.record;
      const worldRelations = relationships.filter(relation => (relation.from === selectedWorld.id || relation.to === selectedWorld.id) && (state.relationScope === "all" || relation.scope === state.relationScope));
      const selectedRelation = worldRelations.find(relation => relation.id === state.relationship) || worldRelations[0];
      const relationDetailMarkup = selectedRelation ? `<div class="relation-detail" style="margin:16px;padding:14px"><div class="relation-pair"><span>${storyEntityById(selectedRelation.from)?.name || "已删除实体"}</span><i>→</i><span>${storyEntityById(selectedRelation.to)?.name || "已删除实体"}</span></div><div class="relation-meta"><span>关系类型</span><strong>${selectedRelation.type}</strong><span>数据归属</span><strong>${selectedRelation.scope === "shared" ? "共享长期事实" : "仅当前作品"}</strong><span>生效阶段</span><strong>${selectedRelation.stage}</strong><span>当前状态</span><strong>${selectedRelation.state}</strong><span>依据</span><strong>${selectedRelation.source}</strong></div><p class="detail-copy relation-note">${selectedRelation.note}</p><button class="button" data-entity-edit="relationship:${selectedRelation.id}">编辑这条关系</button></div>` : "";
      const relationListMarkup = `<div class="relationship-list"><div class="relationship-list-head"><span>关联实体</span><span>类型</span><span>方向</span><span>当前状态</span><span>归属</span></div>${worldRelations.map(relation => { const other = storyEntityById(relation.from === selectedWorld.id ? relation.to : relation.from) || { name: "已删除实体", label: "未知", subtitle: "" }; return `<button class="relationship-row ${selectedRelation && selectedRelation.id === relation.id ? "selected" : ""}" data-relation="${relation.id}"><div><strong>${other.name}</strong><small>${other.label} · ${other.subtitle || ""}</small></div><span>${relation.type}</span><span>${relation.from === selectedWorld.id ? "当前条目 → 对方" : "对方 → 当前条目"}</span><span>${relation.state}</span>${scopeTag(relation.scope)}</button>`; }).join("") || '<div class="relationship-empty">当前范围下没有与这个条目绑定的关系。</div>'}${relationDetailMarkup}</div>`;
      const graphPearlStops = document.documentElement.getAttribute("data-theme") === "dark" ? '<stop offset="0%" stop-color="#7d897f"/><stop offset="55%" stop-color="#39413a"/><stop offset="100%" stop-color="#1b201b"/>' : '<stop offset="0%" stop-color="#ffffff"/><stop offset="65%" stop-color="#eef0eb"/><stop offset="100%" stop-color="#d9ded5"/>';
      const GRAPH_DEFS = `<defs><radialGradient id="graph-pearl" cx="35%" cy="30%" r="75%">${graphPearlStops}</radialGradient><marker id="graph-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" style="fill:var(--tertiary)"/></marker></defs>`;
      const graphLayerNow = () => (state.graphLayer === "type" && state.graphType ? "type" : state.graphLayer === "entity" && selectedWorld ? "entity" : state.graphLayer === "panorama" ? "panorama" : "panorama");
      const graphNodeCircle = (x, y, r, entity, selected, delay) => {
        const color = graphColor(entity.type);
        const halo = selected ? `<circle cx="${x}" cy="${y}" r="${r + 7}" fill="${color}" opacity=".15"></circle>` : "";
        const name = entity.name.length > 5 ? entity.name.slice(0, 5) + "…" : entity.name;
        return `<g class="graph-node" data-graph-node="${entity.id}" style="animation-delay:${delay}ms"><title>${escapeHtml(entity.label || "")} · ${escapeHtml(entity.name)}</title>${halo}<circle cx="${x}" cy="${y}" r="${r}" style="fill:${selected ? color + "22" : "var(--paper)"}" stroke="${color}" stroke-width="${selected ? 2 : 1.3}"></circle><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="${r > 30 ? 15 : 12}" font-weight="600" style="fill:var(--text)">${escapeHtml(name)}</text></g>`;
      };
      const graphStage = (() => {
        const W = 700, H = 500, CX = 350, CY = 250;
        const layer = graphLayerNow();
        if (layer === "panorama") {
          const typesPresent = ["character", "place", "item", "faction", "species", "event", "rule"].filter(type => allWorldEntities.some(item => item.type === type));
          const dials = typesPresent.map((type, i) => {
            const items = allWorldEntities.filter(item => item.type === type);
            const angle = (i / Math.max(1, typesPresent.length)) * Math.PI * 2 - Math.PI / 2;
            const x = CX + Math.cos(angle) * 232, y = CY + Math.sin(angle) * 152;
            const r = 24 + Math.min(26, items.length * 3);
            const linkedCount = items.filter(item => graphRelsOf(item.id).length).length;
            const ticks = items.map((item, j) => {
              const a = (j / items.length) * Math.PI * 2 - Math.PI / 2;
              const linked = graphRelsOf(item.id).length > 0;
              return `<line x1="${x + Math.cos(a) * (r - 5)}" y1="${y + Math.sin(a) * (r - 5)}" x2="${x + Math.cos(a) * (r - 1)}" y2="${y + Math.sin(a) * (r - 1)}" style="stroke:${linked ? graphColor(type) : "var(--line-strong)"}" stroke-width="2"></line>`;
            }).join("");
            const arc = (2 * Math.PI * (r - 9) * (linkedCount / Math.max(1, items.length))).toFixed(1);
            return { type, x, y, r, markup: `<g class="graph-dial" data-graph-dial="${type}" style="animation-delay:${i * 50}ms"><title>${graphTypeLabel(type)} · 点击下钻</title><circle cx="${x}" cy="${y}" r="${r}" style="fill:var(--paper)" stroke="${graphColor(type)}" stroke-width="1.2"></circle><circle cx="${x}" cy="${y}" r="${r - 9}" fill="none" stroke="${graphColor(type)}" stroke-width="3" stroke-dasharray="${arc} 999" opacity=".45" transform="rotate(-90 ${x} ${y})"></circle>${ticks}<text x="${x}" y="${y - 1}" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--text)">${graphTypeLabel(type)}</text><text x="${x}" y="${y + 13}" text-anchor="middle" font-size="10" style="fill:var(--secondary)">${items.length} 条</text></g>` };
          });
          const scopeRels = relationships.filter(relation => state.relationScope === "all" || relation.scope === state.relationScope);
          const chords = [];
          for (let a = 0; a < dials.length; a += 1) for (let b = a + 1; b < dials.length; b += 1) {
            const count = scopeRels.filter(relation => {
              const fa = storyEntityById(relation.from), fb = storyEntityById(relation.to);
              if (!fa || !fb) return false;
              return (fa.type === dials[a].type && fb.type === dials[b].type) || (fa.type === dials[b].type && fb.type === dials[a].type);
            }).length;
            if (count) chords.push(`<line class="graph-chord" data-chord="${dials[a].type}|${dials[b].type}" x1="${dials[a].x}" y1="${dials[a].y}" x2="${dials[b].x}" y2="${dials[b].y}" style="stroke:var(--text)" stroke-opacity=".16" stroke-width="${Math.min(4, .8 + count * .5)}"></line>`);
          }
          const selfArcs = [];
          dials.forEach(d => {
            const count = scopeRels.filter(relation => {
              const fa = storyEntityById(relation.from), fb = storyEntityById(relation.to);
              return fa && fb && fa.type === d.type && fb.type === d.type;
            }).length;
            if (!count) return;
            const r2 = d.r + 8;
            const a1 = Math.PI * .72, a2 = Math.PI * .28;
            const x1 = d.x + Math.cos(a1) * r2, y1 = d.y + Math.sin(a1) * r2;
            const x2 = d.x + Math.cos(a2) * r2, y2 = d.y + Math.sin(a2) * r2;
            selfArcs.push(`<path class="graph-selfarc" d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r2} ${r2} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" style="stroke:${graphColor(d.type)}" stroke-width="${Math.min(5, 1.5 + count)}" stroke-opacity=".55" stroke-linecap="round"><title>同类内部关系 ${count} 条</title></path>`);
          });
          return `<svg viewBox="0 0 ${W} ${H}" class="relationship-map graph-stage-svg ${state.graphPaused ? "paused" : ""}" aria-label="世界观关系全景">${GRAPH_DEFS}${chords.join("")}${selfArcs.join("")}<g class="graph-ripples"><circle cx="${CX}" cy="${CY}" r="12"></circle><circle cx="${CX}" cy="${CY}" r="12"></circle><circle cx="${CX}" cy="${CY}" r="12"></circle></g><circle cx="${CX}" cy="${CY}" r="24" fill="url(#graph-pearl)" style="stroke:var(--line-strong)" stroke-width="1"></circle><circle class="graph-pearl-ring" cx="${CX}" cy="${CY}" r="31" fill="none" style="stroke:var(--tertiary)" stroke-width="1" stroke-dasharray="2 7"></circle>${dials.map(d => d.markup).join("")}</svg>`;
        }
        if (layer === "type") {
          const items = allWorldEntities.filter(item => item.type === state.graphType);
          const color = graphColor(state.graphType);
          const capsules = items.map((item, i) => {
            const angle = (i / Math.max(1, items.length)) * Math.PI * 2 - Math.PI / 2;
            const x = CX + Math.cos(angle) * 232, y = CY + Math.sin(angle) * 162;
            const linked = graphRelsOf(item.id).length;
            return `<g class="graph-node" data-graph-node="${item.id}" style="animation-delay:${i * 45}ms"><title>${escapeHtml(item.name)} · 点击查看关系</title><line x1="${CX + Math.cos(angle) * 44}" y1="${CY + Math.sin(angle) * 44}" x2="${x - Math.cos(angle) * 42}" y2="${y - Math.sin(angle) * 13}" stroke="${color}" stroke-opacity=".3" stroke-width="1"></line><rect x="${x - 44}" y="${y - 13}" width="88" height="26" rx="13" style="fill:var(--paper)" stroke="${color}" stroke-width="${linked ? 1.6 : 1}"></rect><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="600" style="fill:var(--text)">${escapeHtml(item.name.length > 7 ? item.name.slice(0, 7) + "…" : item.name)}</text></g>`;
          }).join("");
          return `<svg viewBox="0 0 ${W} ${H}" class="relationship-map graph-stage-svg ${state.graphPaused ? "paused" : ""}" aria-label="${WORLD_ENTITY_DEFS[state.graphType]?.label || ""}条目">${GRAPH_DEFS}<g class="graph-ripples"><circle cx="${CX}" cy="${CY}" r="12"></circle><circle cx="${CX}" cy="${CY}" r="12"></circle></g>${capsules}<circle cx="${CX}" cy="${CY}" r="40" fill="url(#graph-pearl)" stroke="${color}" stroke-width="1.2"></circle><circle class="graph-pearl-ring" cx="${CX}" cy="${CY}" r="47" fill="none" style="stroke:var(--tertiary)" stroke-width="1" stroke-dasharray="2 7"></circle><text x="${CX}" y="${CY + 4}" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--text)">${graphTypeLabel(state.graphType)}</text></svg>`;
        }
        const neighbors = worldRelations.map(relation => ({ relation, other: storyEntityById(relation.from === selectedWorld.id ? relation.to : relation.from) })).filter(item => item.other);
        neighbors.sort((a, b) => (a.other.type === b.other.type ? a.other.name.localeCompare(b.other.name, "zh-CN") : a.other.type.localeCompare(b.other.type)));
        const positioned = neighbors.map((item, i) => {
          const angle = (i / Math.max(1, neighbors.length)) * Math.PI * 2 - Math.PI / 2;
          return { ...item, x: CX + Math.cos(angle) * 232, y: CY + Math.sin(angle) * 162 };
        });
        const edges = positioned.map(item => {
          const fromCurrent = item.relation.from === selectedWorld.id;
          const x1 = fromCurrent ? CX : item.x, y1 = fromCurrent ? CY : item.y;
          const x2 = fromCurrent ? item.x : CX, y2 = fromCurrent ? item.y : CY;
          const color = graphColor(item.other.type);
          return `<g class="graph-edge" data-edge-a="${selectedWorld.id}" data-edge-b="${item.other.id}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-opacity=".28" stroke-width="1.4" marker-end="url(#graph-arrow)"></line><text class="relationship-edge-label" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 7}" text-anchor="middle" style="fill:var(--secondary)" font-size="10">${escapeHtml(item.relation.type)}${item.relation.state ? " · " + escapeHtml(item.relation.state) : ""}</text></g>`;
        }).join("");
        const nodes = positioned.map((item, i) => graphNodeCircle(item.x, item.y, 26, item.other, false, i * 45)).join("") + graphNodeCircle(CX, CY, 34, selectedWorld, true, 0);
        return `<svg viewBox="0 0 ${W} ${H}" class="relationship-map graph-stage-svg ${state.graphPaused ? "paused" : ""}" aria-label="${escapeHtml(selectedWorld.name)}的关系图">${GRAPH_DEFS}${edges}${nodes}</svg>`;
      })();
      const graphCrumbs = (() => {
        const layer = graphLayerNow();
        const parts = [`<button data-graph-layer="panorama" class="${layer === "panorama" ? "active" : ""}">全景</button>`];
        if (layer !== "panorama") {
          const type = state.graphType || selectedWorld.type;
          parts.push(`<i>›</i><button data-graph-layer="type" class="${layer === "type" ? "active" : ""}">${graphTypeLabel(type)}</button>`);
        }
        if (layer === "entity") parts.push(`<i>›</i><span class="crumb-now">${escapeHtml(selectedWorld.name)}</span>`);
        return parts.join("");
      })();
      const insightRelations = worldRelations.length ? `<div class="panel-label spaced">关系 · ${worldRelations.length}</div><div class="insight-relations">${worldRelations.map(relation => { const otherId = relation.from === selectedWorld.id ? relation.to : relation.from; const other = storyEntityById(otherId); return `<button class="insight-rel-row" data-world-network="${otherId}"><span class="rel-type" style="color:${graphColor(other?.type)}">${escapeHtml(relation.type)}</span><strong>${escapeHtml(other?.name || "已删除实体")}</strong><small>${escapeHtml(relation.state || "")}</small></button>`; }).join("")}</div>` : "";
      let rightMarkup = "";
      if (selectedWorld.type === "character") {
        const person = selectedEntity;
        const ownedItems = weapons.filter(item => itemOwner(item)?.id === person.id);
        const appearances = chapters.filter(chapter => chapterRefIds(chapter, "character").includes(person.id));
        rightMarkup = `<div class="profile-head"><span class="avatar large ${person.color}">${person.name.slice(0, 1)}</span><div><h2>${person.name}</h2><p>${person.role}</p></div><button class="button profile-edit" data-entity-edit="character:${person.id}">编辑</button></div>${person.sharedRef ? `<div class="relation-summary">${scopeTag("shared")}<span>来自共享设定库</span></div>` : ""}<div class="data-section"><span>人物档案</span><div class="data-box"><strong>${escapeHtml(person.role)}</strong>${person.alias ? `<br>别名：${escapeHtml(person.alias)}` : ""}<br>当前位置：${escapeHtml(person.location || "未指定")}${person.faction ? `<br>所属势力：${escapeHtml(person.faction)}` : ""}<br>人物动机：${escapeHtml(person.goal || "尚未填写")}<br>弱点：${escapeHtml(person.weakness || "尚未填写")}<br>能力：${escapeHtml(person.ability || "尚未填写")}${person.abilityCost ? `<br>能力代价：${escapeHtml(person.abilityCost)}` : ""}<br>背景备注：${escapeHtml(person.background || "尚未填写")}</div></div><div class="section-heading" style="margin:18px 0 7px"><h2>秘密</h2><button class="button" data-secret-add>添加秘密</button></div><div class="secret-list">${(person.secrets || []).map(secret => `<div class="secret-card"><p>${escapeHtml(secret.text)}</p><div class="secret-meta"><span class="tag">威胁 ${secret.threat}</span><span class="tag">${secret.isPublic ? "已公开" : "未公开"}</span></div><div class="secret-known">知情：${(secret.knownByIds || []).map(id => storyEntityById(id)?.name).filter(Boolean).join("、") || "无人"}<br>怀疑：${(secret.suspectedByIds || []).map(id => storyEntityById(id)?.name).filter(Boolean).join("、") || "无人"}</div><div class="secret-actions"><button data-secret-edit="${secret.id}">编辑</button><button data-secret-delete="${secret.id}">删除</button></div></div>`).join("") || '<p class="muted">还没有秘密。秘密的价值在于谁知道、谁在怀疑。</p>'}</div><label class="field-label">持有装备</label>${ownedItems.map(item => `<button class="linked-card" data-weapon-nav="${item.id}"><strong>${item.name} · ${item.kind}</strong><span>当前状态：${item.state} →</span></button>`).join("") || '<p class="muted">暂无持有装备</p>'}<label class="field-label">出场章节</label><div class="chapter-links">${appearances.map(chapter => `<button data-chapter-nav="${chapter.id}">${chapter.title}</button>`).join("") || '<span class="muted">尚未关联章节</span>'}</div><button class="button" data-entity-edit="character:${person.id}">编辑人物档案</button>`;
      } else if (selectedWorld.type === "place") {
        const place = selectedEntity;
        const parent = places.find(item => item.id === place.parentId);
        const usedChapters = chapters.filter(chapter => chapterRefIds(chapter, "place").includes(place.id));
        rightMarkup = `<div class="profile-head"><span class="avatar large">${place.name.slice(0, 1)}</span><div><h2>${place.name}</h2><p>地点 · ${escapeHtml(place.type || "")}</p></div><button class="button profile-edit" data-entity-edit="place:${place.id}">编辑</button></div><div class="data-section"><span>地点档案</span><div class="data-box">${escapeHtml(place.desc || "尚未填写地点说明")}${place.terrain ? `<br>地貌：${escapeHtml(place.terrain)}` : ""}${place.danger ? `<br>危险：${escapeHtml(place.danger)}` : ""}<br>父级：${parent ? parent.name : "无"}</div></div><label class="field-label">关联章节</label>${usedChapters.map(chapter => `<button class="linked-card" data-chapter-nav="${chapter.id}"><strong>${chapter.title}</strong><span>打开章节 →</span></button>`).join("") || '<p class="muted">尚未关联章节</p>'}<button class="button" data-map-nav="${place.name}">在地图中打开</button>`;
      } else if (selectedWorld.type === "item") {
        const item = selectedEntity;
        const owner = itemOwner(item);
        const usedChapters = chapters.filter(chapter => chapterRefIds(chapter, "item").includes(item.id));
        rightMarkup = `<div class="profile-head"><span class="avatar large">${item.name.slice(0, 1)}</span><div><h2>${item.name}</h2><p>${item.category} · ${item.kind}</p></div><button class="button profile-edit" data-entity-edit="item:${item.id}">编辑</button></div><div class="data-section"><span>装备档案</span><div class="data-box">${escapeHtml(item.desc || "")}<br>持有者：${owner ? owner.name : item.owner}<br>状态：${item.state || "未指定"}<br>能力：${escapeHtml(item.ability || "未填写")}<br>代价：${escapeHtml(item.drawback || "未填写")}</div></div><label class="field-label">关联章节</label>${usedChapters.map(chapter => `<button class="linked-card" data-chapter-nav="${chapter.id}"><strong>${chapter.title}</strong><span>打开章节 →</span></button>`).join("") || '<p class="muted">尚未关联章节</p>'}<button class="button" data-weapon-nav="${item.id}">打开装备详情</button>`;
      } else {
        const entry = selectedEntity;
        const def = WORLD_ENTITY_DEFS[selectedWorld.type] || { label: "设定", mark: "设" };
        const fieldDefs = {
          faction: [["kind", "势力类型"], ["leader", "首领"], ["goal", "目标"], ["resource", "资源"], ["weakness", "弱点"]],
          species: [["habitat", "栖息地"], ["lifespan", "寿命"], ["society", "社会结构"], ["gift", "天赋"], ["taboo", "禁忌"]],
          event: [["era", "纪元"], ["year", "年份"], ["importance", "影响等级"], ["cause", "起因"], ["impact", "后果"]],
          rule: [["domain", "领域"], ["law", "法则"], ["cost", "代价"], ["exception", "例外"], ["status", "状态"]]
        }[selectedWorld.type] || [];
        rightMarkup = `<div class="profile-head"><span class="avatar large">${def.mark}</span><div><h2>${escapeHtml(entry.name)}</h2><p>${def.label}${entry.fields?.kind ? ` · ${escapeHtml(entry.fields.kind)}` : ""}</p></div><button class="button profile-edit" data-entity-edit="${selectedWorld.type}:${entry.id}">编辑</button></div><div class="world-entity-profile"><div class="data-section"><span>设定摘要</span><div class="data-box">${escapeHtml(entry.summary || "尚未填写摘要")}</div></div>${fieldDefs.some(([key]) => entry.fields?.[key]) ? `<div class="data-section"><span>${def.label}档案</span><div class="world-field-list">${fieldDefs.filter(([key]) => entry.fields?.[key]).map(([key, label]) => `<span>${label}</span><strong>${escapeHtml(entry.fields[key])}</strong>`).join("")}</div></div>` : ""}${entry.body ? `<div class="data-section"><span>补充说明</span><p class="detail-copy">${escapeHtml(entry.body)}</p></div>` : ""}<label class="field-label">相关实体</label>${entityRelationsMarkup(entry.id)}<button class="button" data-world-view="library">返回设定库</button></div>`;
      }
      const networkTypeLabel = state.worldType === "all" ? "全部条目" : (worldTypeOptions.find(([id]) => id === state.worldType)?.[1] || "条目");
      return `<section class="page">
        ${worldTitle}${worldTabs}
        <div class="characters-layout content-fill">
          <aside class="inner-sidebar"><div class="search-box">⌕ <input data-world-search="network" placeholder="搜索设定"></div><div class="world-network-count"><span>当前列表</span><b data-world-visible>${visibleEntities.length}</b></div><div class="world-network-types">${worldTypeOptions.map(([id, label]) => `<button class="${state.worldType === id ? "active" : ""}" data-world-type="${id}"><span>${label}</span><b>${countType(id)}</b></button>`).join("")}</div><div class="panel-label spaced">${networkTypeLabel}</div>${visibleEntities.map(item => `<button class="person-row ${selectedWorld.id === item.id ? "selected" : ""}" data-world-entity="${item.id}" data-world-search-text="${escapeHtml(`${item.name} ${item.label} ${item.summary || ""} ${item.subtitle || ""}`.toLowerCase())}"><span class="avatar ${item.record.color || ""}">${item.type === "character" || item.type === "place" || item.type === "item" ? item.name.slice(0, 1) : WORLD_ENTITY_DEFS[item.type]?.mark || "设"}</span><div><strong>${escapeHtml(item.name)}</strong><small>${item.label}${item.subtitle ? ` · ${escapeHtml(item.subtitle)}` : ""}</small></div></button>`).join("") || '<p class="muted" style="padding:8px">当前筛选下没有条目。</p>'}</aside>
          <div class="relationship-stage">
            <div class="graph-toolbar"><div class="graph-crumbs">${graphCrumbs}</div><div class="graph-scope"><span>关系范围</span><div class="scope-tabs">${[["all", "全部"], ["shared", "共享事实"], ["work", "本作品"]].map(([id, label]) => `<button class="${state.relationScope === id ? "active" : ""}" data-relation-scope="${id}">${label}</button>`).join("")}</div><div class="scope-tabs">${[["list", "列表"], ["graph", "图谱"]].map(([id, label]) => `<button class="${state.characterView === id ? "active" : ""}" data-character-view="${id}">${label}</button>`).join("")}</div></div><div class="graph-actions">${aiButton("rel-suggest")}${aiButton("world-audit")}<button class="button" data-relationship-from="${selectedWorld.id}">添加关系</button><div class="graph-stage-ctl"><button class="button" data-graph-replay title="重播开场动画">重播</button><button class="button ${state.graphPaused ? "active" : ""}" data-graph-pause title="暂停或恢复连线脉冲">${state.graphPaused ? "已暂停" : "暂停"}</button></div></div></div>
            ${state.characterView === "list" ? relationListMarkup : graphStage}<div id="graph-tip"></div>
          </div>
          <aside class="character-detail"><div class="ai-strip">${aiButton("fill-entry", `${selectedWorld.type}:${selectedWorld.id}`)}</div>${rightMarkup}${insightRelations}</aside>
        </div>
      </section>`;
    }
