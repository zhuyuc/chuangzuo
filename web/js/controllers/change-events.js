import { render } from "../app/render.js";
import { markDirty } from "../core/persistence.js";
import { state, weapons } from "../core/store.js";
import { notify } from "../core/utils.js";
import { AI_BASEURL_PRESETS } from "../domain/ai/labels.js";
import { activeMap } from "../domain/maps/model.js";
import { playCompletionSeal } from "../domain/writing/history.js";
import { restoreAccountBackup } from "../features/backup.js";
import { importMaterialFile } from "./material-files.js";





/* 龙吟写作 · 选择、上传与文件变更事件 */
export function attachChangeEvents() {
  document.addEventListener("change", event => {
    if (event.target.dataset.chapterField === "state" && event.target.value === "已完成") playCompletionSeal();
    if (event.target.id === "inspiration-edit-category") {
      const creating = event.target.value === "__new";
      const field = document.getElementById("inspiration-new-category-field");
      field.hidden = !creating;
      field.querySelector("[data-error-for=category]").textContent = "";
      if (creating) document.getElementById("inspiration-edit-category-new").focus();
      return;
    }
    if (event.target.hasAttribute("data-inspiration-category")) { state.inspirationCategory = event.target.value; render(); return; }
    if (event.target.id === "ai-provider") {
      const input = document.getElementById("ai-baseurl");
      const preset = AI_BASEURL_PRESETS[event.target.value] || "";
      const canFill = input && (!input.value.trim() || Object.values(AI_BASEURL_PRESETS).includes(input.value.trim()));
      if (canFill) input.value = preset;
      const status = document.getElementById("ai-test-status");
      if (status) { status.textContent = canFill && preset ? `已按「${event.target.value}」填入默认访问地址，可点测试连接。` : canFill ? "自定义 provider 请手动填写访问地址。" : "保留了你填写的访问地址，可点测试连接验证。"; status.className = "ai-test"; }
      return;
    }
    if (event.target.id === "map-file" && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith("image/")) { notify("请选择图片文件"); return; }
      if (file.size > 8 * 1024 * 1024) { notify("底图文件不能超过 8MB"); return; }
      const reader = new FileReader();
      reader.onload = () => { const map = activeMap(); if (map) { map.image = reader.result; markDirty(); } render(); notify("地图底图已更新"); };
      reader.readAsDataURL(file);
      return;
    }
    if (event.target.id === "backup-file" && event.target.files[0]) {
      restoreAccountBackup(event.target.files[0]);
      event.target.value = "";
    }
    if (event.target.id === "work-sort") { state.workSort = event.target.value; render(); }
    if (event.target.id === "item-image-file" && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith("image/")) { notify("请选择图片文件"); event.target.value = ""; return; }
      if (file.size > 2 * 1024 * 1024) { notify("装备图片不能超过 2MB"); event.target.value = ""; return; }
      const targetId = state.itemImageTarget;
      const reader = new FileReader();
      reader.onload = () => {
        const item = weapons.find(entry => entry.id === targetId);
        if (!item) return;
        item.image = reader.result;
        state.weapon = item.id;
        state.itemImageTarget = null;
        render();
        notify("装备图片已保存");
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    }
    if (event.target.id === "material-file" && event.target.files[0]) {
      importMaterialFile(event.target.files[0]);
      event.target.value = "";
    }
  });
}