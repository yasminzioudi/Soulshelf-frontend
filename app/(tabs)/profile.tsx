// app/(tabs)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BookCover, CurvedHeader, UserAvatar } from "@/src/shared/components/ui";
import { colors, fontFamily, fontSize, radius, spacing } from "@/src/theme";
import { useCurrentUser } from "@/src/features/auth/useCurrentUser";
import { useMyPublications } from "@/src/features/publications/usePublications";
import { getUserProfileApi } from "@/src/features/social/social.api";
import { useQuery } from "@tanstack/react-query";

const getInitial = (name: string | null, email: string | undefined) => {
  const source = (name && name.trim()) || email || "";
  return source.charAt(0).toUpperCase() || "?";
};

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState("Short Stories");
  const { user, loading } = useCurrentUser();

  // Fetch my own publications from backend
  const { publications } = useMyPublications();

  // Fetch my own public profile to get real follower/following counts
  const { data: myProfile } = useQuery({
    queryKey: ["users", user?.id, "profile"],
    queryFn: () => getUserProfileApi(user!.id),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  if (loading && !user) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const followersCount = myProfile?.followersCount ?? 0;
  const followingCount = myProfile?.followingCount ?? 0;
  const publicationsCount = myProfile?.publications?.length ?? publications.length;

  const initials = getInitial(user?.name ?? null, user?.email);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrapper}>
          <CurvedHeader height={140} />
          {/* Settings icon — top left */}
          <Pressable
            onPress={() => router.push("/settings")}
            style={styles.settingsButton}
            hitSlop={12}
          >
            <Ionicons name="settings-outline" size={22} color={colors.white} />
          </Pressable>
          {/* Messages icon — top right */}
          <Pressable
            onPress={() => router.push("/conversations")}
            style={styles.messagesButton}
            hitSlop={12}
          >
            <Ionicons name="chatbubbles-outline" size={22} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.avatarWrapper}>
          <UserAvatar
            name={user?.name}
            email={user?.email}
            avatarUrl={user?.avatarUrl}
            size={100}
            style={{ borderWidth: 4, borderColor: colors.white }}
            initialsStyle={{ fontSize: fontSize.xxl }}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{user?.name || "Add your name"}</Text>
          <Text style={styles.username}>{user?.email}</Text>
          {user?.occupation ? (
            <Text style={styles.occupation}>{user.occupation}</Text>
          ) : null}
          {user?.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : null}

          {/* Action buttons — Edit Profile & Friends & Admin */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.editButton}
              onPress={() => router.push("/edit-profile")}
            >
              <Text style={styles.editText}>Edit Profile</Text>
            </Pressable>
            <Pressable
              style={styles.friendsButton}
              onPress={() => router.push("/friends")}
            >
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={styles.friendsText}>Friends</Text>
            </Pressable>
            {user?.role === "ADMIN" && (
              <Pressable
                style={[styles.friendsButton, { backgroundColor: colors.primary + "15" }]}
                onPress={() => router.push("/admin/add-book" as any)}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.friendsText}>Add Book</Text>
              </Pressable>
            )}
          </View>

          {/* Real Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{publicationsCount}</Text>
              <Text style={styles.statLabel}>Publications</Text>
            </View>
            <Text style={styles.statSeparator}>|</Text>
            <Pressable
              style={styles.statItem}
              onPress={() => user?.id && router.push(`/users/${user.id}/followers` as any)}
              hitSlop={8}
            >
              <Text style={styles.statValue}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </Pressable>
            <Text style={styles.statSeparator}>|</Text>
            <Pressable
              style={styles.statItem}
              onPress={() => user?.id && router.push(`/users/${user.id}/following` as any)}
              hitSlop={8}
            >
              <Text style={styles.statValue}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Publications</Text>
            <Pressable
              style={styles.addPubHeaderBtn}
              onPress={() => router.push("/publications/create")}
              hitSlop={8}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addPubHeaderText}>Add Publication</Text>
            </Pressable>
          </View>

          <View style={styles.tabsRow}>
            <Pressable onPress={() => setActiveTab("Short Stories")}>
              <Text
                style={[
                  styles.tab,
                  activeTab === "Short Stories" && styles.tabActive,
                ]}
              >
                Short Stories
              </Text>
            </Pressable>
          </View>

          {publications.length === 0 ? (
            <View style={styles.emptyPubs}>
              <Ionicons name="book-outline" size={32} color={colors.textSecondary} />
              <Text style={styles.emptyPubsText}>No publications yet</Text>
              <Pressable
                style={styles.createPubBtn}
                onPress={() => router.push("/publications/create")}
              >
                <Text style={styles.createPubText}>Create one →</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {publications.map((pub) => (
                <BookCover
                  key={pub.id}
                  title={pub.title}
                  author={user?.name ?? ""}
                  genre={pub.genre}
                  color="#1E293B"
                  coverImage={pub.coverUrl}
                  onPress={() => router.push(`/publications/${pub.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: "center", alignItems: "center" },
  headerWrapper: { position: "relative" },
  settingsButton: {
    position: "absolute",
    top: spacing.md,
    left: spacing.lg,
    zIndex: 10,
  },
  messagesButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.lg,
    zIndex: 10,
  },
  avatarWrapper: { alignItems: "center", marginTop: -50 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.white,
    overflow: "hidden",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarInitials: {
    color: colors.white,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
  },
  info: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  name: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  username: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  occupation: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: "#F59E0B",
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  editText: {
    color: colors.white,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  friendsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  friendsText: {
    color: colors.primary,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statItem: { alignItems: "center" },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  statSeparator: { color: colors.border, fontSize: fontSize.md },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.text,
  },
  addPubHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight + "30",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  addPubHeaderText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  tabsRow: { alignSelf: "flex-start", marginBottom: spacing.md },
  tab: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingBottom: spacing.xs,
  },
  tabActive: {
    color: colors.text,
    fontFamily: fontFamily.semiBold,
    borderBottomWidth: 2,
    borderBottomColor: colors.text,
  },
  emptyPubs: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyPubsText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  createPubBtn: {},
  createPubText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    alignSelf: "flex-start",
    marginBottom: spacing.xl,
  },
});
