import { Stack } from "expo-router";
import { CatalogProvider } from "@/src/state/catalogContext";

export default function RootLayout() {
  return (
    <CatalogProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="category/[id]" options={{ title: "Categoria" }} />
        <Stack.Screen name="item/[id]" options={{ title: "Item Detail" }} />
        <Stack.Screen name="pdf" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
      </Stack>
    </CatalogProvider>
  );
}
