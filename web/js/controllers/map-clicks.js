import { render } from "../app/render.js";
import { navigate } from "../app/router.js";
import { markDirty } from "../core/persistence.js";
import { places, state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { askConfirm, openDialog } from "../dialogs/index.js";
import { activeMap, mapView } from "../domain/maps/model.js";
import { generateWorldMap } from "../domain/maps/terrain.js";
import { activeData } from "../domain/works.js";





/* 龙吟写作 · 地图与地点点击 */
export function mapClicks(event, target) {
  if (target.dataset.point) { const pointed = places.find(item => item.name === target.dataset.point || item.id === target.dataset.point); if (pointed && pointed.mapId) state.mapId = pointed.mapId; state.mapPoint = target.dataset.point; render(); return true; }
  if (target.dataset.layer) { state.mapLayer = target.dataset.layer; render(); return true; }
  if (target.hasAttribute("data-map-generate")) { const map = activeMap(); if (!map) return true; map.worldMap = generateWorldMap(); map.image = null; map.view = { zoom: 1, panX: 0, panY: 0 }; markDirty(); render(); notify("已生成新的世界地形"); return true; }
  if (target.hasAttribute("data-map-new")) { openDialog("new-map"); return true; }
  if (target.dataset.mapRename) { state.renameMapId = target.dataset.mapRename; openDialog("rename-map"); return true; }
  if (target.dataset.mapDelete) {
    const data = activeData();
    const targetMap = (data.maps || []).find(item => item.id === target.dataset.mapDelete);
    if (!targetMap) return true;
    if ((data.maps || []).length <= 1) { notify("至少保留一张地图"); return true; }
    const count = places.filter(item => item.mapId === targetMap.id).length;
    askConfirm(`删除地图「${targetMap.name}」？其上的 ${count} 个地点会转为未放置，不会删除。`, () => {
      places.forEach(item => { if (item.mapId === targetMap.id) item.mapId = null; });
      data.maps = data.maps.filter(item => item.id !== targetMap.id);
      if (state.mapId === targetMap.id) state.mapId = data.maps[0].id;
      state.mapPoint = null;
      markDirty();
      render();
      notify("地图已删除");
    }, true);
    return true;
  }
  if (target.dataset.placeSelect) { const selected = places.find(item => item.id === target.dataset.placeSelect); if (selected) { state.mapPoint = selected.name; render(); } return true; }
  if (target.dataset.placePlace) { state.placingPlaceId = target.dataset.placePlace; state.mapPlaceMode = true; state.mapTool = "select"; render(); notify("点击地图放置该地点"); return true; }
  const mapSelectRow = target.closest("[data-map-select]");
  if (mapSelectRow) { state.mapId = mapSelectRow.dataset.mapSelect; state.mapPoint = null; state.placingPlaceId = null; state.mapPlaceMode = false; render(); return true; }
  if (target.dataset.mapTool) { state.mapTool = target.dataset.mapTool; state.mapPlaceMode = false; state.placingPlaceId = null; render(); return true; }
  if (target.dataset.mapTerrain) { state.mapTerrain = target.dataset.mapTerrain; state.mapTool = "brush"; render(); return true; }
  if (target.dataset.mapBrush) { state.mapBrush = Number(target.dataset.mapBrush); render(); return true; }
  if (target.dataset.mapZoom) { const view = mapView(); if (target.dataset.mapZoom === "in") view.zoom = Math.min(3, view.zoom + .2); else if (target.dataset.mapZoom === "out") view.zoom = Math.max(.5, view.zoom - .2); else { view.zoom = 1; view.panX = 0; view.panY = 0; } render(); return true; }
  if (target.hasAttribute("data-map-labels")) { state.mapLabels = !state.mapLabels; render(); return true; }
  if (target.hasAttribute("data-map-place-mode")) { state.mapPlaceMode = !state.mapPlaceMode; state.placingPlaceId = null; if (state.mapPlaceMode) state.mapTool = "select"; render(); notify(state.mapPlaceMode ? "点击地图选择新地点的位置" : "已取消添加地点"); return true; }
  if (target.dataset.placeJump) { const destination = places.find(item => item.id === target.dataset.placeJump); if (destination) { state.mapPoint = destination.name; render(); } return true; }
  if (target.dataset.mapNav) { state.mapPoint = target.dataset.mapNav; navigate("maps"); return true; }
  return false;
}