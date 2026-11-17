// src/features/library/useLibrary.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addBookToLibrary,
  getMyLibrary,
  removeBookFromLibrary,
  type AddBookToLibraryPayload,
} from "./library.api";

export function useLibrary() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["library"],
    queryFn: () => getMyLibrary(),
  });

  const addBookMutation = useMutation({
    mutationFn: (payload: AddBookToLibraryPayload) => addBookToLibrary(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  const removeBookMutation = useMutation({
    mutationFn: (bookId: number) => removeBookFromLibrary(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });

  return {
    library: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    addBook: addBookMutation.mutateAsync,
    isAddingBook: addBookMutation.isPending,
    addBookError: addBookMutation.error,
    removeBook: removeBookMutation.mutateAsync,
    isRemovingBook: removeBookMutation.isPending,
    removeBookError: removeBookMutation.error,
  };
}
