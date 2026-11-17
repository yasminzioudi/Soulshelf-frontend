// app/(tabs)/library.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";

import { useLibrary } from "@/src/features/library/useLibrary";
import { useLatestReader } from "@/src/features/reader/useReader";
import { BookCover } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

interface QuickLinkProps {
  label: string;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
}

function QuickLink({ label, onPress, colors }: QuickLinkProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.quickLink,
        { backgroundColor: colors.surface },
        pressed && styles.quickLinkPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.quickLinkText, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
    </Pressable>
  );
}

export default function LibraryScreen() {
  const colors = useColors();
  const { library, isLoading, isError, error, refetch, isRefetching } = useLibrary();
  const { data: latestProgress, refetch: refetchLatest } = useLatestReader();

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchLatest()]);
  };

  const handleContinueReading = () => {
    if (latestProgress?.bookId) {
      router.push(`/reader/${latestProgress.bookId}`);
    } else {
      Alert.alert(
        "No Reading History",
        "You haven't started reading any books yet. Pick a book from your collection to start reading!",
      );
    }
  };

  const renderContent = () => {
    if (isLoading && !isRefetching) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Loading your library...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            Unable to load library
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { color: colors.white }]}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    if (library.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="library-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            Your library is empty
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Books you add to your collection will appear here.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {library.map((item) => (
          <BookCover
            key={item.id}
            title={item.book.title}
            genre={item.book.genre}
            color={item.book.coverColor}
            coverImage={item.book.coverImage}
            onPress={() => router.push(`/book/${item.book.id}`)}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Titre */}
        <Text style={[styles.title, { color: colors.text }]}>My Collections</Text>

        {/* Dynamic Continue Reading Card when progress exists */}
        {latestProgress?.book ? (
          <View style={styles.continueSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Reading</Text>
            <Pressable
              style={({ pressed }) => [
                styles.continueCard,
                { backgroundColor: colors.surface },
                pressed && styles.continueCardPressed,
              ]}
              onPress={handleContinueReading}
              accessibilityRole="button"
            >
              <View style={[styles.cardCover, { backgroundColor: latestProgress.book.coverColor ?? colors.primary }]}>
                {latestProgress.book.coverImage ? (
                  <Image
                    source={{ uri: latestProgress.book.coverImage }}
                    style={styles.cardCoverImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.cardCoverText} numberOfLines={2}>
                    {latestProgress.book.title}
                  </Text>
                )}
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.chapterBadge}>
                  <Text style={[styles.chapterBadgeText, { color: colors.primary }]}>
                    Chapter {latestProgress.currentChapter}
                  </Text>
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {latestProgress.book.title}
                </Text>
                <Text style={[styles.cardAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
                  {latestProgress.book.author ?? "Unknown Author"}
                </Text>
                <View style={styles.resumeRow}>
                  <Text style={[styles.resumeText, { color: colors.primary }]}>Resume Reading</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </Pressable>
          </View>
        ) : (
          /* Continue Reading quick link when no progress exists yet */
          <View style={styles.quickLinksSection}>
            <QuickLink
              label="Continue Reading"
              onPress={handleContinueReading}
              colors={colors}
            />
          </View>
        )}

        {/* Section My Folder */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>My Folder</Text>
        {renderContent()}
      </ScrollView>

      {/* FAB + */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
          pressed && styles.fabPressed,
        ]}
        onPress={() => router.push("/search")}
        accessibilityRole="button"
        accessibilityLabel="Add new book"
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 100, // espace pour le FAB
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
    marginBottom: spacing.lg,
  },
  continueSection: {
    marginBottom: spacing.xl,
  },
  continueCard: {
    flexDirection: "row",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.md,
  },
  continueCardPressed: {
    opacity: 0.85,
  },
  cardCover: {
    width: 60,
    height: 85,
    borderRadius: radius.sm,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCoverImage: {
    width: "100%",
    height: "100%",
  },
  cardCoverText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: "#FFFFFF",
    textAlign: "center",
    padding: 4,
  },
  cardDetails: {
    flex: 1,
    gap: 2,
  },
  chapterBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: 2,
  },
  chapterBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  cardTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  cardAuthor: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  resumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  resumeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  quickLinksSection: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  quickLinkPressed: {
    opacity: 0.75,
  },
  quickLinkText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  stateTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  stateText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  retryText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
