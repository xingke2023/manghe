import { apiClient } from './client';
import type { BlindBox, PaginatedResponse } from './types';

export interface BlindBoxListParams {
  city?: string;
  district?: string;
  fee_type?: number;
  category?: string;
  sort?: 'meeting_time' | 'created_at';
  date_from?: string;
  date_to?: string;
  page?: number;
}

export async function getBlindBoxes(
  params: BlindBoxListParams = {},
  token?: string
): Promise<PaginatedResponse<BlindBox>> {
  const query = new URLSearchParams();
  if (params.city) query.set('city', params.city);
  if (params.district) query.set('district', params.district);
  if (params.fee_type) query.set('fee_type', String(params.fee_type));
  if (params.category) query.set('category', params.category);
  if (params.sort) query.set('sort', params.sort);
  if (params.date_from) query.set('date_from', params.date_from);
  if (params.date_to) query.set('date_to', params.date_to);
  if (params.page) query.set('page', String(params.page));
  const qs = query.toString();
  return apiClient.get<PaginatedResponse<BlindBox>>(
    `/blind-boxes${qs ? `?${qs}` : ''}`,
    token
  );
}

export async function getBlindBox(id: number, token?: string): Promise<{ data: BlindBox }> {
  return apiClient.get<{ data: BlindBox }>(`/blind-boxes/${id}`, token);
}

export async function getFilterOptions(): Promise<{ cities: string[]; districts: string[] }> {
  return apiClient.get<{ cities: string[]; districts: string[] }>('/blind-boxes/filter-options');
}

export async function unpublishBlindBox(id: number, token: string): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/blind-boxes/${id}`, token);
}

export interface FollowingCreatorBox {
  id: number;
  title: string;
  cover_image?: string;
  meeting_time?: string;
  city?: string;
  district?: string;
  fee_type: number;
  fee_label: string;
  view_count: number;
  apply_count: number;
}

export interface FollowingCreatorGroup {
  creator: {
    id: number;
    nickname: string;
    avatar_url?: string;
    gender?: number;
  };
  boxes: FollowingCreatorBox[];
}

export async function getFollowingBoxes(token: string): Promise<{ data: FollowingCreatorGroup[] }> {
  return apiClient.get<{ data: FollowingCreatorGroup[] }>('/following/blind-boxes', token);
}

export interface ProfileViewRequestStatus {
  status: number; // 0=未申请, 1=待处理, 2=已通过, 3=已拒绝
  next_request_time?: string;
}

export async function getProfileViewRequest(boxId: number, token: string): Promise<ProfileViewRequestStatus> {
  return apiClient.get<ProfileViewRequestStatus>(`/blind-boxes/${boxId}/profile-view-request`, token);
}

export async function requestProfileView(boxId: number, token: string): Promise<{ message: string; status: number }> {
  return apiClient.post<{ message: string; status: number }>(`/blind-boxes/${boxId}/profile-view-request`, {}, token);
}

export interface PendingProfileViewRequest {
  id: number;
  box_id: number;
  box_title?: string;
  requester: {
    id: number;
    nickname: string;
    avatar_url?: string;
    gender?: number;
  };
  created_at: string;
}

export async function getPendingProfileViewRequests(token: string): Promise<{ data: PendingProfileViewRequest[] }> {
  return apiClient.get<{ data: PendingProfileViewRequest[] }>('/me/profile-view-requests', token);
}

export async function processProfileViewRequest(
  id: number,
  action: 'approve' | 'reject',
  token: string
): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>(`/profile-view-requests/${id}/${action}`, {}, token);
}
