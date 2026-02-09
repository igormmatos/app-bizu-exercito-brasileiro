import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/src/components/layout";
import { ContentListItem, PillBadge, SearchBar } from "@/src/components/ui";
import { useCatalog } from "@/src/state/catalogContext";
import { colors, type ContentType } from "@/src/theme/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const { categories, items, loadingCache, loadingBizu, bizuOfTheDay, downloadedMap, isFavorite, toggleFavorite } =
    useCatalog();
  const [searchQuery, setSearchQuery] = useState("");

  const categoryStats = useMemo(() => {
    const stats = new Map<string, { total: number; offline: number }>();
    for (const category of categories) {
      stats.set(category.id, { total: 0, offline: 0 });
    }

    for (const item of items) {
      const current = stats.get(item.category_id);
      if (!current) continue;
      current.total += 1;
      if (item.type !== "text" && downloadedMap[item.id]) {
        current.offline += 1;
      }
    }

    return stats;
  }, [categories, downloadedMap, items]);

  const recentItems = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 6),
    [items],
  );

  function openSearch() {
    const q = searchQuery.trim();
    router.push({
      pathname: "/search",
      params: q ? { q } : undefined,
    });
  }

  async function handleToggleFavorite(id: string) {
    try {
      await toggleFavorite(id);
    } catch {
      // message handled by context
    }
  }

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={openSearch}
          onFocus={openSearch}
          placeholder="Buscar bizu, canção..."
          returnKeyType="search"
        />

        <Text style={styles.sectionTitle}>Categorias</Text>
        {loadingCache ? <Text style={styles.metaText}>Carregando cache local...</Text> : null}

        {!loadingCache && categories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sem categorias no cache. Use "Sincronizar agora" na rota Admin.</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {!loadingCache
            ? categories.map((category) => {
                const stat = categoryStats.get(category.id) ?? { total: 0, offline: 0 };
                return (
                  <Pressable
                    key={category.id}
                    style={styles.gridItem}
                    onPress={() =>
                      router.push({
                        pathname: "/category/[id]",
                        params: { id: category.id },
                      })
                    }
                  >
                    {({ pressed }) => (
                      <View style={[styles.categoryCard, pressed ? styles.categoryCardPressed : null]}>
                        <View style={styles.categoryIconCircle}>
                          <Ionicons name="book-outline" size={18} color={colors.army600} />
                        </View>
                        <Text style={styles.categoryTitle} numberOfLines={2}>
                          {category.name}
                        </Text>
                        <Text style={styles.categoryCount}>{stat.total} itens</Text>
                        {stat.offline > 0 ? (
                          <PillBadge
                            label={`${stat.offline} offline`}
                            tone="success"
                            style={styles.categoryOfflineBadge}
                          />
                        ) : null}
                      </View>
                    )}
                  </Pressable>
                );
              })
            : null}
        </View>

        {!loadingBizu && bizuOfTheDay ? (
          <View style={styles.bizuCard}>
            <Text style={styles.bizuLabel}>Bizu do Dia</Text>
            <Text style={styles.bizuTitle} numberOfLines={2}>
              {bizuOfTheDay.title}
            </Text>
            <Text style={styles.bizuMeta} numberOfLines={2}>
              {bizuOfTheDay.description ?? "Bizu em destaque para consulta rápida."}
            </Text>
            <Pressable
              style={styles.bizuButton}
              onPress={() =>
                router.push({
                  pathname: "/item/[id]",
                  params: { id: bizuOfTheDay.id },
                })
              }
            >
              <Text style={styles.bizuButtonText}>Ler agora</Text>
            </Pressable>
          </View>
        ) : null}

        {!loadingCache && recentItems.length > 0 ? <Text style={styles.sectionTitle}>Acesso rápido</Text> : null}
        {!loadingCache
          ? recentItems.map((item) => (
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
                  <Pressable onPress={() => void handleToggleFavorite(item.id)} hitSlop={8}>
                    <Ionicons
                      name={isFavorite(item.id) ? "star" : "star-outline"}
                      size={18}
                      color={isFavorite(item.id) ? "#F59E0B" : colors.gray500}
                    />
                  </Pressable>
                }
              />
            ))
          : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: colors.gray100,
  },
  sectionTitle: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: "700",
    color: colors.gray900,
  },
  metaText: {
    fontSize: 14,
    color: colors.gray700,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 12,
  },
  emptyText: {
    color: colors.gray700,
    fontSize: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  gridItem: {
    width: "48%",
  },
  categoryCard: {
    minHeight: 114,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryCardPressed: {
    transform: [{ scale: 0.985 }],
  },
  categoryIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.army100,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.gray900,
  },
  categoryCount: {
    fontSize: 12,
    color: colors.gray500,
  },
  categoryOfflineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    minHeight: 18,
  },
  bizuCard: {
    borderRadius: 12,
    backgroundColor: colors.army800,
    padding: 14,
    gap: 8,
  },
  bizuLabel: {
    fontSize: 12,
    color: "#D1FAE5",
    fontWeight: "700",
  },
  bizuTitle: {
    fontSize: 19,
    lineHeight: 24,
    color: colors.white,
    fontWeight: "700",
  },
  bizuMeta: {
    fontSize: 13,
    color: "#E5E7EB",
  },
  bizuButton: {
    marginTop: 2,
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bizuButtonText: {
    color: colors.army900,
    fontSize: 13,
    fontWeight: "700",
  },
});
