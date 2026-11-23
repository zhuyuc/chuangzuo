/* 龙吟写作 · 章节引用自动识别 */
import { REF_GROUP_DEFS, REF_TAB_GROUP } from "../core/state.js";
import { chapterText, state } from "../core/store.js";
import { buildRefIndex, entityRefGroup, normalizeChapterRefs } from "./entities.js";
import { refreshWritingReference } from "./writing/references.js";

export function scanChapterReferences(chapter, options = {}) {
  if (!chapter) return 0;
  const text = chapterText[chapter.id] || "";
  const index = buildRefIndex();
  const detected = { character: new Set(), place: new Set(), item: new Set(), world: new Set() };
  if (index.pattern) {
    index.pattern.lastIndex = 0;
    let match;
    while ((match = index.pattern.exec(text))) {
      const entities = index.byName.get(match[0]);
      if (!entities || entities.length !== 1) continue;
      const entity = entities[0];
      detected[entityRefGroup(entity.type)].add(entity.id);
    }
  }
  let added = 0;
  const changedGroups = new Set();
  Object.entries(REF_GROUP_DEFS).forEach(([group, def]) => {
    normalizeChapterRefs(chapter);
    const current = chapter[def.detected];
    const suppressed = new Set(chapter[def.suppressed]);
    const next = [...detected[group]].filter(id => !suppressed.has(id));
    if (current.slice().sort().join("|") !== next.slice().sort().join("|")) {
      added += next.filter(id => !current.includes(id)).length;
      chapter[def.detected] = next;
      changedGroups.add(group);
    }
  });
  const focusInPanel = document.activeElement && document.activeElement.closest && document.activeElement.closest(".writing-reference");
  if (changedGroups.size && options.refresh !== false && !focusInPanel && state.page === "writing" && REF_TAB_GROUP[state.rightTab] && state.referenceScope === "chapter" && changedGroups.has(REF_TAB_GROUP[state.rightTab])) refreshWritingReference();
  return added;
}

export function autoAssociateChapter(chapter) { return scanChapterReferences(chapter, { refresh: true }); }