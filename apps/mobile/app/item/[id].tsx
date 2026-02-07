import { useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Detail</Text>
      <Text style={styles.subtitle}>Rota dinamica do item selecionado.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Item ID:</Text>
        <Text style={styles.value}>{id ?? "indefinido"}</Text>
      </View>
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Voltar</Text>
      </Pressable>
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
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f8f8f8",
  },
  label: {
    fontSize: 13,
    color: "#666",
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 2,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
