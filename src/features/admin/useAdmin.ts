// src/features/admin/useAdmin.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdminBook, type CreateBookPayload } from "./admin.api";

export function useCreateAdminBook() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateBookPayload) => createAdminBook(payload),
    onSuccess: () => {
      // Invalidate both catalog and featured queries so new book appears immediately
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  return {
    createBook: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset,
  };
}
