import { render } from "../app/render.js";
import { markDirty } from "../core/persistence.js";
import { places, state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { openEntityDialog } from "../dialogs/index.js";
import { activeMap, captureMapPointer, mapView } from "../domain/maps/model.js";
import { drawWorldMapCanvas, mapCanvasPoint, paintMapCell, terrainAtPoint } from "../domain/maps/render.js";





/* 龙吟写作 · 地图指针交互 */
let mapDrag = null;

export function attachMapPointerEvents() {
  document.addEventListener("contextmenu", event => {
    if (event.target.closest("#world-map-canvas")) event.preventDefault();
  });

  document.addEventListener("pointerdown", event => {
    const canvas = event.target.closest("#world-map-canvas");
    if (!canvas) return;
    const point = mapCanvasPoint(event.clientX, event.clientY);
    if (!point || point.x < 0 || point.y < 0 || point.x > 720 || point.y > 500) return;
    if (state.mapPlaceMode && event.button === 0) {
      const coords = { x: Math.max(24, Math.min(696, point.x)), y: Math.max(24, Math.min(476, point.y)) };
      if (state.placingPlaceId) {
        const targetPlace = places.find(item => item.id === state.placingPlaceId);
        if (targetPlace) {
          targetPlace.x = coords.x;
          targetPlace.y = coords.y;
          targetPlace.mapId = activeMap()?.id || null;
          state.mapPoint = targetPlace.name;
          markDirty();
        }
        state.placingPlaceId = null;
        state.mapPlaceMode = false;
        render();
        notify("地点已放置到当前地图");
      } else {
        state.placementCoords = coords;
        state.placementMapId = activeMap()?.id || null;
        state.mapPlaceMode = false;
        openEntityDialog("place");
      }
      event.preventDefault();
      return;
    }
    if (event.button === 2) {
      mapDrag = { mode: "pan", startX: event.clientX, startY: event.clientY, panX: mapView().panX, panY: mapView().panY };
      captureMapPointer(canvas, event);
      event.preventDefault();
      return;
    }
    if (state.mapTool === "brush" && event.button === 0) {
      const cell = terrainAtPoint(point);
      if (!cell) return;
      mapDrag = { mode: "brush", x: cell.x, y: cell.y };
      captureMapPointer(canvas, event);
      paintMapCell(cell.x, cell.y);
      drawWorldMapCanvas();
      event.preventDefault();
      return;
    }
    if (state.mapTool === "select" && event.button === 0) {
      const hit = places.find(place => Math.hypot(place.x - point.x, place.y - point.y) < 15 / point.scale);
      if (hit) {
        state.mapPoint = hit.name;
        mapDrag = { mode: "pin", place: hit };
      } else {
        mapDrag = { mode: "pan", startX: event.clientX, startY: event.clientY, panX: mapView().panX, panY: mapView().panY };
      }
      captureMapPointer(canvas, event);
      drawWorldMapCanvas();
      event.preventDefault();
    }
  });

  document.addEventListener("pointermove", event => {
    if (!mapDrag) return;
    if (mapDrag.mode === "pan") {
      const view = mapView();
      view.panX = mapDrag.panX + event.clientX - mapDrag.startX;
      view.panY = mapDrag.panY + event.clientY - mapDrag.startY;
      drawWorldMapCanvas();
      return;
    }
    const point = mapCanvasPoint(event.clientX, event.clientY);
    if (!point) return;
    if (mapDrag.mode === "pin") {
      mapDrag.place.x = Math.max(18, Math.min(702, point.x));
      mapDrag.place.y = Math.max(18, Math.min(482, point.y));
      drawWorldMapCanvas();
    }
    if (mapDrag.mode === "brush") {
      const cell = terrainAtPoint(point);
      if (!cell) return;
      paintMapCell(cell.x, cell.y);
      drawWorldMapCanvas();
    }
  });

  document.addEventListener("pointerup", () => {
    if (!mapDrag) return;
    const drag = mapDrag;
    mapDrag = null;
    if (drag.mode === "pin") render();
    if (drag.mode === "brush") markDirty();
  });

  document.addEventListener("wheel", event => {
    const canvas = event.target.closest("#world-map-canvas");
    if (!canvas) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const view = mapView();
    const oldScale = Math.min(rect.width / 720, rect.height / 500) * view.zoom;
    const offsetX = (rect.width - 720 * (oldScale / view.zoom)) / 2 + view.panX;
    const offsetY = (rect.height - 500 * (oldScale / view.zoom)) / 2 + view.panY;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const worldX = (mouseX - offsetX) / oldScale;
    const worldY = (mouseY - offsetY) / oldScale;
    view.zoom = Math.max(.5, Math.min(3, view.zoom + (event.deltaY < 0 ? .12 : -.12)));
    const newScale = Math.min(rect.width / 720, rect.height / 500) * view.zoom;
    view.panX = mouseX - (rect.width - 720 * (newScale / view.zoom)) / 2 - worldX * newScale;
    view.panY = mouseY - (rect.height - 500 * (newScale / view.zoom)) / 2 - worldY * newScale;
    drawWorldMapCanvas();
  }, { passive: false });
}