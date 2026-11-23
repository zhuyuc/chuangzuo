import { markDirty } from "../core/persistence.js";
import { outlineData, state, worldOverview } from "../core/store.js";
import { applyTheme } from "../core/theme.js";
import { currentChapter } from "../domain/entities.js";
import { plainTextToRichHtml } from "../domain/rich-text.js";
import { activeData, updateWorkSummary } from "../domain/works.js";
import { refreshMaterialList } from "../pages/materials.js";
import { updateCommandResults } from "../ui/command.js";





/* 龙吟写作 · 表单与筛选输入 */
export function attachInputEvents() {
  document.addEventListener("input", event => {
    if (event.target.hasAttribute("data-rich-input")) {
      const error = event.target.closest("form")?.querySelector('[data-error-for="text"]');
      if (error) error.textContent = "";
      return;
    }
    if (event.target.id === "theme-mode") { applyTheme(event.target.value); return; }
    if (event.target.hasAttribute("data-map-query")) {
      const q = event.target.value.trim().toLowerCase();
      document.querySelectorAll("[data-place-select]").forEach(row => { row.style.display = !q || String(row.dataset.placeSearchText || "").includes(q) ? "" : "none"; });
      return;
    }
    if (event.target.form && event.target.form.id === "auth-form") {
      const error = event.target.form.querySelector(`[data-error-for="${event.target.name}"]`);
      if (error) error.textContent = "";
      event.target.classList.remove("invalid");
    }
    if (event.target.id === "work-name") event.target.form.querySelector("[data-work-error]").textContent = "";
    if (event.target.id === "work-search") {
      const query = event.target.value.trim().toLowerCase();
      document.querySelectorAll(".work-row").forEach(row => { row.style.display = !query || row.dataset.workSearch.includes(query) ? "" : "none"; });
    }
    if (event.target.id === "character-search") {
      const query = event.target.value.trim().toLowerCase();
      document.querySelectorAll(".person-row").forEach(row => { row.style.display = !query || row.textContent.toLowerCase().includes(query) ? "" : "none"; });
    }
    if (event.target.id === "item-search") {
      const query = event.target.value.trim().toLowerCase();
      document.querySelectorAll(".weapon-row").forEach(row => { row.style.display = !query || row.textContent.toLowerCase().includes(query) ? "" : "none"; });
    }
    if (event.target.id === "command-input") {
      state.commandQuery = event.target.value;
      updateCommandResults();
    }
    if (event.target.id === "material-search") {
      state.materialQuery = event.target.value;
      refreshMaterialList();
    }
    if (event.target.dataset.worldField) { worldOverview[event.target.dataset.worldField] = event.target.value; activeData().worldOverview = worldOverview; markDirty(); }
    if (event.target.dataset.worldSearch) {
      const scope = event.target.dataset.worldSearch;
      const query = event.target.value.trim().toLowerCase();
      const selector = scope === "network" ? ".person-row[data-world-search-text]" : ".world-entity-card[data-world-search-text]";
      let count = 0;
      document.querySelectorAll(selector).forEach(item => {
        const match = !query || item.dataset.worldSearchText.includes(query);
        item.hidden = !match;
        if (match) count += 1;
      });
      const counter = document.querySelector("[data-world-visible]");
      if (counter) counter.textContent = count;
    }
    if (event.target.hasAttribute("data-inspiration-search")) {
      const query = event.target.value.trim().toLowerCase();
      let count = 0;
      document.querySelectorAll(".inspiration-note-card[data-inspiration-search-text]").forEach(item => {
        const match = !query || item.dataset.inspirationSearchText.includes(query);
        item.hidden = !match;
        if (match) count += 1;
      });
      const counter = document.querySelector("[data-inspiration-visible]");
      if (counter) counter.textContent = count;
    }
    if (event.target.hasAttribute("data-ref-search")) {
      state.referenceQuery = event.target.value;
      const query = event.target.value.trim().toLowerCase();
      let count = 0;
      document.querySelectorAll(".ref-row[data-ref-search-text]").forEach(row => {
        const match = !query || row.dataset.refSearchText.includes(query);
        row.hidden = !match;
        if (match) count += 1;
      });
      const empty = document.querySelector("[data-ref-filter-empty]");
      if (empty) empty.hidden = count > 0 || !query;
    }
    if (event.target.dataset.outlineField && outlineData) { outlineData[event.target.dataset.outlineField] = event.target.value; markDirty(); }
    if (event.target.dataset.chapterField && currentChapter()) {
      const chapter = currentChapter();
      chapter[event.target.dataset.chapterField] = event.target.dataset.chapterField === "targetWords" ? Number(event.target.value) : event.target.value;
      if (event.target.dataset.chapterField === "title") updateWorkSummary();
      markDirty();
    }
    if (event.target.dataset.beatIndex !== undefined && currentChapter()) { currentChapter().beats[Number(event.target.dataset.beatIndex)] = event.target.value; markDirty(); }
  });
  document.addEventListener("paste", event => {
    const editor = event.target.closest?.("[data-rich-input]");
    if (!editor) return;
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") || "";
    if (text) document.execCommand("insertHTML", false, plainTextToRichHtml(text));
  });
}