import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";
import { normalize, searchCatalogIndex } from "@/src/lib/searchIndex";

export default function SearchScreen() {
  const router = useRouter();
  const { items, searchIndex, downloadedMap, loadingCache } = useCatalog();
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query);

  const rankedResults = useMemo(
    () => searchCatalogIndex(searchIndex, normalizedQuery, 50),
    [searchIndex, normalizedQuery],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>
        Busca local com ranking (titulo, tags, descricao e texto), sem depender de rede.
      </Text>

      <TextInput
        placeholder="Digite para buscar..."
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      {loadingCache ? <Text>Carregando cache local...</Text> : null}

      {!loadingCache && items.length === 0 ? (
        <Text style={styles.empty}>Sem itens no cache. Execute a sincronizacao na aba Admin.</Text>
      ) : null}

      {!loadingCache && items.length > 0 ? (
        <Text style={styles.resultCount}>
          {rankedResults.length} resultado(s)
          {normalizedQuery ? ` para "${query}"` : " (top 50 em ordem alfabetica)"}
        </Text>
      ) : null}

      {!loadingCache && items.length > 0 && rankedResults.length === 0 ? (
        <Text style={styles.empty}>Nenhum item encontrado para "{query}".</Text>
      ) : null}

      {!loadingCache
        ? rankedResults.map(({ item, score }) => (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/item/[id]",
                  params: { id: item.id },
                })
              }
            >
              <Text style={styles.cardTitle}>
                {renderHighlightedTitle(item.title, normalizedQuery)}
              </Text>
              <Text style={styles.cardMeta}>
                {item.type}
                {normalizedQuery ? ` • score ${score}` : ""}
              </Text>
              {item.type !== "text" && downloadedMap[item.id] ? (
                <Text style={styles.offline}>Offline</Text>
              ) : null}
            </Pressable>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  resultCount: {
    fontSize: 13,
    color: "#555",
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardMeta: {
    marginTop: 4,
    color: "#666",
  },
  offline: {
    marginTop: 6,
    color: "#0a7f33",
    fontWeight: "600",
  },
  highlight: {
    backgroundColor: "#fff1b8",
    color: "#111",
    fontWeight: "700",
  },
  empty: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    padding: 10,
  },
});

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
