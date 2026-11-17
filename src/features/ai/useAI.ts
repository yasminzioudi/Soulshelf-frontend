// src/features/ai/useAI.ts
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getAIRecommendations,
  requestReaderAssistant,
  smartDiscoverBooks,
  type AIAssistantData,
  type AIAssistantPayload,
  type SmartDiscoveryData,
} from "./ai.api";

export function useSmartDiscovery(prompt?: string, enabled = false) {
  const trimmed = prompt?.trim() ?? "";

  const queryResult = useQuery<SmartDiscoveryData>({
    queryKey: ["ai", "discover", trimmed],
    queryFn: () => smartDiscoverBooks(trimmed),
    enabled: enabled && trimmed.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    discoveryData: queryResult.data ?? null,
    books: queryResult.data?.books ?? [],
    interpretation: queryResult.data?.interpretation ?? null,
    extractedFilters: queryResult.data?.extractedFilters ?? null,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}

export function useSmartDiscoveryMutation() {
  return useMutation({
    mutationFn: (prompt: string) => smartDiscoverBooks(prompt),
  });
}

export function useAIAssistant() {
  const mutation = useMutation<AIAssistantData, Error, AIAssistantPayload>({
    mutationFn: (payload: AIAssistantPayload) => requestReaderAssistant(payload),
  });

  return {
    executeAction: mutation.mutate,
    executeActionAsync: mutation.mutateAsync,
    assistantData: mutation.data ?? null,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useAIRecommendations(enabled = true) {
  const queryResult = useQuery({
    queryKey: ["ai", "recommendations"],
    queryFn: () => getAIRecommendations(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  return {
    recommendations: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isFetching: queryResult.isFetching,
  };
}
