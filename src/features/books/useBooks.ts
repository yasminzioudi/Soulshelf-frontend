// src/features/books/useBooks.ts
import { useQuery } from "@tanstack/react-query";
import { getBookById, getBooks, getFeaturedBooks } from "./books.api";

export function useBooks(query?: string) {
  const trimmed = query?.trim() ?? "";

  const queryResult = useQuery({
    queryKey: ["books", "search", trimmed],
    queryFn: () => getBooks(trimmed),
  });

  return {
    books: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isFetching: queryResult.isFetching,
  };
}

export function useFeaturedBooks() {
  const queryResult = useQuery({
    queryKey: ["books", "featured"],
    queryFn: () => getFeaturedBooks(),
  });

  return {
    featuredBooks: queryResult.data ?? [],
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    refetch: queryResult.refetch,
  };
}

export function useBookDetails(id: number) {
  const queryResult = useQuery({
    queryKey: ["book", id],
    queryFn: () => getBookById(id),
    enabled: Boolean(id && !isNaN(id)),
  });

  return {
    book: queryResult.data ?? null,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isFetching: queryResult.isFetching,
  };
}
