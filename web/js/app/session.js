/* 龙吟写作 · 登录会话用例 */
import { api } from "../core/api.js";
import { resetPersistenceSnapshots, setAccountRevision } from "../core/persistence.js";
import { loadUiPrefs, normalizeWorkType } from "../core/state.js";
import { setLibraryItems, setWorks, state, works } from "../core/store.js";
import { notify } from "../core/utils.js";
import { invalidateRefIndex, normalizeChapterRefs } from "../domain/entities.js";
import { normalizeWorkMaps } from "../domain/maps/model.js";
import { loadWorkData, normalizeWorldOverview } from "../domain/works.js";
import { render } from "./render.js";
import { routeFromHash, syncRouteHash } from "./route-hash.js";

function hydrateAccount(payload) {
  setLibraryItems(payload.library || []);
  setWorks(payload.works || []);
  setAccountRevision(payload.revision);
  state.profile = payload.profile || null;
  Object.assign(state.ai, payload.ai || {});
  delete state.ai.apiKeyMasked;
  if (!works.some(work => work.id === state.currentWork)) state.currentWork = works[0] ? works[0].id : null;
  works.forEach(work => {
    normalizeWorkType(work);
    normalizeWorkMaps(work);
    work.data.worldEntries = work.data.worldEntries || [];
    normalizeWorldOverview(work);
    work.data.inspirations = work.data.inspirations || [];
    work.data.inspirations.forEach(item => { delete item.used; });
    work.data.recentRefIds = work.data.recentRefIds || [];
    (work.data.chapters || []).forEach(normalizeChapterRefs);
  });
  invalidateRefIndex();
  resetPersistenceSnapshots();
}

export function logoutLocal() {
  localStorage.removeItem("longyin_token");
  state.signedIn = false;
  state.authView = "login";
  state.dialog = null;
  setWorks([]);
  setLibraryItems([]);
  render();
}

export async function loadAccount() {
  const payload = await api("/account");
  hydrateAccount(payload);
  state.signedIn = true;
  state.authView = null;
  loadWorkData(state.currentWork || undefined);
  loadUiPrefs();
  state.page = routeFromHash() || "writing";
  syncRouteHash(state.page);
  render();
}

export async function submitAuth(register, email, password) {
  const data = await api(register ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  localStorage.setItem("longyin_token", data.token);
  await loadAccount();
  notify(register ? "账户已创建，开始你的第一部作品" : `欢迎回来，${data.profile?.name || ""}`);
}