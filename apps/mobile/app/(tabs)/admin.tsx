import { StyleSheet, Text, View } from "react-native";

export default function AdminDiagnosticScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin/Diagnostico</Text>
      <Text style={styles.line}>Modo: Placeholder (sem autenticacao)</Text>
      <Text style={styles.line}>Sync: aguardando integracao</Text>
      <Text style={styles.line}>Origem dos dados: nao configurada</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  line: {
    fontSize: 15,
    color: "#333",
  },
});
