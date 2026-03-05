export function openExternalUrl(url: string): void {
  if (!url || typeof window === "undefined") {
    throw new Error("URL inválida para abertura externa.");
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = url;
  }
}

export function openMailto(url: string): void {
  if (!url || typeof window === "undefined") {
    throw new Error("URL mailto inválida.");
  }

  window.location.href = url;
}
