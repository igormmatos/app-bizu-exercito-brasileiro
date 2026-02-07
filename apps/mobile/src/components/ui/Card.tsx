import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/src/theme/tokens";

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}>;

export function Card({ children, style, noPadding = false }: CardProps) {
  return <View style={[styles.card, noPadding ? styles.noPadding : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  noPadding: {
    padding: 0,
  },
});
