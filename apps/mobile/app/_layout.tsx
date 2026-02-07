import { Stack } from "expo-router";
import { CatalogProvider } from "@/src/state/catalogContext";
import { colors } from "@/src/theme/tokens";

export default function RootLayout() {
  return (
    <CatalogProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.army900 },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white, fontWeight: "700" },
          contentStyle: { backgroundColor: colors.gray100 },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="category/[id]" options={{ title: "Categoria" }} />
        <Stack.Screen name="item/[id]" options={{ title: "Item Detail" }} />
        <Stack.Screen name="search" options={{ title: "Busca" }} />
        <Stack.Screen name="admin" options={{ title: "Admin/Diagnostico" }} />
        <Stack.Screen name="pdf" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
      </Stack>
    </CatalogProvider>
  );
}
