import type { CatalogItem } from "@bizu/shared";

export type IndexedCatalogItem = {
  item: CatalogItem;
  titleNormalized: string;
  tagsNormalized: string[];
  descriptionNormalized: string;
  textBodyNormalized: string;
  searchBlob: string;
};

export type RankedCatalogItem = {
  item: CatalogItem;
  score: number;
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function buildSearchIndex(items: CatalogItem[]): IndexedCatalogItem[] {
  return items.map((item) => {
    const titleNormalized = normalize(item.title);
    const tagsNormalized = (item.tags ?? []).map((tag) => normalize(tag));
    const descriptionNormalized = normalize(item.description ?? "");
    const textBodyNormalized = normalize(item.text_body ?? "");
    const searchBlob = [titleNormalized, tagsNormalized.join(" "), descriptionNormalized, textBodyNormalized]
      .filter(Boolean)
      .join(" ");

    return {
      item,
      titleNormalized,
      tagsNormalized,
      descriptionNormalized,
      textBodyNormalized,
      searchBlob,
    };
  });
}

export function searchCatalogIndex(
  index: IndexedCatalogItem[],
  rawQuery: string,
  limit = 50,
): RankedCatalogItem[] {
  const normalizedQuery = normalize(rawQuery);
  if (!normalizedQuery) {
    return index
      .slice()
      .sort((a, b) => a.item.title.localeCompare(b.item.title, "pt-BR"))
      .slice(0, limit)
      .map((entry) => ({ item: entry.item, score: 0 }));
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const ranked: RankedCatalogItem[] = [];

  for (const entry of index) {
    // Fast reject to skip scoring when nothing matches.
    const hasAnyTerm = terms.some((term) => entry.searchBlob.includes(term));
    if (!hasAnyTerm) {
      continue;
    }

    let score = 0;
    for (const term of terms) {
      if (entry.titleNormalized.startsWith(term)) {
        score += 100;
      } else if (entry.titleNormalized.includes(term)) {
        score += 60;
      }

      if (entry.tagsNormalized.some((tag) => tag.includes(term))) {
        score += 40;
      }
      if (entry.descriptionNormalized.includes(term)) {
        score += 20;
      }
      if (entry.textBodyNormalized.includes(term)) {
        score += 10;
      }
    }

    if (score > 0) {
      ranked.push({
        item: entry.item,
        score,
      });
    }
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.item.title.localeCompare(b.item.title, "pt-BR");
  });

  return ranked.slice(0, limit);
}
