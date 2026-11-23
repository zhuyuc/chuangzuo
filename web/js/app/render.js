import { markDirty } from "../core/persistence.js";
import { NAV_ICONS, navGroups, saveUiPrefs, workTypeLabel } from "../core/state.js";
import { state, works } from "../core/store.js";
import { renderDialog } from "../dialogs/index.js";
import { refreshAISelStrip } from "../domain/ai/labels.js";
import { drawWorldMapCanvas, paintMapThumbs } from "../domain/maps/render.js";
import { setGraphHoverId } from "../domain/relationships.js";
import { activeWork } from "../domain/works.js";
import { closeMention } from "../domain/writing/mention.js";
import { dashboardPage } from "../pages/dashboard.js";
import { weaponsPage } from "../pages/equipment.js";
import { inspirationPage } from "../pages/inspiration.js";
import { libraryPage } from "../pages/library.js";
import { mapsPage } from "../pages/maps.js";
import { materialsPage } from "../pages/materials.js";
import { outlinePage } from "../pages/outline.js";
import { storagePage } from "../pages/storage.js";
import { charactersPage } from "../pages/world.js";
import { writingPage } from "../pages/writing.js";
import { renderAuth } from "../ui/auth.js";
import { activePageLabel, renderAccountMenu } from "../ui/shell.js";
import { syncRouteHash } from "./route-hash.js";





/* 龙吟写作 · 页面装配与渲染 */
    export const pages = { dashboard: dashboardPage, library: libraryPage, outline: outlinePage, materials: materialsPage, maps: mapsPage, characters: charactersPage, weapons: weaponsPage, inspiration: inspirationPage, writing: writingPage, storage: storagePage };


    let lastDialogState = null;

    let lastRenderedPage = null;

    let dialogTriggerSig = null;

    function triggerSignature(el) {
      if (!el || !el.getAttribute) return null;
      if (el.id) return `#${el.id}`;
      const keys = Object.keys(el.dataset || {});
      if (keys.length) return `[data-${keys[0]}="${el.dataset[keys[0]]}"]`;
      return null;
    }

    export function render() {
      setGraphHoverId(null);
      if (state.dialog !== lastDialogState) {
        if (state.dialog && !lastDialogState) dialogTriggerSig = triggerSignature(document.activeElement);
        if (!state.dialog && lastDialogState) {
          const sig = dialogTriggerSig;
          dialogTriggerSig = null;
          if (sig) setTimeout(() => { const el = document.querySelector(sig); if (el) el.focus(); }, 0);
        }
        lastDialogState = state.dialog;
      }
      if (state.mentionOpen) closeMention();
      document.getElementById("main-nav").innerHTML = navGroups.map(group => `<div class="nav-group-label">${group.label}</div>${group.items.map(item => `<button class="nav-item ${state.page === item.id ? "active" : ""}" data-page="${item.id}"><span class="nav-mark">${NAV_ICONS[item.id]}</span>${item.label}</button>`).join("")}`).join("");
      document.querySelectorAll(".nav-bottom [data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === state.page));
      document.getElementById("main-content").innerHTML = state.signedIn && works.length ? pages[state.page]() : "";
      const pageRoot = document.getElementById("main-content").firstElementChild;
      if (pageRoot && state.page !== lastRenderedPage) { pageRoot.classList.add("page-enter"); lastRenderedPage = state.page; }
      const navEl = document.getElementById("main-nav");
      const activeNav = navEl ? navEl.querySelector(".nav-item.active") : null;
      if (navEl) {
        if (activeNav) { navEl.style.setProperty("--glider-y", `${activeNav.offsetTop}px`); navEl.style.setProperty("--glider-h", `${activeNav.offsetHeight}px`); }
        else navEl.style.setProperty("--glider-h", "0px");
      }
      const accountName = state.profile?.name || state.profile?.email || "未登录";
      document.getElementById("account-name").textContent = accountName;
      document.getElementById("account-avatar").textContent = accountName.slice(0, 1);
      document.getElementById("current-work-name").textContent = activeWork()?.name || "暂无作品";
      document.getElementById("current-work-genre").textContent = works.length ? workTypeLabel(activeWork()) : "";
      document.title = `龙吟写作 · ${activePageLabel()}`;
      document.body.classList.toggle("focus-mode", state.focus === true && state.page === "writing");
      if (state.signedIn && !state.authView) { syncRouteHash(state.page); saveUiPrefs(); }
      renderAccountMenu();
      renderDialog();
      renderAuth();
      if (state.page === "maps") { paintMapThumbs(); requestAnimationFrame(() => { paintMapThumbs(); drawWorldMapCanvas(); }); }
      if (state.page === "writing") refreshAISelStrip();
      markDirty();
    }
