import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen, WebContent } from "@/src/components/layout";
import { Card, ContentListItem, OutlineButton, PillBadge, PrimaryButton, SearchBar } from "@/src/components/ui";
import {
  createBatchController,
  downloadCategory,
  getCategoryMediaItems,
  isBatchCancelledError,
  removeCategoryDownloads,
  type BatchProgress,
} from "@/src/lib/batchDownload";
import { useCatalog } from "@/src/state/catalogContext";
import { type ContentType, colors } from "@/src/theme/tokens";

export default function CategoryItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { categories, items, downloadedMap, loadingCache, reloadDownloads, isFavorite, toggleFavorite } = useCatalog();
  const [query, setQuery] = useState("");
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [batchStatus, setBatchStatus] = useState<"idle" | "downloading" | "removing" | "cancelled" | "error">("idle");
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const batchControllerRef = useRef<ReturnType<typeof createBatchController> | null>(null);

  const category = categories.find((entry) => entry.id === id);
  const categoryItems = useMemo(() => items.filter((item) => item.category_id === id), [items, id]);
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return categoryItems;
    }

    return categoryItems.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [categoryItems, query]);
  const categoryMediaItems = useMemo(() => getCategoryMediaItems(categoryItems), [categoryItems]);
  const categoryDownloadedCount = useMemo(
    () => categoryMediaItems.filter((item) => Boolean(downloadedMap[item.id])).length,
    [categoryMediaItems, downloadedMap],
  );

  const running = batchStatus === "downloading" || batchStatus === "removing";
  const progressCount =
    running && batchProgress?.currentItemTitle
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
        setBatchMessage(`Download finalizado com erros: ${result.okCount} ok, ${result.failCount} falha(s).`);
        return;
      }

      setBatchStatus("idle");
      setBatchMessage(`Download da categoria concluído: ${result.okCount} item(ns).`);
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
        setBatchMessage("Remoção em lote cancelada.");
      } else {
        setBatchStatus("error");
        setBatchMessage(toMessage(error, "Falha ao remover downloads da categoria."));
      }
    } finally {
      batchControllerRef.current = null;
    }
  }

  function handleCancelBatch() {
    batchControllerRef.current?.cancel();
  }

  async function handleToggleFavorite(itemId: string) {
    try {
      await toggleFavorite(itemId);
    } catch {
      // message handled in context
    }
  }

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <WebContent style={styles.container}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={`Buscar em ${category?.name ?? "Categoria"}...`}
        />

        {loadingCache ? <Text style={styles.metaText}>Carregando cache local...</Text> : null}
        {!loadingCache && !category ? (
          <Card>
            <Text style={styles.emptyText}>Categoria não encontrada no cache.</Text>
          </Card>
        ) : null}

        {!loadingCache && category ? (
          <Card style={styles.batchCard}>
            <Text style={styles.batchTitle}>Ações da categoria</Text>
            <Text style={styles.metaText}>
              Elegíveis para download: {categoryMediaItems.length} | Já baixados: {categoryDownloadedCount}
            </Text>

            <View style={styles.actionsRow}>
              <PrimaryButton
                label="Baixar categoria"
                onPress={() => void handleDownloadCategory()}
                disabled={!categoryMediaItems.length || running}
                style={styles.actionButton}
              />
              <OutlineButton
                label="Remover downloads"
                onPress={() => void handleRemoveCategoryDownloads()}
                disabled={!categoryDownloadedCount || running}
                style={styles.actionButton}
              />
              {running ? (
                <OutlineButton
                  label="Cancelar"
                  onPress={handleCancelBatch}
                  compact
                  style={styles.cancelButton}
                />
              ) : null}
            </View>

            {batchProgress ? (
              <>
                <Text style={styles.metaText}>
                  {batchProgress.mode === "download" ? "Baixando" : "Removendo"} {progressCount}/{batchProgress.total}
                </Text>
                {batchProgress.currentItemTitle ? (
                  <Text style={styles.metaText}>Item atual: {truncate(batchProgress.currentItemTitle, 48)}</Text>
                ) : null}
              </>
            ) : null}

            {batchStatus !== "idle" ? <Text style={styles.metaText}>Estado: {statusLabel(batchStatus)}</Text> : null}
            {batchMessage ? (
              <View style={styles.batchMessageBox}>
                <Text style={styles.batchMessage}>{batchMessage}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {!loadingCache && category && filteredItems.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum item encontrado com esse filtro.</Text>
          </Card>
        ) : null}

        {!loadingCache && category
          ? filteredItems.map((item) => (
              <ContentListItem
                key={item.id}
                type={item.type as ContentType}
                title={item.title}
                subtitle={item.description ?? item.type}
                onPress={() =>
                  router.push({
                    pathname: "/item/[id]",
                    params: { id: item.id },
                  })
                }
                trailing={
                  <View style={styles.trailingWrap}>
                    {item.storage_path && downloadedMap[item.id] ? (
                      <PillBadge label="Offline" tone="success" style={styles.offlineBadge} />
                    ) : null}
                    <Pressable
                      style={styles.favoriteIconButton}
                      onPress={() => void handleToggleFavorite(item.id)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={isFavorite(item.id) ? "star" : "star-outline"}
                        size={18}
                        color={isFavorite(item.id) ? "#F59E0B" : colors.gray500}
                      />
                    </Pressable>
                  </View>
                }
              />
            ))
          : null}
        </WebContent>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  container: {
    gap: 12,
    backgroundColor: colors.gray100,
  },
  batchCard: {
    gap: 8,
  },
  batchTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.gray900,
  },
  metaText: {
    fontSize: 13,
    color: colors.gray700,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray700,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    flexGrow: 1,
  },
  cancelButton: {
    minWidth: 100,
  },
  batchMessageBox: {
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  batchMessage: {
    fontSize: 13,
    color: colors.gray700,
  },
  trailingWrap: {
    gap: 6,
    alignItems: "center",
  },
  offlineBadge: {
    minHeight: 18,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  favoriteIconButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
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
