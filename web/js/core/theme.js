import { render } from "../app/render.js";
import { state } from "./store.js";





/* 龙吟写作 · 主题 */
    export function applyTheme(mode) {
      localStorage.setItem("longyin.theme", mode);
      const resolved = mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
      document.documentElement.setAttribute("data-theme", resolved);
      if (state.signedIn) render();
    }
