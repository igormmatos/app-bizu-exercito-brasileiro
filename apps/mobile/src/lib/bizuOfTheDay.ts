import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CatalogItem } from "@bizu/shared";

const TODAY_KEY_STORAGE = "bizu.todayKey";
const ITEM_ID_STORAGE = "bizu.itemId";

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function pickBizuOfTheDay(items: CatalogItem[], seed: string): CatalogItem | null {
  const eligible = getEligibleItems(items);
  if (eligible.length === 0) {
    return null;
  }

  const sorted = eligible.slice().sort((a, b) => a.id.localeCompare(b.id, "en"));
  const idsFingerprint = sorted.map((item) => item.id).join("|");
  const hash = hashString(`${seed}|${idsFingerprint}`);
  const index = hash % sorted.length;
  return sorted[index] ?? null;
}

export async function loadBizuOfTheDay(items: CatalogItem[]): Promise<CatalogItem | null> {
  const eligible = getEligibleItems(items);
  if (eligible.length === 0) {
    await clearBizuOfTheDayCache();
    return null;
  }

  const todayKey = getTodayKey();
  const [cachedDay, cachedItemId] = await Promise.all([
    AsyncStorage.getItem(TODAY_KEY_STORAGE),
    AsyncStorage.getItem(ITEM_ID_STORAGE),
  ]);

  if (cachedDay === todayKey && cachedItemId) {
    const cachedItem = eligible.find((item) => item.id === cachedItemId);
    if (cachedItem) {
      return cachedItem;
    }
  }

  const picked = pickBizuOfTheDay(eligible, todayKey);
  if (!picked) {
    await clearBizuOfTheDayCache();
    return null;
  }

  await Promise.all([
    AsyncStorage.setItem(TODAY_KEY_STORAGE, todayKey),
    AsyncStorage.setItem(ITEM_ID_STORAGE, picked.id),
  ]);
  return picked;
}

export async function clearBizuOfTheDayCache(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(TODAY_KEY_STORAGE),
    AsyncStorage.removeItem(ITEM_ID_STORAGE),
  ]);
}

function getEligibleItems(items: CatalogItem[]): CatalogItem[] {
  return items.filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }
    if (!item.id || !item.title || !item.type) {
      return false;
    }
    if (!item.updated_at || !item.published) {
      return false;
    }
    return true;
  });
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return hash >>> 0;
}
