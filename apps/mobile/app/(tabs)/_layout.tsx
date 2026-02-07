import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useCatalog } from "@/src/state/catalogContext";
import { colors } from "@/src/theme/tokens";

export default function TabLayout() {
  const router = useRouter();
  const { message, syncing } = useCatalog();
  const [query, setQuery] = useState("");

  const offlineDetected = !syncing && Boolean(message?.toLowerCase().includes("falha"));

  function openSearch() {
    const q = query.trim();
    router.push({
      pathname: "/search",
      params: q ? { q } : undefined,
    });
  }

  function openAdmin() {
    router.push("/admin");
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.army600,
        tabBarInactiveTintColor: colors.gray500,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        header: () => (
          <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
              <Pressable onLongPress={openAdmin} delayLongPress={500}>
                <Text style={styles.headerTitle}>Bizus EB</Text>
              </Pressable>
              {offlineDetected ? <Text style={styles.offlineBadge}>Offline</Text> : null}
            </View>
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Buscar no catalogo..."
                placeholderTextColor={colors.gray500}
                value={query}
                onChangeText={setQuery}
                onFocus={openSearch}
                onSubmitEditing={openSearch}
                style={styles.searchInput}
                returnKeyType="search"
              />
              <Pressable onPress={openSearch} style={styles.searchButton}>
                <Ionicons name="search" size={16} color={colors.white} />
              </Pressable>
            </View>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="suggestion"
        options={{
          title: "Sugestao",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.gray100,
    height: 62,
    paddingBottom: 6,
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  headerContainer: {
    backgroundColor: colors.army900,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
  },
  offlineBadge: {
    color: colors.white,
    backgroundColor: colors.gray500,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "600",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    color: colors.gray900,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: colors.army600,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
