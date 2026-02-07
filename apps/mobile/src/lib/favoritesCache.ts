import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "favorites.itemIds";

export async function loadFavorites(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    return [];
  }

  if (!Array.isArray(parsed)) {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    return [];
  }

  return sanitizeIds(parsed);
}

export async function saveFavorites(ids: string[]): Promise<void> {
  const sanitized = sanitizeIds(ids);
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(sanitized));
}

export async function addFavorite(id: string): Promise<void> {
  const current = await loadFavorites();
  if (current.includes(id)) {
    return;
  }
  current.push(id);
  await saveFavorites(current);
}

export async function removeFavorite(id: string): Promise<void> {
  const current = await loadFavorites();
  const next = current.filter((entry) => entry !== id);
  await saveFavorites(next);
}

function sanitizeIds(input: unknown[]): string[] {
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
