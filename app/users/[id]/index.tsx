import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  type PublicProfileDto,
} from "@/src/features/social/social.api";
import {
  useFollowUser,
  useUnfollowUser,
  useUserProfile,
} from "@/src/features/social/useSocial";
import { getOrCreateConversationApi } from "@/src/features/messaging/messaging.api";
import { UserAvatar } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

export default function PublicProfileScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string }>();
  const userId = parseInt(params.id || "0", 10);

  const { profile, isLoading, isError, refetch } = useUserProfile(userId);
  const { followUser, isFollowingLoading } = useFollowUser();
  const { unfollowUser, isUnfollowingLoading } = useUnfollowUser();
  const [isMessageLoading, setIsMessageLoading] = useState<boolean>(false);

  const isFollowActionPending = isFollowingLoading || isUnfollowingLoading;

  const handleFollowToggle = async () => {
    if (!profile || isFollowActionPending) return;
    try {
      if (profile.isFollowing) {
        await unfollowUser(profile.id);
      } else {
        await followUser(profile.id);
      }
    } catch {
      Alert.alert("Error", "Could not update follow status.");
    }
  };


  const handleStartConversation = async () => {
    if (!profile || isMessageLoading) return;
    setIsMessageLoading(true);
    try {
      const res = await getOrCreateConversationApi(profile.id);
      router.push(`/conversations/${res.conversationId}`);
    } catch {
      Alert.alert("Error", "Could not open conversation.");
    } finally {
      setIsMessageLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Profile not found</Text>
          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => void refetch()}>
            <Text style={styles.btnText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initials = profile.name ? profile.name[0].toUpperCase() : "?";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Navigation */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{profile.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      >
        {/* Profile Info Header */}
        <View style={styles.profileHeader}>
          <UserAvatar
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            size={84}
          />

          <Text style={[styles.userName, { color: colors.text }]}>{profile.name}</Text>
          {profile.occupation && (
            <Text style={[styles.userOccupation, { color: colors.primary }]}>{profile.occupation}</Text>
          )}
          {profile.bio && (
            <Text style={[styles.userBio, { color: colors.textSecondary }]}>{profile.bio}</Text>
          )}

          {/* Stats Bar */}
          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push(`/users/${profile.id}/followers` as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>{profile.followersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push(`/users/${profile.id}/following` as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>{profile.followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{profile.publications.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Publications</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {!profile.isSelf && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  profile.isFollowing
                    ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
                    : { backgroundColor: colors.primary },
                ]}
                onPress={handleFollowToggle}
                disabled={isFollowActionPending}
              >
                {isFollowActionPending ? (
                  <ActivityIndicator size="small" color={profile.isFollowing ? colors.text : "#fff"} />
                ) : (
                  <Text
                    style={[
                      styles.followBtnText,
                      profile.isFollowing ? { color: colors.text } : { color: "#fff" },
                    ]}
                  >
                    {profile.isFollowing ? "Following" : "Follow"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.messageBtn, { borderColor: colors.primary, borderWidth: 1.5 }]}
                onPress={handleStartConversation}
                disabled={isMessageLoading}
              >
                {isMessageLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View style={styles.messageBtnContent}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                    <Text style={[styles.messageBtnText, { color: colors.primary }]}>Message</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* User Publications Section */}
        <View style={styles.publicationsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Publications</Text>

          {profile.publications.length === 0 ? (
            <View style={[styles.emptyPubsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="book-outline" size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyPubsText, { color: colors.textSecondary }]}>
                No publications shared yet.
              </Text>
            </View>
          ) : (
            profile.publications.map((pub: any) => (
              <TouchableOpacity
                key={pub.id}
                style={[styles.pubCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(`/publications/${pub.id}` as any)}
              >
                <View style={styles.pubContent}>
                  <Text style={[styles.pubTitle, { color: colors.text }]}>{pub.title}</Text>
                  {pub.description && (
                    <Text style={[styles.pubDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {pub.description}
                    </Text>
                  )}
                  <View style={styles.pubFooter}>
                    <Text style={[styles.pubGenre, { color: colors.primary }]}>{pub.genre}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  btn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  btnText: {
    color: "#fff",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  profileHeader: {
    alignItems: "center",
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarInitials: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  userName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    marginBottom: 2,
  },
  userOccupation: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  userBio: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: "100%",
    justifyContent: "space-around",
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  divider: {
    width: 1,
    height: 32,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  followBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  messageBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  messageBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  publicationsSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  emptyPubsCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyPubsText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  pubCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  pubContent: {
    flex: 1,
    gap: 2,
  },
  pubTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  pubDesc: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  pubFooter: {
    marginTop: spacing.xs,
  },
  pubGenre: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
});
