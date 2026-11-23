import { aiClicks } from "../controllers/ai-clicks.js";
import { booksClicks } from "../controllers/books-clicks.js";
import { dialogClicks } from "../controllers/dialog-clicks.js";
import { libraryClicks } from "../controllers/library-clicks.js";
import { mapClicks } from "../controllers/map-clicks.js";
import { materialClicks } from "../controllers/material-clicks.js";
import { richEditorClicks } from "../controllers/rich-editor-clicks.js";
import { sessionClicks } from "../controllers/session-clicks.js";
import { typographyClicks } from "../controllers/typography-clicks.js";
import { worldClicks } from "../controllers/world-clicks.js";
import { writingClicks } from "../controllers/writing-clicks.js";
import { state } from "../core/store.js";
import { notify } from "../core/utils.js";
import { closeCommand } from "../ui/command.js";
import { renderAccountMenu } from "../ui/shell.js";





/* 龙吟写作 · 点击事件分发 */

    const clickControllers = [sessionClicks, aiClicks, worldClicks, dialogClicks, booksClicks, writingClicks, typographyClicks, mapClicks, materialClicks, libraryClicks, richEditorClicks];

    document.addEventListener("mousedown", event => {
      if (event.target.closest("[data-rich-command]")) { event.preventDefault(); return; }
      const label = event.target.closest("[data-rich-focus]");
      if (label) { event.preventDefault(); label.closest(".form-field")?.querySelector("[data-rich-input]")?.focus(); }
    });

    document.addEventListener("click", event => {
      const target = event.target.closest("button, [data-point], [data-character], [data-graph-entity], [data-graph-node], [data-graph-dial], [data-map-select], [data-work-open]");
      if (!target) return;
      for (const handle of clickControllers) if (handle(event, target)) return;
      if (target.dataset.action) { event.stopPropagation(); notify(target.dataset.action); }
    });

    document.getElementById("toast").addEventListener("click", event => {
      const toast = event.currentTarget;
      if (!toast.classList.contains("error")) return;
      navigator.clipboard?.writeText(toast.textContent);
      toast.classList.remove("show", "error");
    });

    document.addEventListener("click", event => {
      if (event.target.classList.contains("command-screen")) closeCommand();
      if (state.accountMenuOpen && !event.target.closest(".account-menu-wrap")) { state.accountMenuOpen = false; renderAccountMenu(); }
    });