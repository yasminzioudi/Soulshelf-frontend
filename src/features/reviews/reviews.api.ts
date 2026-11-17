// src/features/reviews/reviews.api.ts
import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";

export interface Reviewer {
  id: number;
  name: string | null;
  avatarUrl: string | null;
}

export interface ReviewItem {
  id: number;
  userId: number;
  bookId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Reviewer | null;
}

export interface BookReviewsData {
  count: number;
  averageRating: number;
  reviews: ReviewItem[];
}

export interface GetBookReviewsResponse {
  success: true;
  data: BookReviewsData;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string | null;
}

export interface CreateReviewResponse {
  success: true;
  data: ReviewItem;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string | null;
}

export interface UpdateReviewResponse {
  success: true;
  data: ReviewItem;
}

export const getBookReviews = async (bookId: number): Promise<BookReviewsData> => {
  const res = await apiClient.get<GetBookReviewsResponse>(`/books/${bookId}/reviews`);
  return res.data.data;
};

export const createReview = async (
  bookId: number,
  payload: CreateReviewPayload,
  accessToken?: string,
): Promise<ReviewItem> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.post<CreateReviewResponse>(
    `/books/${bookId}/reviews`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};

export const updateReview = async (
  reviewId: number,
  payload: UpdateReviewPayload,
  accessToken?: string,
): Promise<ReviewItem> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.patch<UpdateReviewResponse>(
    `/reviews/${reviewId}`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};

export const deleteReview = async (
  reviewId: number,
  accessToken?: string,
): Promise<{ message: string }> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.delete<{ success: true; data: { message: string } }>(
    `/reviews/${reviewId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};
