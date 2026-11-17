import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";

export interface ConversationSummaryDto {
  id: number;
  otherUser: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
  latestMessage: string | null;
  latestMessageCreatedAt: string | null;
  unreadCount: number;
}

export interface MessageDto {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string;
}

export interface CreateConversationResponse {
  conversationId: number;
  otherUser: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
}

async function authHeaders() {
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  return { Authorization: `Bearer ${token}` };
}

export const getOrCreateConversationApi = async (
  targetUserId: number,
): Promise<CreateConversationResponse> => {
  const headers = await authHeaders();
  const res = await apiClient.post<{ success: true; data: CreateConversationResponse }>(
    "/conversations",
    { targetUserId },
    { headers },
  );
  return res.data.data;
};

export const getConversationsApi = async (): Promise<ConversationSummaryDto[]> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: ConversationSummaryDto[] }>(
    "/conversations",
    { headers },
  );
  return res.data.data;
};

export const getMessagesApi = async (conversationId: number): Promise<MessageDto[]> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: MessageDto[] }>(
    `/conversations/${conversationId}/messages`,
    { headers },
  );
  return res.data.data;
};

export const sendMessageApi = async (
  conversationId: number,
  content: string,
): Promise<MessageDto> => {
  const headers = await authHeaders();
  const res = await apiClient.post<{ success: true; data: MessageDto }>(
    `/conversations/${conversationId}/messages`,
    { content },
    { headers },
  );
  return res.data.data;
};
