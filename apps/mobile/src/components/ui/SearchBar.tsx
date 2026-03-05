import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { colors } from "@/src/theme/tokens";

type SearchBarProps = Omit<TextInputProps, "style"> & {
  containerStyle?: ViewStyle;
  inputStyle?: TextInputProps["style"];
};

export function SearchBar({ containerStyle, inputStyle, placeholder, ...props }: SearchBarProps) {
  return (
    <View style={[styles.container, Platform.OS === "web" ? styles.containerWeb : null, containerStyle]}>
      <Ionicons name="search" size={16} color={colors.gray500} />
      <TextInput
        {...props}
        style={[styles.input, inputStyle]}
        placeholder={placeholder ?? "Buscar..."}
        placeholderTextColor={colors.gray500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  containerWeb: {
    minHeight: 40,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    color: colors.gray900,
    fontSize: 14,
  },
});
