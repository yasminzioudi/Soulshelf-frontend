// src/features/friends/friends.api.ts
import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";

export interface PublicUser {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface FriendRequest {
  id: number;
  createdAt: string;
  sender?: PublicUser;
  receiver?: PublicUser;
  status?: string;
  senderId?: number;
  receiverId?: number;
}

export interface FriendRequestsData {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

async function authHeaders() {
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  return { Authorization: `Bearer ${token}` };
}

export const searchUsers = async (query: string): Promise<PublicUser[]> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: PublicUser[] }>(
    `/users/search?q=${encodeURIComponent(query)}`,
    { headers },
  );
  return res.data.data;
};

export const getFriends = async (): Promise<PublicUser[]> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: PublicUser[] }>(
    "/friends/me",
    { headers },
  );
  return res.data.data;
};

export const getFriendRequests = async (): Promise<FriendRequestsData> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: FriendRequestsData }>(
    "/friends/me/requests",
    { headers },
  );
  return res.data.data;
};

export const sendFriendRequest = async (userId: number): Promise<FriendRequest> => {
  const headers = await authHeaders();
  const res = await apiClient.post<{ success: true; data: FriendRequest }>(
    `/friends/me/requests/${userId}`,
    {},
    { headers },
  );
  return res.data.data;
};

export const acceptFriendRequest = async (requestId: number): Promise<FriendRequest> => {
  const headers = await authHeaders();
  const res = await apiClient.post<{ success: true; data: FriendRequest }>(
    `/friends/me/requests/${requestId}/accept`,
    {},
    { headers },
  );
  return res.data.data;
};

export const rejectFriendRequest = async (requestId: number): Promise<FriendRequest> => {
  const headers = await authHeaders();
  const res = await apiClient.post<{ success: true; data: FriendRequest }>(
    `/friends/me/requests/${requestId}/reject`,
    {},
    { headers },
  );
  return res.data.data;
};

export const removeFriend = async (userId: number): Promise<{ message: string }> => {
  const headers = await authHeaders();
  const res = await apiClient.delete<{ success: true; data: { message: string } }>(
    `/friends/me/${userId}`,
    { headers },
  );
  return res.data.data;
};
