import { apiClient } from "@/src/core/api/client";
import { getAccessToken } from "@/src/core/storage/tokenStorage";

export interface PublicUserDto {
  id: number;
  name: string;
  avatarUrl: string | null;
  occupation?: string | null;
  bio?: string | null;
}

export interface FollowResponseDto {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export interface PublicProfileDto {
  id: number;
  email?: string;
  name: string;
  avatarUrl: string | null;
  occupation: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  publications: any[];
}

export interface DiscoverWriterDto {
  id: number;
  name: string;
  avatarUrl: string | null;
  occupation: string | null;
  followersCount: number;
  publicationsCount: number;
}

async function authHeaders() {
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  return { Authorization: `Bearer ${token}` };
}

export const getDiscoverWritersApi = async (): Promise<DiscoverWriterDto[]> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: DiscoverWriterDto[] }>(
    "/social/discover/writers",
    { headers },
  );
  return res.data.data;
};

export const followUserApi = async (userId: number): Promise<FollowResponseDto> => {
  const headers = await authHeaders();
  const res = await apiClient.post<{ success: true; data: FollowResponseDto }>(
    `/social/follow/${userId}`,
    {},
    { headers },
  );
  return res.data.data;
};

export const unfollowUserApi = async (userId: number): Promise<FollowResponseDto> => {
  const headers = await authHeaders();
  const res = await apiClient.delete<{ success: true; data: FollowResponseDto }>(
    `/social/follow/${userId}`,
    { headers },
  );
  return res.data.data;
};

export const getFollowStatusApi = async (userId: number): Promise<FollowResponseDto> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: FollowResponseDto }>(
    `/social/status/${userId}`,
    { headers },
  );
  return res.data.data;
};

export const getFollowersApi = async (userId: number): Promise<PublicUserDto[]> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: PublicUserDto[] }>(
    `/social/followers/${userId}`,
    { headers },
  );
  return res.data.data;
};

export const getFollowingApi = async (userId: number): Promise<PublicUserDto[]> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: PublicUserDto[] }>(
    `/social/following/${userId}`,
    { headers },
  );
  return res.data.data;
};

export const searchPeopleApi = async (query: string): Promise<PublicUserDto[]> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: PublicUserDto[] }>(
    `/social/search?q=${encodeURIComponent(query)}`,
    { headers },
  );
  return res.data.data;
};

export const getUserProfileApi = async (userId: number): Promise<PublicProfileDto> => {
  const headers = await authHeaders();
  const res = await apiClient.get<{ success: true; data: PublicProfileDto }>(
    `/users/${userId}`,
    { headers },
  );
  return res.data.data;
};
