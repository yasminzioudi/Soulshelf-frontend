// app/users/[id]/followers.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFollowers, useUserProfile } from "@/src/features/social/useSocial";
import type { PublicUserDto } from "@/src/features/social/social.api";
import { UserAvatar as SharedUserAvatar } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

function UserAvatar({ user, size = 48 }: { user: PublicUserDto; size?: number }) {
  return <SharedUserAvatar name={user.name} avatarUrl={user.avatarUrl} size={size} />;
}

export default function FollowersScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string }>();
  const userId = parseInt(params.id || "0", 10);

  const { profile } = useUserProfile(userId);
  const { followers, isLoading, isError, refetch } = useFollowers(userId);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Followers</Text>
          {profile?.name && (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {profile.name}
            </Text>
          )}
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subText, { color: colors.textSecondary }]}>Loading followers...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Unable to load followers</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => void refetch()}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={52} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No followers yet</Text>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            When someone follows this profile, they will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }
        >
          {followers.map((person) => (
            <TouchableOpacity
              key={person.id}
              style={[
                styles.userCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/users/${person.id}` as any)}
              activeOpacity={0.7}
            >
              <UserAvatar user={person} size={48} />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                  {person.name}
                </Text>
                {person.occupation ? (
                  <Text style={[styles.userOccupation, { color: colors.primary }]} numberOfLines={1}>
                    {person.occupation}
                  </Text>
                ) : null}
                {person.bio ? (
                  <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={1}>
                    {person.bio}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 32 },
  headerTitleWrap: { alignItems: "center" },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  subText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  retryBtnText: {
    color: "#fff",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  userOccupation: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  userBio: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
