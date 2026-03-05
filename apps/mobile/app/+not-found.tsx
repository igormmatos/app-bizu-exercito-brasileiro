import { Link, Stack } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { Screen, WebContent } from "@/src/components/layout";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Não encontrado" }} />
      <Screen edges={["left", "right"]} backgroundColor="#fff">
        <WebContent padded={false} style={styles.container}>
          <Text style={styles.title}>Esta tela não existe.</Text>

          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Voltar para Home</Text>
          </Link>
        </WebContent>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
