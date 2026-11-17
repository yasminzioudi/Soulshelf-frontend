// src/features/admin/admin.api.ts
import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";
import type { Book } from "@/src/features/books/books.api";

export interface CreateBookPayload {
  title: string;
  author: string;
  genre?: string;
  language?: string;
  pages?: number;
  publishedYear?: number;
  coverImage?: string;
  coverColor?: string;
  isFeatured?: boolean;
  chapterTitle?: string;
  chapterContent: string;
}

export interface CreateBookResponse {
  success: true;
  data: {
    book: Book;
    chapter: {
      id: number;
      bookId: number;
      chapterNum: number;
      title: string;
      content: string;
    };
  };
}

export const createAdminBook = async (
  payload: CreateBookPayload,
): Promise<CreateBookResponse["data"]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.post<CreateBookResponse>("/admin/books", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};
