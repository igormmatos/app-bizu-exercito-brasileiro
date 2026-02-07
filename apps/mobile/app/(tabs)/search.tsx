import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function SearchScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Tela placeholder de busca.</Text>

      <Pressable style={styles.button} onPress={() => router.push("/item/exemplo-bizu")}>
        <Text style={styles.buttonText}>Abrir item de exemplo</Text>
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
  button: {
    marginTop: 8,
    backgroundColor: "#1f6feb",
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
