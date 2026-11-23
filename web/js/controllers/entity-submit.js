import { render } from "../app/render.js";
import { chapterText, chapters, characters, libraryItems, materials, outlineData, places, relationships, state, weapons, worldEntries } from "../core/store.js";
import { notify } from "../core/utils.js";
import { currentCharacter, invalidateRefIndex, storyEntityById } from "../domain/entities.js";
import { activeMap } from "../domain/maps/model.js";
import { activeData, updateWorkSummary } from "../domain/works.js";





/* 龙吟写作 · 设定与实体表单提交 */
export function entitySubmit(event) {
  if (event.target.id === "secret-form") {
    event.preventDefault();
    const person = currentCharacter();
    if (!person) return true;
    if (!event.target.elements.text.value.trim()) { event.target.querySelector("[data-error-for=text]").textContent = "请填写秘密内容。"; return true; }
    person.secrets = person.secrets || [];
    const existing = person.secrets.find(item => item.id === state.secretId);
    const secret = existing || { id: `secret-${Date.now()}` };
    const formData = new FormData(event.target);
    Object.assign(secret, {
      text: formData.get("text").trim(),
      threat: Number(formData.get("threat")) || 3,
      isPublic: formData.get("isPublic") === "on",
      knownByIds: formData.getAll("knownBy"),
      suspectedByIds: formData.getAll("suspectedBy")
    });
    if (!existing) person.secrets.push(secret);
    state.dialog = null;
    state.secretId = null;
    render();
    notify(existing ? "秘密已更新" : "秘密已添加");
    return true;
  }
  if (event.target.id === "entity-form") {
    event.preventDefault();
    const form = event.target;
    const kind = state.entityType;
    const record = state.entityRecord;
    const data = {}; new FormData(form).forEach((value, key) => data[key] = typeof value === "string" ? value.trim() : value);
    const setError = (name, text) => { const el = form.querySelector(`[data-error-for="${name}"]`); if (el) el.textContent = text; };
    if (kind === "character" && !data.name) { setError("name", "请输入人物名称。"); return true; }
    if (kind === "relationship" && data.from === data.to) { setError("to", "起点和终点不能是同一个条目。"); return true; }
    if ((kind === "material" || kind === "item" || kind === "place" || kind === "shared" || kind === "faction" || kind === "species" || kind === "event" || kind === "rule") && !(data.name || data.title)) { setError(data.name !== undefined ? "name" : "title", "请填写名称或标题。"); return true; }
    if (kind === "chapter" && !data.title) { setError("title", "请输入章节标题。"); return true; }
    if (kind === "volume" && !data.title) { setError("title", "请输入卷名。"); return true; }
    if (kind === "character") {
      const entity = record || { id: `char-${Date.now()}`, color: ["blue", "purple", "green", "orange", "pink"][characters.length % 5], secrets: [] };
      Object.assign(entity, { name: data.name, alias: data.alias || "", role: data.role || "人物", faction: data.faction || "", location: data.location || "未指定", goal: data.goal || "", weakness: data.weakness || "", ability: data.ability || "", abilityCost: data.abilityCost || "", background: data.background || "" });
      if (!record) characters.push(entity);
      state.character = entity.id;
      state.worldEntity = entity.id;
    }
    if (kind === "relationship") {
      const entity = record || { id: `rel-${Date.now()}`, source: "手动建立" };
      Object.assign(entity, { from: data.from, to: data.to, type: data.type || "未命名关系", state: data.state || "当前", scope: data.scope, stage: data.stage || "当前剧情", source: data.source || record?.source || "手动建立", note: data.note || "" });
      if (!record) relationships.push(entity);
      const fromEntity = storyEntityById(data.from);
      const toEntity = storyEntityById(data.to);
      if (fromEntity?.type === "character") state.character = data.from;
      else if (toEntity?.type === "character") state.character = data.to;
      state.worldEntity = data.from;
      state.relationship = entity.id;
    }
    if (kind === "material") {
      const entity = record || { id: `mat-${Date.now()}`, updated: "刚刚" };
      Object.assign(entity, { title: data.title, type: data.type || record?.type || state.materialPresetType || "资料笔记", source: data.source || "手动整理", sourceUrl: data.sourceUrl || "", tags: (data.tags || "").split(/[、,，\s]+/).filter(Boolean), note: data.note || "" });
      if (!record) materials.unshift(entity);
      state.material = entity.id;
      state.materialPresetType = "资料笔记";
    }
    if (kind === "place") {
      const entity = record || { id: `place-${Date.now()}` };
      Object.assign(entity, { name: data.name, alias: data.alias || "", type: data.type || "地点", parentId: data.parentId || "", terrain: data.terrain || "", climate: data.climate || "", powers: data.powers || "", danger: data.danger || "", x: Number(data.x) || 360, y: Number(data.y) || 250, desc: data.desc || "" });
      if (!entity.mapId) entity.mapId = state.placementMapId || activeMap()?.id || null;
      if (!record) places.push(entity);
      state.mapPoint = entity.name;
      state.worldEntity = entity.id;
      state.placementCoords = null;
      state.mapPlaceMode = false;
    }
    if (kind === "item") {
      const entity = record || { id: `item-${Date.now()}` };
      const owner = characters.find(item => item.id === data.owner);
      Object.assign(entity, { name: data.name, alias: data.alias || "", category: data.category, kind: data.kind || data.category, ownerId: owner ? owner.id : null, owner: owner ? owner.name : "未指定", state: data.state || "完好", chapter: data.chapter || "未出场", ability: data.ability || "", duration: data.duration || "", drawback: data.drawback || "", desc: data.desc || "" });
      if (!record) weapons.unshift(entity);
      state.weapon = entity.id;
      state.worldEntity = entity.id;
    }
    if (["faction", "species", "event", "rule"].includes(kind)) {
      const entity = record || { id: `${kind}-${Date.now()}`, entityType: kind };
      const fieldMap = kind === "faction"
        ? { kind: data.type, leader: data.leader, goal: data.goal, resource: data.resource, weakness: data.weakness }
        : kind === "species"
          ? { habitat: data.habitat, lifespan: data.lifespan, society: data.society, gift: data.gift, taboo: data.taboo }
          : kind === "event"
            ? { era: data.era, year: data.year, importance: data.importance, cause: data.cause, impact: data.impact }
            : { domain: data.domain, law: data.law, cost: data.cost, exception: data.exception, status: data.status };
      Object.assign(entity, { name: data.name, alias: data.alias || "", summary: data.summary || "", fields: fieldMap, body: data.body || "", updated: "刚刚" });
      if (!record) worldEntries.push(entity);
      state.worldEntity = entity.id;
      state.worldType = kind;
      state.page = "characters";
      state.worldView = "library";
    }
    if (kind === "volume") {
      const entity = record || { id: `v-${Date.now()}` };
      Object.assign(entity, { title: data.title, subtitle: data.subtitle || "", goal: data.goal || "", target: Number(data.target) || 100000 });
      if (!record) outlineData.volumes.push(entity);
      state.outlineVolume = entity.id;
    }
    if (kind === "chapter") {
      const entity = record || { id: `${state.currentWork}-chapter-${Date.now()}`, words: "0", beats: [], characterIds: [], placeIds: [], itemIds: [], worldEntryIds: [], materialIds: [], detectedCharacterIds: [], detectedPlaceIds: [], detectedItemIds: [], detectedWorldIds: [], suppressedCharacterIds: [], suppressedPlaceIds: [], suppressedItemIds: [], suppressedWorldIds: [] };
      Object.assign(entity, { title: data.title, volumeId: data.volumeId, state: data.state || record?.state || "待写作", targetWords: Number(data.targetWords) || 4000, summary: data.summary || "" });
      if (!record) {
        const volume = outlineData.volumes.find(item => item.id === data.volumeId) || outlineData.volumes[0];
        entity.volume = volume ? `${volume.title} ${volume.subtitle}`.trim() : "第一卷";
        chapters.push(entity);
        chapterText[entity.id] = "";
        activeData().openTabs.push(entity.id);
      }
      state.chapter = entity.id;
      state.outlineVolume = entity.volumeId;
    }
    if (kind === "shared") {
      const entity = record || { id: `shared-${Date.now()}`, scope: "shared", usage: "当前账户" };
      Object.assign(entity, { kind: data.kind, name: data.name, summary: data.summary || "", base: data.base || "", extension: data.extension || "" });
      if (!record) libraryItems.unshift(entity);
      state.libraryItem = entity.id;
    }
    state.dialog = null;
    state.entityType = null;
    state.entityId = null;
    state.entityRecord = null;
    state.relationshipSource = null;
    if (kind === "chapter") state.page = "writing";
    if (kind === "volume") state.outlineView = "volumes";
    invalidateRefIndex();
    updateWorkSummary();
    render();
    notify(record ? "修改已保存" : "已创建并保存");
    return true;
  }
  return false;
}