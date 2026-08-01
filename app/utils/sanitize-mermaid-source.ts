/**
 * Normalize and repair Prof Z / user Mermaid output so Mermaid.js can parse it.
 * Use `repairMermaidSource` before render; `prepareMermaidForRender` tries
 * progressively stronger fixes.
 */

const MAX_LABEL_LENGTH = 90;

function sanitizeLabelText(label: string): string {
  return label
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]+>/gi, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u2026/g, "...")
    .replace(/<br\s*\/?>/gi, " / ")
    .replace(/\s*\|\s*/g, " / ")
    .replace(/[;]+/g, "")
    .replace(/"+/g, "")
    .replace(/'+/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateLabel(label: string): string {
  if (label.length <= MAX_LABEL_LENGTH) return label;
  return `${label.slice(0, MAX_LABEL_LENGTH - 1)}…`;
}

function stripMarkdownFences(text: string): string {
  let output = text.trim();
  output = output.replace(/^```(?:mermaid)?\s*/i, "");
  output = output.replace(/```\s*$/i, "");
  output = output.replace(/^```(?:mermaid)?\s*/i, "");

  return output
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index) => {
      if (line === "```" || line === "```mermaid") return false;
      if (index === 0 && /^```(?:mermaid)?\s*/i.test(line)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

function ensureDiagramHeader(text: string): string {
  const trimmed = text.trim();
  if (/^(flowchart|graph)\s+(TD|TB|BT|RL|LR|td|tb|bt|rl|lr)\b/i.test(trimmed)) {
    return trimmed.replace(
      /^(flowchart|graph)\s+(TD|TB|BT|RL|LR|td|tb|bt|rl|lr)\b/i,
      (_, kind, dir) => `${kind.toLowerCase() === "graph" ? "flowchart" : "flowchart"} ${dir.toUpperCase()}`
    );
  }
  if (/^(flowchart|graph)\b/i.test(trimmed)) {
    return trimmed.replace(/^(flowchart|graph)\b/i, "flowchart TD");
  }
  return `flowchart TD\n${trimmed}`;
}

function sanitizeQuotedSubgraphLabels(text: string): string {
  return text.replace(/\["([^"]*)"\]/g, (_, label: string) => {
    return `["${truncateLabel(sanitizeLabelText(label))}"]`;
  });
}

function formatRectLabel(cleaned: string): string {
  if (!cleaned) return "[]";
  const escaped = cleaned.replace(/"/g, "'");
  if (/[,;:()\/&]/.test(escaped)) return `["${escaped}"]`;
  return `[${escaped}]`;
}

function sanitizeNodeLabels(text: string): string {
  return text.replace(
    /(\[\[[^\]]*\]\]|\[[^\]]*\]|\{[^}]*\}|\([^)]*\))/g,
    (segment) => {
      if (segment.startsWith("((")) {
        return `((${truncateLabel(sanitizeLabelText(segment.slice(2, -2)))}))`;
      }
      if (segment.startsWith("(") && !segment.startsWith("((")) {
        const inner = segment.slice(1, -1);
        const cleaned = truncateLabel(sanitizeLabelText(inner));
        if (/[,;:()\/&]/.test(cleaned)) {
          return `["${cleaned.replace(/"/g, "'")}"]`;
        }
        return `(${cleaned})`;
      }
      if (segment.startsWith("{")) {
        const cleaned = truncateLabel(sanitizeLabelText(segment.slice(1, -1)));
        return `{${cleaned}}`;
      }
      if (segment.startsWith("[[")) {
        const cleaned = truncateLabel(sanitizeLabelText(segment.slice(2, -2)));
        return `[[${cleaned}]]`;
      }
      const cleaned = truncateLabel(sanitizeLabelText(segment.slice(1, -1)));
      return formatRectLabel(cleaned);
    }
  );
}

function sanitizeEdgeLabels(text: string): string {
  return text
    .replace(/--"([^"]*)"/g, (_, label: string) => {
      return `--"${truncateLabel(sanitizeLabelText(label))}"`;
    })
    .replace(/--\s*([^->\n]+?)\s*-->/g, (_, label: string) => {
      const cleaned = truncateLabel(sanitizeLabelText(label));
      return cleaned ? `--"${cleaned}"-->` : "-->";
    });
}

function fixBrokenQuotes(text: string): string {
  return text
    .replace(/\u2026/g, "...")
    .replace(/"{2,}/g, '"');
}

function fixQuotedEdgeLabels(text: string): string {
  return text.replace(/--\s*"+([^"\n>-]*?)"*\s*-->/g, (_, label: string) => {
    const cleaned = truncateLabel(sanitizeLabelText(label));
    return cleaned ? `-->|${cleaned}|` : "-->";
  });
}

function fixMalformedQuotedEdges(text: string): string {
  return text
    .replace(/--\s*"+[^>\n-]*?--+>/g, "-->")
    .replace(/--\s*"+[^>\n]*?(?=-->)/g, "--");
}

function fixLinesWithUnbalancedQuotes(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const count = (line.match(/"/g) || []).length;
      if (count === 0 || count % 2 === 0) return line;
      return line.replace(/"/g, "");
    })
    .join("\n");
}

function simplifyBracketLabels(text: string): string {
  let output = text.replace(/\["([^"\[\]]+)"\]/g, (_, label: string) => {
    const cleaned = truncateLabel(sanitizeLabelText(label));
    if (!cleaned) return "[]";
    return formatRectLabel(cleaned);
  });

  output = output.replace(/(?<!\[)\[([^\[\]]+)\](?!\])/g, (_, label: string) => {
    const cleaned = truncateLabel(sanitizeLabelText(label));
    return formatRectLabel(cleaned);
  });

  return output;
}

/** Insert arrows between node definitions glued on one line: `]B[` → `] --> B[`. */
function fixGluedNodes(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (/^subgraph\b/i.test(line.trim()) || /^end\b/i.test(line.trim())) {
        return line;
      }

      let fixed = line.replace(
        /([\]\)])\s*([A-Za-z_][\w]*)\s*(?=(\[\[|\[|\{|\(|\(\())/g,
        "$1 --> $2"
      );

      fixed = fixed.replace(
        /(\]\]|])\s*(?=(\[\[|\[))/g,
        (match, closing, _lookahead, offset, whole) => {
          const before = whole.slice(0, offset).trimEnd();
          if (/-->$|---->|-\.->$/.test(before)) return match;
          return `${closing} --> `;
        }
      );

      return fixed;
    })
    .join("\n");
}

/** Split node IDs glued to closing brackets/parens: `Users]G -->` → `Users]\nG -->`. */
function splitDenseEdgeLines(text: string): string {
  return text
    .split("\n")
    .flatMap((line) => {
      let fixed = fixGluedNodes(line);
      if (!/-->|---|-\.->/.test(fixed)) return [fixed];

      fixed = fixed
        .replace(
          /\]\s*([A-Za-z_][\w]*)\s*(-->|---|-\.->)/g,
          "]\n$1 $2"
        )
        .replace(
          /\)\s*([A-Za-z_][\w]*)\s*(-->|---|-\.->)/g,
          ")\n$1 $2"
        )
        .replace(
          /(-->|---|-\.->)\s*([A-Za-z][\w]*)\s+([A-Za-z_][\w]*)\s*\[/g,
          "$1 $3["
        );

      fixed = fixGluedNodes(fixed);

      return fixed.split("\n").map((part) => part.trim()).filter(Boolean);
    })
    .join("\n");
}

/** Close node labels missing a trailing `]` before the next arrow or line end. */
function fixUnclosedBracketLabels(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (!line.includes("[") || /^subgraph\b/i.test(line.trim())) return line;

      let balance = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "[" && line[i + 1] !== "[") balance++;
        if (line[i] === "]" && line[i - 1] !== "]") balance--;
      }

      if (balance <= 0) return line;
      return `${line}${"]".repeat(balance)}`;
    })
    .join("\n");
}

function fixSubgraphs(text: string): string {
  let output = text.replace(
    /^subgraph\s+([A-Za-z_][\w]*)\s+as\s+(.+)$/gim,
    'subgraph $1 ["$2"]'
  );

  output = output.replace(/^subgraph\s+([^[\n{]+)$/gim, (match, title: string) => {
    const trimmed = title.trim();
    if (!trimmed || trimmed.includes("[")) return match;
    if (!/[\s:&?]/.test(trimmed)) return match;
    const id = `sg_${trimmed.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) || "group"}`;
    return `subgraph ${id} ["${truncateLabel(sanitizeLabelText(trimmed))}"]`;
  });

  return output;
}

function fixCitationMarkers(text: string): string {
  return text.replace(
    /([\[{(][^\]}]+?)\s+\[(\d+)\]([\]}])/g,
    "$1 ($2)$3"
  );
}

function normalizeLines(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/;\s*$/g, ""))
    .join("\n");
}

function removeUnsupportedDirectives(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^style\s+/i.test(trimmed)) return false;
      if (/^classDef\s+/i.test(trimmed)) return false;
      if (/^class\s+/i.test(trimmed)) return false;
      if (/^linkStyle\s+/i.test(trimmed)) return false;
      if (/^click\s+/i.test(trimmed)) return false;
      return true;
    })
    .join("\n");
}

function flattenSubgraphs(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\s*(subgraph\b|end)\s*$/i.test(line.trim()))
    .join("\n");
}

function dedupeAttempts(attempts: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const attempt of attempts) {
    const key = attempt.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(key);
  }
  return unique;
}

/** First-pass cleanup for display and storage. */
export function sanitizeMermaidSource(raw: string): string {
  if (!raw.trim()) return "";

  let text = stripMarkdownFences(raw);
  text = ensureDiagramHeader(text);
  text = fixBrokenQuotes(text);
  text = fixGluedNodes(text);
  text = splitDenseEdgeLines(text);
  text = fixUnclosedBracketLabels(text);
  text = fixSubgraphs(text);
  text = fixQuotedEdgeLabels(text);
  text = fixMalformedQuotedEdges(text);
  text = simplifyBracketLabels(text);
  text = fixGluedNodes(text);
  text = sanitizeQuotedSubgraphLabels(text);
  text = sanitizeNodeLabels(text);
  text = sanitizeEdgeLabels(text);
  text = fixCitationMarkers(text);
  text = fixLinesWithUnbalancedQuotes(text);
  text = normalizeLines(text);

  return text.trim();
}

/** Stronger repair before render — strips styling directives that often break parsers. */
export function repairMermaidSource(raw: string): string {
  let text = sanitizeMermaidSource(raw);
  text = removeUnsupportedDirectives(text);
  text = fixGluedNodes(text);
  text = splitDenseEdgeLines(text);
  text = fixUnclosedBracketLabels(text);
  text = fixMalformedQuotedEdges(text);
  text = fixLinesWithUnbalancedQuotes(text);
  text = simplifyBracketLabels(text);
  text = sanitizeNodeLabels(text);
  return normalizeLines(text);
}

/** Last-resort repair: flatten subgraph wrappers. */
export function repairMermaidSourceAggressive(raw: string): string {
  let text = repairMermaidSource(raw);
  text = flattenSubgraphs(text);
  text = sanitizeNodeLabels(text);
  return normalizeLines(text);
}

/** All repair attempts from gentle → aggressive (for render retry loop). */
export function prepareMermaidRepairAttempts(raw: string): string[] {
  return dedupeAttempts([
    sanitizeMermaidSource(raw),
    repairMermaidSource(raw),
    repairMermaidSourceAggressive(raw),
  ]);
}

/** Best-effort single string to store in the editor after Prof Z / before save. */
export function prepareMermaidForEditor(raw: string): string {
  return repairMermaidSource(raw);
}
