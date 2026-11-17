// app/favorites.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useFavorites } from "@/src/features/favorites/useFavorites";
import { BookCover } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

export default function FavoritesScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");

  const { favorites, isLoading, isError, error, refetch, isRefetching } = useFavorites();

  const filteredFavorites = favorites.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (item.title || item.book?.title || "").toLowerCase();
    const author = (item.author || item.book?.author || "").toLowerCase();
    const genre = (item.genre || item.book?.genre || "").toLowerCase();
    return title.includes(query) || author.includes(query) || genre.includes(query);
  });

  const renderContent = () => {
    if (isLoading && !isRefetching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading favorites...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to load favorites</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    if (favorites.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Favorites Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Tap the heart icon on any book to add it to your favorites.
          </Text>
          <Pressable
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/search")}
          >
            <Text style={styles.exploreButtonText}>Explore Books</Text>
          </Pressable>
        </View>
      );
    }

    if (filteredFavorites.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results Found</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            No favorite books match "{searchQuery}".
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {filteredFavorites.map((item) => {
          const bookId = item.bookId ?? item.book?.id;
          const title = item.title ?? item.book?.title ?? "Untitled Book";
          const author = item.author ?? item.book?.author;
          const genre = item.genre ?? item.book?.genre;
          const color = item.coverColor ?? item.book?.coverColor;
          const coverImage = item.coverImage ?? item.book?.coverImage;

          return (
            <View key={item.id} style={styles.gridCard}>
              <BookCover
                title={title}
                author={author}
                genre={genre}
                color={color}
                coverImage={coverImage}
                width="100%"
                onPress={() => router.push(`/book/${bookId}`)}
              />
            </View>
          );
        })}
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
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header avec retour */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Find your Favorites</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Barre de recherche */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search favorites..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
    rowGap: spacing.lg,
  },
  gridCard: {
    width: "50%",
    paddingHorizontal: spacing.xs,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.sm,
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  errorTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    textAlign: "center",
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  emptyTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.lg,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  exploreButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
});
