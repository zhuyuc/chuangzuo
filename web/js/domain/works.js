import { chapters, characters, materials, outlineData, places, relationships, resetWorkScope, setWorkScope, state, weapons, works } from "../core/store.js";
import { activeWork } from "./active-work.js";
export { activeWork, activeData } from "./active-work.js";
import { currentChapter, invalidateRefIndex, normalizeChapterRefs, storyEntityById } from "./entities.js";
import { mapPlaces } from "./maps/model.js";





/* 龙吟写作 · 作品与章节 */

    export function normalizeWorldOverview(work) {
      const overview = work.data.worldOverview || (work.data.worldOverview = { genre: work.genre || "", intro: "" });
      if (!overview.intro) {
        const legacy = [overview.logline, overview.conflict, overview.era, overview.scale, overview.power, overview.levels].filter(Boolean);
        if (legacy.length) overview.intro = legacy.join("\n");
      }
      delete overview.logline; delete overview.conflict; delete overview.era; delete overview.scale; delete overview.power; delete overview.levels;
      if (!overview.intro) overview.intro = "";
    }

    export function buildBlankWorkData(workId) {
      const chapterId = `${workId}-c1`;
      return {
        chapters: [{ id: chapterId, title: "第一章 未命名章节", volume: "第一卷", volumeId: "v1", state: "待写作", words: "0", summary: "", beats: [], characterIds: [], detectedCharacterIds: [], suppressedCharacterIds: [], placeIds: [], detectedPlaceIds: [], suppressedPlaceIds: [], itemIds: [], detectedItemIds: [], suppressedItemIds: [], worldEntryIds: [], detectedWorldIds: [], suppressedWorldIds: [], materialIds: [] }],
        materials: [], characters: [], relationships: [], items: [], places: [], worldEntries: [],
        worldOverview: { genre: "", era: "", conflict: "", scale: "", power: "", levels: "", logline: "" },
        inspirations: [], recentRefIds: [], history: [], openTabs: [chapterId], currentChapter: chapterId,
        outline: { worldRules: "", worldTerrain: "", volumes: [{ id: "v1", title: "第一卷", subtitle: "未命名卷", goal: "", target: 100000 }] },
        maps: [{ id: `map-${workId}`, name: "世界地图", kind: "世界", worldMap: null, image: null, view: { zoom: 1, panX: 0, panY: 0 } }],
        text: { [chapterId]: "" }
      };
    }


    export function loadWorkData(workId = state.currentWork) {
      const work = works.find(item => item.id === workId) || works[0];
      if (!work) {
        resetWorkScope();
        return;
      }
      const data = work.data;
      state.currentWork = work.id;
      data.worldEntries = data.worldEntries || [];
      data.worldOverview = data.worldOverview || { genre: "", intro: "" };
      data.inspirations = data.inspirations || [];
      data.inspirations.forEach(item => { delete item.tags; });
      data.recentRefIds = data.recentRefIds || [];
      setWorkScope({
        chapters: data.chapters,
        materials: data.materials,
        characters: data.characters,
        relationships: data.relationships,
        weapons: data.items,
        places: data.places,
        chapterText: data.text,
        historySnapshots: data.history,
        outlineData: data.outline,
        worldEntries: data.worldEntries,
        worldOverview: data.worldOverview,
        inspirations: data.inspirations
      });
      chapters.forEach(normalizeChapterRefs);
      invalidateRefIndex();
      if (!chapters.some(item => item.id === state.chapter)) state.chapter = data.currentChapter || (chapters[0] && chapters[0].id);
      const loadedChapter = chapters.find(item => item.id === state.chapter);
      state.outlineVolume = loadedChapter ? loadedChapter.volumeId : (outlineData.volumes[0] && outlineData.volumes[0].id);
      state.materialType = "全部";
      state.materialTag = null;
      state.materialQuery = "";
      state.itemCategory = "全部";
      state.characterView = "list";
      state.relationScope = "all";
      state.rightTab = "大纲";
      state.referenceScope = "chapter";
      state.referenceEntity = null;
      state.referenceQuery = "";
      state.referenceChapter = null;
      state.mentionOpen = false;
      if (!materials.some(item => item.id === state.material)) state.material = materials[0] ? materials[0].id : null;
      if (!characters.some(item => item.id === state.character)) state.character = characters[0] ? characters[0].id : null;
      if (!storyEntityById(state.worldEntity)) state.worldEntity = storyEntityById(state.character)?.id || storyEntityById(places[0]?.id)?.id || storyEntityById(weapons[0]?.id)?.id || null;
      state.worldType = "all";
      state.worldView = "overview";
      state.mapId = work.data.maps && work.data.maps.length ? work.data.maps[0].id : null;
      state.mapTool = "select";
      state.mapPlaceMode = false;
      state.placingPlaceId = null;
      state.inspirationCategory = "all";
      state.inspirationEditId = null;
      if (!weapons.some(item => item.id === state.weapon)) state.weapon = weapons[0] ? weapons[0].id : null;
      if (!mapPlaces().some(item => item.name === state.mapPoint)) state.mapPoint = mapPlaces()[0] ? mapPlaces()[0].name : null;
      if (!relationships.some(item => item.id === state.relationship)) state.relationship = relationships[0] ? relationships[0].id : null;
    }

    export function updateWorkSummary() {
      const work = activeWork();
      if (!work) return;
      const chapter = currentChapter();
      const total = chapters.reduce((sum, item) => sum + Number(String(item.words).replace(/[^\d]/g, "") || 0), 0);
      work.current = chapter ? `${chapter.volume} · ${chapter.title}` : "尚无章节";
      work.words = `${total.toLocaleString()} 字`;
      work.progress = Math.min(100, Math.round(total / 100000 * 100));
      work.time = "刚刚";
    }
