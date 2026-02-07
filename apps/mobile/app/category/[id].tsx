import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";
import {
  createBatchController,
  downloadCategory,
  getCategoryMediaItems,
  isBatchCancelledError,
  removeCategoryDownloads,
  type BatchProgress,
} from "@/src/lib/batchDownload";
import { colors } from "@/src/theme/tokens";

export default function CategoryItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { categories, items, downloadedMap, loadingCache, reloadDownloads, isFavorite, toggleFavorite } = useCatalog();
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [batchStatus, setBatchStatus] = useState<"idle" | "downloading" | "removing" | "cancelled" | "error">("idle");
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const batchControllerRef = useRef<ReturnType<typeof createBatchController> | null>(null);

  const category = categories.find((entry) => entry.id === id);
  const categoryItems = useMemo(
    () => items.filter((item) => item.category_id === id),
    [items, id],
  );
  const categoryMediaItems = useMemo(() => getCategoryMediaItems(categoryItems), [categoryItems]);
  const categoryDownloadedCount = useMemo(
    () => categoryMediaItems.filter((item) => Boolean(downloadedMap[item.id])).length,
    [categoryMediaItems, downloadedMap],
  );
  const running = batchStatus === "downloading" || batchStatus === "removing";
  const progressCount = running && batchProgress?.currentItemTitle
    ? Math.min(batchProgress.completed + 1, batchProgress.total)
    : (batchProgress?.completed ?? 0);

  useEffect(() => () => batchControllerRef.current?.cancel(), []);

  async function handleDownloadCategory() {
    if (!categoryMediaItems.length || running) {
      return;
    }

    setBatchStatus("downloading");
    setBatchMessage(null);
    setBatchProgress({
      mode: "download",
      completed: 0,
      total: categoryMediaItems.length,
      currentItemTitle: null,
      okCount: 0,
      failCount: 0,
    });

    const controller = createBatchController();
    batchControllerRef.current = controller;

    try {
      const result = await downloadCategory(categoryMediaItems, setBatchProgress, controller);
      await reloadDownloads();

      if (result.failCount > 0) {
        setBatchStatus("error");
        setBatchMessage(
          `Download finalizado com erros: ${result.okCount} ok, ${result.failCount} falha(s).`,
        );
        return;
      }

      setBatchStatus("idle");
      setBatchMessage(`Download da categoria concluido: ${result.okCount} item(ns).`);
    } catch (error) {
      if (isBatchCancelledError(error)) {
        setBatchStatus("cancelled");
        setBatchMessage("Download da categoria cancelado.");
      } else {
        setBatchStatus("error");
        setBatchMessage(toMessage(error, "Falha no download da categoria."));
      }
    } finally {
      batchControllerRef.current = null;
    }
  }

  async function handleRemoveCategoryDownloads() {
    if (!categoryMediaItems.length || running) {
      return;
    }

    setBatchStatus("removing");
    setBatchMessage(null);
    setBatchProgress({
      mode: "remove",
      completed: 0,
      total: categoryMediaItems.length,
      currentItemTitle: null,
      okCount: 0,
      failCount: 0,
    });

    const controller = createBatchController();
    batchControllerRef.current = controller;

    try {
      await removeCategoryDownloads(categoryMediaItems, setBatchProgress, controller);
      await reloadDownloads();
      setBatchStatus("idle");
      setBatchMessage("Downloads da categoria removidos.");
    } catch (error) {
      if (isBatchCancelledError(error)) {
        setBatchStatus("cancelled");
        setBatchMessage("Remocao em lote cancelada.");
      } else {
        setBatchStatus("error");
        setBatchMessage(toMessage(error, "Falha ao remover downloads da categoria."));
      }
    } finally {
      batchControllerRef.current = null;
    }
  }

  function handleCancelBatch() {
    if (batchControllerRef.current) {
      batchControllerRef.current.cancel();
    }
  }

  async function handleToggleFavorite(id: string) {
    try {
      await toggleFavorite(id);
    } catch {
      // message handled in context
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{category?.name ?? "Categoria"}</Text>
      <Text style={styles.subtitle}>Itens publicados em cache</Text>

      {loadingCache ? <Text>Carregando cache local...</Text> : null}

      {!loadingCache && !category ? (
        <Text style={styles.empty}>Categoria nao encontrada no cache.</Text>
      ) : null}

      {!loadingCache && category && categoryItems.length === 0 ? (
        <Text style={styles.empty}>Nenhum item desta categoria no cache.</Text>
      ) : null}

      {!loadingCache && category ? (
        <View style={styles.batchCard}>
          <Text style={styles.batchTitle}>Acoes da categoria</Text>
          <Text style={styles.batchInfo}>
            Elegiveis para download: {categoryMediaItems.length} | Ja baixados: {categoryDownloadedCount}
          </Text>

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.button, (!categoryMediaItems.length || running) && styles.buttonDisabled]}
              onPress={handleDownloadCategory}
              disabled={!categoryMediaItems.length || running}
            >
              <Text style={styles.buttonText}>Baixar categoria</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, (!categoryDownloadedCount || running) && styles.buttonDisabled]}
              onPress={handleRemoveCategoryDownloads}
              disabled={!categoryDownloadedCount || running}
            >
              <Text style={styles.secondaryButtonText}>Remover downloads da categoria</Text>
            </Pressable>
            {running ? (
              <Pressable style={styles.secondaryButton} onPress={handleCancelBatch}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
            ) : null}
          </View>

          {batchProgress ? (
            <>
              <Text style={styles.batchInfo}>
                {batchProgress.mode === "download" ? "Baixando" : "Removendo"} {progressCount}/{batchProgress.total}
              </Text>
              {batchProgress.currentItemTitle ? (
                <Text style={styles.batchInfo}>
                  Item atual: {truncate(batchProgress.currentItemTitle, 48)}
                </Text>
              ) : null}
            </>
          ) : null}

          {batchStatus !== "idle" ? (
            <Text style={styles.batchInfo}>Estado: {statusLabel(batchStatus)}</Text>
          ) : null}
          {batchMessage ? <Text style={styles.batchMessage}>{batchMessage}</Text> : null}
        </View>
      ) : null}

      {!loadingCache && category
        ? categoryItems.map((item) => (
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
                <Text style={styles.cardMeta}>
                  {item.type} • {item.published ? "publicado" : "rascunho"}
                </Text>
                {item.type !== "text" && downloadedMap[item.id] ? (
                  <Text style={styles.offline}>Offline</Text>
                ) : null}
              </Pressable>
              <Pressable style={styles.favoriteButton} onPress={() => void handleToggleFavorite(item.id)}>
                <Ionicons
                  name={isFavorite(item.id) ? "star" : "star-outline"}
                  size={18}
                  color={isFavorite(item.id) ? colors.army600 : colors.gray500}
                />
              </Pressable>
            </View>
          ))
        : null}
    </ScrollView>
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
  empty: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    padding: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f8f8f8",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  cardMain: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  cardMeta: {
    marginTop: 4,
    color: "#666",
  },
  offline: {
    marginTop: 6,
    color: "#0a7f33",
    fontWeight: "600",
  },
  batchCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#f8f8f8",
    gap: 8,
  },
  batchTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  batchInfo: {
    fontSize: 13,
    color: "#555",
  },
  batchMessage: {
    fontSize: 14,
    color: "#333",
    backgroundColor: "#efefef",
    borderRadius: 8,
    padding: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  button: {
    marginTop: 2,
    backgroundColor: "#1f6feb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  secondaryButton: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#1f6feb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#1f6feb",
    fontWeight: "600",
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

function statusLabel(status: "idle" | "downloading" | "removing" | "cancelled" | "error"): string {
  if (status === "downloading") return "baixando";
  if (status === "removing") return "removendo";
  if (status === "cancelled") return "cancelado";
  if (status === "error") return "erro";
  return "ok";
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return `${fallback} ${error.message}`;
  }
  return fallback;
}
