// src/features/publications/publications.api.ts
import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";

export interface PublicationAuthor {
  id: number;
  name: string;
  avatarUrl: string | null;
  occupation: string | null;
}

export interface Publication {
  id: number;
  authorId: number;
  title: string;
  description: string | null;
  genre: string;
  language: string | null;
  publishedYear: number | null;
  pages: number | null;
  coverUrl: string | null;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  author?: PublicationAuthor;
}

export interface CreatePublicationPayload {
  title: string;
  description?: string;
  genre: string;
  language?: string;
  publishedYear?: number;
  pages?: number;
  coverUrl?: string;
  content?: string;
}

export interface UpdatePublicationPayload {
  title?: string;
  description?: string | null;
  genre?: string;
  language?: string;
  publishedYear?: number | null;
  pages?: number | null;
  coverUrl?: string | null;
  content?: string | null;
}

export interface PublicationLikeStatus {
  isLiked: boolean;
  likesCount: number;
}

export interface GetPublicationsResponse {
  success: true;
  data: Publication[];
}

export interface GetPublicationResponse {
  success: true;
  data: Publication;
}

export interface DeletePublicationResponse {
  success: true;
  data: { id: number };
}

export interface PublicationLikeResponse {
  success: true;
  data: PublicationLikeStatus;
}

export const getAllPublications = async (): Promise<Publication[]> => {
  const res = await apiClient.get<GetPublicationsResponse>("/publications");
  return res.data.data;
};

export const getMyPublications = async (accessToken?: string): Promise<Publication[]> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.get<GetPublicationsResponse>("/publications/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const getPublicationById = async (
  id: number,
  accessToken?: string,
): Promise<Publication> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.get<GetPublicationResponse>(`/publications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const createPublication = async (
  payload: CreatePublicationPayload,
  accessToken?: string,
): Promise<Publication> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.post<GetPublicationResponse>("/publications", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const updatePublication = async (
  id: number,
  payload: UpdatePublicationPayload,
  accessToken?: string,
): Promise<Publication> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.patch<GetPublicationResponse>(`/publications/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const deletePublication = async (
  id: number,
  accessToken?: string,
): Promise<{ id: number }> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.delete<DeletePublicationResponse>(`/publications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const getPublicationLikeStatus = async (
  id: number,
  accessToken?: string,
): Promise<PublicationLikeStatus> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.get<PublicationLikeResponse>(`/publications/${id}/likes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const likePublication = async (
  id: number,
  accessToken?: string,
): Promise<PublicationLikeStatus> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.post<PublicationLikeResponse>(`/publications/${id}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const unlikePublication = async (
  id: number,
  accessToken?: string,
): Promise<PublicationLikeStatus> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const res = await apiClient.delete<PublicationLikeResponse>(`/publications/${id}/like`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};
