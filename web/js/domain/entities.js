import { REF_GROUP_DEFS, REF_TAB_GROUP, WORLD_ENTITY_DEFS } from "../core/state.js";
import { chapterText, chapters, characters, materials, places, relationships, state, weapons, worldEntries } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";





/* 龙吟写作 · 作品实体与引用 */
    export function currentChapter() { return chapters.find(item => item.id === state.chapter) || chapters[0] || null; }

    export function currentMaterial() { return materials.find(item => item.id === state.material) || materials[0] || null; }

    export function currentCharacter() { return characters.find(item => item.id === state.character) || characters[0] || null; }

    export function currentWeapon() { return weapons.find(item => item.id === state.weapon) || weapons[0] || null; }

    export function itemOwner(item) { return characters.find(person => person.id === item.ownerId) || characters.find(person => person.name === item.owner) || null; }

    export function itemOwnerName(item) { const owner = itemOwner(item); return owner ? owner.name : (item.owner || "未指定"); }

    export function storyEntities() {
      return [
        ...characters.map(item => ({ id: item.id, name: item.name, type: "character", label: "人物", subtitle: item.role, summary: item.goal || item.background || "", page: "characters", record: item })),
        ...places.map(item => ({ id: item.id, name: item.name, type: "place", label: "地点", subtitle: item.type, summary: item.desc, page: "maps", record: item })),
        ...weapons.map(item => ({ id: item.id, name: item.name, type: "item", label: "装备", subtitle: `${item.category} · ${item.kind}`, summary: item.desc, page: "weapons", record: item })),
        ...worldEntries.map(item => ({ id: item.id, name: item.name, type: item.entityType, label: WORLD_ENTITY_DEFS[item.entityType]?.label || "设定", subtitle: item.fields?.kind || item.fields?.domain || item.fields?.era || item.fields?.habitat || "", summary: item.summary, page: "characters", record: item }))
      ];
    }

    export function storyEntityById(id) { return storyEntities().find(item => item.id === id) || null; }

    export function entityRefGroup(type) { return type === "character" || type === "place" || type === "item" ? type : "world"; }

    export function splitEntityAliases(record) {
      return String(record?.alias || "").split(/[、,，/\s]+/).map(name => name.trim()).filter(name => Array.from(name).length >= 2);
    }

    export function normalizeChapterRefs(chapter) {
      if (!chapter) return;
      Object.values(REF_GROUP_DEFS).forEach(def => {
        if (!Array.isArray(chapter[def.manual])) chapter[def.manual] = [];
        if (!Array.isArray(chapter[def.detected])) chapter[def.detected] = [];
        if (!Array.isArray(chapter[def.suppressed])) chapter[def.suppressed] = [];
      });
    }

    export function chapterRefIds(chapter, group) {
      const def = REF_GROUP_DEFS[group];
      if (!chapter || !def) return [];
      normalizeChapterRefs(chapter);
      const suppressed = new Set(chapter[def.suppressed]);
      return [...new Set([...chapter[def.manual], ...chapter[def.detected].filter(id => !suppressed.has(id))])];
    }

    export function isChapterRef(chapter, group, id) {
      return chapterRefIds(chapter, group).includes(id);
    }

    export function addChapterRef(chapter, group, id) {
      const def = REF_GROUP_DEFS[group];
      if (!chapter || !def || !id) return;
      normalizeChapterRefs(chapter);
      chapter[def.suppressed] = chapter[def.suppressed].filter(item => item !== id);
      if (!chapter[def.manual].includes(id)) chapter[def.manual].push(id);
    }

    export function removeChapterRef(chapter, group, id) {
      const def = REF_GROUP_DEFS[group];
      if (!chapter || !def || !id) return;
      normalizeChapterRefs(chapter);
      chapter[def.manual] = chapter[def.manual].filter(item => item !== id);
      chapter[def.detected] = chapter[def.detected].filter(item => item !== id);
      if (!chapter[def.suppressed].includes(id)) chapter[def.suppressed].push(id);
    }

    let refIndexCache = null;

    export function invalidateRefIndex() { refIndexCache = null; }

    function escapeRegExpText(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

    export function buildRefIndex() {
      if (refIndexCache) return refIndexCache;
      const byName = new Map();
      storyEntities().forEach(entity => {
        const names = [entity.name, ...splitEntityAliases(entity.record)];
        names.forEach(name => {
          const key = String(name || "").trim();
          if (Array.from(key).length < 2) return;
          const list = byName.get(key) || [];
          if (!list.some(item => item.type === entity.type && item.id === entity.id)) list.push(entity);
          byName.set(key, list);
        });
      });
      const names = [...byName.keys()].sort((a, b) => b.length - a.length);
      const pattern = names.length ? new RegExp(names.map(escapeRegExpText).join("|"), "g") : null;
      refIndexCache = { byName, pattern };
      return refIndexCache;
    }

    export function entityRelationsMarkup(entityId) {
      const list = relationships.filter(relation => relation.from === entityId || relation.to === entityId);
      if (!list.length) return '<p class="muted">暂无实体关联</p>';
      return list.map(relation => {
        const from = storyEntityById(relation.from);
        const to = storyEntityById(relation.to);
        return `<button class="linked-card" data-relation-edit="${relation.id}"><strong>${escapeHtml(from?.name || "已删除实体")} → ${escapeHtml(to?.name || "已删除实体")}</strong><span>${escapeHtml(relation.type)} · ${escapeHtml(relation.state || "")} →</span></button>`;
      }).join("");
    }
