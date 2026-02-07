import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/src/theme/tokens";

type PillBadgeTone = "offline" | "neutral" | "success" | "warning";

type PillBadgeProps = {
  label: string;
  tone?: PillBadgeTone;
  style?: StyleProp<ViewStyle>;
};

export function PillBadge({ label, tone = "neutral", style }: PillBadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone], style]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
});

const toneStyles = StyleSheet.create({
  offline: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  neutral: {
    backgroundColor: colors.gray500,
  },
  success: {
    backgroundColor: colors.army600,
  },
  warning: {
    backgroundColor: "#B45309",
  },
});
