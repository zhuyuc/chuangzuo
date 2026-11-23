/* 龙吟写作 · 灵感富文本工具栏 */
export function richEditorClicks(event, target) {
  const command = target.dataset.richCommand;
  if (!command) return false;
  const editor = target.closest("[data-rich-editor]")?.querySelector("[data-rich-input]");
  if (!editor) return true;
  editor.focus();
  if (command === "quote") {
    const selection = window.getSelection();
    let node = selection?.anchorNode;
    let quoted = false;
    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BLOCKQUOTE") { quoted = true; break; }
      node = node.parentNode;
    }
    document.execCommand("formatBlock", false, quoted ? "p" : "blockquote");
  } else {
    document.execCommand(command, false, null);
  }
  return true;
}