/* 龙吟写作 · 基础工具与提示 */
    let toastTimer;
    export function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }

    export function safeUrl(value) {
      try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; }
    }

    export function notify(message, kind = "info") {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("show");
      toast.classList.toggle("error", kind === "error");
      clearTimeout(toastTimer);
      if (kind === "error") { toastTimer = null; return; }
      toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
    }

    export function notifyError(message) { notify(message, "error"); }
