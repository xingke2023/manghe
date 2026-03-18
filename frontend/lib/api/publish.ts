import { apiClient } from './client';

export interface PublishStatus {
  value_test_status: number; // 0=未测试, 1=通过, 2=审核中
  has_deposit: boolean;
}

export interface ValueTestAnswers {
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6: string; q7: string; q8: string; q9: string; q10: string;
}

export interface CreateBlindBoxData {
  title: string;
  meeting_time: string;
  location: string;
  city?: string;
  district?: string;
  fee_type: number;
  cover_image?: string;
  expected_traits?: string[];
  experience_values?: string[];
  max_participants?: number;
}

export async function getPublishStatus(token: string): Promise<PublishStatus> {
  return apiClient.get<PublishStatus>('/publish/status', token);
}

export async function submitValueTest(answers: ValueTestAnswers, token: string) {
  return apiClient.post<{ status: number; message: string }>('/value-test', { answers }, token);
}

export async function payDeposit(token: string) {
  return apiClient.post<{ message: string }>('/deposit', {}, token);
}

export async function redeemVoucher(code: string, token: string) {
  return apiClient.post<{ message: string }>('/vouchers/redeem', { code }, token);
}

export async function createBlindBox(data: CreateBlindBoxData, token: string) {
  return apiClient.post<{ message: string; id: number }>('/blind-boxes', data, token);
}
