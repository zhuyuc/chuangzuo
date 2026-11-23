import { render } from "../app/render.js";
import { markDirty } from "../core/persistence.js";
import { state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { activeMap } from "../domain/maps/model.js";
import { generateWorldMap, makeBlankMap } from "../domain/maps/terrain.js";
import { activeData } from "../domain/works.js";





/* 龙吟写作 · 地图表单提交 */
export function mapSubmit(event) {
  if (event.target.id === "new-map-form") {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.mapName.value.trim();
    if (!name) { form.querySelector("[data-map-error]").textContent = "请输入地图名称。"; return true; }
    const data = activeData();
    data.maps = data.maps || [];
    const id = `map-${Date.now()}`;
    const source = form.elements.source.value;
    const current = activeMap();
    let worldMap = null;
    if (source === "generate") worldMap = generateWorldMap();
    else if (source === "copy" && current && current.worldMap) worldMap = JSON.parse(JSON.stringify(current.worldMap));
    else if (source === "blank") worldMap = makeBlankMap();
    data.maps.push({ id, name, kind: form.elements.kind.value, worldMap, image: null, view: { zoom: 1, panX: 0, panY: 0 } });
    state.mapId = id;
    state.mapPoint = null;
    state.dialog = null;
    markDirty();
    render();
    notify(`地图「${name}」已创建`);
    return true;
  }
  if (event.target.id === "rename-map-form") {
    event.preventDefault();
    const form = event.target;
    const name = form.elements.mapName.value.trim();
    if (!name) { form.querySelector("[data-map-error]").textContent = "地图名称不能为空。"; return true; }
    const targetMap = (activeData()?.maps || []).find(item => item.id === state.renameMapId);
    if (targetMap) { targetMap.name = name; markDirty(); }
    state.dialog = null;
    state.renameMapId = null;
    render();
    notify("已保存新名称");
    return true;
  }
  return false;
}