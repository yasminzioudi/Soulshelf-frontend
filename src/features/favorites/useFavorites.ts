// src/features/favorites/useFavorites.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "./favorites.api";

export function useFavorites() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(),
  });

  const addFavoriteMutation = useMutation({
    mutationFn: (bookId: number) => addFavorite(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (bookId: number) => removeFavorite(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  return {
    favorites: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    addFavorite: addFavoriteMutation.mutateAsync,
    isAddingFavorite: addFavoriteMutation.isPending,
    addFavoriteError: addFavoriteMutation.error,
    removeFavorite: removeFavoriteMutation.mutateAsync,
    isRemovingFavorite: removeFavoriteMutation.isPending,
    removeFavoriteError: removeFavoriteMutation.error,
  };
}
