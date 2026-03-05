import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { getContentColors, type ContentType, colors } from "@/src/theme/tokens";

type ContentListItemProps = {
  title: string;
  subtitle?: string | null;
  type?: ContentType;
  trailing?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ContentListItem({
  title,
  subtitle,
  type = "text",
  trailing,
  onPress,
  style,
}: ContentListItemProps) {
  const palette = getContentColors(type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, Platform.OS === "web" ? styles.cardWeb : null, pressed ? styles.pressed : null, style]}
    >
      <View style={[styles.iconCircle, { backgroundColor: palette.bg }]}>
        <Ionicons name={iconByType(type)} size={16} color={palette.primary} />
      </View>

      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardWeb: {
    minHeight: 64,
    paddingVertical: 9,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.gray900,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray500,
  },
  trailing: {
    alignItems: "center",
    justifyContent: "center",
  },
});

function iconByType(type: ContentType): keyof typeof Ionicons.glyphMap {
  if (type === "audio") return "musical-note";
  if (type === "pdf") return "document-text";
  if (type === "image") return "image";
  return "book";
}
