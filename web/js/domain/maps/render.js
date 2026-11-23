import { state } from "../../core/store.js";
import { activeData } from "../works.js";
import { activeMap, currentPlace, ensureMapTerrain, mapPlaces, mapView } from "./model.js";
import { MAP_TERRAINS, renderWorldTerrain } from "./terrain.js";





/* 龙吟写作 · 地图画布绘制 */
    let worldMapImageCache = { src: "", image: null };

    export function paintMapThumbs() {
      document.querySelectorAll("[data-map-thumb]").forEach(canvas => {
        const map = (activeData()?.maps || []).find(item => item.id === canvas.dataset.mapThumb);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (map && map.worldMap && Array.isArray(map.worldMap.grid)) ctx.drawImage(renderWorldTerrain(map.worldMap), 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#2a647c"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      });
    }

    export function mapCanvasPoint(clientX, clientY) {
      const canvas = document.getElementById("world-map-canvas");
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const base = Math.min(rect.width / 720, rect.height / 500);
      const view = mapView();
      const offsetX = (rect.width - 720 * base) / 2 + view.panX;
      const offsetY = (rect.height - 500 * base) / 2 + view.panY;
      return { x: (clientX - rect.left - offsetX) / (base * view.zoom), y: (clientY - rect.top - offsetY) / (base * view.zoom), scale: base * view.zoom, rect, offsetX, offsetY };
    }

    export function drawWorldMapCanvas() {
      const canvas = document.getElementById("world-map-canvas");
      if (!canvas) return;
      const data = ensureMapTerrain();
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--canvas-bg").trim() || "#e8e7df";
      ctx.fillRect(0, 0, rect.width, rect.height);
      const base = Math.min(rect.width / 720, rect.height / 500);
      const view = mapView();
      const offsetX = (rect.width - 720 * base) / 2 + view.panX;
      const offsetY = (rect.height - 500 * base) / 2 + view.panY;
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(base * view.zoom, base * view.zoom);
      const image = activeMap()?.image;
      if (image) {
        if (worldMapImageCache.src !== image) {
          const img = new Image();
          worldMapImageCache = { src: image, image: img };
          img.onload = () => { if (document.getElementById("world-map-canvas")) drawWorldMapCanvas(); };
          img.src = image;
        }
        if (worldMapImageCache.image?.complete) ctx.drawImage(worldMapImageCache.image, 0, 0, 720, 500);
      } else {
        ctx.drawImage(renderWorldTerrain(data), 0, 0, 720, 500);
      }
      const pxScale = base * view.zoom;
      mapPlaces().forEach(place => {
        const selected = currentPlace()?.id === place.id;
        ctx.beginPath();
        ctx.arc(place.x, place.y, (selected ? 9 : 7) / pxScale, 0, Math.PI * 2);
        ctx.fillStyle = selected ? "#386150" : "#ffffff";
        ctx.fill();
        ctx.lineWidth = 2.5 / pxScale;
        ctx.strokeStyle = "#386150";
        ctx.stroke();
        if (state.mapLabels) {
          ctx.font = `600 ${12 / pxScale}px "Microsoft YaHei", sans-serif`;
          ctx.textBaseline = "middle";
          ctx.lineWidth = 4 / pxScale;
          ctx.strokeStyle = "#f7f7f4";
          ctx.strokeText(place.name, place.x + 13 / pxScale, place.y);
          ctx.fillStyle = "#242823";
          ctx.fillText(place.name, place.x + 13 / pxScale, place.y);
        }
      });
      ctx.restore();
    }

    export function terrainAtPoint(point) {
      if (!point || point.x < 0 || point.y < 0 || point.x >= 720 || point.y >= 500) return null;
      const map = ensureMapTerrain();
      return { x: Math.min(map.cols - 1, Math.floor(point.x / 720 * map.cols)), y: Math.min(map.rows - 1, Math.floor(point.y / 500 * map.rows)) };
    }

    export function paintMapCell(cx, cy) {
      const map = ensureMapTerrain();
      const terrain = MAP_TERRAINS.find(item => item.key === state.mapTerrain) || MAP_TERRAINS[3];
      const radius = Math.max(0, state.mapBrush - 1);
      for (let y = cy - radius; y <= cy + radius; y += 1) {
        for (let x = cx - radius; x <= cx + radius; x += 1) {
          if (x < 0 || y < 0 || x >= map.cols || y >= map.rows) continue;
          map.grid[y * map.cols + x] = terrain.level;
        }
      }
      map.rev = (map.rev || 0) + 1;
      const owner = activeMap();
      if (owner) owner.image = null;
    }