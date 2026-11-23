import { api } from "./api.js";
import { libraryItems, state, works } from "./store.js";
import { notifyError } from "./utils.js";





/* 龙吟写作 · 资源级持久化 */

    let persistTimer = null;

    let persisting = false;

    let persistQueued = false;

    let accountRevision = 0;

    let saveBlocked = false;

    let savedLibrary = null;

    let savedWorks = new Map();

    function workMeta(work) {
      const data = { ...work.data };
      delete data.text;
      return JSON.stringify({ ...work, data });
    }

    function chapterTexts(work) {
      const texts = new Map();
      for (const chapter of work.data.chapters || []) texts.set(chapter.id, String(work.data.text?.[chapter.id] ?? ""));
      return texts;
    }

    export function setAccountRevision(value) { accountRevision = Number(value || 0); }

    export function resetPersistenceSnapshots() {
      saveBlocked = false;
      savedLibrary = JSON.stringify(libraryItems);
      savedWorks = new Map();
      for (const work of works) savedWorks.set(work.id, { meta: workMeta(work), texts: chapterTexts(work) });
    }

    export function markDirty() {
      if (!state.signedIn) return;
      clearTimeout(persistTimer);
      persistTimer = setTimeout(saveAccountNow, 900);
    }

    async function request(path, options) {
      const result = await api(path, options);
      if (Number.isFinite(result?.revision)) accountRevision = result.revision;
      return result;
    }

    async function saveDeletedWorks() {
      for (const id of [...savedWorks.keys()]) {
        if (works.some(work => work.id === id)) continue;
        await request(`/works/${encodeURIComponent(id)}`, { method: "DELETE", body: JSON.stringify({ revision: accountRevision }) });
        savedWorks.delete(id);
      }
    }

    async function saveLibrary() {
      const serialized = JSON.stringify(libraryItems);
      if (serialized === savedLibrary) return;
      await request("/library", { method: "PUT", body: JSON.stringify({ library: libraryItems, revision: accountRevision }) });
      savedLibrary = serialized;
    }

    async function saveWork(work) {
      const meta = workMeta(work);
      const texts = chapterTexts(work);
      const previous = savedWorks.get(work.id);
      if (previous) {
        for (const chapterId of previous.texts.keys()) {
          if (texts.has(chapterId)) continue;
          await request(`/works/${encodeURIComponent(work.id)}/chapters/${encodeURIComponent(chapterId)}`, { method: "DELETE", body: JSON.stringify({ revision: accountRevision }) });
        }
      }
      if (!previous || previous.meta !== meta) {
        const payload = { ...work, data: { ...work.data } };
        delete payload.data.text;
        await request(`/works/${encodeURIComponent(work.id)}`, { method: "PUT", body: JSON.stringify({ work: payload, revision: accountRevision }) });
      }
      for (const [chapterId, text] of texts) {
        if (previous && previous.texts.get(chapterId) === text) continue;
        await request(`/works/${encodeURIComponent(work.id)}/chapters/${encodeURIComponent(chapterId)}`, { method: "PUT", body: JSON.stringify({ text, revision: accountRevision }) });
      }
      savedWorks.set(work.id, { meta, texts });
    }

    export async function saveAccountNow() {
      clearTimeout(persistTimer);
      persistTimer = null;
      if (!state.signedIn || saveBlocked) return;
      if (persisting) { persistQueued = true; return; }
      persisting = true;
      try {
        await saveDeletedWorks();
        for (const work of works) await saveWork(work);
        await saveLibrary();
      } catch (error) {
        if (error.status === 409) {
          saveBlocked = true;
          notifyError("保存失败：数据已在其他设备更新，请刷新页面后再继续编辑。");
        } else {
          notifyError(`保存失败：${error.message}（点击提示可复制）`);
        }
      } finally {
        persisting = false;
        if (persistQueued) {
          persistQueued = false;
          persistTimer = setTimeout(saveAccountNow, 0);
        }
      }
    }