/* 龙吟写作 · 素材文件导入用例 */
import { render } from "../app/render.js";
import { materials, state } from "../core/store.js";
import { notify } from "../core/utils.js";

export function importMaterialFile(file) {
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { notify("演示环境单个素材文件不能超过 2MB"); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const id = `material-${Date.now()}`;
    const type = file.type.startsWith("image/") ? "图片" : "文档";
    materials.unshift({ id, title: file.name.replace(/\.[^.]+$/, ""), type, source: file.name, sourceUrl: "", tags: [], note: "", updated: "刚刚", attachmentName: file.name, attachmentData: reader.result });
    state.material = id;
    state.materialType = "全部";
    state.materialTag = null;
    state.page = "materials";
    render();
    notify(`已导入${type}：${file.name}`);
  };
  reader.readAsDataURL(file);
}