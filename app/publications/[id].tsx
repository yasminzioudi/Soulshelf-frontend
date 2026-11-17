// app/publications/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getUser, StoredUser } from "@/src/core/storage/tokenStorage";
import {
  useDeletePublication,
  usePublication,
  usePublicationLikeStatus,
  useLikePublication,
  useUnlikePublication,
} from "@/src/features/publications/usePublications";
import { Button } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

export default function PublicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const pubId = Number(id);
  const isValidId = !isNaN(pubId) && pubId > 0;

  const { publication, isLoading, isError, error, refetch } = usePublication(isValidId ? pubId : 0);
  const { deletePublication, isDeleting } = useDeletePublication();
  const { isLiked, likesCount } = usePublicationLikeStatus(isValidId ? pubId : 0);
  const { likePublication, isLiking } = useLikePublication();
  const { unlikePublication, isUnliking } = useUnlikePublication();
  const isPendingLike = isLiking || isUnliking;

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      const user = await getUser();
      if (!cancelled) {
        setCurrentUser(user);
      }
    };
    void fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const isOwner = Boolean(
    publication && currentUser && publication.authorId === currentUser.id,
  );

  // Split plain text content into readable paragraphs with reading time estimate
  const paragraphs = useMemo(() => {
    if (!publication?.content) return [];
    return publication.content
      .split(/\r?\n\r?\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [publication?.content]);

  const readingStats = useMemo(() => {
    if (!publication?.content) return null;
    const words = publication.content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  }, [publication?.content]);

  const handleToggleLike = async () => {
    if (!isValidId || isPendingLike) return;
    try {
      if (isLiked) {
        await unlikePublication(pubId);
      } else {
        await likePublication(pubId);
      }
    } catch {
      Alert.alert("Error", "Could not update like status.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Publication",
      `Are you sure you want to delete "${publication?.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePublication(pubId);
              router.back();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : "Unable to delete publication.";
              Alert.alert("Delete Failed", msg);
            }
          },
        },
      ],
    );
  };

  if (!isValidId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Invalid Publication</Text>
          <Button label="Go Back" onPress={() => router.back()} style={styles.backBtn} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Loading publication...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !publication) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContainer}>
          <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Publication Not Found</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : "The requested publication does not exist."}
          </Text>
          <Button label="Try Again" onPress={() => refetch()} style={styles.backBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            Publication
          </Text>

          {/* Owner Actions */}
          {isOwner ? (
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => router.push(`/publications/edit/${pubId}`)}
                hitSlop={8}
                style={styles.actionIcon}
              >
                <Ionicons name="pencil-outline" size={22} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                hitSlop={8}
                style={styles.actionIcon}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Ionicons name="trash-outline" size={22} color={colors.error} />
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.placeholderIcon} />
          )}
        </View>

        {/* Cover & Main Info Header */}
        <View style={styles.heroSection}>
          {publication.coverUrl ? (
            <Image
              source={{ uri: publication.coverUrl }}
              style={styles.coverImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.coverFallback, { backgroundColor: colors.surface }]}>
              <Ionicons name="journal-outline" size={48} color={colors.primary} />
            </View>
          )}

          <Text style={[styles.title, { color: colors.text }]}>{publication.title}</Text>

          {/* Tappable Author Name -> Public Profile */}
          <TouchableOpacity
            onPress={() => publication.authorId && router.push(`/users/${publication.authorId}` as any)}
            disabled={!publication.authorId}
          >
            <Text style={[styles.authorName, { color: colors.primary }]}>
              By {publication.author?.name ?? "Unknown Author"}
              {publication.author?.occupation ? ` • ${publication.author.occupation}` : ""} →
            </Text>
          </TouchableOpacity>

          <View style={[styles.genreBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.genreText}>{publication.genre}</Text>
          </View>

          {/* Publication Like Control */}
          <TouchableOpacity
            style={[
              styles.likeBarButton,
              {
                borderColor: colors.border,
                backgroundColor: isLiked ? colors.primaryLight : colors.surface,
              },
            ]}
            onPress={handleToggleLike}
            disabled={isPendingLike}
          >
            {isPendingLike ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={22}
                  color={isLiked ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.likeCountText,
                    { color: isLiked ? colors.primary : colors.text },
                  ]}
                >
                  {likesCount} {likesCount === 1 ? "Like" : "Likes"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Metadata Details Card */}
        <View style={[styles.metadataCard, { backgroundColor: colors.surface }]}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Published</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {publication.publishedYear ?? "N/A"}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Language</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {publication.language ?? "English"}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Pages</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {publication.pages ? `${publication.pages} pages` : "N/A"}
            </Text>
          </View>
        </View>

        {/* Description Section */}
        {publication.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {publication.description}
            </Text>
          </View>
        ) : null}

        {/* Reader / Content Body Section */}
        <View style={styles.section}>
          <View style={styles.contentHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Story Content</Text>
            {readingStats && (
              <Text style={[styles.readingStatsText, { color: colors.textSecondary }]}>
                {readingStats.minutes} min read • {readingStats.words} words
              </Text>
            )}
          </View>
          {paragraphs.length > 0 ? (
            <View style={[styles.contentCard, { backgroundColor: colors.surface }]}>
              {paragraphs.map((paragraph, index) => (
                <Text
                  key={index}
                  style={[
                    styles.bodyParagraph,
                    {
                      color: colors.text,
                      marginBottom: index === paragraphs.length - 1 ? 0 : spacing.lg,
                    },
                  ]}
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyContentText, { color: colors.textSecondary }]}>
              No reader text content provided for this publication.
            </Text>
          )}
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
    marginBottom: spacing.lg,
  },
  headerIcon: {
    width: 32,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  actionIcon: {
    padding: spacing.xs,
  },
  placeholderIcon: {
    width: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  stateTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    textAlign: "center",
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  backBtn: {
    marginTop: spacing.md,
    minWidth: 140,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  coverImage: {
    width: 140,
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  coverFallback: {
    width: 140,
    height: 200,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  authorName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  genreBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  genreText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  likeBarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  likeCountText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  metadataCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  metaItem: {
    alignItems: "center",
  },
  metaLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  metaValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  divider: {
    width: 1,
    height: 28,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  contentCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  emptyContentText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
  contentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  readingStatsText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  bodyParagraph: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
});
