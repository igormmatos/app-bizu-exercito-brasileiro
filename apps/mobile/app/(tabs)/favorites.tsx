import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/src/components/layout";
import { Card, ContentListItem } from "@/src/components/ui";
import { useCatalog } from "@/src/state/catalogContext";
import { type ContentType, colors } from "@/src/theme/tokens";

export default function FavoritesScreen() {
  const router = useRouter();
  const { items, favoriteIds, loadingCache, loadingFavorites, toggleFavorite } = useCatalog();

  const favoriteItems = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    return favoriteIds
      .map((id) => byId.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  }, [items, favoriteIds]);

  async function handleToggleFavorite(id: string) {
    try {
      await toggleFavorite(id);
    } catch {
      // message handled in context
    }
  }

  return (
    <Screen edges={["left", "right"]}>
      <View style={styles.container}>
        {loadingCache || loadingFavorites ? <Text style={styles.metaText}>Carregando favoritos...</Text> : null}

        {!loadingCache && !loadingFavorites && favoriteItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
            <Text style={styles.emptyText}>Você ainda não favoritou nenhum item.</Text>
          </Card>
        ) : null}

        {!loadingCache && !loadingFavorites
          ? favoriteItems.map((item) => (
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
                  <Pressable
                    style={styles.favoriteIconButton}
                    onPress={() => void handleToggleFavorite(item.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="star" size={18} color="#F59E0B" />
                  </Pressable>
                }
              />
            ))
          : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: colors.gray100,
  },
  metaText: {
    fontSize: 14,
    color: colors.gray700,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 18,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.gray900,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: "center",
  },
  favoriteIconButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
