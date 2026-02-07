import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCatalog } from "@/src/state/catalogContext";
import { getPublicContentUrl } from "@/src/lib/catalogApi";
import { downloadItemMedia, removeItemMedia, type DownloadableMediaType } from "@/src/lib/downloadManager";
import { colors } from "@/src/theme/tokens";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, downloadedMap, loadingCache, reloadDownloads, isFavorite, toggleFavorite } = useCatalog();
  const item = items.find((entry) => entry.id === id);
  const [busy, setBusy] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const downloadedEntry = item ? downloadedMap[item.id] : undefined;
  const isDownloaded = Boolean(downloadedEntry);
  const isMediaItem = Boolean(item && item.type !== "text" && item.storage_path);
  const remoteUrl = isMediaItem && item?.storage_path ? getPublicContentUrl(item.storage_path) : null;
  const audioSource = item?.type === "audio" ? (downloadedEntry?.localUri ?? remoteUrl) : null;
  const audioPlayer = useAudioPlayer(audioSource ?? null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  async function handleDownload() {
    if (!item || item.type === "text" || !item.storage_path) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await downloadItemMedia(item.id, item.storage_path, item.type as DownloadableMediaType);
      await reloadDownloads();
      setMessage("Download concluido.");
    } catch (error) {
      setMessage(toMessage(error, "Falha ao baixar item."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveDownload() {
    if (!item) return;

    setBusy(true);
    setMessage(null);
    try {
      if (item.type === "audio") {
        audioPlayer.pause();
        await audioPlayer.seekTo(0);
      }
      await removeItemMedia(item.id);
      await reloadDownloads();
      setMessage("Download removido.");
    } catch (error) {
      setMessage(toMessage(error, "Falha ao remover download."));
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenPreferred() {
    if (!item || item.type === "text" || !remoteUrl) return;

    setBusy(true);
    setMessage(null);
    try {
      if (downloadedEntry?.localUri) {
        const info = await FileSystem.getInfoAsync(downloadedEntry.localUri);
        if (info.exists) {
          if (item.type === "pdf") {
            router.push({
              pathname: "/pdf",
              params: {
                uri: downloadedEntry.localUri,
                title: item.title,
              },
            });
            return;
          }
          await Linking.openURL(downloadedEntry.localUri);
          return;
        }
        await removeItemMedia(item.id);
        await reloadDownloads();
      }

      if (item.type === "pdf") {
        router.push({
          pathname: "/pdf",
          params: {
            uri: remoteUrl,
            title: item.title,
          },
        });
        return;
      }

      await Linking.openURL(remoteUrl);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao abrir item."));
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenRemote() {
    if (!remoteUrl || !item || item.type === "text") return;
    try {
      if (item.type === "pdf") {
        router.push({
          pathname: "/pdf",
          params: {
            uri: remoteUrl,
            title: item.title,
          },
        });
        return;
      }
      await Linking.openURL(remoteUrl);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao abrir URL remota."));
    }
  }

  async function handleAudioPlayPause() {
    if (!item || item.type !== "audio" || !remoteUrl) return;

    setAudioBusy(true);
    setMessage(null);
    try {
      if (audioStatus.playing) {
        audioPlayer.pause();
        return;
      }

      if (
        audioStatus.didJustFinish ||
        (audioStatus.duration > 0 && audioStatus.currentTime >= audioStatus.duration)
      ) {
        await audioPlayer.seekTo(0);
      }

      audioPlayer.play();
    } catch (error) {
      setMessage(toMessage(error, "Falha ao reproduzir audio."));
    } finally {
      setAudioBusy(false);
    }
  }

  async function handleToggleFavorite() {
    if (!item) return;
    try {
      await toggleFavorite(item.id);
    } catch {
      // message handled in context
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Item Detail</Text>
      <Text style={styles.subtitle}>Detalhes do item em cache e controle offline.</Text>

      {item ? (
        <Pressable style={styles.favoriteButton} onPress={handleToggleFavorite}>
          <Ionicons
            name={isFavorite(item.id) ? "star" : "star-outline"}
            size={16}
            color={isFavorite(item.id) ? colors.army600 : colors.gray700}
          />
          <Text style={styles.favoriteButtonText}>
            {isFavorite(item.id) ? "Desfavoritar" : "Favoritar"}
          </Text>
        </Pressable>
      ) : null}

      {loadingCache ? <Text>Carregando cache local...</Text> : null}

      {!loadingCache && !item ? <Text style={styles.empty}>Item nao encontrado no cache.</Text> : null}

      {!loadingCache && item ? (
        <View style={styles.card}>
          <Text style={styles.label}>ID</Text>
          <Text style={styles.value}>{item.id}</Text>

          <Text style={styles.label}>Titulo</Text>
          <Text style={styles.value}>{item.title}</Text>

          <Text style={styles.label}>Tipo</Text>
          <Text style={styles.value}>{item.type}</Text>

          <Text style={styles.label}>Descricao</Text>
          <Text style={styles.value}>{item.description ?? "-"}</Text>

          <Text style={styles.label}>Tags</Text>
          <Text style={styles.value}>{item.tags?.join(", ") ?? "-"}</Text>

          <Text style={styles.label}>Atualizado em</Text>
          <Text style={styles.value}>{item.updated_at}</Text>

          <Text style={styles.label}>storage_path</Text>
          <Text style={styles.value}>{item.storage_path ?? "-"}</Text>

          {remoteUrl ? (
            <>
              <Text style={styles.label}>URL publica (texto)</Text>
              <Text style={styles.value}>{remoteUrl}</Text>
            </>
          ) : null}

          {item.type === "text" ? (
            <>
              <Text style={styles.label}>text_body</Text>
              <Text style={styles.value}>{item.text_body}</Text>
            </>
          ) : null}

          {isMediaItem ? (
            <>
              <Text style={styles.label}>Status offline</Text>
              <Text style={styles.value}>{isDownloaded ? "Baixado" : "Nao baixado"}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {item?.type === "image" && remoteUrl ? (
        <View style={styles.card}>
          <Text style={styles.label}>Preview da imagem ({isDownloaded ? "local" : "remota"})</Text>
          <Image
            source={{ uri: downloadedEntry?.localUri ?? remoteUrl }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        </View>
      ) : null}

      {item?.type === "audio" && remoteUrl ? (
        <View style={styles.actionsRow}>
          <Pressable style={styles.button} onPress={handleAudioPlayPause} disabled={audioBusy}>
            <Text style={styles.buttonText}>
              {audioBusy ? "Processando..." : audioStatus.playing ? "Pausar audio" : "Tocar audio"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {isMediaItem ? (
        <View style={styles.actionsRow}>
          {!isDownloaded ? (
            <Pressable style={styles.button} onPress={handleDownload} disabled={busy}>
              <Text style={styles.buttonText}>{busy ? "Baixando..." : "Baixar"}</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.button} onPress={handleOpenPreferred} disabled={busy}>
                <Text style={styles.buttonText}>Abrir offline</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleRemoveDownload} disabled={busy}>
                <Text style={styles.secondaryButtonText}>Remover download</Text>
              </Pressable>
            </>
          )}
          <Pressable style={styles.secondaryButton} onPress={handleOpenRemote} disabled={busy}>
            <Text style={styles.secondaryButtonText}>Abrir remoto</Text>
          </Pressable>
        </View>
      ) : null}

      {item?.type === "pdf" ? (
        <Text style={styles.hint}>
          PDF: abertura no viewer embutido (WebView + pdf.js), com suporte local/remoto.
        </Text>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Voltar</Text>
      </Pressable>
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
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginTop: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
    marginTop: 2,
  },
  imagePreview: {
    width: "100%",
    height: 220,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
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
  secondaryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#1f6feb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
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
  hint: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  favoriteButton: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  favoriteButtonText: {
    color: colors.gray700,
    fontWeight: "600",
  },
});

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return `${fallback} ${error.message}`;
  }
  return fallback;
}
