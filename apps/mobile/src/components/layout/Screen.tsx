import type { PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors } from "@/src/theme/tokens";

type ScreenProps = PropsWithChildren<{
  backgroundColor?: string;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({
  children,
  backgroundColor = colors.gray100,
  edges = ["top", "left", "right"],
  style,
}: ScreenProps) {
  return <SafeAreaView style={[styles.container, { backgroundColor }, style]} edges={edges}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
