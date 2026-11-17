// src/features/reviews/useReviews.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReview,
  deleteReview,
  getBookReviews,
  updateReview,
  type CreateReviewPayload,
  type UpdateReviewPayload,
} from "./reviews.api";

export function useBookReviews(bookId: number) {
  const queryClient = useQueryClient();
  const enabled = !isNaN(bookId) && bookId > 0;

  const query = useQuery({
    queryKey: ["reviews", bookId],
    queryFn: () => getBookReviews(bookId),
    enabled,
  });

  const addReviewMutation = useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(bookId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", bookId] });
    },
  });

  const editReviewMutation = useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: number; payload: UpdateReviewPayload }) =>
      updateReview(reviewId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", bookId] });
    },
  });

  const removeReviewMutation = useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", bookId] });
    },
  });

  return {
    reviewsData: query.data,
    reviews: query.data?.reviews ?? [],
    count: query.data?.count ?? 0,
    averageRating: query.data?.averageRating ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    addReview: addReviewMutation.mutateAsync,
    isAddingReview: addReviewMutation.isPending,
    addReviewError: addReviewMutation.error,

    editReview: editReviewMutation.mutateAsync,
    isEditingReview: editReviewMutation.isPending,
    editReviewError: editReviewMutation.error,

    deleteReview: removeReviewMutation.mutateAsync,
    isDeletingReview: removeReviewMutation.isPending,
    deleteReviewError: removeReviewMutation.error,
  };
}
