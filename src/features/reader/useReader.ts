// src/features/reader/useReader.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBookChapters,
  getLatestReadingProgress,
  getReadingProgress,
  updateReadingProgress,
} from "./reader.api";

export function useReader(bookId: number) {
  const queryClient = useQueryClient();
  const enabled = !isNaN(bookId) && bookId > 0;

  const chaptersQuery = useQuery({
    queryKey: ["chapters", bookId],
    queryFn: () => getBookChapters(bookId),
    enabled,
  });

  const progressQuery = useQuery({
    queryKey: ["readingProgress", bookId],
    queryFn: () => getReadingProgress(bookId),
    enabled,
  });

  const updateProgressMutation = useMutation({
    mutationFn: (chapterNum: number) => updateReadingProgress(bookId, chapterNum),
    onSuccess: (data) => {
      queryClient.setQueryData(["readingProgress", bookId], data);
      queryClient.invalidateQueries({ queryKey: ["readingProgress", "latest"] });
    },
  });

  return {
    chapters: chaptersQuery.data ?? [],
    isChaptersLoading: chaptersQuery.isLoading,
    isChaptersError: chaptersQuery.isError,
    chaptersError: chaptersQuery.error,
    refetchChapters: chaptersQuery.refetch,

    savedProgress: progressQuery.data,
    isProgressLoading: progressQuery.isLoading,
    savedChapterNum: progressQuery.data?.currentChapter ?? 1,

    saveProgress: updateProgressMutation.mutateAsync,
    isSavingProgress: updateProgressMutation.isPending,
  };
}

export function useLatestReader() {
  return useQuery({
    queryKey: ["readingProgress", "latest"],
    queryFn: () => getLatestReadingProgress(),
  });
}
