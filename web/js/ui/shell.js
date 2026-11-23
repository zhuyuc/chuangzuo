import { navItems, standalonePageLabels } from "../core/state.js";
import { state } from "../core/store.js";





/* 龙吟写作 · 应用外壳与账户菜单 */
    export function activePageLabel() { return standalonePageLabels[state.page] || (navItems.find(item => item.id === state.page) || navItems[0]).label; }

    export function pageTitle(title, description, actions = "") {
      return `<div class="page-title"><div><h1>${title}</h1><p>${description}</p></div><div class="toolbar">${actions}</div></div>`;
    }

    export function renderAccountMenu() {
      const menu = document.getElementById("account-menu");
      if (!menu) return;
      menu.classList.toggle("open", state.accountMenuOpen);
      menu.innerHTML = state.accountMenuOpen ? `<button data-ai-settings><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="8" cy="8" r="2.6"/><path d="M8 1.8v1.9M8 12.3v1.9M1.8 8h1.9M12.3 8h1.9M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6L11 5M5 11l-1.4 1.4"/></svg>设置</button><button data-pen-name><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.8 2.6l2.6 2.6"/><path d="M3.2 12.8l1.2-3.4 7-7a1.4 1.4 0 0 1 2 2l-7 7-3.2 1.4z"/><path d="M4.4 9.4l2.2 2.2"/></svg>设置笔名</button><button data-theme-toggle><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${document.documentElement.getAttribute("data-theme") === "dark" ? '<circle cx="8" cy="8" r="3.2"/><path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3"/>' : '<path d="M13.2 9.4A5.6 5.6 0 0 1 6.6 2.8a5.6 5.6 0 1 0 6.6 6.6z"/>'}</svg>${document.documentElement.getAttribute("data-theme") === "dark" ? "浅色模式" : "深色模式"}</button><button class="danger" data-logout><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 2.8H4.2a1.2 1.2 0 0 0-1.2 1.2v8a1.2 1.2 0 0 0 1.2 1.2h2.3"/><path d="M10.2 5.4L12.8 8l-2.6 2.6"/><path d="M12.8 8H6.6"/></svg>退出登录</button>` : "";
    }
