import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { Alert, Linking, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { Screen } from "@/src/components/layout";
import { Card, OutlineButton, PreviewPlaceholder, PrimaryButton } from "@/src/components/ui";
import { getPublicContentUrl } from "@/src/lib/catalogApi";
import { downloadItemMedia, removeItemMedia, type DownloadableMediaType } from "@/src/lib/downloadManager";
import { addRecentItem } from "@/src/lib/recentCache";
import { useCatalog } from "@/src/state/catalogContext";
import { colors } from "@/src/theme/tokens";
import { parseSafeHtml, type HtmlInlineNode } from "@bizu/shared";

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
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [lyricsNeedsToggle, setLyricsNeedsToggle] = useState(false);
  const [lyricsNoticeShown, setLyricsNoticeShown] = useState(false);
  const [videoEmbedFailed, setVideoEmbedFailed] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  const downloadedEntry = item ? downloadedMap[item.id] : undefined;
  const isDownloaded = Boolean(downloadedEntry);
  const mediaType = item ? resolveMediaType(item.type, item.storage_path) : null;
  const isMediaItem = Boolean(mediaType && item?.storage_path);
  const remoteUrl = item?.storage_path ? getPublicContentUrl(item.storage_path) : null;
  const videoLink = item?.type === "video" ? (item.link?.trim() ?? "") : "";
  const youtubeVideoId = useMemo(() => getYouTubeId(videoLink), [videoLink]);
  const canRenderEmbeddedVideo = Platform.OS !== "web";
  const imageSourceUri = mediaType === "image" ? (downloadedEntry?.localUri ?? remoteUrl) : null;
  const audioSource = mediaType === "audio" ? (downloadedEntry?.localUri ?? remoteUrl) : null;
  const audioPlayer = useAudioPlayer(audioSource ?? null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const audioDuration = Math.max(0, audioStatus.duration ?? 0);
  const audioCurrentTime = Math.max(0, Math.min(audioStatus.currentTime ?? 0, audioDuration || 0));
  const displayedAudioTime = isScrubbing && scrubTime !== null ? scrubTime : audioCurrentTime;
  const audioProgress = audioDuration > 0 ? Math.max(0, Math.min(1, displayedAudioTime / audioDuration)) : 0;
  const textContent = item?.text_body?.trim() ?? "";
  const textBlocks = useMemo(() => parseSafeHtml(textContent), [textContent]);
  const shouldShowLyrics = item?.type === "audio" || item?.type === "video";
  const lyricsText = useMemo(() => {
    if (!item || !shouldShowLyrics) {
      return "";
    }
    return item.text_body?.trim() || item.description?.trim() || "Sem letra cadastrada para este conteúdo.";
  }, [item, shouldShowLyrics]);
  const isLyricsLongByLength = lyricsText.length >= LYRICS_TOGGLE_CHAR_THRESHOLD;

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
    setIsScrubbing(false);
    setScrubTime(null);
    setProgressTrackWidth(0);
    setLyricsExpanded(false);
    setLyricsNeedsToggle(false);
    setLyricsNoticeShown(false);
    setVideoEmbedFailed(false);
  }, [item?.id]);

  useEffect(() => {
    setLyricsNeedsToggle(isLyricsLongByLength);
  }, [isLyricsLongByLength]);

  useEffect(() => {
    if (mediaType !== "audio") {
      return;
    }
    audioPlayer.loop = repeatEnabled;
  }, [audioPlayer, mediaType, repeatEnabled]);

  async function handleDownload() {
    if (!item || !item.storage_path || !mediaType) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await downloadItemMedia(item.id, item.storage_path, mediaType);
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
      if (mediaType === "audio") {
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
    if (!item || !remoteUrl || !mediaType) return;

    setBusy(true);
    setMessage(null);
    try {
      if (downloadedEntry?.localUri) {
        const info = await FileSystem.getInfoAsync(downloadedEntry.localUri);
        if (info.exists) {
          if (mediaType === "pdf") {
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

      if (mediaType === "pdf") {
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

  async function handleOpenYoutube() {
    if (!videoLink) {
      return;
    }
    try {
      await Linking.openURL(videoLink);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao abrir link do YouTube."));
    }
  }

  async function handleAudioPlayPause() {
    if (!item || mediaType !== "audio" || !remoteUrl) return;

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
    if (!item || mediaType !== "audio" || !remoteUrl) return;

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
    if (!item || mediaType !== "audio" || !remoteUrl) return;

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

  async function handleAudioRestart() {
    if (!item || mediaType !== "audio" || !remoteUrl) return;

    setAudioBusy(true);
    setMessage(null);
    try {
      await audioPlayer.seekTo(0);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao reiniciar áudio."));
    } finally {
      setAudioBusy(false);
    }
  }

  function handleToggleLyrics() {
    if (lyricsExpanded) {
      setLyricsExpanded(false);
      return;
    }

    if (!lyricsNoticeShown) {
      if (Platform.OS === "web") {
        setLyricsNoticeShown(true);
        setMessage(LYRICS_NOTICE_MESSAGE);
        setLyricsExpanded(true);
        return;
      }

      Alert.alert("Aviso", LYRICS_NOTICE_MESSAGE, [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Continuar",
          onPress: () => {
            setLyricsNoticeShown(true);
            setLyricsExpanded(true);
          },
        },
      ]);
      return;
    }

    setLyricsExpanded(true);
  }

  async function handleReportContent() {
    if (!item || (item.type !== "audio" && item.type !== "video")) {
      return;
    }

    const prefillMessage = `Reportar conteúdo: ${item.title} (${item.id}) - motivo: `;
    const mailSubject = encodeURIComponent(`Reportar conteúdo: ${item.title}`);
    const mailBody = encodeURIComponent(prefillMessage);

    setReportBusy(true);
    setMessage(null);

    try {
      try {
        router.push({
          pathname: "/(tabs)/suggestion",
          params: {
            prefillMessage,
            prefillCategory: "Conteúdo",
          },
        });
        return;
      } catch {
        // fallback to mailto below
      }

      await Linking.openURL(`mailto:?subject=${mailSubject}&body=${mailBody}`);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao abrir fluxo de reporte."));
    } finally {
      setReportBusy(false);
    }
  }

  function previewScrubAt(locationX: number) {
    if (audioDuration <= 0 || progressTrackWidth <= 0) {
      return;
    }
    const clampedX = Math.max(0, Math.min(locationX, progressTrackWidth));
    const nextTime = (clampedX / progressTrackWidth) * audioDuration;
    setIsScrubbing(true);
    setScrubTime(nextTime);
  }

  async function commitScrubAt(locationX: number) {
    if (!item || mediaType !== "audio" || !remoteUrl) {
      return;
    }

    if (audioDuration <= 0 || progressTrackWidth <= 0) {
      setIsScrubbing(false);
      setScrubTime(null);
      return;
    }

    const clampedX = Math.max(0, Math.min(locationX, progressTrackWidth));
    const nextTime = (clampedX / progressTrackWidth) * audioDuration;
    setIsScrubbing(false);
    setScrubTime(nextTime);
    setAudioBusy(true);
    setMessage(null);

    try {
      await audioPlayer.seekTo(nextTime);
    } catch (error) {
      setMessage(toMessage(error, "Falha ao ajustar posição do áudio."));
    } finally {
      setAudioBusy(false);
      setScrubTime(null);
    }
  }

  const progressPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => audioDuration > 0,
        onMoveShouldSetPanResponder: () => audioDuration > 0,
        onPanResponderGrant: (event) => {
          previewScrubAt(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          previewScrubAt(event.nativeEvent.locationX);
        },
        onPanResponderRelease: (event) => {
          void commitScrubAt(event.nativeEvent.locationX);
        },
        onPanResponderTerminate: () => {
          setIsScrubbing(false);
          setScrubTime(null);
        },
      }),
    [audioDuration, progressTrackWidth, mediaType, item?.id, remoteUrl, audioPlayer],
  );

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

            {item.type === "video" ? (
              <Card style={styles.videoCard}>
                {youtubeVideoId && !videoEmbedFailed && canRenderEmbeddedVideo ? (
                  <View style={styles.videoEmbedFrame}>
                    <YoutubePlayer
                      height={220}
                      play={false}
                      videoId={youtubeVideoId}
                      webViewStyle={styles.videoEmbed}
                      webViewProps={{
                        allowsInlineMediaPlayback: true,
                      }}
                      initialPlayerParams={{
                        rel: false,
                        controls: true,
                      }}
                      onError={() => setVideoEmbedFailed(true)}
                    />
                  </View>
                ) : (
                  <View style={styles.videoFallback}>
                    <Text style={styles.metaText}>
                      {canRenderEmbeddedVideo
                        ? "Não foi possível carregar o vídeo incorporado."
                        : "Visualização incorporada não é suportada no web. Abra no YouTube."}
                    </Text>
                  </View>
                )}
                <OutlineButton
                  label="Abrir no YouTube"
                  onPress={() => void handleOpenYoutube()}
                  disabled={!videoLink || reportBusy}
                />
              </Card>
            ) : null}

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

            {mediaType === "audio" ? (
              <Card style={styles.audioCard}>
                <View style={styles.audioTransportBar}>
                  <Pressable
                    style={({ pressed }) => [styles.transportButton, pressed ? styles.transportButtonPressed : null]}
                    onPress={() => void handleAudioRestart()}
                    disabled={audioBusy}
                  >
                    <Ionicons name="refresh" size={17} color={colors.gray700} />
                    <Text style={styles.transportButtonLabel}>0:00</Text>
                  </Pressable>

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

                <View
                  style={styles.progressTrack}
                  onLayout={(event) => setProgressTrackWidth(event.nativeEvent.layout.width)}
                  {...progressPanResponder.panHandlers}
                >
                  <View style={[styles.progressFill, { width: `${audioProgress * 100}%` }]} />
                  {audioDuration > 0 ? (
                    <View
                      style={[
                        styles.progressThumb,
                        {
                          left: Math.max(
                            0,
                            Math.min(Math.max(progressTrackWidth - 16, 0), audioProgress * progressTrackWidth - 8),
                          ),
                        },
                      ]}
                    />
                  ) : null}
                </View>

                <View style={styles.timeRow}>
                  <Text style={styles.timeText}>{formatSeconds(displayedAudioTime)}</Text>
                  <Text style={styles.timeText}>{formatSeconds(audioDuration)}</Text>
                </View>

              </Card>
            ) : null}

            {shouldShowLyrics ? (
              <Card style={styles.lyricsCard}>
                <Text style={styles.lyricsLabel}>LETRA</Text>
                <Text
                  style={styles.lyricsText}
                  numberOfLines={lyricsExpanded ? undefined : LYRICS_COLLAPSED_LINES}
                  onTextLayout={(event) => {
                    if (!lyricsExpanded && event.nativeEvent.lines.length > LYRICS_COLLAPSED_LINES) {
                      setLyricsNeedsToggle(true);
                    }
                  }}
                >
                  {lyricsText}
                </Text>
                {lyricsNeedsToggle ? (
                  <Pressable
                    style={({ pressed }) => [styles.lyricsToggleButton, pressed ? styles.transportButtonPressed : null]}
                    onPress={handleToggleLyrics}
                  >
                    <Text style={styles.lyricsToggleText}>
                      {lyricsExpanded ? "Ver menos" : "Ver letra completa"}
                    </Text>
                  </Pressable>
                ) : null}
              </Card>
            ) : null}

            {item.type === "audio" || item.type === "video" ? (
              <OutlineButton
                label={reportBusy ? "Abrindo..." : "Reportar conteúdo"}
                onPress={() => void handleReportContent()}
                disabled={reportBusy}
              />
            ) : null}

            {item.type === "text" && mediaType === "image" ? (
              <Card style={styles.inlineImageCard}>
                <View style={styles.inlineImageFrame}>
                  {imageSourceUri ? (
                    <Image source={{ uri: imageSourceUri }} style={styles.inlineImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.metaText}>Imagem indisponível.</Text>
                  )}
                </View>
              </Card>
            ) : null}

            {(item.type === "text" || (item.type === "image" && textBlocks.length > 0)) ? (
              <Card>
                {textBlocks.length > 0 ? (
                  <View style={styles.markdownRoot}>{renderHtmlBlocks(textBlocks)}</View>
                ) : (
                  <Text style={styles.textBody}>Sem conteúdo textual.</Text>
                )}
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
  videoCard: {
    padding: 0,
    overflow: "hidden",
    gap: 10,
  },
  videoEmbedFrame: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.gray900,
  },
  videoEmbed: {
    flex: 1,
    backgroundColor: colors.gray900,
  },
  videoFallback: {
    minHeight: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    margin: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  audioTransportBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  transportButton: {
    minHeight: 44,
    width: 56,
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
    width: 56,
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
    height: 12,
    backgroundColor: colors.gray300,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
    position: "relative",
    justifyContent: "center",
  },
  progressFill: {
    height: 12,
    backgroundColor: colors.army600,
  },
  progressThumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.army700,
    top: -2,
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
  lyricsCard: {
    gap: 8,
  },
  lyricsLabel: {
    fontSize: 11,
    color: colors.gray500,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: 0.4,
  },
  lyricsText: {
    color: colors.gray700,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "serif",
    fontSize: 16,
    lineHeight: 26,
  },
  lyricsToggleButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 999,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lyricsToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.gray700,
  },
  textBody: {
    color: colors.gray700,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "justify",
  },
  markdownRoot: {
    gap: 8,
  },
  markdownParagraph: {
    color: colors.gray700,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "justify",
  },
  markdownList: {
    gap: 6,
  },
  markdownListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  markdownBullet: {
    color: colors.gray700,
    fontSize: 15,
    lineHeight: 24,
  },
  markdownListText: {
    flex: 1,
    color: colors.gray700,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "justify",
  },
  markdownBold: {
    fontWeight: "700",
  },
  markdownItalic: {
    fontStyle: "italic",
  },
  markdownLink: {
    color: "#1D4ED8",
    textDecorationLine: "underline",
  },
  inlineImageCard: {
    padding: 0,
    overflow: "hidden",
  },
  inlineImageFrame: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineImage: {
    width: "100%",
    height: "100%",
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

const LYRICS_COLLAPSED_LINES = 10;
const LYRICS_TOGGLE_CHAR_THRESHOLD = 600;
const LYRICS_NOTICE_MESSAGE =
  'Esta letra é exibida com finalidade informativa e educativa.\nCaso haja qualquer questão relacionada a direitos autorais, utilize a opção "Reportar conteúdo".';

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return `${fallback} ${error.message}`;
  }
  return fallback;
}

function resolveMediaType(
  itemType: "pdf" | "audio" | "image" | "text" | "video",
  storagePath?: string | null,
): DownloadableMediaType | null {
  if (!storagePath) {
    return null;
  }

  if (itemType === "pdf" || itemType === "audio" || itemType === "image") {
    return itemType;
  }

  if (itemType === "text" && storagePath.startsWith("image/")) {
    return "image";
  }

  return null;
}

function getYouTubeId(link: string): string | null {
  const trimmedLink = link.trim();
  if (!trimmedLink) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedLink);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  const normalizedHost = host.replace(/^www\./, "");

  if (normalizedHost === "youtu.be") {
    return parsedUrl.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (normalizedHost === "youtube.com" || normalizedHost.endsWith(".youtube.com")) {
    if (parsedUrl.pathname === "/watch") {
      return parsedUrl.searchParams.get("v")?.trim() || null;
    }

    if (parsedUrl.pathname.startsWith("/shorts/")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[1] ?? null;
    }

    if (parsedUrl.pathname.startsWith("/embed/")) {
      return parsedUrl.pathname.split("/").filter(Boolean)[1] ?? null;
    }
  }

  return null;
}

function renderHtmlBlocks(blocks: ReturnType<typeof parseSafeHtml>) {
  return blocks.map((block, blockIndex) => {
    if (block.type === "paragraph") {
      return (
        <Text key={`paragraph-${blockIndex}`} style={styles.markdownParagraph}>
          {renderHtmlInline(block.inlines)}
        </Text>
      );
    }

    return (
      <View key={`list-${blockIndex}`} style={styles.markdownList}>
        {block.items.map((item, itemIndex) => (
          <View key={`list-item-${blockIndex}-${itemIndex}`} style={styles.markdownListItem}>
            <Text style={styles.markdownBullet}>{block.ordered ? `${itemIndex + 1}.` : "•"}</Text>
            <Text style={styles.markdownListText}>{renderHtmlInline(item)}</Text>
          </View>
        ))}
      </View>
    );
  });
}

function renderHtmlInline(nodes: HtmlInlineNode[]) {
  return nodes.map((node, index) => {
    if (node.type === "br") {
      return <Text key={`br-${index}`}>{"\n"}</Text>;
    }

    const style = [
      node.bold ? styles.markdownBold : null,
      node.italic ? styles.markdownItalic : null,
      node.href ? styles.markdownLink : null,
    ];

    if (node.href) {
      return (
        <Text
          key={`link-${index}`}
          style={style}
          onPress={() => {
            if (node.href) {
              void Linking.openURL(node.href);
            }
          }}
        >
          {node.text}
        </Text>
      );
    }

    return (
      <Text key={`text-${index}`} style={style}>
        {node.text}
      </Text>
    );
  });
}
