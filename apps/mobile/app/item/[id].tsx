import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/src/components/layout";
import { Card, OutlineButton, PreviewPlaceholder, PrimaryButton } from "@/src/components/ui";
import { getPublicContentUrl } from "@/src/lib/catalogApi";
import { downloadItemMedia, removeItemMedia, type DownloadableMediaType } from "@/src/lib/downloadManager";
import { addRecentItem } from "@/src/lib/recentCache";
import { useCatalog } from "@/src/state/catalogContext";
import { colors } from "@/src/theme/tokens";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, downloadedMap, loadingCache, reloadDownloads, isFavorite, toggleFavorite } = useCatalog();
  const item = items.find((entry) => entry.id === id);
  const [busy, setBusy] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [offlineSizeLabel, setOfflineSizeLabel] = useState("-- MB");

  const downloadedEntry = item ? downloadedMap[item.id] : undefined;
  const isDownloaded = Boolean(downloadedEntry);
  const isMediaItem = Boolean(item && item.type !== "text" && item.storage_path);
  const remoteUrl = isMediaItem && item?.storage_path ? getPublicContentUrl(item.storage_path) : null;
  const audioSource = item?.type === "audio" ? (downloadedEntry?.localUri ?? remoteUrl) : null;
  const audioPlayer = useAudioPlayer(audioSource ?? null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const audioDuration = Math.max(0, audioStatus.duration ?? 0);
  const audioCurrentTime = Math.max(0, Math.min(audioStatus.currentTime ?? 0, audioDuration || 0));
  const audioProgress = audioDuration > 0 ? audioCurrentTime / audioDuration : 0;
  const lyricsText = useMemo(() => {
    if (!item || item.type !== "audio") {
      return "";
    }
    const audioTextBody = (item as { text_body?: string | null }).text_body;
    return audioTextBody?.trim() || item.description?.trim() || "Sem letra cadastrada para este áudio.";
  }, [item]);

  useEffect(() => {
    let active = true;

    async function resolveSize() {
      if (!downloadedEntry?.localUri) {
        if (active) setOfflineSizeLabel("-- MB");
        return;
      }

      try {
        const info = await FileSystem.getInfoAsync(downloadedEntry.localUri);
        const bytes = "size" in info && typeof info.size === "number" ? info.size : 0;
        const mb = bytes / (1024 * 1024);
        if (active) {
          setOfflineSizeLabel(`${mb.toFixed(1)} MB`);
        }
      } catch {
        if (active) setOfflineSizeLabel("-- MB");
      }
    }

    void resolveSize();

    return () => {
      active = false;
    };
  }, [downloadedEntry?.localUri]);

  useEffect(() => {
    if (!item?.id) {
      return;
    }
    void addRecentItem(item.id);
  }, [item?.id]);

  useEffect(() => {
    setRepeatEnabled(false);
  }, [item?.id]);

  useEffect(() => {
    if (item?.type !== "audio") {
      return;
    }
    audioPlayer.loop = repeatEnabled;
  }, [audioPlayer, item?.type, repeatEnabled]);

  async function handleDownload() {
    if (!item || item.type === "text" || !item.storage_path) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await downloadItemMedia(item.id, item.storage_path, item.type as DownloadableMediaType);
      await reloadDownloads();
      setMessage("Download concluído.");
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
    if (!remoteUrl || !item || (item.type !== "pdf" && item.type !== "image")) return;
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
      setMessage(toMessage(error, "Falha ao reproduzir áudio."));
    } finally {
      setAudioBusy(false);
    }
  }

  async function handleAudioForwardFiveSeconds() {
    if (!item || item.type !== "audio" || !remoteUrl) return;

    setAudioBusy(true);
    setMessage(null);
    try {
      const current = Math.max(0, audioStatus.currentTime ?? 0);
      const nextTime = audioDuration > 0 ? Math.min(audioDuration, current + 5) : current + 5;
      await audioPlayer.seekTo(nextTime);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao avançar áudio."));
    } finally {
      setAudioBusy(false);
    }
  }

  async function handleAudioBackwardFiveSeconds() {
    if (!item || item.type !== "audio" || !remoteUrl) return;

    setAudioBusy(true);
    setMessage(null);
    try {
      const current = Math.max(0, audioStatus.currentTime ?? 0);
      const nextTime = Math.max(0, current - 5);
      await audioPlayer.seekTo(nextTime);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao retroceder áudio."));
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
    <Screen edges={["left", "right"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {loadingCache ? <Text style={styles.metaText}>Carregando cache local...</Text> : null}

        {!loadingCache && !item ? (
          <Card>
            <Text style={styles.metaText}>Item não encontrado no cache.</Text>
          </Card>
        ) : null}

        {!loadingCache && item ? (
          <>
            <View style={styles.topActions}>
              <Pressable style={styles.favoriteButton} onPress={() => void handleToggleFavorite()}>
                <Ionicons
                  name={isFavorite(item.id) ? "star" : "star-outline"}
                  size={17}
                  color={isFavorite(item.id) ? "#F59E0B" : colors.gray500}
                />
                <Text style={styles.favoriteText}>{isFavorite(item.id) ? "Favoritado" : "Favoritar"}</Text>
              </Pressable>
            </View>

            {item.type === "pdf" || item.type === "image" ? <PreviewPlaceholder type={item.type} height={170} /> : null}

            <Text style={styles.title}>{item.title}</Text>

            {item.type === "pdf" ? (
              <PrimaryButton
                label="Ler Documento (PDF)"
                onPress={() => void handleOpenPreferred()}
                disabled={busy}
              />
            ) : null}

            {item.type === "image" ? (
              <PrimaryButton
                label="Visualizar Imagem Ampliada"
                onPress={() => void handleOpenPreferred()}
                disabled={busy}
              />
            ) : null}

            {item.type === "audio" ? (
              <Card style={styles.audioCard}>
                <View style={styles.audioTransportBar}>
                  <Pressable
                    style={({ pressed }) => [styles.transportButton, pressed ? styles.transportButtonPressed : null]}
                    onPress={() => void handleAudioBackwardFiveSeconds()}
                    disabled={audioBusy}
                  >
                    <Ionicons name="play-back" size={18} color={colors.gray700} />
                    <Text style={styles.transportButtonLabel}>-5s</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.transportPrimaryButton,
                      pressed ? styles.transportPrimaryButtonPressed : null,
                    ]}
                    onPress={() => void handleAudioPlayPause()}
                    disabled={audioBusy}
                  >
                    <Ionicons name={audioStatus.playing ? "pause" : "play"} size={22} color={colors.white} />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.transportButton, pressed ? styles.transportButtonPressed : null]}
                    onPress={() => void handleAudioForwardFiveSeconds()}
                    disabled={audioBusy}
                  >
                    <Ionicons name="play-forward" size={18} color={colors.gray700} />
                    <Text style={styles.transportButtonLabel}>+5s</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.transportRepeatButton,
                      repeatEnabled ? styles.transportRepeatButtonActive : null,
                      pressed ? styles.transportButtonPressed : null,
                    ]}
                    onPress={() => setRepeatEnabled((prev) => !prev)}
                    disabled={audioBusy}
                  >
                    <Ionicons
                      name="repeat"
                      size={18}
                      color={repeatEnabled ? colors.army700 : colors.gray700}
                    />
                    <Text
                      style={[
                        styles.transportRepeatLabel,
                        repeatEnabled ? styles.transportRepeatLabelActive : null,
                      ]}
                    >
                      {repeatEnabled ? "ON" : "OFF"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, audioProgress)) * 100}%` }]} />
                </View>

                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatSeconds(audioCurrentTime)}</Text>
                  <Text style={styles.timeText}>{formatSeconds(audioDuration)}</Text>
                </View>

                <View style={styles.lyricsBox}>
                  <Text style={styles.lyricsLabel}>LETRA DA CANÇÃO</Text>
                  <ScrollView nestedScrollEnabled style={styles.lyricsScroll}>
                    <Text style={styles.lyricsText}>{lyricsText}</Text>
                  </ScrollView>
                </View>
              </Card>
            ) : null}

            {item.type === "text" ? (
              <Card>
                <Text style={styles.textBody}>{item.text_body ?? "Sem conteúdo textual."}</Text>
              </Card>
            ) : null}

            {isMediaItem ? (
              <Card>
                <View style={styles.offlineHeader}>
                  <Text style={styles.offlineTitle}>Disponibilidade Offline</Text>
                  <Text style={styles.offlineSize}>{offlineSizeLabel}</Text>
                </View>

                {!isDownloaded ? (
                  <OutlineButton
                    label={busy ? "Baixando..." : "Baixar para Offline"}
                    onPress={() => void handleDownload()}
                    disabled={busy}
                  />
                ) : (
                  <OutlineButton
                    label={busy ? "Removendo..." : "Remover download"}
                    onPress={() => void handleRemoveDownload()}
                    disabled={busy}
                  />
                )}

                {item.type === "pdf" || item.type === "image" ? (
                  <OutlineButton label="Abrir remoto" onPress={() => void handleOpenRemote()} disabled={busy} />
                ) : null}
              </Card>
            ) : null}

            {message ? (
              <Card>
                <Text style={styles.message}>{message}</Text>
              </Card>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: colors.gray100,
  },
  metaText: {
    fontSize: 14,
    color: colors.gray700,
  },
  topActions: {
    alignItems: "flex-end",
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  favoriteText: {
    fontSize: 13,
    color: colors.gray500,
    fontWeight: "600",
  },
  title: {
    fontSize: 29,
    lineHeight: 34,
    color: colors.gray900,
    fontWeight: "700",
  },
  audioCard: {
    gap: 10,
  },
  audioTransportBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  transportButton: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    flex: 1,
  },
  transportButtonPressed: {
    backgroundColor: colors.gray100,
  },
  transportButtonLabel: {
    color: colors.gray700,
    fontSize: 11,
    fontWeight: "700",
  },
  transportPrimaryButton: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.army700,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  transportPrimaryButtonPressed: {
    backgroundColor: colors.army600,
  },
  transportRepeatButton: {
    minHeight: 44,
    minWidth: 60,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  transportRepeatButtonActive: {
    borderColor: colors.army600,
    backgroundColor: colors.army100,
  },
  transportRepeatLabel: {
    color: colors.gray700,
    fontSize: 11,
    fontWeight: "800",
  },
  transportRepeatLabelActive: {
    color: colors.army700,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.army600,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 11,
    color: colors.gray500,
    fontWeight: "600",
  },
  lyricsBox: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    backgroundColor: colors.white,
    padding: 10,
    gap: 8,
    minHeight: 180,
  },
  lyricsLabel: {
    fontSize: 11,
    color: colors.gray500,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.4,
  },
  lyricsScroll: {
    maxHeight: 165,
  },
  lyricsText: {
    color: colors.gray700,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "serif",
    fontSize: 17,
    lineHeight: 28,
  },
  textBody: {
    color: colors.gray700,
    fontSize: 15,
    lineHeight: 24,
  },
  offlineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  offlineTitle: {
    fontSize: 15,
    color: colors.gray700,
    fontWeight: "700",
  },
  offlineSize: {
    fontSize: 12,
    color: colors.gray500,
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    color: colors.gray700,
  },
});

function formatSeconds(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return `${fallback} ${error.message}`;
  }
  return fallback;
}
