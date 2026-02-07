import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";
import { normalize, searchCatalogIndex } from "@/src/lib/searchIndex";
import { colors } from "@/src/theme/tokens";

export default function SearchScreen() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { items, searchIndex, downloadedMap, loadingCache, isFavorite, toggleFavorite } = useCatalog();
  const [query, setQuery] = useState(typeof q === "string" ? q : "");

  useEffect(() => {
    if (typeof q === "string") {
      setQuery(q);
    }
  }, [q]);

  const normalizedQuery = normalize(query);
  const rankedResults = useMemo(
    () => searchCatalogIndex(searchIndex, normalizedQuery, 50),
    [searchIndex, normalizedQuery],
  );

  async function handleToggleFavorite(id: string) {
    try {
      await toggleFavorite(id);
    } catch {
      // message handled by context
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Busca</Text>
      <Text style={styles.subtitle}>Resultados locais com ranking de relevancia.</Text>

      <TextInput
        placeholder="Digite para buscar..."
        placeholderTextColor={colors.gray500}
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      {loadingCache ? <Text>Carregando cache local...</Text> : null}

      {!loadingCache && items.length === 0 ? (
        <Text style={styles.empty}>Sem itens no cache. Execute a sincronizacao na rota Admin.</Text>
      ) : null}

      {!loadingCache && items.length > 0 ? (
        <Text style={styles.resultCount}>
          {rankedResults.length} resultado(s)
          {normalizedQuery ? ` para "${query}"` : " (top 50 em ordem alfabetica)"}
        </Text>
      ) : null}

      {!loadingCache && items.length > 0 && rankedResults.length === 0 ? (
        <Text style={styles.empty}>Nenhum resultado para "{query}".</Text>
      ) : null}

      {!loadingCache
        ? rankedResults.map(({ item, score }) => (
            <View key={item.id} style={styles.card}>
              <Pressable
                style={styles.cardMain}
                onPress={() =>
                  router.push({
                    pathname: "/item/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <Text style={styles.cardTitle}>{renderHighlightedTitle(item.title, normalizedQuery)}</Text>
                <Text style={styles.cardMeta}>
                  {item.type}
                  {normalizedQuery ? ` • score ${score}` : ""}
                </Text>
                {item.type !== "text" && downloadedMap[item.id] ? (
                  <Text style={styles.offline}>Offline</Text>
                ) : null}
              </Pressable>
              <Pressable style={styles.favoriteButton} onPress={() => void handleToggleFavorite(item.id)}>
                <Ionicons
                  name={isFavorite(item.id) ? "star" : "star-outline"}
                  size={18}
                  color={isFavorite(item.id) ? colors.army600 : colors.gray500}
                />
              </Pressable>
            </View>
          ))
        : null}
    </View>
  );
}

function renderHighlightedTitle(title: string, normalizedQuery: string): ReactNode {
  if (!normalizedQuery) {
    return title;
  }

  const match = findNormalizedMatch(title, normalizedQuery);
  if (!match) {
    return title;
  }

  return (
    <Text>
      {title.slice(0, match.start)}
      <Text style={styles.highlight}>{title.slice(match.start, match.end)}</Text>
      {title.slice(match.end)}
    </Text>
  );
}

function findNormalizedMatch(text: string, normalizedNeedle: string): { start: number; end: number } | null {
  if (!text || !normalizedNeedle) {
    return null;
  }

  let normalized = "";
  const normalizedToOriginal: number[] = [];

  for (let i = 0; i < text.length; i += 1) {
    const normalizedChar = normalize(text[i]).replace(/\s+/g, "");
    if (!normalizedChar) {
      continue;
    }
    normalized += normalizedChar;
    for (let j = 0; j < normalizedChar.length; j += 1) {
      normalizedToOriginal.push(i);
    }
  }

  const index = normalized.indexOf(normalizedNeedle);
  if (index < 0) {
    return null;
  }

  const start = normalizedToOriginal[index] ?? 0;
  const endIndex = normalizedToOriginal[index + normalizedNeedle.length - 1];
  const end = typeof endIndex === "number" ? endIndex + 1 : start + 1;
  return { start, end };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: colors.gray100,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.gray900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray700,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.white,
    color: colors.gray900,
  },
  resultCount: {
    fontSize: 13,
    color: colors.gray700,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 8,
    padding: 10,
    backgroundColor: colors.white,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  cardMain: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray900,
  },
  cardMeta: {
    marginTop: 4,
    color: colors.gray500,
  },
  offline: {
    marginTop: 6,
    color: colors.gray700,
    fontWeight: "600",
  },
  highlight: {
    backgroundColor: "#fff1b8",
    color: colors.gray900,
    fontWeight: "700",
  },
  favoriteButton: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 999,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  empty: {
    fontSize: 14,
    color: colors.gray700,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
  },
});
