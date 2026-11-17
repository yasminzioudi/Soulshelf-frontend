// src/features/books/books.api.ts
import { apiClient } from "@/src/core/api/client";

export interface Book {
  id: number;
  title: string;
  genre: string | null;
  author: string | null;
  coverColor: string | null;
  coverImage: string | null;
  publishedYear?: number | null;
  language?: string | null;
  pages?: number | null;
  isFeatured?: boolean;
}

export interface GetBooksResponse {
  success: true;
  data: Book[];
}

export interface GetBookByIdResponse {
  success: true;
  data: Book;
}

export const getBooks = async (query?: string): Promise<Book[]> => {
  const trimmed = query?.trim();
  const params = trimmed ? { q: trimmed } : undefined;
  const res = await apiClient.get<GetBooksResponse>("/books", { params });
  return res.data.data;
};

export const getFeaturedBooks = async (): Promise<Book[]> => {
  const res = await apiClient.get<GetBooksResponse>("/books/featured");
  return res.data.data;
};

export const getBookById = async (id: number): Promise<Book> => {
  const res = await apiClient.get<GetBookByIdResponse>(`/books/${id}`);
  return res.data.data;
};
