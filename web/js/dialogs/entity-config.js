import { chapters, characters, libraryItems, materials, outlineData, places, relationships, state, weapons, worldEntries } from "../core/store.js";
import { escapeHtml } from "../core/utils.js";
import { itemOwner, storyEntities } from "../domain/entities.js";
import { MAP_TERRAINS } from "../domain/maps/terrain.js";





/* 龙吟写作 · 实体表单字段配置 */
    export function entityRecord(kind, id) {
      const source = { character: characters, relationship: relationships, material: materials, place: places, item: weapons, volume: outlineData.volumes, chapter: chapters, shared: libraryItems, faction: worldEntries.filter(item => item.entityType === "faction"), species: worldEntries.filter(item => item.entityType === "species"), event: worldEntries.filter(item => item.entityType === "event"), rule: worldEntries.filter(item => item.entityType === "rule") }[kind] || [];
      return id ? source.find(item => item.id === id) : null;
    }

    export function selectOptions(options, value) {
      return options.map(option => `<option value="${escapeHtml(option[0])}" ${String(option[0]) === String(value ?? "") ? "selected" : ""}>${escapeHtml(option[1])}</option>`).join("");
    }

    function uniqueFieldValues(list, get) { return [...new Set(list.map(get).filter(value => value && String(value).trim()))]; }

    function optionList(values, current) {
      const list = [...new Set(values.filter(Boolean))];
      if (current && !list.includes(current)) list.unshift(current);
      return list.map(value => [value, value]);
    }

    const factionNameList = () => worldEntries.filter(item => item.entityType === "faction").map(item => item.name);

    const placeNameList = () => places.map(item => item.name).filter(Boolean);

    const characterNameList = () => characters.map(item => item.name).filter(Boolean);

    const chapterTitleList = () => chapters.map(item => item.title).filter(Boolean);

    export function entityConfig(kind, record) {
      const isEdit = Boolean(record);
      if (kind === "faction") return { title: isEdit ? "编辑势力" : "新增势力", description: "势力要说明它想要什么、依靠什么、又怕失去什么。", fields: [
        { name: "name", label: "势力名称", value: record?.name, required: true },
        { name: "alias", label: "别名 / 常用称谓", value: record?.alias },
        { name: "summary", label: "一句话摘要", value: record?.summary },
        { name: "type", label: "势力类型", type: "datalist", value: record?.fields?.kind, placeholder: "国教、行会、部族", options: optionList(uniqueFieldValues(worldEntries.filter(item => item.entityType === "faction"), item => item.fields?.kind), record?.fields?.kind) },
        { name: "leader", label: "领袖", type: "select", value: record?.fields?.leader || "", options: [["", "无"], ...optionList(characterNameList(), record?.fields?.leader)] },
        { name: "goal", label: "目标", value: record?.fields?.goal },
        { name: "resource", label: "资源", value: record?.fields?.resource },
        { name: "weakness", label: "软肋", value: record?.fields?.weakness },
        { name: "body", label: "背景与备注", type: "textarea", value: record?.body }
      ] };
      if (kind === "species") return { title: isEdit ? "编辑种族" : "新增种族", description: "记录种族如何生存、社会如何组织，以及不可触碰的禁忌。", fields: [
        { name: "name", label: "种族名称", value: record?.name, required: true },
        { name: "alias", label: "别名 / 常用称谓", value: record?.alias },
        { name: "summary", label: "一句话摘要", value: record?.summary },
        { name: "habitat", label: "栖息地", type: "datalist", value: record?.fields?.habitat, options: optionList([...placeNameList(), ...uniqueFieldValues(worldEntries.filter(item => item.entityType === "species"), item => item.fields?.habitat)], record?.fields?.habitat) },
        { name: "lifespan", label: "寿命", value: record?.fields?.lifespan },
        { name: "society", label: "社会结构", value: record?.fields?.society },
        { name: "gift", label: "天赋", value: record?.fields?.gift },
        { name: "taboo", label: "禁忌", value: record?.fields?.taboo },
        { name: "body", label: "背景与备注", type: "textarea", value: record?.body }
      ] };
      if (kind === "event") return { title: isEdit ? "编辑事件" : "新增事件", description: "事件记录世界发生过的变化，以及它造成的后果。", fields: [
        { name: "name", label: "事件名称", value: record?.name, required: true },
        { name: "alias", label: "别名 / 常用称谓", value: record?.alias },
        { name: "summary", label: "一句话摘要", value: record?.summary },
        { name: "era", label: "纪元", type: "datalist", value: record?.fields?.era, options: optionList(uniqueFieldValues(worldEntries.filter(item => item.entityType === "event"), item => item.fields?.era), record?.fields?.era) },
        { name: "year", label: "年份", value: record?.fields?.year },
        { name: "importance", label: "重要度 1–5", type: "select", value: record?.fields?.importance || "3", options: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]] },
        { name: "cause", label: "起因", type: "textarea", value: record?.fields?.cause },
        { name: "impact", label: "影响", type: "textarea", value: record?.fields?.impact },
        { name: "body", label: "背景与备注", type: "textarea", value: record?.body }
      ] };
      if (kind === "rule") return { title: isEdit ? "编辑规则" : "新增规则", description: "规则必须同时写明代价或限制，避免无成本的万能设定。", fields: [
        { name: "name", label: "规则名称", value: record?.name, required: true },
        { name: "alias", label: "别名 / 常用称谓", value: record?.alias },
        { name: "summary", label: "一句话摘要", value: record?.summary },
        { name: "domain", label: "领域", type: "datalist", value: record?.fields?.domain, placeholder: "武学、宗教、经济", options: optionList(uniqueFieldValues(worldEntries.filter(item => item.entityType === "rule"), item => item.fields?.domain), record?.fields?.domain) },
        { name: "law", label: "规则", type: "textarea", value: record?.fields?.law },
        { name: "cost", label: "代价与限制", type: "textarea", value: record?.fields?.cost },
        { name: "exception", label: "例外", value: record?.fields?.exception },
        { name: "status", label: "状态", type: "select", value: record?.fields?.status || "稳定", options: [["稳定", "稳定"], ["存疑", "存疑"], ["冲突", "冲突"]] },
        { name: "body", label: "补充说明", type: "textarea", value: record?.body }
      ] };
      if (kind === "shared") return { title: isEdit ? "编辑共享设定" : "新建共享设定", description: "共享设定可在账户下的多部作品中引用。", fields: [
        { name: "kind", label: "设定类型", type: "select", value: record?.kind || "人物", options: [["人物", "人物"], ["地点", "地点"], ["武器", "武器"], ["素材", "素材"]] },
        { name: "name", label: "名称", value: record?.name, required: true },
        { name: "summary", label: "简述", value: record?.summary },
        { name: "base", label: "共享内容", type: "textarea", value: record?.base },
        { name: "extension", label: "作品内使用方法", type: "textarea", value: record?.extension }
      ] };
      if (kind === "character") return { title: isEdit ? "编辑人物" : "新增人物", description: "人物身份属于当前作品，后续可申请加入共享设定库。", fields: [
        { name: "name", label: "人物名称", value: record?.name, required: true },
        { name: "alias", label: "别名 / 外号", value: record?.alias },
        { name: "role", label: "身份与定位", value: record?.role, placeholder: "例如：主角 · 巡城卫" },
        { name: "faction", label: "所属势力", type: "select", value: record?.faction || "", options: [["", "无"], ...optionList(factionNameList(), record?.faction)] },
        { name: "location", label: "当前位置", type: "select", value: record?.location || "未指定", options: [["未指定", "未指定"], ...optionList(placeNameList(), record?.location && record.location !== "未指定" ? record.location : null)] },
        { name: "goal", label: "人物动机", value: record?.goal, placeholder: "他真正想要什么，为什么不能放弃" },
        { name: "weakness", label: "弱点 / 软肋", value: record?.weakness },
        { name: "ability", label: "能力", value: record?.ability },
        { name: "abilityCost", label: "能力代价与限制", value: record?.abilityCost },
        { name: "background", label: "背景与备注", type: "textarea", value: record?.background }
      ] };
      if (kind === "relationship") {
        const related = storyEntities();
        if (related.length < 2) return { title: "添加关系", description: "关系必须绑定两个创作实体，请先建立至少两条世界观设定。", fields: [], blocked: true };
        const fromDefault = record?.from || state.relationshipSource || state.character || related[0].id;
        return { title: isEdit ? "编辑关系" : "添加关系", description: "关系可连接人物、地点、装备、势力、种族、事件与规则，并限定到具体作品和剧情阶段。", fields: [
          { name: "from", label: "起点实体", type: "select", value: fromDefault, options: related.map(item => [item.id, `${item.label} · ${item.name}`]), required: true },
          { name: "to", label: "目标实体", type: "select", value: record?.to || (related.find(item => item.id !== fromDefault) || related[0]).id, options: related.map(item => [item.id, `${item.label} · ${item.name}`]), required: true },
          { name: "type", label: "关系类型", type: "datalist", value: record?.type, placeholder: "师徒、盟友、敌对", required: true, options: optionList(uniqueFieldValues(relationships, item => item.type), record?.type) },
          { name: "state", label: "当前状态", type: "datalist", value: record?.state, placeholder: "合作中、关系破裂", options: optionList(uniqueFieldValues(relationships, item => item.state), record?.state) },
          { name: "scope", label: "数据归属", type: "select", value: record?.scope || "work", options: [["work", "仅当前作品"], ["shared", "共享长期事实"]] },
          { name: "stage", label: "生效阶段", type: "datalist", value: record?.stage || "当前剧情", placeholder: "第二卷 / 长期事实", options: optionList([...outlineData.volumes.map(volume => `${volume.title} ${volume.subtitle || ""}`.trim()), "当前剧情", "长期事实", ...uniqueFieldValues(relationships, item => item.stage)], record?.stage) },
          { name: "source", label: "依据（章节 / 素材）", type: "datalist", value: record?.source, placeholder: "第三章 无名的信", options: optionList([...chapterTitleList(), ...materials.map(item => item.title)], record?.source) },
          { name: "note", label: "关系说明", type: "textarea", value: record?.note }
        ] };
      }
      if (kind === "material") return { title: isEdit ? "编辑素材" : "新增素材", description: "素材属于当前作品，可关联章节并反查引用。", fields: [
        { name: "title", label: "素材标题", value: record?.title, required: true },
        { name: "source", label: "来源", type: "datalist", value: record?.source, placeholder: "文件、书名或手动整理", options: optionList(uniqueFieldValues(materials, item => item.source), record?.source) },
        { name: "sourceUrl", label: "来源链接", value: record?.sourceUrl, placeholder: "https://..." },
        { name: "tags", label: "标签", value: record ? record.tags.join("、") : "", placeholder: "使用顿号或逗号分隔" },
        { name: "note", label: "素材笔记", type: "textarea", value: record?.note }
      ] };
      if (kind === "place") return { title: isEdit ? "编辑地点" : "添加地点", description: "地点会出现在当前作品的地图上，并可关联章节与人物。", fields: [
        { name: "name", label: "地点名称", value: record?.name, required: true },
        { name: "alias", label: "别名 / 常用称谓", value: record?.alias, placeholder: "例如：旧城、山南城" },
        { name: "type", label: "地点类型", type: "datalist", value: record?.type || "地点", placeholder: "城池、山门、渡口", options: optionList(uniqueFieldValues(places, item => item.type), record?.type) },
        { name: "parentId", label: "所属区域（上级地点）", type: "select", value: record?.parentId || "", options: [["", "无"], ...places.filter(item => item.id !== record?.id).map(item => [item.id, item.name])] },
        { name: "terrain", label: "地貌", type: "datalist", value: record?.terrain, placeholder: "山脉、沼泽、浮岛", options: optionList([...MAP_TERRAINS.map(item => item.label), ...uniqueFieldValues(places, item => item.terrain)], record?.terrain) },
        { name: "climate", label: "气候", type: "datalist", value: record?.climate, options: optionList(uniqueFieldValues(places, item => item.climate), record?.climate) },
        { name: "powers", label: "控制势力", type: "datalist", value: record?.powers, options: optionList(factionNameList(), record?.powers) },
        { name: "danger", label: "危险", value: record?.danger },
        { name: "x", label: "地图横坐标", type: "number", value: record?.x ?? state.placementCoords?.x ?? 360 },
        { name: "y", label: "地图纵坐标", type: "number", value: record?.y ?? state.placementCoords?.y ?? 250 },
        { name: "desc", label: "地点说明", type: "textarea", value: record?.desc }
      ] };
      if (kind === "item") return { title: isEdit ? "编辑装备" : "新增武器/防具", description: "只区分武器与防具，具体形制作为装备属性记录。", fields: [
        { name: "name", label: "物品名称", value: record?.name, required: true },
        { name: "alias", label: "别名 / 常用称谓", value: record?.alias, placeholder: "例如：断水刀、照夜弩" },
        { name: "category", label: "装备分类", type: "select", value: record?.category === "防具" ? "防具" : "武器", options: [["武器", "武器"], ["防具", "防具"]] },
        { name: "kind", label: "具体类型", type: "datalist", value: record?.kind, placeholder: "横刀、手弩、符印", options: optionList(uniqueFieldValues(weapons, item => item.kind), record?.kind) },
        { name: "owner", label: "当前持有者", type: "select", value: record ? (itemOwner(record)?.id || "") : "", options: [["", "未指定"], ...characters.map(item => [item.id, item.name])] },
        { name: "state", label: "当前状态", type: "datalist", value: record?.state || "完好", options: optionList(["完好", "损毁", "遗失", "认主", "改造中", ...uniqueFieldValues(weapons, item => item.state)], record?.state) },
        { name: "chapter", label: "首次出场", type: "select", value: record?.chapter || "未出场", options: [["未出场", "未出场"], ...optionList(chapterTitleList(), record?.chapter && record.chapter !== "未出场" ? record.chapter : null)] },
        { name: "ability", label: "能力", value: record?.ability },
        { name: "duration", label: "持续时间", value: record?.duration },
        { name: "drawback", label: "代价与限制", value: record?.drawback },
        { name: "desc", label: "物品描述", type: "textarea", value: record?.desc }
      ] };
      if (kind === "volume") return { title: isEdit ? "编辑分卷" : "新增分卷", description: "分卷用于组织章节和阶段目标。", fields: [
        { name: "title", label: "卷名", value: record?.title || `第${outlineData.volumes.length + 1}卷`, required: true },
        { name: "subtitle", label: "副标题", value: record?.subtitle, placeholder: "例如：风起" },
        { name: "goal", label: "本卷目标", type: "textarea", value: record?.goal },
        { name: "target", label: "目标字数", type: "number", value: record?.target || 100000 }
      ] };
      if (kind === "chapter") return { title: isEdit ? "编辑章节" : "新增章节", description: "新章节会加入当前分卷，并打开到正文编辑器。", fields: [
        { name: "title", label: "章节标题", value: record?.title || `第${chapters.length + 1}章 未命名章节`, required: true },
        { name: "volumeId", label: "所属分卷", type: "select", value: record?.volumeId || state.outlineVolume, options: outlineData.volumes.map(item => [item.id, `${item.title} ${item.subtitle}`]) },
                { name: "targetWords", label: "目标字数", type: "number", value: record?.targetWords || 4000 }
      ] };
      return null;
    }
