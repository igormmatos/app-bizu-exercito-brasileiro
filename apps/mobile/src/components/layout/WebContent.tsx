import type { PropsWithChildren } from "react";
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from "react-native";

type WebContentProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  maxWidth?: number;
  desktopBreakpoint?: number;
}>;

const DEFAULT_MAX_WIDTH = 720;
const DEFAULT_DESKTOP_BREAKPOINT = 1024;

export function WebContent({
  children,
  style,
  padded = true,
  maxWidth = DEFAULT_MAX_WIDTH,
  desktopBreakpoint = DEFAULT_DESKTOP_BREAKPOINT,
}: WebContentProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= desktopBreakpoint;

  return (
    <View
      style={[
        styles.base,
        padded ? styles.padded : null,
        isDesktop ? { maxWidth, alignSelf: "center" } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
  },
  padded: {
    padding: 16,
  },
});
