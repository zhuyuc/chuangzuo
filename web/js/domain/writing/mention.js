import { REF_GROUP_DEFS } from "../../core/state.js";
import { state } from "../../core/store.js";
import { escapeHtml } from "../../core/utils.js";
import { addChapterRef, currentChapter, entityRefGroup, isChapterRef, splitEntityAliases, storyEntities, storyEntityById } from "../entities.js";
import { activeData } from "../works.js";
import { referenceMark, referenceSearchText, refreshWritingReference, rememberRecentRef } from "./references.js";





/* 龙吟写作 · @ 引用选择器 */
    export function mentionKey(entity) { return `${entity.type}:${entity.id}`; }

    function mentionEntityName(entity, query) {
      const exactAlias = splitEntityAliases(entity.record).find(alias => alias.toLowerCase() === String(query || "").trim().toLowerCase());
      return exactAlias || entity.name;
    }

    export function mentionCandidates(query) {
      const chapter = currentChapter();
      const all = storyEntities();
      const keyOf = mentionKey;
      const unique = list => {
        const seen = new Set();
        return list.filter(entity => {
          const key = keyOf(entity);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };
      const isChapterEntity = entity => isChapterRef(chapter, entityRefGroup(entity.type), entity.id);
      const recent = (activeData().recentRefIds || []).map(id => storyEntityById(id)).filter(Boolean);
      const q = String(query || "").trim().toLowerCase();
      let list = [];
      if (q) {
        const scored = all.map(entity => {
          const names = [entity.name, ...splitEntityAliases(entity.record)].map(name => name.toLowerCase());
          let score = 99;
          if (names.some(name => name === q)) score = 0;
          else if (names.some(name => name.startsWith(q))) score = 1;
          else if (names.some(name => name.includes(q))) score = 2;
          else if (`${entity.label} ${entity.subtitle || ""}`.toLowerCase().includes(q)) score = 3;
          else if (q.length > 1 && referenceSearchText(entity).includes(q)) score = 4;
          return { entity, score };
        }).filter(item => item.score < 99);
        const precise = scored.filter(item => item.score <= 3);
        list = (precise.length ? precise : scored).sort((a, b) => a.score - b.score || (Number(isChapterEntity(b.entity)) - Number(isChapterEntity(a.entity))) || a.entity.name.localeCompare(b.entity.name, "zh-CN")).map(item => item.entity);
      } else {
        list = unique([...all.filter(isChapterEntity), ...recent, ...all]);
      }
      return unique(list).slice(0, 30).map(entity => ({ entity, inChapter: isChapterEntity(entity) }));
    }

    export function getTextareaCaretPosition(textarea) {
      const rect = textarea.getBoundingClientRect();
      const style = getComputedStyle(textarea);
      const mirror = document.createElement("div");
      mirror.style.cssText = `position:fixed;visibility:hidden;pointer-events:none;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;padding:${style.padding};border:${style.border};font-family:${style.fontFamily};font-size:${style.fontSize};font-weight:${style.fontWeight};line-height:${style.lineHeight};letter-spacing:${style.letterSpacing};white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;box-sizing:border-box;overflow:hidden;`;
      mirror.textContent = textarea.value.slice(0, textarea.selectionStart);
      const marker = document.createElement("span");
      marker.textContent = "\u200b";
      mirror.appendChild(marker);
      document.body.appendChild(mirror);
      mirror.scrollTop = textarea.scrollTop;
      const markerRect = marker.getBoundingClientRect();
      const result = { left: markerRect.left, top: markerRect.top, bottom: markerRect.bottom };
      mirror.remove();
      return result;
    }

    export function positionMentionPopup() {
      const popup = document.getElementById("mention-popup");
      const editor = document.getElementById("manuscript");
      if (!popup || !editor) return;
      const caret = getTextareaCaretPosition(editor);
      const width = popup.offsetWidth;
      const height = popup.offsetHeight;
      let left = Math.min(window.innerWidth - width - 8, Math.max(8, caret.left));
      let top = caret.bottom + 6;
      if (top + height > window.innerHeight - 8) top = Math.max(8, caret.top - height - 6);
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
      const active = popup.querySelector(".mention-row.active");
      if (active) active.scrollIntoView({ block: "nearest" });
    }

    export function renderMentionPopup() {
      const root = document.getElementById("mention-root");
      if (!state.mentionOpen || state.page !== "writing") { root.innerHTML = ""; return; }
      const candidates = mentionCandidates(state.mentionQuery);
      state.mentionIndex = Math.max(0, Math.min(candidates.length - 1, state.mentionIndex));
      root.innerHTML = `<div class="mention-popup" id="mention-popup" style="left:-9999px;top:-9999px" role="listbox" aria-label="引用正文资料"><div class="mention-head"><span>引用资料</span><kbd>${state.mentionQuery ? `@${escapeHtml(state.mentionQuery)}` : "@"}</kbd></div><div class="mention-list">${candidates.map(({ entity, inChapter }, index) => `<button type="button" class="mention-row ${index === state.mentionIndex ? "active" : ""}" data-mention-key="${entity.type}:${entity.id}" role="option" aria-selected="${index === state.mentionIndex}"><span class="mention-mark">${referenceMark(entity)}</span><span class="mention-main"><strong>${escapeHtml(entity.name)}</strong><small>${entity.label}${entity.subtitle ? ` · ${escapeHtml(entity.subtitle)}` : ""}</small></span><span class="mention-meta">${inChapter ? "<b>本章</b>" : ""}</span></button>`).join("") || '<div class="mention-empty">没有找到匹配的资料。<br>可以换姓名、别名、身份或势力关键词。</div>'}</div><div class="mention-foot">${candidates.length ? "↑↓ 选择 · Enter 插入并关联 · Esc 关闭" : "Esc 关闭"}</div></div>`;
      requestAnimationFrame(positionMentionPopup);
    }

    export function closeMention() {
      state.mentionOpen = false;
      state.mentionQuery = "";
      state.mentionIndex = 0;
      const root = document.getElementById("mention-root");
      if (root) root.innerHTML = "";
    }

    export function updateMentionFromEditor() {
      const editor = document.getElementById("manuscript");
      if (!editor || state.page !== "writing" || editor.selectionStart !== editor.selectionEnd) { closeMention(); return; }
      const caret = editor.selectionStart;
      const before = editor.value.slice(0, caret);
      const at = Math.max(before.lastIndexOf("@"), before.lastIndexOf("＠"));
      if (at < 0) { closeMention(); return; }
      const token = before.slice(at + 1);
      if (token.length > 24 || /[\s\u3000，。！？、；：“”‘’（）《》【】…—]/.test(token)) { closeMention(); return; }
      const previous = at > 0 ? before[at - 1] : "";
      if (previous && /[A-Za-z0-9._%+\-]/.test(previous)) { closeMention(); return; }
      const changed = !state.mentionOpen || state.mentionStart !== at || state.mentionQuery !== token;
      state.mentionOpen = true;
      state.mentionStart = at;
      state.mentionQuery = token;
      if (changed) state.mentionIndex = 0;
      renderMentionPopup();
    }

    export function selectMention(key) {
      const entity = storyEntityById(String(key).split(":").slice(1).join(":"));
      const editor = document.getElementById("manuscript");
      if (!entity || !editor) return;
      const start = state.mentionStart;
      const caret = editor.selectionStart;
      const query = state.mentionQuery;
      const insert = mentionEntityName(entity, query);
      closeMention();
      editor.focus();
      editor.setSelectionRange(start, caret);
      let inserted = false;
      try { inserted = document.execCommand("insertText", false, insert); } catch (error) { inserted = false; }
      if (!inserted) {
        editor.setRangeText(insert, start, caret, "end");
        editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: insert }));
      }
      editor.setSelectionRange(start + insert.length, start + insert.length);
      const group = entityRefGroup(entity.type);
      addChapterRef(currentChapter(), group, entity.id);
      rememberRecentRef(entity);
      state.referenceScope = "chapter";
      state.referenceEntity = mentionKey(entity);
      state.referenceQuery = "";
      state.rightTab = REF_GROUP_DEFS[group].tab;
      if (entity.type === "character") { state.character = entity.id; state.worldEntity = entity.id; }
      if (entity.type === "place") state.mapPoint = entity.record.name;
      if (entity.type === "item") state.weapon = entity.id;
      if (group === "world") { state.worldEntity = entity.id; state.worldType = entity.type; }
      refreshWritingReference();
    }