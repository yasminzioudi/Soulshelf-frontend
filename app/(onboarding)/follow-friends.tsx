// app/(onboarding)/follow-friends.tsx
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

import { Button, UserAvatar } from "@/src/shared/components/ui";
import { useDiscoverWriters } from "@/src/features/social/useSocial";
import { followUserApi, unfollowUserApi } from "@/src/features/social/social.api";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

export default function FollowFriendsScreen() {
  const colors = useColors();
  const { writers, isLoading } = useDiscoverWriters();
  // track which user IDs the current user has followed during onboarding
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [pendingId, setPendingId] = useState<number | null>(null);

  const handleToggleFollow = async (id: number) => {
    if (pendingId !== null) return;
    setPendingId(id);
    try {
      if (followed.has(id)) {
        await unfollowUserApi(id);
        setFollowed((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await followUserApi(id);
        setFollowed((prev) => new Set(prev).add(id));
      }
    } catch {
      // silently ignore — user can retry
    } finally {
      setPendingId(null);
    }
  };

  const handleBegin = () => {
    router.push("/(tabs)/library");
  };

  // Build rows of 2 from writers
  const rows: (typeof writers)[] = [];
  for (let i = 0; i < writers.length; i += 2) {
    rows.push(writers.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Progress bar — step 2 of 2 */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: "100%", backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, { color: colors.text }]}>Follow Your Friends</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Follow writers for more relevant suggestions.
        </Text>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Discovering writers...
            </Text>
          </View>
        )}

        {/* Writers Grid */}
        {!isLoading && writers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No writers to suggest right now.
            </Text>
          </View>
        )}

        {!isLoading && rows.length > 0 && (
          <View style={styles.grid}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((writer) => {
                  const isFollowing = followed.has(writer.id);
                  const isPending = pendingId === writer.id;
                  const initials = writer.name ? writer.name[0].toUpperCase() : "?";
                  return (
                    <View
                      key={writer.id}
                      style={[styles.card, { backgroundColor: colors.surface }]}
                    >
                      {/* Avatar */}
                      <UserAvatar
                        name={writer.name}
                        avatarUrl={writer.avatarUrl}
                        size={64}
                        style={{ marginBottom: spacing.xs }}
                      />

                      {/* Name */}
                      <Text style={[styles.writerName, { color: colors.text }]} numberOfLines={1}>
                        {writer.name}
                      </Text>

                      {/* Occupation */}
                      {writer.occupation ? (
                        <Text style={[styles.writerOcc, { color: colors.primary }]} numberOfLines={1}>
                          {writer.occupation}
                        </Text>
                      ) : null}

                      {/* Stats */}
                      <Text style={[styles.writerStats, { color: colors.textSecondary }]}>
                        {writer.followersCount} followers
                      </Text>

                      {/* Follow Button */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.followButton,
                          isFollowing
                            ? { backgroundColor: colors.surface, borderColor: colors.primary }
                            : { backgroundColor: colors.primary, borderColor: colors.primary },
                          pressed && styles.followButtonPressed,
                        ]}
                        onPress={() => handleToggleFollow(writer.id)}
                        disabled={isPending}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isFollowing
                            ? `Unfollow ${writer.name}`
                            : `Follow ${writer.name}`
                        }
                      >
                        {isPending ? (
                          <ActivityIndicator size="small" color={isFollowing ? colors.primary : "#fff"} />
                        ) : (
                          <Text
                            style={[
                              styles.followLabel,
                              { color: isFollowing ? colors.primary : "#FFFFFF" },
                            ]}
                          >
                            {isFollowing ? "Following" : "Follow"}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Main Action Button */}
        <Button
          label="Begin Your Adventure"
          onPress={handleBegin}
          style={styles.beginButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  progressTrack: {
    height: 4,
    width: "100%",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxl,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginBottom: spacing.xl,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  grid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarInitials: {
    color: "#fff",
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
  },
  writerName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  writerOcc: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  writerStats: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  followButton: {
    width: "100%",
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  followButtonPressed: {
    opacity: 0.75,
  },
  followLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  beginButton: {
    width: "100%",
  },
});
