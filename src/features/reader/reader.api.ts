// src/features/reader/reader.api.ts
import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";

export interface Chapter {
  id: number;
  bookId: number;
  chapterNum: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface ReadingProgress {
  id?: number;
  bookId: number;
  currentChapter: number;
  updatedAt?: string | null;
}

export interface LatestReadingProgress {
  id: number;
  bookId: number;
  currentChapter: number;
  updatedAt: string;
  book: {
    id: number;
    title: string;
    author: string | null;
    genre: string | null;
    coverColor: string | null;
    coverImage: string | null;
  } | null;
}

export interface GetBookChaptersResponse {
  success: true;
  data: Chapter[];
}

export interface GetReadingProgressResponse {
  success: true;
  data: ReadingProgress;
}

export interface GetLatestReadingProgressResponse {
  success: true;
  data: LatestReadingProgress | null;
}

export interface UpdateReadingProgressResponse {
  success: true;
  data: ReadingProgress;
}

export const getBookChapters = async (bookId: number): Promise<Chapter[]> => {
  const res = await apiClient.get<GetBookChaptersResponse>(`/books/${bookId}/chapters`);
  return res.data.data;
};

export const getReadingProgress = async (
  bookId: number,
  accessToken?: string,
): Promise<ReadingProgress> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.get<GetReadingProgressResponse>(
    `/reading-progress/me/${bookId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};

export const getLatestReadingProgress = async (
  accessToken?: string,
): Promise<LatestReadingProgress | null> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.get<GetLatestReadingProgressResponse>(
    "/reading-progress/me/latest",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};

export const updateReadingProgress = async (
  bookId: number,
  currentChapter: number,
  accessToken?: string,
): Promise<ReadingProgress> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.post<UpdateReadingProgressResponse>(
    `/reading-progress/me/${bookId}`,
    { currentChapter },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return res.data.data;
};
