'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getChatMessages, sendChatMessage, lockApplication, rejectApplication, getApplications, type ChatMessage, type Application } from '@/lib/api/chat';

interface SessionInfo {
  id: number;
  status: number;
  is_unlocked: boolean;
  other_user?: { id: number; nickname: string; avatar?: string };
  blind_box?: { id: number; title: string; cover_image?: string; meeting_time?: string; status?: number };
  is_creator?: boolean;
  box_id?: number;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Number(params.id);
  const { token } = useAuth();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [confirmModal, setConfirmModal] = useState<'lock' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getChatMessages(sessionId, token);
      setSession(res.session as SessionInfo);
      setMessages(res.data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      router.back();
    }
  }, [sessionId, token, router]);

  useEffect(() => { load(); }, [load]);

  // Load application info for creator view
  useEffect(() => {
    if (!session?.is_creator || !session?.box_id || !token) return;
    getApplications(session.box_id, token).then(res => {
      const app = res.data.find(a => a.applicant.id === session.other_user?.id);
      if (app) setApplication(app);
    }).catch(() => {});
  }, [session, token]);

  async function handleSend() {
    if (!input.trim() || sending || !token || isBoxDelisted) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(sessionId, input.trim(), token);
      setMessages(prev => [...prev, msg]);
      setInput('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  async function handleLock() {
    if (!application || !token) return;
    setActionLoading(true);
    try {
      await lockApplication(application.id, token);
      setApplication(prev => prev ? { ...prev, is_locked: true, status: 2 } : prev);
      setConfirmModal(null);
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!application || !token) return;
    setActionLoading(true);
    try {
      await rejectApplication(application.id, token);
      setApplication(prev => prev ? { ...prev, status: 3 } : prev);
      setConfirmModal(null);
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  }

  const otherUser = session?.other_user;
  const blindBox = session?.blind_box;
  const isCreator = session?.is_creator;
  const applicationStatus = application?.status; // 1=pending, 2=locked, 3=rejected
  const isBoxDelisted = blindBox?.status === 3;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100 shrink-0">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {otherUser?.avatar ? (
            <img src={otherUser.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-200 to-pink-300 flex items-center justify-center text-sm">😊</div>
          )}
          <span className="text-[15px] font-semibold">{otherUser?.nickname ?? 'TA'}</span>
          <span className="w-2 h-2 rounded-full bg-green-400 ml-0.5" />
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
              <circle cx="12" cy="12" r="1.5" fill="#666" />
              <circle cx="19" cy="12" r="1.5" fill="#666" />
              <circle cx="5" cy="12" r="1.5" fill="#666" />
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="#666" />
            </svg>
          </button>
        </div>
      </div>

      {/* Blind box context card */}
      {blindBox && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
          <button
            onClick={() => router.push(`/blind-box/${blindBox.id}`)}
            className="w-full flex items-center gap-3 bg-white rounded-xl p-2.5 shadow-sm"
          >
            {blindBox.cover_image ? (
              <img src={blindBox.cover_image} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center text-xl shrink-0">🎁</div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">约会主题：{blindBox.title}</p>
              {blindBox.meeting_time && (
                <p className="text-[12px] text-gray-400 mt-0.5">
                  约会时间：{new Date(blindBox.meeting_time).toLocaleDateString('zh-CN', {
                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Creator action card: accept/reject applicant */}
      {isCreator && application && applicationStatus === 1 && (
        <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] text-gray-700">
              <span>🔔</span>
              <span>是否同意应约？</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal('lock')}
                className="bg-gray-900 text-white text-[12px] font-semibold px-4 py-1.5 rounded-full"
              >
                通过
              </button>
              <button
                onClick={() => setConfirmModal('reject')}
                className="bg-gray-100 text-gray-600 text-[12px] font-semibold px-4 py-1.5 rounded-full"
              >
                拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locked status banner */}
      {isCreator && applicationStatus === 2 && (
        <div className="px-3 py-2 bg-green-50 border-b border-green-100 shrink-0">
          <p className="text-[13px] text-green-600 text-center">✅ 已通过 · 记得约定承诺赴约</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-3">
        {/* Connection start indicator */}
        <div className="flex items-center justify-center gap-2 my-2">
          <span className="text-lg">🤝</span>
          <span className="text-[12px] text-gray-400">你们开始产生连接</span>
        </div>

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input or closed banner */}
      {isBoxDelisted ? (
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-2 shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <span className="text-[13px] text-gray-400">盲盒已下架，聊天已关闭</span>
        </div>
      ) : (
        <div className="px-3 py-3 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="请输入聊天内容"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[14px] outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center disabled:bg-gray-300 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-8">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden">
            <div className="p-6 text-center">
              <h3 className="text-[17px] font-bold text-gray-900 mb-2">
                {confirmModal === 'lock' ? '是否通过？' : '是否拒绝？'}
              </h3>
              <p className="text-[13px] text-gray-500">
                {confirmModal === 'lock'
                  ? '通过对方后，记得约定承诺赴约'
                  : '拒绝后，对方将会在您的世界消失'}
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3.5 text-[15px] text-gray-600 border-r border-gray-100"
              >
                {confirmModal === 'lock' ? '暂不' : '想想'}
              </button>
              <button
                onClick={confirmModal === 'lock' ? handleLock : handleReject}
                disabled={actionLoading}
                className="flex-1 py-3.5 text-[15px] font-semibold text-[#E8373F]"
              >
                {actionLoading ? '...' : (confirmModal === 'lock' ? '通过' : '拒绝')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`flex items-end gap-2 ${message.is_mine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!message.is_mine && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-200 to-pink-300 flex items-center justify-center text-sm shrink-0 mb-0.5">😊</div>
      )}
      <div
        className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
          message.is_mine
            ? 'bg-gray-900 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
