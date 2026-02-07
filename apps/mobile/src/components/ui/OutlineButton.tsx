import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/src/theme/tokens";

type OutlineButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function OutlineButton({
  label,
  onPress,
  disabled = false,
  compact = false,
  style,
}: OutlineButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compact : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <View>
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  compact: {
    minHeight: 36,
    paddingVertical: 8,
  },
  pressed: {
    backgroundColor: colors.gray100,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: colors.gray700,
    fontSize: 15,
    fontWeight: "600",
  },
});
