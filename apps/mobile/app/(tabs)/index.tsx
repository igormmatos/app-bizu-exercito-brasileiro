import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";

export default function HomeScreen() {
  const router = useRouter();
  const { categories, items, downloadedMap, loadingCache } = useCatalog();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bizu EB - Home</Text>
      <Text style={styles.subtitle}>Categorias em cache</Text>

      {loadingCache ? <Text>Carregando cache local...</Text> : null}

      {!loadingCache && categories.length === 0 ? (
        <Text style={styles.empty}>Sem categorias no cache. Use "Sincronizar agora" na aba Admin.</Text>
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
                Abrir itens da categoria • Offline: {countOfflineByCategory(category.id, items, downloadedMap)}
              </Text>
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
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f8f8f8",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardMeta: {
    marginTop: 4,
    color: "#666",
  },
  empty: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    padding: 10,
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
