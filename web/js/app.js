import "./events/click.js";
import "./events/submit.js";
import { attachChangeEvents } from "./controllers/change-events.js";
import { attachInputEvents } from "./controllers/input-events.js";
import { attachManuscriptEvents } from "./controllers/manuscript-events.js";
import { attachMapPointerEvents } from "./controllers/map-pointer.js";
import { attachUiPointerEvents } from "./controllers/ui-pointer.js";
import { attachWritingPointerEvents } from "./controllers/writing-pointer.js";
import { apiToken } from "./core/api.js";
import { loadUiPrefs } from "./core/state.js";
import { state } from "./core/store.js";
import { attachKeyboardEvents } from "./events/keyboard.js";
import { attachWindowEvents } from "./events/window.js";
import { renderAuth } from "./ui/auth.js";
import { loadAccount, logoutLocal } from "./app/session.js";





/* 龙吟写作 · 模块入口 */

    async function boot() {
      loadUiPrefs();
      if (!apiToken()) {
        state.authView = location.hash === "#register" ? "register" : "login";
        renderAuth();
        return;
      }
      try {
        await loadAccount();
      } catch (error) {
        logoutLocal();
      }
    }

    attachInputEvents();
    attachManuscriptEvents();
    attachChangeEvents();
    attachMapPointerEvents();
    attachWritingPointerEvents();
    attachUiPointerEvents();
    attachKeyboardEvents();
    attachWindowEvents();
    window.addEventListener("longyin:unauthorized", logoutLocal);
    boot();