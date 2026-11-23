import { importMaterialFile } from "./material-files.js";





/* 龙吟写作 · 全局指针反馈与文件拖放 */
let bookTiltTarget = null;

export function attachUiPointerEvents() {
  document.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    const host = event.target.closest ? event.target.closest(".button.primary") : null;
    if (!host || host.disabled) return;
    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${event.clientX - rect.left - size / 2}px`;
    span.style.top = `${event.clientY - rect.top - size / 2}px`;
    host.appendChild(span);
    setTimeout(() => span.remove(), 600);
  }, { passive: true });

  document.addEventListener("dragover", event => {
    if (event.target.closest(".materials-layout")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }
  });

  document.addEventListener("drop", event => {
    if (!event.target.closest(".materials-layout") || !event.dataTransfer.files.length) return;
    event.preventDefault();
    Array.from(event.dataTransfer.files).forEach(file => importMaterialFile(file));
  });

  document.addEventListener("pointermove", event => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || event.pointerType === "touch") return;
    const target = event.target.closest?.("[data-book-tilt]") || null;
    if (bookTiltTarget && bookTiltTarget !== target) {
      bookTiltTarget.style.setProperty("--tilt-x", "0deg");
      bookTiltTarget.style.setProperty("--tilt-y", "0deg");
    }
    bookTiltTarget = target;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    target.style.setProperty("--tilt-x", `${(x * 5).toFixed(2)}deg`);
    target.style.setProperty("--tilt-y", `${(-y * 4).toFixed(2)}deg`);
  });
}