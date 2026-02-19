export type MarkdownInlineNode =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "link"; text: string; href: string };

export type MarkdownBlockNode =
  | { type: "paragraph"; inlines: MarkdownInlineNode[] }
  | { type: "list"; items: MarkdownInlineNode[][] };

export function parseSimpleMarkdown(input: string): MarkdownBlockNode[] {
  const source = (input ?? "").replace(/\r\n/g, "\n").trim();
  if (!source) {
    return [];
  }

  const blocks: MarkdownBlockNode[] = [];
  const lines = source.split("\n");
  let index = 0;

  while (index < lines.length) {
    const current = lines[index];

    if (!current.trim()) {
      index += 1;
      continue;
    }

    if (isListLine(current)) {
      const listItems: MarkdownInlineNode[][] = [];
      while (index < lines.length && isListLine(lines[index])) {
        const itemText = lines[index].replace(/^\s*-\s+/, "").trim();
        const inlines = parseInline(itemText);
        listItems.push(inlines.length > 0 ? inlines : [{ type: "text", text: "" }]);
        index += 1;
      }
      blocks.push({ type: "list", items: listItems });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index].trim() && !isListLine(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    const paragraphText = paragraphLines.join(" ").trim();
    if (paragraphText) {
      blocks.push({ type: "paragraph", inlines: parseInline(paragraphText) });
    }
  }

  return blocks;
}

function isListLine(value: string): boolean {
  return /^\s*-\s+/.test(value);
}

function parseInline(text: string): MarkdownInlineNode[] {
  const nodes: MarkdownInlineNode[] = [];
  let cursor = 0;
  let plainBuffer = "";

  function flushPlain() {
    if (!plainBuffer) return;
    nodes.push({ type: "text", text: plainBuffer });
    plainBuffer = "";
  }

  while (cursor < text.length) {
    if (text.startsWith("**", cursor)) {
      const end = text.indexOf("**", cursor + 2);
      if (end > cursor + 2) {
        flushPlain();
        nodes.push({ type: "bold", text: text.slice(cursor + 2, end) });
        cursor = end + 2;
        continue;
      }
    }

    if (text[cursor] === "*") {
      const end = text.indexOf("*", cursor + 1);
      if (end > cursor + 1) {
        flushPlain();
        nodes.push({ type: "italic", text: text.slice(cursor + 1, end) });
        cursor = end + 1;
        continue;
      }
    }

    if (text[cursor] === "[") {
      const closeLabel = text.indexOf("]", cursor + 1);
      const openHref = closeLabel >= 0 ? text.indexOf("(", closeLabel + 1) : -1;
      const closeHref = openHref >= 0 ? text.indexOf(")", openHref + 1) : -1;
      if (closeLabel > cursor + 1 && openHref === closeLabel + 1 && closeHref > openHref + 1) {
        const label = text.slice(cursor + 1, closeLabel).trim();
        const href = sanitizeHref(text.slice(openHref + 1, closeHref));
        if (label && href) {
          flushPlain();
          nodes.push({ type: "link", text: label, href });
          cursor = closeHref + 1;
          continue;
        }
      }
    }

    plainBuffer += text[cursor];
    cursor += 1;
  }

  flushPlain();

  return mergeAdjacentTextNodes(nodes);
}

function sanitizeHref(rawHref: string): string | null {
  const href = rawHref.trim();
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) {
    return href;
  }
  return null;
}

function mergeAdjacentTextNodes(nodes: MarkdownInlineNode[]): MarkdownInlineNode[] {
  const merged: MarkdownInlineNode[] = [];

  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.type === "text" && last?.type === "text") {
      last.text += node.text;
      continue;
    }
    merged.push(node);
  }

  return merged;
}
