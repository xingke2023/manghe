import { apiClient } from './client';

export interface ChatSessionOtherUser {
  id: number;
  nickname: string;
  avatar?: string;
}

export interface ChatSessionBlindBox {
  id: number;
  title: string;
  cover_image?: string;
  meeting_time?: string;
}

export interface ChatSession {
  id: number;
  box_id: number;
  status: number;
  is_creator: boolean;
  last_message?: string;
  last_message_time?: string;
  blind_box?: ChatSessionBlindBox;
  other_user?: ChatSessionOtherUser;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  is_mine: boolean;
  content: string;
  message_type: number;
  is_read: boolean;
  created_at: string;
}

export interface Application {
  id: number;
  status: number;
  is_locked: boolean;
  created_at?: string;
  applicant: {
    id: number;
    nickname: string;
    avatar?: string;
    gender?: number;
  };
}

export interface SessionInfo {
  session_id: number;
  is_new: boolean;
  creator: { id: number; nickname: string; avatar?: string };
  blind_box: { id: number; title: string; cover_image?: string; meeting_time?: string };
}

export async function getOrCreateSession(boxId: number, token: string): Promise<SessionInfo> {
  return apiClient.post<SessionInfo>('/chat/sessions', { box_id: boxId }, token);
}

export async function getChatSessions(token: string): Promise<{ data: ChatSession[] }> {
  return apiClient.get<{ data: ChatSession[] }>('/chat/sessions', token);
}

export async function getChatMessages(sessionId: number, token: string) {
  return apiClient.get<{
    session: {
      id: number;
      status: number;
      is_unlocked: boolean;
      is_creator: boolean;
      box_id: number;
      other_user?: { id: number; nickname: string; avatar?: string };
      blind_box?: { id: number; title: string; cover_image?: string; meeting_time?: string };
    };
    data: ChatMessage[]
  }>(`/chat/${sessionId}/messages`, token);
}

export async function sendChatMessage(sessionId: number, content: string, token: string) {
  return apiClient.post<ChatMessage>(`/chat/${sessionId}/messages`, { content }, token);
}

export async function applyBlindBox(boxId: number, token: string) {
  return apiClient.post<{ message: string; application_id: number }>(`/blind-boxes/${boxId}/apply`, {}, token);
}

export async function getApplications(boxId: number, token: string): Promise<{ data: Application[] }> {
  return apiClient.get<{ data: Application[] }>(`/blind-boxes/${boxId}/applications`, token);
}

export async function lockApplication(applicationId: number, token: string) {
  return apiClient.post<{ message: string }>(`/applications/${applicationId}/lock`, {}, token);
}

export async function rejectApplication(applicationId: number, token: string) {
  return apiClient.post<{ message: string }>(`/applications/${applicationId}/reject`, {}, token);
}
