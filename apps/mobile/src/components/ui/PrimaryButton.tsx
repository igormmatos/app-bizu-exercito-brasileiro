import { Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/src/theme/tokens";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  compact = false,
  style,
}: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        Platform.OS === "web" ? styles.buttonWeb : null,
        compact ? styles.compact : null,
        compact && Platform.OS === "web" ? styles.compactWeb : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: colors.army600,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 1,
  },
  buttonWeb: {
    minHeight: 40,
    paddingVertical: 9,
  },
  compact: {
    minHeight: 36,
    paddingVertical: 8,
  },
  compactWeb: {
    minHeight: 34,
    paddingVertical: 7,
  },
  pressed: {
    backgroundColor: colors.army700,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
