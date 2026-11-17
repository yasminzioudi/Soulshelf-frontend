// src/features/ai/ai.api.ts
import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";
import type { Book } from "@/src/features/books/books.api";

export interface SmartDiscoveryData {
  prompt: string;
  interpretation: string;
  extractedFilters: {
    genres: string[];
    keywords: string[];
    authors: string[];
  };
  books: Book[];
}

export interface SmartDiscoveryApiResponse {
  success: boolean;
  data: SmartDiscoveryData;
  error?: string;
}

export type AIAssistantAction = "summarize" | "explain" | "simplify" | "ask";

export interface AIAssistantPayload {
  action: AIAssistantAction;
  bookId?: number;
  chapterId?: number;
  selectedText?: string;
  question?: string;
}

export interface AIAssistantData {
  action: AIAssistantAction;
  response: string;
  contextSnippet: string;
}

export interface AIAssistantApiResponse {
  success: boolean;
  data: AIAssistantData;
  error?: string;
}

export interface AIRecommendationItem {
  book: Book;
  reason: string;
}

export interface AIRecommendationsApiResponse {
  success: boolean;
  data: AIRecommendationItem[];
  error?: string;
}

// POST /ai/discover — intentionally public, no auth required
export const smartDiscoverBooks = async (prompt: string): Promise<SmartDiscoveryData> => {
  const res = await apiClient.post<SmartDiscoveryApiResponse>("/ai/discover", {
    prompt: prompt.trim(),
  });
  return res.data.data;
};

// POST /ai/assistant — requires auth
export const requestReaderAssistant = async (
  payload: AIAssistantPayload,
): Promise<AIAssistantData> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }
  const res = await apiClient.post<AIAssistantApiResponse>("/ai/assistant", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

// GET /ai/recommendations — requires auth
export const getAIRecommendations = async (accessToken?: string): Promise<AIRecommendationItem[]> => {
  const token = accessToken ?? (await getAccessToken());
  if (!token) {
    return [];
  }
  const res = await apiClient.get<AIRecommendationsApiResponse>("/ai/recommendations", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data ?? [];
};
