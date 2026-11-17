// src/features/library/library.api.ts
import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";

export interface Book {
  id: number;
  title: string;
  genre: string | null;
  author: string | null;
  coverColor: string | null;
  coverImage: string | null;
}

export type LibraryBookStatus = "OWNED" | "READING" | "COMPLETED" | "WISHLIST" | string;

export interface LibraryItem {
  id: number;
  status: LibraryBookStatus;
  addedAt: string;
  book: Book;
}

export interface GetMyLibraryResponse {
  success: true;
  data: LibraryItem[];
}

export interface AddBookToLibraryPayload {
  bookId: number;
  status?: LibraryBookStatus;
}

export interface AddBookToLibraryResponse {
  success: true;
  data: LibraryItem;
}

export const getMyLibrary = async (accessToken?: string): Promise<LibraryItem[]> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.get<GetMyLibraryResponse>("/library/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const addBookToLibrary = async (
  payload: AddBookToLibraryPayload,
  accessToken?: string,
): Promise<LibraryItem> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.post<AddBookToLibraryResponse>(
    "/library/me",
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};

export const removeBookFromLibrary = async (
  bookId: number,
  accessToken?: string,
): Promise<{ message: string }> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.delete<{ success: true; data: { message: string } }>(
    `/library/me/${bookId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};
