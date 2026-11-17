import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversationsApi,
  getMessagesApi,
  sendMessageApi,
  type ConversationSummaryDto,
  type MessageDto,
} from "./messaging.api";

export function useConversations() {
  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: () => getConversationsApi(),
  });

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useChatMessages(conversationId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => (conversationId ? getMessagesApi(conversationId) : Promise.resolve([])),
    enabled: Boolean(conversationId),
    refetchInterval: 3000,
  });

  const mutation = useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error("No conversation");
      return sendMessageApi(conversationId, content.trim());
    },
    onSuccess: (newMsg) => {
      queryClient.setQueryData<MessageDto[]>(["messages", conversationId], (old) =>
        old ? [...old, newMsg] : [newMsg],
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isSending: mutation.isPending,
    sendMessage: mutation.mutateAsync,
    refetch: query.refetch,
  };
}

