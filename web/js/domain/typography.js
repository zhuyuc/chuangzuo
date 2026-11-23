/* 龙吟写作 · 中文排版纯函数 */
const CJK = "\\u3400-\\u9fff";
const STRUCTURAL = /^(?:#|>|[-*]\s)/;

export function isStructuralBlock(block) {
  return STRUCTURAL.test(String(block || "").trim());
}

export function splitParagraphs(text) {
  const source = String(text ?? "").replace(/\r\n?/g, "\n");
  if (!source.trim()) return [];
  if (/\n[ \t]*\n/.test(source)) {
    return source.split(/\n[ \t]*\n+/).map(block => block.replace(/[ \t]+\n/g, "\n").trim()).filter(Boolean);
  }
  return source.split("\n").map(line => line.trim()).filter(Boolean);
}

export function normalizePunctuation(text) {
  const source = String(text ?? "");
  let punctuation = 0;
  let blankLines = 0;
  let output = source
    .replace(/\.{3,}/g, () => { punctuation += 1; return "……"; })
    .replace(/-{2,}/g, () => { punctuation += 1; return "——"; })
    .replace(new RegExp(`([${CJK}])([,!?;:])`, "g"), (match, chinese, mark) => {
      punctuation += 1;
      return chinese + ({ ",": "，", "!": "！", "?": "？", ";": "；", ":": "：" }[mark] || mark);
    })
    .replace(new RegExp(`([${CJK}])\\.(?=$|[\\s“”‘’${CJK}])`, "g"), (match, chinese) => {
      punctuation += 1;
      return `${chinese}。`;
    })
    .replace(/[ \t]+\n/g, "\n");
  output = output.replace(/\n{3,}/g, () => { blankLines += 1; return "\n\n"; });
  output = output.replace(/^\n+/, "").replace(/\s+$/, "");
  return { text: output, punctuation, blankLines };
}

export function indentForExport(text) {
  return String(text ?? "").replace(/\r\n?/g, "\n").split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed || isStructuralBlock(trimmed) || trimmed.startsWith("　　")) return line;
    return `　　${trimmed}`;
  }).join("\n");
}

export function countCharacters(text) {
  return String(text ?? "").replace(/\s/g, "").length;
}