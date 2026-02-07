import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { type ContentType, colors } from "@/src/theme/tokens";

type PreviewPlaceholderProps = {
  type: ContentType;
  label?: string;
  height?: number;
};

export function PreviewPlaceholder({ type, label, height = 170 }: PreviewPlaceholderProps) {
  return (
    <View style={[styles.container, { height }]}>
      <Ionicons name={iconByType(type)} size={44} color="#9CA3AF" />
      <Text style={styles.label}>{label ?? defaultLabelByType(type)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.6,
    fontWeight: "700",
    color: "#9CA3AF",
  },
});

function iconByType(type: ContentType): keyof typeof Ionicons.glyphMap {
  if (type === "audio") return "musical-notes";
  if (type === "pdf") return "document-text";
  if (type === "image") return "image";
  return "document";
}

function defaultLabelByType(type: ContentType): string {
  if (type === "audio") return "AUDIO PREVIEW";
  if (type === "pdf") return "PDF PREVIEW";
  if (type === "image") return "IMAGE PREVIEW";
  return "TEXT PREVIEW";
}
