import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";

export default function AdminDiagnosticScreen() {
  const {
    categories,
    items,
    lastSyncAt,
    downloadedCount,
    loadingCache,
    loadingDownloads,
    syncing,
    message,
    syncNow,
    clearNow,
    reloadDownloads,
    clearDownloadsNow,
  } = useCatalog();

  const busy = syncing || loadingDownloads;

  async function handleSync() {
    try {
      await syncNow();
    } catch {
      // message is handled in context state
    }
  }

  async function handleClear() {
    try {
      await clearNow();
    } catch {
      // message is handled in context state
    }
  }

  async function handleClearDownloads() {
    try {
      await clearDownloadsNow();
      await reloadDownloads();
    } catch {
      // message is handled in context state
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin/Diagnostico</Text>
      <Text style={styles.line}>Sync manual do catalogo publicado.</Text>

      {loadingCache ? <Text style={styles.line}>Carregando cache local...</Text> : null}
      {loadingDownloads ? <Text style={styles.line}>Carregando status de downloads...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.kv}>Categorias em cache: {categories.length}</Text>
        <Text style={styles.kv}>Itens em cache: {items.length}</Text>
        <Text style={styles.kv}>Itens baixados: {downloadedCount}</Text>
        <Text style={styles.kv}>Ultimo sync: {lastSyncAt ?? "nunca"}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={handleSync} disabled={busy}>
          <Text style={styles.primaryButtonText}>{syncing ? "Sincronizando..." : "Sincronizar agora"}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleClear} disabled={busy}>
          <Text style={styles.secondaryButtonText}>Limpar cache</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleClearDownloads} disabled={busy}>
          <Text style={styles.secondaryButtonText}>Limpar downloads</Text>
        </Pressable>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
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
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    padding: 12,
    gap: 6,
  },
  kv: {
    fontSize: 15,
    color: "#333",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: "#1f6feb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1f6feb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#1f6feb",
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    color: "#444",
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    padding: 10,
  },
});
