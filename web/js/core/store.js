

/* 龙吟写作 · 显式状态仓库（ESM 单例） */
export const state = { page: "writing", chapter: null, material: null, materialType: "全部", materialTag: null, materialQuery: "", materialPresetType: "资料笔记", character: null, worldEntity: null, worldType: "all", worldView: "overview", relationship: null, relationScope: "all", characterView: "list", weapon: null, itemCategory: "全部", mapPoint: null, mapLayer: "剧情地点", mapId: null, placingPlaceId: null, renameMapId: null, placementMapId: null, mapTool: "select", mapTerrain: "grass", mapBrush: 1, mapLabels: true, mapPlaceMode: false, placementCoords: null, inspirationCategory: "all", inspirationEditId: null, outlineView: "overview", outlineVolume: "v1", rightTab: "大纲", referenceScope: "chapter", referenceEntity: null, referenceQuery: "", referenceChapter: null, removeRefKey: null, mentionOpen: false, ai: { enabled: true, configured: true, provider: "OpenAI 兼容", model: "longyin-mock-1", baseUrl: "", includeText: true }, aiSel: null, aiAction: null, aiResult: null, mentionQuery: "", mentionStart: 0, mentionIndex: 0, focus: false, searchOpen: false, libraryType: "全部", libraryItem: null, currentWork: null, dialog: null, historyVersion: null, entityType: null, entityId: null, entityRecord: null, relationshipSource: null, secretId: null, itemImageTarget: null, commandOpen: false, commandQuery: "", accountMenuOpen: false, lastBackup: "本次会话尚未生成", workQuery: "", workSort: "recent", workEditId: null, mapQuery: null, dialogBeforeConfirm: null, collapsedVolumes: [], graphLayer: null, graphType: null, graphPaused: false, authView: location.hash === "#register" ? "register" : "login", signedIn: false };

export let works = [];
export let libraryItems = [];
export let chapters = [];
export let materials = [];
export let characters = [];
export let relationships = [];
export let weapons = [];
export let places = [];
export let chapterText = {};
export let historySnapshots = [];
export let outlineData = null;
export let worldEntries = [];
export let worldOverview = {};
export let inspirations = [];

export function setWorks(next) { works = Array.isArray(next) ? next : []; }
export function setLibraryItems(next) { libraryItems = Array.isArray(next) ? next : []; }
export function setWorkScope(scope) {
  chapters = scope.chapters;
  materials = scope.materials;
  characters = scope.characters;
  relationships = scope.relationships;
  weapons = scope.weapons;
  places = scope.places;
  chapterText = scope.chapterText;
  historySnapshots = scope.historySnapshots;
  outlineData = scope.outlineData;
  worldEntries = scope.worldEntries;
  worldOverview = scope.worldOverview;
  inspirations = scope.inspirations;
}
export function resetWorkScope() {
  setWorkScope({
    chapters: [], materials: [], characters: [], relationships: [], weapons: [], places: [],
    chapterText: {}, historySnapshots: [], outlineData: { worldRules: "", worldTerrain: "", volumes: [] },
    worldEntries: [], worldOverview: {}, inspirations: []
  });
}