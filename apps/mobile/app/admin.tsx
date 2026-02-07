import { Pressable, StyleSheet, Text, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";
import { colors } from "@/src/theme/tokens";

export default function AdminDiagnosticScreen() {
  const {
    categories,
    items,
    bizuOfTheDay,
    loadingBizu,
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
    recalculateBizuOfTheDay,
  } = useCatalog();

  const busy = syncing || loadingDownloads || loadingBizu;

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

  async function handleRecalculateBizu() {
    try {
      await recalculateBizuOfTheDay();
    } catch {
      // message is handled in context state
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin/Diagnostico</Text>
      <Text style={styles.line}>Rota tecnica (fora da barra de abas).</Text>

      {loadingCache ? <Text style={styles.line}>Carregando cache local...</Text> : null}
      {loadingDownloads ? <Text style={styles.line}>Carregando status de downloads...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.kv}>Categorias em cache: {categories.length}</Text>
        <Text style={styles.kv}>Itens em cache: {items.length}</Text>
        <Text style={styles.kv}>Itens baixados: {downloadedCount}</Text>
        <Text style={styles.kv}>Bizu do Dia: {bizuOfTheDay?.title ?? "nenhum"}</Text>
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

        <Pressable style={styles.secondaryButton} onPress={handleRecalculateBizu} disabled={busy}>
          <Text style={styles.secondaryButtonText}>Recalcular Bizu do Dia</Text>
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
    backgroundColor: colors.gray100,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.gray900,
    marginBottom: 4,
  },
  line: {
    fontSize: 15,
    color: colors.gray700,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 10,
    backgroundColor: colors.white,
    padding: 12,
    gap: 6,
  },
  kv: {
    fontSize: 15,
    color: colors.gray700,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: colors.army600,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.army600,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: colors.army600,
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    color: colors.gray700,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
  },
});
