import { places, state } from "../../core/store.js";
import { activeData } from "../active-work.js";
import { generateWorldMap } from "./terrain.js";





/* 龙吟写作 · 地图模型与视图状态 */
    export function captureMapPointer(canvas, event) { try { canvas.setPointerCapture(event.pointerId); } catch { /* 合成指针事件无活动 pointer，忽略 */ } }

    export function currentPlace() { return places.find(item => item.id === state.mapPoint || item.name === state.mapPoint) || places[0] || null; }

    export function activeMap() {
      const data = activeData();
      if (!data || !Array.isArray(data.maps) || !data.maps.length) return null;
      return data.maps.find(item => item.id === state.mapId) || data.maps[0];
    }

    export function mapView() {
      const map = activeMap();
      if (!map) return { zoom: 1, panX: 0, panY: 0 };
      if (!map.view) map.view = { zoom: 1, panX: 0, panY: 0 };
      return map.view;
    }

    export function mapPlaces() {
      const map = activeMap();
      return map ? places.filter(item => item.mapId === map.id) : [];
    }

    export function unplacedPlaces() {
      const ids = new Set((activeData()?.maps || []).map(item => item.id));
      return places.filter(item => !item.mapId || !ids.has(item.mapId));
    }

    export function normalizeWorkMaps(work) {
      const data = work.data;
      if (!data) return;
      if (!Array.isArray(data.maps) || !data.maps.length) {
        data.maps = [{ id: `map-${work.id}`, name: "世界地图", kind: "世界", worldMap: data.worldMap || null, image: data.mapImage || null, view: { zoom: 1, panX: 0, panY: 0 } }];
      }
      delete data.worldMap;
      delete data.mapImage;
      data.maps.forEach(map => { if (!map.view) map.view = { zoom: 1, panX: 0, panY: 0 }; });
      const ids = new Set(data.maps.map(item => item.id));
      (data.places || []).forEach(place => { if (!place.mapId || !ids.has(place.mapId)) place.mapId = data.maps[0].id; });
    }

    export function ensureMapTerrain() {
      const map = activeMap();
      if (!map) return null;
      if (!map.worldMap || !Array.isArray(map.worldMap.grid)) map.worldMap = generateWorldMap();
      return map.worldMap;
    }