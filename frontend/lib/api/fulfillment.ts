import { apiClient } from './client';

export interface Fulfillment {
  application_id: number;
  role: 'creator' | 'applicant';
  box_id: number;
  title: string;
  cover_image?: string;
  meeting_time?: string;
  location?: string;
  city?: string;
  district?: string;
  box_status: number; // 1=active,2=full,3=closed,4=fulfilled
  has_checked_in: boolean;
  fulfill_status: number; // 0=pending,1=完美履约,2=我失约,3=对方失约
}

export async function getFulfillments(token: string): Promise<{ data: Fulfillment[] }> {
  return apiClient.get<{ data: Fulfillment[] }>('/me/fulfillments', token);
}

export async function submitCheckin(
  boxId: number,
  latitude: number,
  longitude: number,
  token: string
): Promise<{ is_valid: boolean; distance_meters?: number; message: string }> {
  return apiClient.post('/checkins', { box_id: boxId, latitude, longitude }, token);
}

export async function generateMeetingCode(
  boxId: number,
  token: string
): Promise<{ qr_code: string; valid_until: string }> {
  return apiClient.post('/meeting-codes', { box_id: boxId }, token);
}

export async function verifyMeetingCode(
  boxId: number,
  qrCode: string,
  token: string
): Promise<{ is_valid: boolean; message: string }> {
  return apiClient.post('/meeting-verifications', { box_id: boxId, qr_code: qrCode }, token);
}

export async function submitAppeal(
  boxId: number,
  reason: string,
  token: string
): Promise<{ message: string }> {
  return apiClient.post('/appeals', { box_id: boxId, reason }, token);
}
