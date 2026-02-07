import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";
import { colors } from "@/src/theme/tokens";

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
    <View style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.subtitle}>Acesso rapido aos itens marcados localmente.</Text>

      {loadingCache || loadingFavorites ? (
        <Text style={styles.subtitle}>Carregando favoritos...</Text>
      ) : null}

      {!loadingCache && !loadingFavorites && favoriteItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Voce ainda nao favoritou nenhum item.</Text>
        </View>
      ) : null}

      {!loadingCache && !loadingFavorites
        ? favoriteItems.map((item) => (
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
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.type}</Text>
              </Pressable>
              <Pressable style={styles.favoriteButton} onPress={() => void handleToggleFavorite(item.id)}>
                <Ionicons name="star" size={18} color={colors.army600} />
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
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
    padding: 14,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray700,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardMain: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.gray900,
  },
  cardMeta: {
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
