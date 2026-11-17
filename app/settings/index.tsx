// app/settings/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { useCurrentUser } from "@/src/features/auth/useCurrentUser";
import { UserAvatar } from "@/src/shared/components/ui";
import { useAppTheme } from "@/src/shared/providers/ThemeProvider";
import { fontFamily, fontSize, spacing } from "@/src/theme";

const MENU_ITEMS = [
  { id: "favourite-books", icon: "heart-outline", label: "Favourite Books" },
  {
    id: "favourite-authors",
    icon: "heart-outline",
    label: "Favourite Authors",
  },
  { id: "downloads", icon: "download-outline", label: "Downloads" },
  { id: "languages", icon: "globe-outline", label: "Languages" },
  { id: "location", icon: "location-outline", label: "Location" },
  { id: "subscription", icon: "play-outline", label: "Subscription" },
] as const;

const getInitial = (
  name: string | null | undefined,
  email: string | undefined,
) => {
  const source = (name && name.trim()) || email || "";
  return source.charAt(0).toUpperCase() || "?";
};

export default function SettingsScreen() {
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useCurrentUser();

  // ── Theme ────────────────────────────────────────────────────────────────
  const { colors, isDark, toggleTheme } = useAppTheme();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          if (loggingOut) return;
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </View>

        {/* Profil */}
        <Pressable
          style={styles.profileRow}
          onPress={() => router.push("/edit-profile")}
        >
          <View style={styles.avatarWrapper}>
            <UserAvatar
              name={user?.name}
              email={user?.email}
              avatarUrl={user?.avatarUrl}
              size={72}
            />
            <View style={[styles.cameraIcon, { backgroundColor: colors.primary, borderColor: colors.white }]}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </View>
          <View>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.name || "Add your name"}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </Pressable>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              style={styles.menuItem}
              onPress={() => {
                if (item.id === "favourite-books") {
                  router.push("/favorites");
                }
              }}
            >
              <Ionicons name={item.icon as any} size={20} color={colors.text} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          ))}

          {/* Dark Mode switch — connected to global ThemeProvider */}
          <View style={styles.menuItem}>
            <Ionicons name="moon-outline" size={20} color={colors.text} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          {/* Admin Tools — Only visible to users with ADMIN role */}
          {user?.role === "ADMIN" && (
            <Pressable
              style={styles.menuItem}
              onPress={() => router.push("/admin/add-book" as any)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.menuLabel, { color: colors.primary, fontFamily: fontFamily.semiBold }]}>
                Add Book / Content (Admin)
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.primary}
              />
            </Pressable>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.menu}>
          <Pressable style={styles.menuItem}>
            <Ionicons name="trash-outline" size={20} color={colors.text} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Clear Cache</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.menuLabel, { color: colors.error }]}>
              {loggingOut ? "Logging out..." : "Log Out"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 56, height: 56 },
  avatarInitials: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  cameraIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  profileName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  profileEmail: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  menu: { gap: spacing.lg },
  menuItem: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  menuLabel: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xl,
  },
});
