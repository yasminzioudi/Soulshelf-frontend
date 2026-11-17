// app/search.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useBooks } from "@/src/features/books/useBooks";
import { useSearchPeople } from "@/src/features/social/useSocial";
import { useSmartDiscovery } from "@/src/features/ai/useAI";
import type { PublicUserDto } from "@/src/features/social/social.api";
import { BookCover, UserAvatar } from "@/src/shared/components/ui";
import { fontFamily, fontSize, radius, spacing, useColors } from "@/src/theme";

const FILTERS = ["Writer", "Novel", "Drama"];

const AI_SUGGESTIONS = [
  "Thrilling mystery with twists",
  "Epic fantasy adventure in ancient realms",
  "Warm cozy romance and coffee shops",
  "Dark psychological crime fiction",
];

export default function SearchScreen() {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isAIMode, setIsAIMode] = useState(false);

  // Simple 250ms debounce for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  // Standard search queries
  const {
    books,
    isLoading: booksLoading,
    isError: booksError,
    error: booksErr,
    refetch,
    isFetching,
  } = useBooks(isAIMode ? "" : debouncedQuery);

  const { users, isLoading: usersLoading } = useSearchPeople(
    isAIMode ? "" : debouncedQuery,
  );

  // AI Smart Discovery query
  const {
    books: aiBooks,
    interpretation,
    extractedFilters,
    isLoading: aiLoading,
    isError: aiError,
    error: aiErr,
    refetch: refetchAI,
  } = useSmartDiscovery(debouncedQuery, isAIMode);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => {
      const exists = prev.includes(filter);
      const next = exists ? prev.filter((f) => f !== filter) : [...prev, filter];
      if (!exists) {
        setQuery(filter);
      } else {
        setQuery("");
      }
      return next;
    });
  };

  const isLoading = booksLoading && !isFetching;
  const hasQuery = debouncedQuery.trim().length > 0;

  const renderPeopleSection = () => {
    if (isAIMode || !hasQuery) return null;
    if (usersLoading) {
      return (
        <View style={styles.sectionLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.sectionLoadingText, { color: colors.textSecondary }]}>
            Searching people...
          </Text>
        </View>
      );
    }
    if (!users || users.length === 0) return null;

    return (
      <View style={styles.resultsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          People ({users.length})
        </Text>
        <View style={styles.peopleList}>
          {users.map((user: PublicUserDto) => {
            return (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.personCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => router.push(`/users/${user.id}` as any)}
              >
                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size={44} />
                <View style={styles.personInfo}>
                  <Text style={[styles.personName, { color: colors.text }]}>{user.name}</Text>
                  {user.occupation ? (
                    <Text
                      style={[styles.personSub, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {user.occupation}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderBooksSection = () => {
    if (isAIMode) return null;

    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Searching catalog...
          </Text>
        </View>
      );
    }

    if (booksError) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Search failed</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {booksErr instanceof Error ? booksErr.message : "Unable to fetch books."}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    if (books.length === 0) {
      if (!hasQuery) return null;
      return null;
    }

    return (
      <View style={styles.resultsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Books ({books.length})
        </Text>
        <View style={styles.grid}>
          {books.map((book) => (
            <BookCover
              key={book.id}
              title={book.title}
              author={book.author}
              genre={book.genre}
              color={book.coverColor}
              coverImage={book.coverImage}
              width="47%"
              onPress={() => router.push(`/book/${book.id}`)}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderAISmartDiscoverySection = () => {
    if (!isAIMode) return null;

    if (!hasQuery) {
      return (
        <View style={styles.aiSuggestionBox}>
          <View style={styles.aiInsightHeader}>
            <Ionicons name="sparkles" size={18} color="#FFD700" />
            <Text style={[styles.aiSuggestionTitle, { color: colors.text }]}>
              Describe your mood or story idea
            </Text>
          </View>
          <Text style={[styles.aiSuggestionSubtitle, { color: colors.textSecondary }]}>
            Gemini reads into your description, detects themes, and filters our real catalog:
          </Text>
          <View style={styles.aiPillRow}>
            {AI_SUGGESTIONS.map((sug) => (
              <TouchableOpacity
                key={sug}
                style={[
                  styles.aiSuggestionPill,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setQuery(sug)}
              >
                <Text style={[styles.aiSuggestionPillText, { color: colors.text }]}>
                  "{sug}"
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (aiLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            ✨ Gemini AI Analyzing...
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Extracting literary themes, genres, and matching available books...
          </Text>
        </View>
      );
    }

    if (aiError) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Discovery failed</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {aiErr instanceof Error ? aiErr.message : "Unable to complete AI discovery."}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetchAI()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.resultsSection}>
        {/* Interpretation Box */}
        {interpretation && (
          <View
            style={[
              styles.aiInsightCard,
              { backgroundColor: colors.surface, borderColor: colors.primary + "40" },
            ]}
          >
            <View style={styles.aiInsightHeader}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.aiInsightTitle, { color: colors.primary }]}>
                AI Search Interpretation
              </Text>
            </View>
            <Text style={[styles.aiInsightText, { color: colors.text }]}>
              "{interpretation}"
            </Text>

            {/* Extracted filter badges */}
            <View style={styles.aiTagRow}>
              {extractedFilters?.genres?.map((g) => (
                <View
                  key={g}
                  style={[styles.aiTag, { backgroundColor: colors.primary + "20" }]}
                >
                  <Text style={[styles.aiTagText, { color: colors.primary }]}>
                    Genre: {g}
                  </Text>
                </View>
              ))}
              {extractedFilters?.authors?.map((a) => (
                <View
                  key={a}
                  style={[styles.aiTag, { backgroundColor: colors.primary + "20" }]}
                >
                  <Text style={[styles.aiTagText, { color: colors.primary }]}>
                    Author: {a}
                  </Text>
                </View>
              ))}
              {extractedFilters?.keywords?.map((k) => (
                <View
                  key={k}
                  style={[styles.aiTag, { backgroundColor: colors.border }]}
                >
                  <Text style={[styles.aiTagText, { color: colors.textSecondary }]}>
                    #{k}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Matched Books ({aiBooks.length})
        </Text>

        {aiBooks.length === 0 ? (
          <View style={styles.stateContainer}>
            <Ionicons name="search-outline" size={44} color={colors.textSecondary} />
            <Text style={[styles.stateTitle, { color: colors.text }]}>
              No matching books found
            </Text>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Try another mood or topic like "thriller", "drama", or "mystery".
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {aiBooks.map((book) => (
              <BookCover
                key={book.id}
                title={book.title}
                author={book.author}
                genre={book.genre}
                color={book.coverColor}
                coverImage={book.coverImage}
                width="47%"
                onPress={() => router.push(`/book/${book.id}`)}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (isAIMode) return null;
    if (!hasQuery) return null;
    if (isLoading || usersLoading) return null;
    if ((users && users.length > 0) || books.length > 0) return null;
    return (
      <View style={styles.stateContainer}>
        <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.stateTitle, { color: colors.text }]}>No results found</Text>
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>
          Try searching for a different title, author, name, or genre.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Search Mode Toggle (Standard vs Smart AI Discovery) */}
        <View style={styles.modeToggleRow}>
          <TouchableOpacity
            style={[
              styles.modeToggleBtn,
              !isAIMode
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setIsAIMode(false)}
          >
            <Text
              style={[
                styles.modeToggleText,
                { color: !isAIMode ? "#FFFFFF" : colors.textSecondary },
              ]}
            >
              Standard Search
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeToggleBtn,
              isAIMode
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => setIsAIMode(true)}
          >
            <Ionicons name="sparkles" size={14} color={isAIMode ? "#FFD700" : colors.primary} />
            <Text
              style={[
                styles.modeToggleText,
                { color: isAIMode ? "#FFFFFF" : colors.primary, fontFamily: fontFamily.semiBold },
              ]}
            >
              Smart AI Discovery
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons
            name={isAIMode ? "sparkles" : "search"}
            size={18}
            color={isAIMode ? colors.primary : colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            placeholder={
              isAIMode
                ? "Describe your ideal book (e.g. suspense in Victorian London)"
                : "Search books, people, or genres"
            }
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* Filters (Standard Search Only) */}
        {!isAIMode && (
          <View style={styles.filterRow}>
            {FILTERS.map((filter) => {
              const active = activeFilters.includes(filter);
              return (
                <Pressable
                  key={filter}
                  onPress={() => toggleFilter(filter)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: active ? colors.primary : colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: active ? colors.white : colors.textSecondary },
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* AI Smart Discovery Section */}
        {renderAISmartDiscoverySection()}

        {/* Standard People Results */}
        {renderPeopleSection()}

        {/* Standard Book Results */}
        {renderBooksSection()}

        {/* Combined empty state */}
        {renderEmpty()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerRow: { marginBottom: spacing.md },
  modeToggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  modeToggleText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  filterLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.xs },
  resultsSection: { marginBottom: spacing.xl },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  sectionLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionLoadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  peopleList: {
    gap: spacing.sm,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  personInfo: { flex: 1 },
  personName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
  },
  personSub: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
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
  // AI Smart Discovery Styles
  aiSuggestionBox: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  aiSuggestionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  aiSuggestionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  aiPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  aiSuggestionPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  aiSuggestionPillText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  aiInsightCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  aiInsightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  aiInsightTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  aiInsightText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    fontStyle: "italic",
    marginBottom: spacing.sm,
  },
  aiTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  aiTag: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  aiTagText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs - 1,
  },
});