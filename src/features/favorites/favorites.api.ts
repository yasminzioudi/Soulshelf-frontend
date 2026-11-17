// src/features/favorites/favorites.api.ts
import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";
import type { Book } from "@/src/features/books/books.api";

export interface FavoriteItem {
  id: number;
  createdAt: string;
  bookId: number;
  title: string | null;
  author: string | null;
  genre: string | null;
  coverColor: string | null;
  coverImage: string | null;
  book: Book;
}

export interface GetFavoritesResponse {
  success: true;
  data: FavoriteItem[];
}

export interface AddFavoriteResponse {
  success: true;
  data: FavoriteItem;
}

export const getFavorites = async (accessToken?: string): Promise<FavoriteItem[]> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.get<GetFavoritesResponse>("/favorites/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const addFavorite = async (
  bookId: number,
  accessToken?: string,
): Promise<FavoriteItem> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.post<AddFavoriteResponse>(
    `/favorites/me/${bookId}`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};

export const removeFavorite = async (
  bookId: number,
  accessToken?: string,
): Promise<{ message: string }> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.delete<{ success: true; data: { message: string } }>(
    `/favorites/me/${bookId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};
