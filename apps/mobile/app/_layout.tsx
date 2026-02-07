import { Stack } from "expo-router";
import { CatalogProvider } from "@/src/state/catalogContext";
import { PillBadge } from "@/src/components/ui";
import { useCatalog } from "@/src/state/catalogContext";
import { colors } from "@/src/theme/tokens";

export default function RootLayout() {
  return (
    <CatalogProvider>
      <AppStack />
    </CatalogProvider>
  );
}

function AppStack() {
  const { message, syncing } = useCatalog();
  const offlineDetected = !syncing && Boolean(message?.toLowerCase().includes("falha"));

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.army900 },
        headerTintColor: colors.white,
        headerTitleStyle: { color: colors.white, fontWeight: "700" },
        headerRight: () => (offlineDetected ? <PillBadge label="Offline" tone="offline" /> : null),
        contentStyle: { backgroundColor: colors.gray100 },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="category/[id]" options={{ title: "Categoria" }} />
      <Stack.Screen name="item/[id]" options={{ title: "Detalhes" }} />
      <Stack.Screen name="search" options={{ title: "Busca" }} />
      <Stack.Screen name="admin" options={{ title: "Admin/Diagnostico" }} />
      <Stack.Screen name="pdf" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
    </Stack>
  );
}
