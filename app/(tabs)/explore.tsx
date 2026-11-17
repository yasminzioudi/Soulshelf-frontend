// app/(tabs)/explore.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useBooks, useFeaturedBooks } from "@/src/features/books/useBooks";
import { useCommunityPublications } from "@/src/features/publications/usePublications";
import { useDiscoverWriters } from "@/src/features/social/useSocial";
import { useAIRecommendations } from "@/src/features/ai/useAI";
import { useCurrentUser } from "@/src/features/auth/useCurrentUser";
import type { DiscoverWriterDto } from "@/src/features/social/social.api";
import { BookCover, UserAvatar } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  colors: ReturnType<typeof useColors>;
}

function SectionHeader({ title, onViewAll, colors }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {onViewAll && (
        <Pressable onPress={onViewAll}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All →</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function ExploreScreen() {
  const colors = useColors();
  const { books, isLoading, isError, error, refetch, isFetching } = useBooks();
  const { featuredBooks, refetch: refetchFeatured } = useFeaturedBooks();
  const { publications: communityPubs } = useCommunityPublications();
  const { writers, isLoading: loadingWriters, refetch: refetchWriters } = useDiscoverWriters();
  const { user } = useCurrentUser();
  const { recommendations, refetch: refetchRecs } = useAIRecommendations();
  const [selectedGenre, setSelectedGenre] = useState<string>("All");

  // Derive unique non-null genres dynamically from real PostgreSQL books
  const genres = useMemo(() => {
    const list = Array.from(
      new Set(books.map((b) => b.genre).filter((g): g is string => Boolean(g && g.trim()))),
    );
    return ["All", ...list];
  }, [books]);

  // Filter books dynamically by selected genre
  const filteredBooks = useMemo(() => {
    if (selectedGenre === "All") return books;
    return books.filter((b) => b.genre?.toLowerCase() === selectedGenre.toLowerCase());
  }, [books, selectedGenre]);

  const handleRefresh = () => {
    refetch();
    refetchFeatured();
    refetchWriters();
    refetchRecs();
  };

  const renderContent = () => {
    if (isLoading && books.length === 0) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Loading explore catalog...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            Unable to load catalog
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    const isFiltered = selectedGenre !== "All";

    return (
      <>
        {/* If a genre is selected, prioritize and show the filtered catalog right at the top */}
        {isFiltered ? (
          <View style={styles.gridSection}>
            <SectionHeader
              title={`${selectedGenre} Books`}
              colors={colors}
            />
            {filteredBooks.length === 0 ? (
              <View style={styles.stateContainer}>
                <Ionicons name="compass-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.stateTitle, { color: colors.text }]}>
                  No books found
                </Text>
                <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                  {`No books available under "${selectedGenre}".`}
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredBooks.map((item) => (
                  <BookCover
                    key={item.id}
                    title={item.title}
                    author={item.author}
                    genre={item.genre}
                    color={item.coverColor}
                    coverImage={item.coverImage}
                    width="47%"
                    onPress={() => router.push(`/book/${item.id}`)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Section 1: Discover Writers (Real Backend Writers) */}
            {writers && writers.length > 0 && (
              <View style={styles.gridSection}>
                <SectionHeader title="Discover Writers" colors={colors} />
                <FlatList
                  data={writers}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carousel}
                  renderItem={({ item }: { item: DiscoverWriterDto }) => {
                    return (
                      <TouchableOpacity
                        style={[styles.writerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => router.push(`/users/${item.id}` as any)}
                      >
                        <UserAvatar
                          name={item.name}
                          avatarUrl={item.avatarUrl}
                          size={48}
                        />
                        <Text style={[styles.writerName, { color: colors.text }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.occupation ? (
                          <Text style={[styles.writerOcc, { color: colors.primary }]} numberOfLines={1}>
                            {item.occupation}
                          </Text>
                        ) : null}
                        <Text style={[styles.writerStats, { color: colors.textSecondary }]}>
                          {item.followersCount} followers · {item.publicationsCount} pubs
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {/* Section 2: Featured Discoveries Carousel - Separate from catalog */}
            {featuredBooks.length > 0 && (
              <View>
                <SectionHeader title="Featured Discoveries" colors={colors} />
                <FlatList
                  data={featuredBooks}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carousel}
                  renderItem={({ item }) => (
                    <BookCover
                      title={item.title}
                      author={item.author}
                      genre={item.genre}
                      color={item.coverColor}
                      coverImage={item.coverImage}
                      width={130}
                      onPress={() => router.push(`/book/${item.id}`)}
                    />
                  )}
                />
              </View>
            )}

            {/* Section: Recommended For You (AI Personalized) */}
            {recommendations && recommendations.length > 0 && (
              <View style={styles.gridSection}>
                <View style={styles.aiRecsHeaderRow}>
                  <View style={styles.aiRecsHeaderTitle}>
                    <Ionicons name="sparkles" size={16} color="#FFD700" />
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                      Recommended For You
                    </Text>
                  </View>
                  <View style={[styles.aiBadgePill, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.aiBadgePillText, { color: colors.primary }]}>
                      ✨ Gemini AI
                    </Text>
                  </View>
                </View>

                <FlatList
                  data={recommendations}
                  keyExtractor={(item) => String(item.book.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carousel}
                  renderItem={({ item }) => (
                    <View style={styles.recItemContainer}>
                      <BookCover
                        title={item.book.title}
                        author={item.book.author}
                        genre={item.book.genre}
                        color={item.book.coverColor}
                        coverImage={item.book.coverImage}
                        width={130}
                        onPress={() => router.push(`/book/${item.book.id}`)}
                      />
                      {item.reason ? (
                        <View
                          style={[
                            styles.recReasonBox,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                          ]}
                        >
                          <Text
                            style={[styles.recReasonText, { color: colors.textSecondary }]}
                            numberOfLines={2}
                          >
                            {item.reason}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                />
              </View>
            )}

            {/* Section 3: Short Stories from SoulShelf Community */}
            {communityPubs.length > 0 ? (
              <View style={styles.gridSection}>
                <SectionHeader title="Short Stories from SoulShelf Community" colors={colors} />
                <FlatList
                  data={communityPubs}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carousel}
                  renderItem={({ item }) => (
                    <BookCover
                      title={item.title}
                      author={item.author?.name ?? "Author"}
                      genre={item.genre}
                      color="#1E293B"
                      coverImage={item.coverUrl}
                      width={130}
                      onPress={() => router.push(`/publications/${item.id}`)}
                    />
                  )}
                />
              </View>
            ) : null}

            {/* Section 4: Explore Catalog Grid (All Books) */}
            <View style={styles.gridSection}>
              <SectionHeader
                title="Explore Catalog"
                colors={colors}
              />
              {filteredBooks.length === 0 ? (
                <View style={styles.stateContainer}>
                  <Ionicons name="compass-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.stateTitle, { color: colors.text }]}>
                    No books found
                  </Text>
                  <Text style={[styles.stateText, { color: colors.textSecondary }]}>
                    The catalog is currently empty.
                  </Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {filteredBooks.map((item) => (
                    <BookCover
                      key={item.id}
                      title={item.title}
                      author={item.author}
                      genre={item.genre}
                      color={item.coverColor}
                      coverImage={item.coverImage}
                      width="47%"
                      onPress={() => router.push(`/book/${item.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || loadingWriters}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Titre + actions (Search + Find Favorites) */}
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
          <View style={styles.actionsRow}>
            <Pressable onPress={() => router.push("/search")} hitSlop={8}>
              <Ionicons name="search-outline" size={22} color={colors.text} />
            </Pressable>
            <Pressable
              style={[styles.favButton, { borderColor: colors.primary }]}
              onPress={() => router.push("/favorites")}
            >
              <Ionicons name="heart-outline" size={16} color={colors.primary} />
              <Text style={[styles.favLabel, { color: colors.primary }]}>Find Favorites</Text>
            </Pressable>
          </View>
        </View>

        {/* Categories / Genres Chips */}
        <View style={styles.genresSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genresRow}
          >
            {genres.map((genre) => {
              const active = genre.toLowerCase() === selectedGenre.toLowerCase();
              return (
                <Pressable
                  key={genre}
                  onPress={() => setSelectedGenre(genre)}
                  style={[
                    styles.genreChip,
                    { backgroundColor: active ? colors.primary : colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.genreLabel,
                      { color: active ? colors.white : colors.textSecondary },
                    ]}
                  >
                    {genre}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Dynamic Explore Content */}
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xl,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  favButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  favLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  genresSection: {
    marginBottom: spacing.lg,
  },
  genresRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  genreChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  genreLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  viewAll: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  carousel: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  writerCard: {
    width: 140,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  writerAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  writerAvatarImg: {
    width: 54,
    height: 54,
  },
  writerInitials: {
    color: "#fff",
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  writerName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  writerOcc: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    textAlign: "center",
  },
  writerStats: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    textAlign: "center",
  },
  gridSection: {
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    rowGap: spacing.lg,
    marginBottom: spacing.xl,
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
    color: "#FFFFFF",
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  aiRecsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  aiRecsHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  aiBadgePill: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  aiBadgePillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  recItemContainer: {
    width: 130,
    gap: spacing.xs,
  },
  recReasonBox: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  recReasonText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    lineHeight: 13,
  },
});
