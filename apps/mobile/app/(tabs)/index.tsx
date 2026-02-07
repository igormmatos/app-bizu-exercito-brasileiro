import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const categories = [
  { id: "operacoes", label: "Operacoes" },
  { id: "legislacao", label: "Legislacao" },
  { id: "treinamento", label: "Treinamento" },
  { id: "logistica", label: "Logistica" },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bizu EB - Home</Text>
      <Text style={styles.subtitle}>Categorias (placeholder)</Text>

      {categories.map((category) => (
        <Pressable
          key={category.id}
          style={styles.card}
          onPress={() => router.push(`/item/${category.id}`)}
        >
          <Text style={styles.cardTitle}>{category.label}</Text>
          <Text style={styles.cardMeta}>Abrir detalhe</Text>
        </Pressable>
      ))}
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
});
