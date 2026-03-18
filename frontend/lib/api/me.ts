import { apiClient } from './client';

export interface MyProfile {
  id: number;
  nickname?: string;
  avatar_url?: string;
  gender?: number;
  birth_date?: string;
  age?: number;
  height?: number;
  city?: string;
  district?: string;
  is_member?: boolean;
  member_expire_date?: string;
  credit_score?: number;
  has_box_permission?: boolean;
  profile?: {
    dating_purposes?: string[];
    target_gender?: number;
    target_age_min?: number;
    target_age_max?: number;
    about_me?: string;
    interests?: string[];
    interest_photos?: string[];
    occupation?: string;
    education?: string;
    annual_income?: string;
  } | null;
}

export interface MyBlindBox {
  id: number;
  title: string;
  cover_image?: string;
  meeting_time?: string;
  city?: string;
  district?: string;
  fee_type: number;
  fee_label: string;
  status: number;
  view_count: number;
  apply_count: number;
  expected_traits?: string[];
}

export interface FollowingUser {
  id: number;
  nickname: string;
  avatar_url?: string;
  gender?: number;
  generation_label?: string;
}

export async function getMyProfile(token: string): Promise<{ user: MyProfile }> {
  return apiClient.get<{ user: MyProfile }>('/me/profile', token);
}

export async function updateProfile(data: Partial<MyProfile & { dating_purposes?: string[]; target_gender?: number; target_age_min?: number; target_age_max?: number; about_me?: string; interests?: string[]; occupation?: string; education?: string }>, token: string) {
  return apiClient.put<{ message: string }>('/profile', data, token);
}

export async function getMyBlindBoxes(token: string): Promise<{ data: MyBlindBox[] }> {
  return apiClient.get<{ data: MyBlindBox[] }>('/me/blind-boxes', token);
}

export async function getMyFollowing(token: string): Promise<{ data: FollowingUser[] }> {
  return apiClient.get<{ data: FollowingUser[] }>('/me/following', token);
}

export async function getMyVouchers(token: string): Promise<{ available: number }> {
  return apiClient.get<{ available: number }>('/me/vouchers', token);
}

export async function getDailyViews(token: string): Promise<{ used: number; limit: number; remaining: number; is_member: boolean }> {
  return apiClient.get('/me/daily-views', token);
}

export async function recordBoxView(boxId: number, token: string): Promise<{ message: string; already_viewed: boolean }> {
  return apiClient.post(`/blind-boxes/${boxId}/view`, {}, token);
}

export async function followUser(userId: number, token: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/users/${userId}/follow`, {}, token);
}

export async function unfollowUser(userId: number, token: string): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/users/${userId}/follow`, token);
}

export async function getFollowStatus(userId: number, token: string): Promise<{ following: boolean; following_count: number; can_follow: boolean }> {
  return apiClient.get(`/users/${userId}/follow`, token);
}
