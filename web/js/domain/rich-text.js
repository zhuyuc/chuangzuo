import { escapeHtml } from "../core/utils.js";




/* 龙吟写作 · 灵感富文本清洗与纯文本派生 */
const ALLOWED_TAGS = new Set(["P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "S", "DEL", "UL", "OL", "LI", "BLOCKQUOTE"]);
const BLOCKED_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "FORM", "INPUT", "TEXTAREA", "SELECT", "BUTTON", "SVG", "MATH"]);
const LINE_TAGS = new Set(["P", "DIV", "LI", "BLOCKQUOTE"]);

export function sanitizeRichText(value) {
  const doc = new DOMParser().parseFromString(String(value || ""), "text/html");
  const clean = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) { child.remove(); return; }
      if (BLOCKED_TAGS.has(child.tagName)) { child.remove(); return; }
      clean(child);
      if (!ALLOWED_TAGS.has(child.tagName)) { child.replaceWith(...child.childNodes); return; }
      [...child.attributes].forEach(attribute => child.removeAttribute(attribute.name));
    });
  };
  clean(doc.body);
  return doc.body.innerHTML;
}

export function richTextToPlain(value) {
  const doc = new DOMParser().parseFromString(String(value || ""), "text/html");
  let plain = "";
  const walk = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) { plain += child.nodeValue; return; }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      if (child.tagName === "BR") { plain += "\n"; return; }
      const line = LINE_TAGS.has(child.tagName);
      if (line && plain && !plain.endsWith("\n")) plain += "\n";
      walk(child);
      if (line && plain && !plain.endsWith("\n")) plain += "\n";
    });
  };
  walk(doc.body);
  return plain.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function plainTextToRichHtml(value) {
  return escapeHtml(String(value || "")).replace(/\r?\n/g, "<br>");
}

export function inspirationRichHtml(item) {
  return item?.html ? sanitizeRichText(item.html) : plainTextToRichHtml(item?.text || "");
}