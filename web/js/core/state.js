import { state } from "./store.js";





/* 龙吟写作 · 核心状态与常量 */

    export const APP_CONTRACTS = window.LongyinContracts || {
      apiVersion: 1,
      apiPrefix: "/api/v1",
      limits: { accountNameMin: 2, accountNameMax: 32, passwordMin: 6, penNameMax: 24 },
      messages: { invalidAccount: "请输入有效的账户（邮箱，或 2-32 位不含空格的用户名）。", invalidPassword: "密码至少需要 6 个字符。", penNameTooLong: "作者笔名不能超过 24 个字符。", penNameNewline: "作者笔名不能包含换行。" }
    };

    export const WORLD_ENTITY_DEFS = {
      faction: { label: "势力", mark: "势", hint: "组织、国家、教团、行会、家族" },
      species: { label: "种族", mark: "族", hint: "智慧种族、异变生物、神话族裔" },
      event: { label: "事件", mark: "事", hint: "战争、灾变、加冕、叛逃等历史节点" },
      rule: { label: "规则", mark: "则", hint: "力量、科技、宗教、经济等底层法则" }
    };

    export const REF_GROUP_DEFS = {
      character: { label: "人物", tab: "人物", mark: "人", manual: "characterIds", detected: "detectedCharacterIds", suppressed: "suppressedCharacterIds" },
      place: { label: "地点", tab: "地点", mark: "址", manual: "placeIds", detected: "detectedPlaceIds", suppressed: "suppressedPlaceIds" },
      item: { label: "装备", tab: "装备", mark: "刃", manual: "itemIds", detected: "detectedItemIds", suppressed: "suppressedItemIds" },
      world: { label: "设定", tab: "设定", mark: "设", manual: "worldEntryIds", detected: "detectedWorldIds", suppressed: "suppressedWorldIds" }
    };

    export const REF_TAB_GROUP = { "人物": "character", "地点": "place", "装备": "item", "设定": "world" };

    export const REFERENCE_TABS = ["大纲", "人物", "地点", "装备", "设定", "素材"];

    export const REFERENCE_TAB_HINTS = { "大纲": "全书主线与本卷目标", "人物": "人物档案，可加入本章引用", "地点": "地点档案，可加入本章引用", "装备": "武器装备档案，可加入本章引用", "设定": "世界设定条目：规则、势力、事件等", "素材": "素材列表，点击加入或移出本章引用" };

    export const NAV_ICONS = {
      dashboard: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><rect x="2.4" y="2.4" width="4.8" height="4.8" rx="1.2"/><rect x="8.8" y="2.4" width="4.8" height="4.8" rx="1.2"/><rect x="2.4" y="8.8" width="4.8" height="4.8" rx="1.2"/><rect x="8.8" y="8.8" width="4.8" height="4.8" rx="1.2"/></svg>',
      writing: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 13l.8-2.9 7.4-7.4a1.5 1.5 0 0 1 2.1 2.1L5.9 12.2 3 13z"/><path d="M9.9 4l2.1 2.1"/></svg>',
      outline: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M3 3.4h10"/><path d="M6 8h7M6 12.6h7"/><circle cx="3.4" cy="8" r="1"/><circle cx="3.4" cy="12.6" r="1"/></svg>',
      materials: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M2.4 4.6a1.2 1.2 0 0 1 1.2-1.2h2.9l1.5 1.9h4.4a1.2 1.2 0 0 1 1.2 1.2v5.9a1.2 1.2 0 0 1-1.2 1.2H3.6a1.2 1.2 0 0 1-1.2-1.2z"/></svg>',
      inspiration: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.4a4.1 4.1 0 0 1 2.5 7.3c-.5.4-.8 1-.8 1.5v.3H6.3v-.3c0-.5-.3-1.1-.8-1.5A4.1 4.1 0 0 1 8 2.4z"/><path d="M6.7 13.6h2.6"/></svg>',
      characters: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="5.6"/><path d="M2.4 8h11.2"/><path d="M8 2.4c1.8 1.6 2.7 3.5 2.7 5.6S9.8 12 8 13.6C6.2 12 5.3 10.1 5.3 8S6.2 4 8 2.4z"/></svg>',
      maps: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M2.4 4.3l3.8-1.5 3.6 1.5 3.8-1.5v8.9l-3.8 1.5-3.6-1.5-3.8 1.5z"/><path d="M6.2 2.8v9M9.8 4.3v9"/></svg>',
      weapons: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 2.8L7 9"/><path d="M5.5 7.5l3 3"/><path d="M7 9l-2.1 2.1"/><circle cx="4.2" cy="11.8" r="1"/></svg>'
    };

    export const WORK_FORMS = ["长篇", "中篇", "短篇", "剧本"];

    export const WORK_GENRES = ["玄幻", "奇幻", "武侠", "仙侠", "都市", "现实", "军事", "历史", "游戏", "体育", "科幻", "悬疑", "言情", "轻小说", "其他"];

    export function workTypeLabel(work) { return `${work?.form || "长篇"} · ${work?.genre || "其他"}`; }

    export function authorPenName() { return String(state.profile?.penName || "").trim(); }

    const WORK_COVER_PALETTES = {
      jade: ["#294537", "#0e1913", "#c4d7c7", "#bfa061"],
      pine: ["#233a31", "#0b1510", "#b5cabb", "#a8894f"],
      ember: ["#473128", "#160f0c", "#e3c8a8", "#bf8e55"],
      indigo: ["#253942", "#0c1519", "#bdd1d8", "#85a9ae"],
      rose: ["#402e35", "#160f12", "#dfc6cc", "#c19a84"],
      olive: ["#3b3928", "#15140e", "#d6cda9", "#b49a54"]
    };

    export function workCoverVars(work) {
      const genre = String(work?.genre || "");
      const tones = /武侠|历史|军事/.test(genre) ? ["ember", "olive"] : /科幻|悬疑|游戏/.test(genre) ? ["indigo", "jade"] : /言情|都市|现实/.test(genre) ? ["rose", "ember"] : work?.form === "剧本" ? ["olive", "jade"] : /仙侠/.test(genre) ? ["pine", "jade"] : ["jade", "pine"];
      let hash = 0;
      for (const char of String(work?.id || work?.name || "longyin")) hash = (hash * 31 + char.charCodeAt(0)) % 997;
      const palette = WORK_COVER_PALETTES[tones[hash % tones.length]];
      return `--book-a:${palette[0]};--book-b:${palette[1]};--book-ink:${palette[2]};--book-accent:${palette[3]};--book-tilt:${(hash % 5 - 2) * .45}deg`;
    }

    export function normalizeWorkType(work) {
      if (!work || work.form) return;
      const legacy = { "东方幻想": "奇幻", "现代言情": "言情" };
      const raw = String(work.genre || "");
      if (raw.includes(" · ")) {
        const [formPart, genrePart] = raw.split(" · ");
        work.form = WORK_FORMS.includes(formPart) ? formPart : "长篇";
        work.genre = legacy[genrePart] || (WORK_GENRES.includes(genrePart) ? genrePart : "其他");
      } else if (raw === "短篇小说") { work.form = "短篇"; work.genre = "其他"; }
      else if (raw === "剧本") { work.form = "剧本"; work.genre = "其他"; }
      else { work.form = "长篇"; work.genre = WORK_GENRES.includes(raw) ? raw : "其他"; }
    }

    export const navGroups = [
      { label: "作品", items: [
        { id: "dashboard", label: "工作台" }
      ] },
      { label: "创作", items: [
        { id: "writing", label: "写作" },
        { id: "outline", label: "大纲" }
      ] },
      { label: "资料", items: [
        { id: "materials", label: "素材库" },
        { id: "inspiration", label: "灵感" }
      ] },
      { label: "世界设定", items: [
        { id: "characters", label: "世界观" },
        { id: "maps", label: "地图" },
        { id: "weapons", label: "装备" }
      ] }
    ];

    export const navItems = navGroups.flatMap(group => group.items);

    export const standalonePageLabels = { dashboard: "工作台", library: "共享设定库", storage: "服务器与备份", history: "历史版本" };



    const UI_PREF_KEY = "longyin.ui";

    const UI_PREF_KEYS = ["rightTab", "outlineView", "referenceScope", "mapTool", "mapLabels", "inspirationCategory", "workSort"];

    let uiPrefCache = "";

    export function loadUiPrefs() {
      try {
        const prefs = JSON.parse(localStorage.getItem(UI_PREF_KEY) || "{}");
        if (REFERENCE_TABS.includes(prefs.rightTab)) state.rightTab = prefs.rightTab;
        if (["overview", "volumes"].includes(prefs.outlineView)) state.outlineView = prefs.outlineView;
        if (["chapter", "all"].includes(prefs.referenceScope)) state.referenceScope = prefs.referenceScope;
        if (["select", "brush"].includes(prefs.mapTool)) state.mapTool = prefs.mapTool;
        if (typeof prefs.mapLabels === "boolean") state.mapLabels = prefs.mapLabels;
        if (typeof prefs.inspirationCategory === "string") state.inspirationCategory = prefs.inspirationCategory;
        if (["recent", "name", "progress"].includes(prefs.workSort)) state.workSort = prefs.workSort;
      } catch (error) { /* 偏好损坏时忽略，使用默认值 */ }
    }

    export function saveUiPrefs() {
      const prefs = {};
      UI_PREF_KEYS.forEach(key => { prefs[key] = state[key]; });
      const json = JSON.stringify(prefs);
      if (json !== uiPrefCache) { uiPrefCache = json; localStorage.setItem(UI_PREF_KEY, json); }
    }
