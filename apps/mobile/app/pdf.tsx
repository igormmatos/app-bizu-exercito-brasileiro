import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Screen } from "@/src/components/layout";

type ViewerMessage =
  | { type: "viewer-ready" }
  | { type: "loading"; page: number; total: number }
  | { type: "loaded"; page: number; total: number }
  | { type: "error"; message: string }
  | { type: "zoom-state"; scale: number };

type ViewerCommand = "ZOOM_IN" | "ZOOM_OUT" | "ZOOM_RESET";

const PDFJS_DIR = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ""}pdfjs-viewer/`;

export default function PdfViewerScreen() {
  const { uri: rawUri, title } = useLocalSearchParams<{ uri?: string; title?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const pdfUri = useMemo(() => (typeof rawUri === "string" ? rawUri : ""), [rawUri]);
  const pdfTitle = useMemo(() => (typeof title === "string" && title.trim() ? title : "PDF Viewer"), [title]);
  const isLocalUri = pdfUri.startsWith("file://");

  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [localBase64, setLocalBase64] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<string | null>(null);
  const [zoomInfo, setZoomInfo] = useState("120%");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function setup() {
      if (!pdfUri) {
        throw new Error("Parâmetro 'uri' não informado.");
      }

      setLoading(true);
      setError(null);
      setViewerReady(false);
      setLocalBase64(null);
      setPageInfo(null);
      setZoomInfo("120%");

      await FileSystem.makeDirectoryAsync(PDFJS_DIR, { intermediates: true });
      await copyBundledAsset(require("../assets/pdfjs/viewer.html"), `${PDFJS_DIR}viewer.html`);
      await copyBundledAsset(require("../assets/pdfjs/viewer.txt"), `${PDFJS_DIR}viewer.js`);
      await copyBundledAsset(require("../assets/pdfjs/pdf.min.txt"), `${PDFJS_DIR}pdf.min.js`);
      await copyBundledAsset(require("../assets/pdfjs/pdf.worker.min.txt"), `${PDFJS_DIR}pdf.worker.min.js`);

      const params = new URLSearchParams();
      if (!isLocalUri) {
        params.set("file", pdfUri);
      }
      params.set("title", pdfTitle);
      const query = params.toString();
      const builtUri = `${PDFJS_DIR}viewer.html${query ? `?${query}` : ""}`;

      if (!active) return;
      setViewerUri(builtUri);

      if (isLocalUri) {
        const base64 = await FileSystem.readAsStringAsync(pdfUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!active) return;
        setLocalBase64(base64);
      }
    }

    void setup().catch((caught) => {
      if (!active) return;
      setLoading(false);
      setError(toMessage(caught, "Falha ao preparar viewer PDF."));
    });

    return () => {
      active = false;
    };
  }, [isLocalUri, pdfTitle, pdfUri]);

  useEffect(() => {
    if (!isLocalUri || !viewerReady || !localBase64 || !webViewRef.current) {
      return;
    }

    webViewRef.current.postMessage(
      JSON.stringify({
        type: "open-base64",
        base64: localBase64,
        title: pdfTitle,
      }),
    );
  }, [isLocalUri, localBase64, pdfTitle, viewerReady]);

  function handleWebViewMessage(event: { nativeEvent: { data: string } }) {
    let payload: ViewerMessage | null = null;
    try {
      payload = JSON.parse(event.nativeEvent.data) as ViewerMessage;
    } catch {
      return;
    }

    if (!payload) return;

    if (payload.type === "viewer-ready") {
      setViewerReady(true);
      return;
    }

    if (payload.type === "zoom-state") {
      if (typeof payload.scale === "number" && Number.isFinite(payload.scale)) {
        setZoomInfo(`${Math.round(payload.scale * 100)}%`);
      }
      return;
    }

    if (payload.type === "loading") {
      setLoading(true);
      if (payload.total > 0) {
        setPageInfo(`Página ${payload.page}/${payload.total}`);
      }
      return;
    }

    if (payload.type === "loaded") {
      setLoading(false);
      setError(null);
      setPageInfo(`Página ${payload.page}/${payload.total}`);
      return;
    }

    if (payload.type === "error") {
      setLoading(false);
      setError(payload.message || "Erro ao carregar PDF.");
    }
  }

  function sendViewerCommand(command: ViewerCommand) {
    if (!webViewRef.current || !viewerReady || !!error) {
      return;
    }
    const payload = { type: command };
    const serialized = JSON.stringify(payload);

    // Primary channel (RN -> WebView message event).
    webViewRef.current.postMessage(serialized);

    // Fallback channel for platforms/webview versions where message delivery is flaky.
    webViewRef.current.injectJavaScript(
      `window.__BIZU_HANDLE_NATIVE_MESSAGE && window.__BIZU_HANDLE_NATIVE_MESSAGE(${serialized}); true;`,
    );
  }

  return (
    <Screen edges={["left", "right"]} backgroundColor="#fff" style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {pdfTitle}
          </Text>
          {pageInfo ? <Text style={styles.meta}>{`${pageInfo} | Zoom ${zoomInfo}`}</Text> : null}
        </View>
        <View style={styles.zoomActions}>
          <Pressable
            style={styles.zoomButton}
            onPress={() => sendViewerCommand("ZOOM_OUT")}
            disabled={!viewerReady || !!error}
          >
            <Text style={styles.zoomButtonText}>-</Text>
          </Pressable>
          <Pressable
            style={styles.zoomResetButton}
            onPress={() => sendViewerCommand("ZOOM_RESET")}
            disabled={!viewerReady || !!error}
          >
            <Text style={styles.zoomButtonText}>{zoomInfo}</Text>
          </Pressable>
          <Pressable
            style={styles.zoomButton}
            onPress={() => sendViewerCommand("ZOOM_IN")}
            disabled={!viewerReady || !!error}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.viewerContainer}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {viewerUri ? (
          <WebView
            ref={webViewRef}
            source={{ uri: viewerUri }}
            originWhitelist={["*"]}
            onMessage={handleWebViewMessage}
            allowFileAccess
            allowingReadAccessToURL={PDFJS_DIR}
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            style={styles.webView}
          />
        ) : null}

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#1f6feb" />
            <Text style={styles.loadingText}>Carregando PDF...</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

async function copyBundledAsset(moduleId: number, targetPath: string): Promise<void> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const source = asset.localUri ?? asset.uri;
  if (!source) {
    throw new Error("Asset PDF não encontrado.");
  }
  await FileSystem.deleteAsync(targetPath, { idempotent: true });
  await FileSystem.copyAsync({ from: source, to: targetPath });
}

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return `${fallback} ${error.message}`;
  }
  return fallback;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#d8dde3",
    backgroundColor: "#fff",
  },
  viewerContainer: {
    flex: 1,
  },
  backButton: {
    borderWidth: 1,
    borderColor: "#1f6feb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    color: "#1f6feb",
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  zoomActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zoomButton: {
    minWidth: 30,
    borderWidth: 1,
    borderColor: "#1f6feb",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  zoomResetButton: {
    minWidth: 52,
    borderWidth: 1,
    borderColor: "#1f6feb",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  zoomButtonText: {
    color: "#1f6feb",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    color: "#555",
  },
  errorBox: {
    margin: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#ffeaea",
  },
  errorText: {
    color: "#822",
    fontSize: 13,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "#f3f6fb",
    borderBottomWidth: 1,
    borderBottomColor: "#d8dde3",
  },
  loadingText: {
    color: "#345",
    fontSize: 13,
  },
});
