import { render } from "../app/render.js";
import { routeFromHash } from "../app/route-hash.js";
import { state } from "../core/store.js";
import { applyTheme } from "../core/theme.js";
import { drawWorldMapCanvas } from "../domain/maps/render.js";
import { closeMention } from "../domain/writing/mention.js";
import { renderAuth } from "../ui/auth.js";





/* 龙吟写作 · 窗口、主题与路由事件 */
export function attachWindowEvents() {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if ((localStorage.getItem("longyin.theme") || "light") === "system") applyTheme("system");
  });

  window.addEventListener("hashchange", () => {
    if (!state.signedIn) {
      state.authView = location.hash === "#register" ? "register" : "login";
      renderAuth();
      return;
    }
    const page = routeFromHash();
    if (page && page !== state.page) { state.page = page; render(); }
  });

  window.addEventListener("resize", () => {
    if (state.mentionOpen) closeMention();
    if (state.page === "maps") drawWorldMapCanvas();
  });

  window.addEventListener("hashchange", () => {
    state.authView = location.hash === "#register" ? "register" : location.hash === "#login" || !state.signedIn ? "login" : null;
    renderAuth();
  });
}