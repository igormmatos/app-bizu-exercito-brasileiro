export const colors = {
  army900: "#26392D",
  army600: "#40694D",
  gray100: "#F3F4F6",
  gray900: "#111827",
  gray700: "#374151",
  gray500: "#6B7280",
  white: "#FFFFFF",
  audioPrimary: "#7C3AED",
  audioBg: "#EDE9FE",
  pdfPrimary: "#DC2626",
  pdfBg: "#FEE2E2",
  imagePrimary: "#2563EB",
  imageBg: "#DBEAFE",
  textPrimary: "#EA580C",
  textBg: "#FFEDD5",
} as const;

export type ContentType = "audio" | "pdf" | "image" | "text";

export function getContentColor(type: ContentType): { primary: string; bg: string } {
  if (type === "audio") {
    return { primary: colors.audioPrimary, bg: colors.audioBg };
  }
  if (type === "pdf") {
    return { primary: colors.pdfPrimary, bg: colors.pdfBg };
  }
  if (type === "image") {
    return { primary: colors.imagePrimary, bg: colors.imageBg };
  }
  return { primary: colors.textPrimary, bg: colors.textBg };
}
