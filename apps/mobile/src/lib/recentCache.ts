import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_KEY = "recent.itemIds";
const MAX_RECENT_ITEMS = 10;

export async function loadRecentItemIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(RECENT_KEY);
  if (!raw) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await AsyncStorage.removeItem(RECENT_KEY);
    return [];
  }

  if (!Array.isArray(parsed)) {
    await AsyncStorage.removeItem(RECENT_KEY);
    return [];
  }

  return sanitizeRecentIds(parsed).slice(0, MAX_RECENT_ITEMS);
}

export async function saveRecentItemIds(ids: string[]): Promise<void> {
  const sanitized = sanitizeRecentIds(ids).slice(0, MAX_RECENT_ITEMS);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(sanitized));
}

export async function addRecentItem(id: string): Promise<void> {
  const normalized = typeof id === "string" ? id.trim() : "";
  if (!normalized) {
    return;
  }

  const current = await loadRecentItemIds();
  const withoutCurrent = current.filter((entry) => entry !== normalized);
  const next = [normalized, ...withoutCurrent].slice(0, MAX_RECENT_ITEMS);
  await saveRecentItemIds(next);
}

function sanitizeRecentIds(input: unknown[]): string[] {
  const unique = new Set<string>();
  const ordered: string[] = [];

  for (const value of input) {
    if (typeof value !== "string") {
      continue;
    }
    const id = value.trim();
    if (!id || unique.has(id)) {
      continue;
    }
    unique.add(id);
    ordered.push(id);
  }

  return ordered;
}
