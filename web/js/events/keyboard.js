import { render } from "../app/render.js";
import { state } from "../core/store.js";
import { closeDialog } from "../dialogs/index.js";
import { currentChapter } from "../domain/entities.js";
import { mapView } from "../domain/maps/model.js";
import { drawWorldMapCanvas } from "../domain/maps/render.js";
import { stepManuscriptUndo } from "../domain/writing/history.js";
import { closeMention, mentionCandidates, mentionKey, renderMentionPopup, selectMention } from "../domain/writing/mention.js";
import { closeCommand, openCommand, runCommand } from "../ui/command.js";
import { renderAccountMenu } from "../ui/shell.js";





/* 龙吟写作 · 键盘事件 */
export function attachKeyboardEvents() {
  document.addEventListener("keydown", event => {
    if (document.activeElement?.id === "manuscript" && (event.ctrlKey || event.metaKey) && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === "z") { event.preventDefault(); stepManuscriptUndo(event.shiftKey); return; }
      if (key === "y") { event.preventDefault(); stepManuscriptUndo(true); return; }
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key === "f" || event.key === "F")) {
      if (state.page === "writing" && currentChapter()) {
        event.preventDefault();
        state.searchOpen = !state.searchOpen;
        render();
        if (state.searchOpen) { const input = document.getElementById("find-query"); if (input) input.focus(); }
      }
      return;
    }
    if (state.mentionOpen) {
      if (event.isComposing || event.keyCode === 229) return;
      const candidates = mentionCandidates(state.mentionQuery);
      if (event.key === "ArrowDown") { event.preventDefault(); if (candidates.length) { state.mentionIndex = Math.min(candidates.length - 1, state.mentionIndex + 1); renderMentionPopup(); } return; }
      if (event.key === "ArrowUp") { event.preventDefault(); if (candidates.length) { state.mentionIndex = Math.max(0, state.mentionIndex - 1); renderMentionPopup(); } return; }
      if (event.key === "Enter") {
        if (candidates[state.mentionIndex]) { event.preventDefault(); selectMention(mentionKey(candidates[state.mentionIndex].entity)); }
        else closeMention();
        return;
      }
      if (event.key === "Escape") { event.preventDefault(); closeMention(); return; }
      if (event.key === "Tab" || ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { closeMention(); return; }
      return;
    }
    if (event.key === "Escape" && state.focus && !state.searchOpen && !state.dialog) { state.focus = false; render(); return; }
    const activeTag = (document.activeElement && document.activeElement.tagName) || "";
    if (state.signedIn && state.page === "maps" && !state.dialog && !state.commandOpen && !/^(INPUT|TEXTAREA|SELECT)$/.test(activeTag)) {
      const view = mapView();
      if (event.key === "ArrowLeft") { view.panX += 48; event.preventDefault(); drawWorldMapCanvas(); return; }
      if (event.key === "ArrowRight") { view.panX -= 48; event.preventDefault(); drawWorldMapCanvas(); return; }
      if (event.key === "ArrowUp") { view.panY += 48; event.preventDefault(); drawWorldMapCanvas(); return; }
      if (event.key === "ArrowDown") { view.panY -= 48; event.preventDefault(); drawWorldMapCanvas(); return; }
      if (event.key === "+" || event.key === "=") { view.zoom = Math.min(3, view.zoom + .2); event.preventDefault(); render(); return; }
      if (event.key === "-") { view.zoom = Math.max(.5, view.zoom - .2); event.preventDefault(); render(); return; }
      if (event.key === "0") { view.zoom = 1; view.panX = 0; view.panY = 0; event.preventDefault(); render(); return; }
    }
    if (state.signedIn && event.ctrlKey && event.key.toLowerCase() === "k") { event.preventDefault(); state.commandOpen ? closeCommand() : openCommand(); return; }
    if (state.signedIn && event.ctrlKey && event.key.toLowerCase() === "n") { event.preventDefault(); openCommand("新建"); return; }
    if (state.commandOpen) {
      const items = Array.from(document.querySelectorAll(".command-item"));
      let active = items.findIndex(item => item.classList.contains("active"));
      if (event.key === "ArrowDown") { event.preventDefault(); active = Math.min(items.length - 1, active + 1); items.forEach((item, index) => item.classList.toggle("active", index === active)); if (items[active]) items[active].scrollIntoView({ block: "nearest" }); return; }
      if (event.key === "ArrowUp") { event.preventDefault(); active = Math.max(0, active - 1); items.forEach((item, index) => item.classList.toggle("active", index === active)); if (items[active]) items[active].scrollIntoView({ block: "nearest" }); return; }
      if (event.key === "Enter" && items[active]) { event.preventDefault(); runCommand(items[active].dataset.commandAction); return; }
      if (event.key === "Escape") { event.preventDefault(); closeCommand(); return; }
    }
    if (event.key === "Escape" && state.page === "characters" && state.worldView === "network" && state.characterView === "graph" && !state.dialog && !state.commandOpen && !state.accountMenuOpen) {
      const layer = state.graphLayer === "type" && state.graphType ? "type" : state.graphLayer === "entity" && state.worldEntity ? "entity" : "panorama";
      if (layer === "entity") state.graphLayer = "type";
      else if (layer === "type") state.graphLayer = "panorama";
      else return;
      event.preventDefault();
      render();
      return;
    }
    if (event.key === "Escape" && state.accountMenuOpen) { state.accountMenuOpen = false; renderAccountMenu(); return; }
    if (event.key === "Escape" && state.dialog) closeDialog();
  });
}