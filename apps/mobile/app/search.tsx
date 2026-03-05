import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen, WebContent } from "@/src/components/layout";
import { Card, ContentListItem, PillBadge, SearchBar } from "@/src/components/ui";
import { normalize, searchCatalogIndex } from "@/src/lib/searchIndex";
import { useCatalog } from "@/src/state/catalogContext";
import { type ContentType, colors } from "@/src/theme/tokens";

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
      // message handled in context
    }
  }

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <WebContent style={styles.container}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar bizu, canção..."
          returnKeyType="search"
          autoFocus={typeof q === "string" && q.length > 0}
        />

        {loadingCache ? <Text style={styles.metaText}>Carregando cache local...</Text> : null}

        {!loadingCache && items.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Sem itens no cache. Execute a sincronização na rota Admin.</Text>
          </Card>
        ) : null}

        {!loadingCache && items.length > 0 ? (
          <Text style={styles.resultCount}>
            {rankedResults.length} resultado(s)
            {normalizedQuery ? ` para "${query}"` : " (top 50)"}
          </Text>
        ) : null}

        {!loadingCache && items.length > 0 && rankedResults.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum resultado para "{query}".</Text>
          </Card>
        ) : null}

        {!loadingCache
          ? rankedResults.map(({ item }) => (
              <ContentListItem
                key={item.id}
                type={item.type as ContentType}
                title={item.title}
                subtitle={item.description ?? item.type}
                onPress={() =>
                  router.push({
                    pathname: "/item/[id]",
                    params: { id: item.id },
                  })
                }
                trailing={
                  <View style={styles.trailingWrap}>
                    {item.storage_path && downloadedMap[item.id] ? (
                      <PillBadge label="Offline" tone="success" style={styles.offlineBadge} />
                    ) : null}
                    <Pressable
                      style={styles.favoriteIconButton}
                      onPress={() => void handleToggleFavorite(item.id)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={isFavorite(item.id) ? "star" : "star-outline"}
                        size={18}
                        color={isFavorite(item.id) ? "#F59E0B" : colors.gray500}
                      />
                    </Pressable>
                  </View>
                }
              />
            ))
          : null}
        </WebContent>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  container: {
    gap: 12,
    backgroundColor: colors.gray100,
  },
  metaText: {
    fontSize: 14,
    color: colors.gray700,
  },
  resultCount: {
    fontSize: 13,
    color: colors.gray700,
    fontWeight: "600",
  },
  trailingWrap: {
    gap: 6,
    alignItems: "center",
  },
  offlineBadge: {
    minHeight: 18,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  favoriteIconButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray700,
  },
});
