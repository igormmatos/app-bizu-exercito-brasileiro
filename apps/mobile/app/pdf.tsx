import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";

type ViewerMessage =
  | { type: "viewer-ready" }
  | { type: "loading"; page: number; total: number }
  | { type: "loaded"; page: number; total: number }
  | { type: "error"; message: string };

const PDFJS_DIR = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ""}pdfjs-viewer/`;

export default function PdfViewerScreen() {
  const { uri: rawUri, title } = useLocalSearchParams<{ uri?: string; title?: string }>();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const pdfUri = useMemo(() => (typeof rawUri === "string" ? rawUri : ""), [rawUri]);
  const pdfTitle = useMemo(() => (typeof title === "string" && title.trim() ? title : "PDF Viewer"), [title]);
  const isLocalUri = pdfUri.startsWith("file://");

  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [localBase64, setLocalBase64] = useState<string | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageInfo, setPageInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function setup() {
      if (!pdfUri) {
        throw new Error("Parametro 'uri' nao informado.");
      }

      setLoading(true);
      setError(null);
      setViewerReady(false);
      setLocalBase64(null);
      setPageInfo(null);

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

    if (payload.type === "loading") {
      setLoading(true);
      if (payload.total > 0) {
        setPageInfo(`Pagina ${payload.page}/${payload.total}`);
      }
      return;
    }

    if (payload.type === "loaded") {
      setLoading(false);
      setError(null);
      setPageInfo(`Pagina ${payload.page}/${payload.total}`);
      return;
    }

    if (payload.type === "error") {
      setLoading(false);
      setError(payload.message || "Erro ao carregar PDF.");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {pdfTitle}
          </Text>
          {pageInfo ? <Text style={styles.meta}>{pageInfo}</Text> : null}
        </View>
      </View>

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
  );
}

async function copyBundledAsset(moduleId: number, targetPath: string): Promise<void> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const source = asset.localUri ?? asset.uri;
  if (!source) {
    throw new Error("Asset PDF nao encontrado.");
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#d8dde3",
    backgroundColor: "#fff",
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
    top: 56,
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
