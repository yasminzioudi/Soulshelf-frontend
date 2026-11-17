// app/book/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";

import { getUser, type StoredUser } from "@/src/core/storage/tokenStorage";
import { useBookDetails } from "@/src/features/books/useBooks";
import { useFavorites } from "@/src/features/favorites/useFavorites";
import { useLibrary } from "@/src/features/library/useLibrary";
import { useReader } from "@/src/features/reader/useReader";
import { useBookReviews } from "@/src/features/reviews/useReviews";
import { formatReviewDate } from "@/src/shared/utils/date";
import { BookCover, CurvedHeader, UserAvatar } from "@/src/shared/components/ui";
import {
  fontFamily,
  fontSize,
  radius,
  shadows,
  spacing,
  useColors,
} from "@/src/theme";

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const bookId = Number(id);
  const isValidId = !isNaN(bookId) && bookId > 0;

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");

  useEffect(() => {
    getUser().then(setCurrentUser);
  }, []);

  const { book, isLoading, isError, error } = useBookDetails(isValidId ? bookId : 0);
  const { library, addBook, isAddingBook, removeBook, isRemovingBook } = useLibrary();
  const { favorites, addFavorite, isAddingFavorite, removeFavorite, isRemovingFavorite } = useFavorites();
  const { savedChapterNum } = useReader(isValidId ? bookId : 0);
  const {
    reviews,
    count: reviewCount,
    averageRating,
    isLoading: isReviewsLoading,
    addReview,
    isAddingReview,
    editReview,
    isEditingReview,
    deleteReview,
    isDeletingReview,
  } = useBookReviews(isValidId ? bookId : 0);

  const isLibraryBusy = isAddingBook || isRemovingBook;
  const isFavoriteBusy = isAddingFavorite || isRemovingFavorite;
  const isReviewBusy = isAddingReview || isEditingReview || isDeletingReview;

  const isAlreadyInLibrary = library.some((item) => item.book && item.book.id === bookId);
  const isFavorited = favorites.some((item) => (item.book ? item.book.id === bookId : item.bookId === bookId));
  const readLabel = savedChapterNum > 1 ? "Continue Reading" : "Read";

  const myReview = currentUser
    ? reviews.find((r) => r.userId === currentUser.id)
    : null;

  const openReviewForm = () => {
    if (myReview) {
      setRatingInput(myReview.rating);
      setCommentInput(myReview.comment ?? "");
    } else {
      setRatingInput(5);
      setCommentInput("");
    }
    setShowReviewForm(true);
  };

  const handleSaveReview = async () => {
    if (isReviewBusy) return;
    try {
      if (myReview) {
        await editReview({
          reviewId: myReview.id,
          payload: { rating: ratingInput, comment: commentInput.trim() || null },
        });
        Alert.alert("Success", "Your review has been updated.");
      } else {
        await addReview({
          rating: ratingInput,
          comment: commentInput.trim() || null,
        });
        Alert.alert("Success", "Your review has been published.");
      }
      setShowReviewForm(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save review.");
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || isReviewBusy) return;
    Alert.alert("Delete Review", "Are you sure you want to delete your review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReview(myReview.id);
            setShowReviewForm(false);
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete review.");
          }
        },
      },
    ]);
  };

  const handleToggleSave = async () => {
    if (!book || isLibraryBusy) return;
    if (isAlreadyInLibrary) {
      try {
        await removeBook(book.id);
      } catch {
        // Handled gracefully via onError query invalidation
      }
    } else {
      try {
        await addBook({ bookId: book.id });
      } catch {
        // Handled gracefully via onError query invalidation
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!book || isFavoriteBusy) return;
    if (isFavorited) {
      try {
        await removeFavorite(book.id);
      } catch {
        // Handled gracefully via onError query invalidation
      }
    } else {
      try {
        await addFavorite(book.id);
      } catch {
        // Handled gracefully via onError query invalidation
      }
    }
  };

  const renderStars = (rating: number, size = 16) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={size}
          color="#F59E0B"
        />,
      );
    }
    return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
  };

  const renderBody = () => {
    if (!isValidId || (isError && !book)) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Book Not Found</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {error instanceof Error ? error.message : "The requested book does not exist."}
          </Text>
          <Pressable
            style={[styles.backActionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backActionText}>Go Back</Text>
          </Pressable>
        </View>
      );
    }

    if (isLoading && !book) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            Loading book details...
          </Text>
        </View>
      );
    }

    if (!book) return null;

    return (
      <>
        <View style={styles.coverWrapper}>
          <View style={[styles.coverCard, { backgroundColor: colors.surface }]}>
            <BookCover
              title={book.title}
              genre={book.genre}
              author={book.author}
              color={book.coverColor}
              coverImage={book.coverImage}
              width={140}
              hideMeta
            />
          </View>
        </View>

        <View style={styles.info}>
          <Text style={[styles.bookTitle, { color: colors.text }]}>{book.title}</Text>
          <Text style={[styles.author, { color: colors.textSecondary }]}>
            {book.author ?? "Unknown Author"}
          </Text>
          <Text style={[styles.genre, { color: colors.textSecondary }]}>
            {book.genre ?? "General"}
          </Text>

          {/* Additional Metadata Chips */}
          {(book.publishedYear || book.language || book.pages) ? (
            <View style={styles.metaRow}>
              {book.publishedYear ? (
                <View style={[styles.metaChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{book.publishedYear}</Text>
                </View>
              ) : null}
              {book.language ? (
                <View style={[styles.metaChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="language-outline" size={13} color={colors.textSecondary} />
                  <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{book.language}</Text>
                </View>
              ) : null}
              {book.pages ? (
                <View style={[styles.metaChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="document-text-outline" size={13} color={colors.textSecondary} />
                  <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>{book.pages} pages</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            {/* Read / Continue Reading Button */}
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/reader/${book.id}`)}
            >
              <View style={styles.buttonInnerRow}>
                <Ionicons name="book-outline" size={16} color="#FFFFFF" />
                <Text style={styles.readText}>{readLabel}</Text>
              </View>
            </Pressable>

            {/* Library Save/Saved Button */}
            <Pressable
              style={[
                styles.actionButton,
                isAlreadyInLibrary
                  ? { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
              ]}
              onPress={handleToggleSave}
              disabled={isLibraryBusy}
            >
              {isLibraryBusy ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.actionText, { color: colors.text }]}>
                  {isAlreadyInLibrary ? "Saved" : "Save"}
                </Text>
              )}
            </Pressable>

            {/* Favorite / Unfavorite Button */}
            <Pressable
              style={[
                styles.actionButton,
                isFavorited
                  ? { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: "#E11D48" }
                  : { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
              ]}
              onPress={handleToggleFavorite}
              disabled={isFavoriteBusy}
            >
              {isFavoriteBusy ? (
                <ActivityIndicator size="small" color="#E11D48" />
              ) : (
                <View style={styles.buttonInnerRow}>
                  <Ionicons
                    name={isFavorited ? "heart" : "heart-outline"}
                    size={16}
                    color={isFavorited ? "#E11D48" : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionText,
                      isFavorited ? { color: "#E11D48" } : { color: colors.text },
                    ]}
                  >
                    {isFavorited ? "Unfavorite" : "Favorite"}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Review Action Button */}
            <Pressable
              style={[styles.reviewButton, { borderColor: colors.primary }]}
              onPress={openReviewForm}
            >
              <Text style={[styles.reviewText, { color: colors.primary }]}>
                {myReview ? "Edit Review" : "Add Review"}
              </Text>
            </Pressable>
          </View>

          {/* Form Modal / Box */}
          {showReviewForm && (
            <View style={[styles.reviewFormBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.reviewFormTitle, { color: colors.text }]}>
                {myReview ? "Edit Your Review" : "Write a Review"}
              </Text>
              
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Rating:</Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setRatingInput(star)} hitSlop={8}>
                    <Ionicons
                      name={star <= ratingInput ? "star" : "star-outline"}
                      size={28}
                      color="#F59E0B"
                    />
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Comment (Optional):</Text>
              <TextInput
                style={[styles.commentInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Share your thoughts on this book..."
                placeholderTextColor={colors.textSecondary}
                value={commentInput}
                onChangeText={setCommentInput}
                multiline
                numberOfLines={3}
              />

              <View style={styles.formButtonsRow}>
                {myReview && (
                  <Pressable
                    style={[styles.formDeleteBtn, { borderColor: "#E11D48" }]}
                    onPress={handleDeleteReview}
                    disabled={isReviewBusy}
                  >
                    <Text style={{ color: "#E11D48", fontFamily: fontFamily.medium, fontSize: fontSize.xs }}>
                      Delete
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.formCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setShowReviewForm(false)}
                  disabled={isReviewBusy}
                >
                  <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.medium, fontSize: fontSize.xs }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.formSubmitBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveReview}
                  disabled={isReviewBusy}
                >
                  {isReviewBusy ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: "#FFFFFF", fontFamily: fontFamily.semiBold, fontSize: fontSize.xs }}>
                      Submit
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Reviews Header with Summary */}
          <View style={styles.reviewsHeader}>
            <View style={styles.reviewsSummaryRow}>
              <Text style={[styles.reviewsTitle, { color: colors.text }]}>Reviews</Text>
              {reviewCount > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.ratingBadgeText, { color: colors.text }]}>
                    {averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.reviewsCount, { color: colors.textSecondary }]}>
              ({reviewCount} {reviewCount === 1 ? "Review" : "Reviews"})
            </Text>
          </View>

          <View style={[styles.reviewLine, { backgroundColor: colors.border }]} />

          {/* Reviews List */}
          {isReviewsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : reviews.length === 0 ? (
            <Text style={[styles.noReviewsText, { color: colors.textSecondary }]}>
              No reviews yet. Be the first to write a review!
            </Text>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((rev) => (
                <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.reviewerInfo}>
                      <UserAvatar
                        name={rev.user?.name}
                        avatarUrl={rev.user?.avatarUrl}
                        size={36}
                      />
                      <View>
                        <Text style={[styles.reviewerName, { color: colors.text }]}>
                          {rev.user?.name ?? "Anonymous User"}
                        </Text>
                        <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                          {formatReviewDate(rev.createdAt)}
                        </Text>
                      </View>
                    </View>
                    {renderStars(rev.rating)}
                  </View>
                  {rev.comment ? (
                    <Text style={[styles.reviewComment, { color: colors.text }]}>{rev.comment}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <CurvedHeader height={140}>
          <View style={styles.headerButtonsRow}>
            <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>

            {book && (
              <Pressable
                style={styles.headerHeartButton}
                onPress={handleToggleFavorite}
                disabled={isFavoriteBusy}
                hitSlop={12}
              >
                <Ionicons
                  name={isFavorited ? "heart" : "heart-outline"}
                  size={24}
                  color={isFavorited ? "#F43F5E" : "#FFFFFF"}
                />
              </Pressable>
            )}
          </View>
        </CurvedHeader>

        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backButton: {},
  headerHeartButton: {
    padding: spacing.xs,
  },
  coverWrapper: { alignItems: "center", marginTop: -70 },
  coverCard: {
    borderRadius: radius.md,
    padding: spacing.xs,
    ...shadows.card,
  },
  info: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  bookTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    textAlign: "center",
  },
  author: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  genre: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.lg,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: "#FFFFFF",
  },
  actionText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  reviewButton: {
    borderWidth: 1.5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  reviewFormBox: {
    width: "100%",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  reviewFormTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  starPickerRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textAlignVertical: "top",
    minHeight: 70,
  },
  formButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  formDeleteBtn: {
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  formCancelBtn: {
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  formSubmitBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.xs,
  },
  reviewsSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  reviewsTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
  },
  reviewsCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  reviewLine: {
    width: "100%",
    height: 1,
    marginBottom: spacing.md,
  },
  noReviewsText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  reviewsList: {
    width: "100%",
    gap: spacing.md,
  },
  reviewCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewerInitials: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerInitialsText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
  },
  reviewerName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  reviewDate: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
  },
  reviewComment: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
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
  backActionButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  backActionText: {
    color: "#FFFFFF",
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  metaChipText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
});
