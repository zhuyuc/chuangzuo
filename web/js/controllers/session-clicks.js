import { render } from "../app/render.js";
import { navigate } from "../app/router.js";
import { logoutLocal } from "../app/session.js";
import { api } from "../core/api.js";
import { state } from "../core/store.js";
import { applyTheme } from "../core/theme.js";
import { renderDialog } from "../dialogs/index.js";
import { backupAccount, exportCurrentWork } from "../features/backup.js";
import { openAuth } from "../ui/auth.js";
import { openCommand, runCommand } from "../ui/command.js";
import { renderAccountMenu } from "../ui/shell.js";





/* 龙吟写作 · 账户、导航与全局入口点击 */
export function sessionClicks(event, target) {
  if (target.hasAttribute("data-account-toggle")) { state.accountMenuOpen = !state.accountMenuOpen; renderAccountMenu(); return true; }
  if (target.hasAttribute("data-command-open")) { openCommand(); return true; }
  if (target.dataset.commandAction) { runCommand(target.dataset.commandAction); return true; }
  if (target.hasAttribute("data-backup-all")) { backupAccount(); return true; }
  if (target.hasAttribute("data-export-work")) { exportCurrentWork(); return true; }
  if (target.hasAttribute("data-home")) { state.dialog = null; navigate("dashboard"); return true; }
  if (target.dataset.auth) { openAuth(target.dataset.auth); return true; }
  if (target.dataset.passwordTarget) { const input = document.getElementById(target.dataset.passwordTarget); const show = input.type === "password"; input.type = show ? "text" : "password"; target.textContent = show ? "隐藏" : "显示"; return true; }
  if (target.dataset.page) { navigate(target.dataset.page); return true; }
  if (target.dataset.toggle === "search") { state.searchOpen = !state.searchOpen; render(); return true; }
  if (target.dataset.toggle === "focus") { state.focus = !state.focus; render(); return true; }
  if (target.hasAttribute("data-logout")) { api("/auth/logout", { method: "POST" }).catch(() => {}); logoutLocal(); return true; }
  if (target.hasAttribute("data-pen-name")) {
    state.accountMenuOpen = false;
    renderAccountMenu();
    state.dialog = "pen-name";
    renderDialog();
    return true;
  }
  if (target.hasAttribute("data-theme-toggle")) {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    setTimeout(renderAccountMenu, 0);
    return true;
  }
  return false;
}