import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/src/theme/tokens";

type SafeHeaderProps = {
  title: string;
  right?: ReactNode;
  onTitleLongPress?: () => void;
};

export function SafeHeader({ title, right, onTitleLongPress }: SafeHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <Pressable onLongPress={onTitleLongPress} delayLongPress={500}>
          <Text style={styles.title}>{title}</Text>
        </Pressable>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: colors.army900,
  },
  inner: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    minHeight: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
});
