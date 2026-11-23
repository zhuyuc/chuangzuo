import { render } from "../app/render.js";
import { markDirty } from "../core/persistence.js";
import { workTypeLabel } from "../core/state.js";
import { chapterText, chapters, libraryItems, outlineData, state, works } from "../core/store.js";
import { notify, notifyError } from "../core/utils.js";
import { askConfirm } from "../dialogs/index.js";
import { activeWork, loadWorkData } from "../domain/works.js";





/* 龙吟写作 · 备份与导出 */
    function downloadFile(filename, content, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    export function backupAccount() {
      const payload = { format: "longyin-backup", formatVersion: 1, createdAt: new Date().toISOString(), account: { name: "林墨", email: "writer@example.com" }, libraryItems, works };
      downloadFile(`龙吟写作-账户备份-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), "application/json");
      state.lastBackup = new Date().toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
      render();
      notify("账户备份已生成");
    }

    export function exportCurrentWork() {
      const work = activeWork();
      const lines = [`# ${work.name}`, "", `类型：${workTypeLabel(work)}`, `导出时间：${new Date().toLocaleString("zh-CN")}`, ""];
      if (outlineData.worldRules) lines.push(`世界运行基础规则：${outlineData.worldRules}`);
      if (outlineData.worldTerrain) lines.push(`世界地形地貌：${outlineData.worldTerrain}`);
      outlineData.volumes.forEach(volume => {
        const volumeChapters = chapters.filter(chapter => chapter.volumeId === volume.id);
        if (!volumeChapters.length) return;
        lines.push(`## ${volume.title} ${volume.subtitle}`.trim(), "");
        volumeChapters.forEach(chapter => {
          lines.push(`### ${chapter.title}`, "");
          if (chapter.summary) lines.push(`> ${chapter.summary}`, "");
          lines.push(chapterText[chapter.id] || "", "");
        });
      });
      downloadFile(`${work.name}.md`, lines.join("\n"), "text/markdown;charset=utf-8");
      notify("当前作品已导出为 Markdown");
    }

    export async function restoreAccountBackup(file) {
      try {
        const payload = JSON.parse(await file.text());
        if (payload.format !== "longyin-backup" || !Array.isArray(payload.works) || !payload.works.every(work => work.id && work.name && work.data && Array.isArray(work.data.chapters))) throw new Error("备份格式不正确");
        askConfirm("恢复备份会覆盖当前账户的全部作品与共享设定，是否继续？", () => {
          works.splice(0, works.length, ...payload.works);
          if (Array.isArray(payload.libraryItems)) libraryItems.splice(0, libraryItems.length, ...payload.libraryItems);
          state.currentWork = works[0].id;
          state.chapter = works[0].data.currentChapter || works[0].data.chapters[0].id;
          state.page = "dashboard";
          state.character = null;
          state.material = null;
          state.weapon = null;
          state.mapPoint = null;
          state.relationship = null;
          loadWorkData();
          render();
          markDirty();
          notify(`已从备份恢复 ${payload.works.length} 部作品`);
        }, true);
      } catch (error) {
        notifyError("恢复失败：备份文件无法识别");
      }
    }
