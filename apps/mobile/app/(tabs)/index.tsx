import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";
import { colors, getContentColor, type ContentType } from "@/src/theme/tokens";

export default function HomeScreen() {
  const router = useRouter();
  const {
    categories,
    items,
    downloadedMap,
    loadingCache,
    loadingBizu,
    bizuOfTheDay,
    favoriteIds,
    isFavorite,
    toggleFavorite,
  } = useCatalog();
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const recentItems = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .slice(0, 10),
    [items],
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
      <Text style={styles.title}>Bizu EB - Home</Text>
      <Text style={styles.subtitle}>Categorias em cache</Text>

      {loadingCache ? <Text>Carregando cache local...</Text> : null}
      {loadingBizu ? <Text>Carregando Bizu do Dia...</Text> : null}

      {!loadingCache && !loadingBizu && bizuOfTheDay ? (
        <View
          style={[
            styles.bizuCard,
            {
              borderColor: getContentColor(bizuOfTheDay.type as ContentType).primary,
              backgroundColor: getContentColor(bizuOfTheDay.type as ContentType).bg,
            },
          ]}
        >
          <Text style={styles.bizuLabel}>Bizu do Dia</Text>
          <Text style={styles.bizuTitle}>{bizuOfTheDay.title}</Text>
          <Text style={styles.bizuMeta}>
            {categoriesById.get(bizuOfTheDay.category_id) ?? "Sem categoria"} • {bizuOfTheDay.type}
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
            <Ionicons name={iconByType(bizuOfTheDay.type)} size={14} color={colors.white} />
            <Text style={styles.bizuButtonText}>Abrir</Text>
          </Pressable>
        </View>
      ) : null}

      {!loadingCache && categories.length === 0 ? (
        <Text style={styles.empty}>Sem categorias no cache. Use "Sincronizar agora" na rota Admin.</Text>
      ) : null}

      {!loadingCache
        ? categories.map((category) => (
            <Pressable
              key={category.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/category/[id]",
                  params: { id: category.id },
                })
              }
            >
              <Text style={styles.cardTitle}>{category.name}</Text>
              <Text style={styles.cardMeta}>
                Abrir itens da categoria • Offline: {countOfflineByCategory(category.id, items, downloadedMap)} •
                Favoritos: {countFavoritesByCategory(category.id, items, favoriteIds)}
              </Text>
            </Pressable>
          ))
        : null}

      {!loadingCache && recentItems.length > 0 ? (
        <Text style={styles.sectionTitle}>Acesso rapido</Text>
      ) : null}

      {!loadingCache
        ? recentItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Pressable
                style={styles.itemMain}
                onPress={() =>
                  router.push({
                    pathname: "/item/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>{item.type}</Text>
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
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.white,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray900,
  },
  cardMeta: {
    marginTop: 4,
    color: colors.gray500,
  },
  empty: {
    fontSize: 14,
    color: colors.gray700,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
  },
  bizuCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  bizuLabel: {
    fontSize: 12,
    color: colors.gray700,
    fontWeight: "700",
  },
  bizuTitle: {
    fontSize: 18,
    color: colors.gray900,
    fontWeight: "700",
  },
  bizuMeta: {
    fontSize: 13,
    color: colors.gray700,
  },
  bizuButton: {
    marginTop: 4,
    backgroundColor: colors.army600,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bizuButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray900,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemMain: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.gray900,
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 13,
    color: colors.gray500,
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
});

function countOfflineByCategory(
  categoryId: string,
  items: ReturnType<typeof useCatalog>["items"],
  downloadedMap: ReturnType<typeof useCatalog>["downloadedMap"],
): number {
  return items.filter((item) => item.category_id === categoryId && item.type !== "text" && downloadedMap[item.id])
    .length;
}

function countFavoritesByCategory(
  categoryId: string,
  items: ReturnType<typeof useCatalog>["items"],
  favoriteIds: string[],
): number {
  const favorites = new Set(favoriteIds);
  return items.filter((item) => item.category_id === categoryId && favorites.has(item.id)).length;
}

function iconByType(type: string): keyof typeof Ionicons.glyphMap {
  if (type === "audio") return "musical-notes";
  if (type === "pdf") return "document-text";
  if (type === "image") return "image";
  return "text";
}
