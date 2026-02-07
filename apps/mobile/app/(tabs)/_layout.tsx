import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PillBadge } from "@/src/components/ui";
import { useCatalog } from "@/src/state/catalogContext";
import { colors } from "@/src/theme/tokens";

export default function TabLayout() {
  const router = useRouter();
  const { message, syncing } = useCatalog();

  const offlineDetected = !syncing && Boolean(message?.toLowerCase().includes("falha"));

  function openAdmin() {
    router.push("/admin");
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.army600,
        tabBarInactiveTintColor: colors.gray500,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        header: () => (
          <View style={styles.headerContainer}>
            <Pressable onLongPress={openAdmin} delayLongPress={500}>
              <Text style={styles.headerTitle}>{titleByRoute(route.name)}</Text>
            </Pressable>
            {offlineDetected ? <PillBadge label="Offline" tone="offline" /> : null}
          </View>
        ),
      })}
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
    paddingBottom: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
});

function titleByRoute(routeName: string): string {
  if (routeName === "favorites") return "Meus Favoritos";
  if (routeName === "suggestion") return "Colaboracao";
  return "Bizus EB";
}
