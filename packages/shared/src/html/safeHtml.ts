export type HtmlInlineNode =
  | {
      type: "text";
      text: string;
      bold?: boolean;
      italic?: boolean;
      href?: string;
    }
  | { type: "br" };

export type HtmlBlockNode =
  | { type: "paragraph"; inlines: HtmlInlineNode[] }
  | { type: "list"; ordered: boolean; items: HtmlInlineNode[][] };

type ActiveMarks = {
  bold: boolean;
  italic: boolean;
  href: string | null;
};

type TagFrame =
  | { tag: "strong" | "em"; previous: ActiveMarks }
  | { tag: "a"; previous: ActiveMarks };

const EMPTY_MARKS: ActiveMarks = {
  bold: false,
  italic: false,
  href: null,
};

export function parseSafeHtml(input: string): HtmlBlockNode[] {
  const source = (input ?? "").replace(/\r\n/g, "\n").trim();
  if (!source) {
    return [];
  }

  const hasHtmlTags = /<\s*\/?\s*[a-zA-Z]/.test(source);
  if (!hasHtmlTags) {
    return parsePlainText(source);
  }

  const tokens = source.match(/<[^>]*>|[^<]+/g) ?? [];
  const blocks: HtmlBlockNode[] = [];
  let activeMarks: ActiveMarks = { ...EMPTY_MARKS };
  const tagStack: TagFrame[] = [];
  let currentParagraph: HtmlInlineNode[] | null = null;
  let currentList: { ordered: boolean; items: HtmlInlineNode[][] } | null = null;
  let currentListItem: HtmlInlineNode[] | null = null;
  let skipTagContent: "script" | "style" | null = null;

  function ensureParagraph(): HtmlInlineNode[] {
    if (!currentParagraph) {
      currentParagraph = [];
    }
    return currentParagraph;
  }

  function currentInlineTarget(): HtmlInlineNode[] {
    if (currentListItem) {
      return currentListItem;
    }
    return ensureParagraph();
  }

  function appendInline(node: HtmlInlineNode) {
    const target = currentInlineTarget();
    const previous = target[target.length - 1];
    if (node.type === "text" && previous?.type === "text") {
      const sameStyle =
        Boolean(previous.bold) === Boolean(node.bold) &&
        Boolean(previous.italic) === Boolean(node.italic) &&
        (previous.href ?? "") === (node.href ?? "");
      if (sameStyle) {
        previous.text += node.text;
        return;
      }
    }
    target.push(node);
  }

  function closeParagraph() {
    if (!currentParagraph) return;
    const inlines = normalizeInlines(currentParagraph);
    if (inlines.length > 0) {
      blocks.push({ type: "paragraph", inlines });
    }
    currentParagraph = null;
  }

  function closeListItem() {
    if (!currentListItem || !currentList) return;
    const inlines = normalizeInlines(currentListItem);
    if (inlines.length > 0) {
      currentList.items.push(inlines);
    }
    currentListItem = null;
  }

  function closeList() {
    if (!currentList) return;
    closeListItem();
    if (currentList.items.length > 0) {
      blocks.push({
        type: "list",
        ordered: currentList.ordered,
        items: currentList.items,
      });
    }
    currentList = null;
  }

  function closeAllFormatting() {
    activeMarks = { ...EMPTY_MARKS };
    tagStack.length = 0;
  }

  function startList(ordered: boolean) {
    closeParagraph();
    if (currentList && currentList.ordered !== ordered) {
      closeList();
    }
    if (!currentList) {
      currentList = { ordered, items: [] };
    }
  }

  function startListItem() {
    if (!currentList) {
      startList(false);
    }
    closeListItem();
    closeAllFormatting();
    currentListItem = [];
  }

  for (const token of tokens) {
    const isTag = token.startsWith("<");
    if (!isTag) {
      if (skipTagContent) {
        continue;
      }
      const decoded = decodeEntities(token);
      if (!decoded) {
        continue;
      }
      appendInline({
        type: "text",
        text: decoded,
        bold: activeMarks.bold || undefined,
        italic: activeMarks.italic || undefined,
        href: activeMarks.href ?? undefined,
      });
      continue;
    }

    const tagMatch = token.match(/^<\s*(\/)?\s*([a-zA-Z0-9]+)([^>]*)>/);
    if (!tagMatch) {
      continue;
    }

    const closing = Boolean(tagMatch[1]);
    const tagName = tagMatch[2].toLowerCase();
    const attrs = tagMatch[3] ?? "";
    const selfClosing = /\/\s*>$/.test(token) || tagName === "br";

    if (skipTagContent) {
      if (closing && tagName === skipTagContent) {
        skipTagContent = null;
      }
      continue;
    }

    if (!closing && (tagName === "script" || tagName === "style")) {
      skipTagContent = tagName;
      continue;
    }

    if (tagName === "p") {
      if (closing) {
        closeAllFormatting();
        closeParagraph();
      } else {
        closeList();
        closeParagraph();
        currentParagraph = [];
      }
      continue;
    }

    if (tagName === "ul" || tagName === "ol") {
      if (closing) {
        closeAllFormatting();
        closeList();
      } else {
        startList(tagName === "ol");
      }
      continue;
    }

    if (tagName === "li") {
      if (closing) {
        closeAllFormatting();
        closeListItem();
      } else {
        startListItem();
      }
      continue;
    }

    if (tagName === "br") {
      appendInline({ type: "br" });
      continue;
    }

    if (tagName === "strong" || tagName === "b") {
      if (closing) {
        restoreMarks("strong");
      } else {
        tagStack.push({ tag: "strong", previous: { ...activeMarks } });
        activeMarks.bold = true;
      }
      continue;
    }

    if (tagName === "em" || tagName === "i") {
      if (closing) {
        restoreMarks("em");
      } else {
        tagStack.push({ tag: "em", previous: { ...activeMarks } });
        activeMarks.italic = true;
      }
      continue;
    }

    if (tagName === "a") {
      if (closing) {
        restoreMarks("a");
      } else {
        const href = parseHref(attrs);
        tagStack.push({ tag: "a", previous: { ...activeMarks } });
        activeMarks.href = href;
      }
      continue;
    }

    if (selfClosing) {
      continue;
    }
  }

  closeAllFormatting();
  closeParagraph();
  closeList();

  if (blocks.length === 0) {
    return parsePlainText(source);
  }

  return blocks;

  function restoreMarks(tag: TagFrame["tag"]) {
    for (let index = tagStack.length - 1; index >= 0; index -= 1) {
      if (tagStack[index].tag !== tag) {
        continue;
      }
      const frame = tagStack[index];
      tagStack.splice(index, 1);
      activeMarks = { ...frame.previous };
      return;
    }
  }
}

function parsePlainText(source: string): HtmlBlockNode[] {
  const blocks: HtmlBlockNode[] = [];
  const paragraphs = source.split(/\n\s*\n/g);

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (trimmed.split("\n").every((line) => line.trim().startsWith("- "))) {
      const items = trimmed
        .split("\n")
        .map((line) => line.trim().replace(/^- /, ""))
        .filter((line) => line.length > 0)
        .map((line) => [{ type: "text", text: line } as HtmlInlineNode]);
      if (items.length > 0) {
        blocks.push({ type: "list", ordered: false, items });
      }
      continue;
    }

    const lines = trimmed.split("\n");
    const inlines: HtmlInlineNode[] = [];
    lines.forEach((line, index) => {
      if (index > 0) {
        inlines.push({ type: "br" });
      }
      inlines.push({ type: "text", text: line.trim() });
    });
    blocks.push({ type: "paragraph", inlines });
  }

  return blocks;
}

function parseHref(attrs: string): string | null {
  const hrefMatch = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
  const rawHref = hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "";
  const href = rawHref.trim();
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) {
    return href;
  }
  return null;
}

function normalizeInlines(nodes: HtmlInlineNode[]): HtmlInlineNode[] {
  const normalized: HtmlInlineNode[] = [];
  for (const node of nodes) {
    if (node.type === "text") {
      if (!node.text) continue;
      const previous = normalized[normalized.length - 1];
      if (previous?.type === "text") {
        const sameStyle =
          Boolean(previous.bold) === Boolean(node.bold) &&
          Boolean(previous.italic) === Boolean(node.italic) &&
          (previous.href ?? "") === (node.href ?? "");
        if (sameStyle) {
          previous.text += node.text;
          continue;
        }
      }
    }
    normalized.push(node);
  }

  while (normalized[0]?.type === "br") {
    normalized.shift();
  }
  while (normalized[normalized.length - 1]?.type === "br") {
    normalized.pop();
  }

  return normalized;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}
