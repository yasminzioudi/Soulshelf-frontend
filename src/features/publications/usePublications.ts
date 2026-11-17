// src/features/publications/usePublications.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPublication,
  deletePublication,
  getAllPublications,
  getMyPublications,
  getPublicationById,
  getPublicationLikeStatus,
  likePublication,
  unlikePublication,
  updatePublication,
  type CreatePublicationPayload,
  type UpdatePublicationPayload,
} from "./publications.api";

export function useCommunityPublications() {
  const query = useQuery({
    queryKey: ["publications", "community"],
    queryFn: () => getAllPublications(),
  });

  return {
    publications: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

export function useMyPublications() {
  const query = useQuery({
    queryKey: ["publications", "me"],
    queryFn: () => getMyPublications(),
  });

  return {
    publications: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}

export function usePublication(id: number) {
  const isValid = Boolean(id && !isNaN(id) && id > 0);

  const query = useQuery({
    queryKey: ["publications", id],
    queryFn: () => getPublicationById(id),
    enabled: isValid,
  });

  return {
    publication: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

export function usePublicationLikeStatus(id: number) {
  const isValid = Boolean(id && !isNaN(id) && id > 0);

  const query = useQuery({
    queryKey: ["publications", id, "likes"],
    queryFn: () => getPublicationLikeStatus(id),
    enabled: isValid,
  });

  return {
    isLiked: query.data?.isLiked ?? false,
    likesCount: query.data?.likesCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useLikePublication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => likePublication(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(["publications", id, "likes"], data);
      queryClient.invalidateQueries({ queryKey: ["publications", id, "likes"] });
    },
  });

  return {
    likePublication: mutation.mutateAsync,
    isLiking: mutation.isPending,
  };
}

export function useUnlikePublication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => unlikePublication(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(["publications", id, "likes"], data);
      queryClient.invalidateQueries({ queryKey: ["publications", id, "likes"] });
    },
  });

  return {
    unlikePublication: mutation.mutateAsync,
    isUnliking: mutation.isPending,
  };
}

export function useCreatePublication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreatePublicationPayload) => createPublication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publications", "me"] });
    },
  });

  return {
    createPublication: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdatePublication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePublicationPayload }) =>
      updatePublication(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["publications", "me"] });
      queryClient.invalidateQueries({ queryKey: ["publications", data.id] });
    },
  });

  return {
    updatePublication: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeletePublication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => deletePublication(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["publications", "me"] });
      queryClient.removeQueries({ queryKey: ["publications", id] });
    },
  });

  return {
    deletePublication: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
