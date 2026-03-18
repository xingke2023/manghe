'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getChatSessions, type ChatSession } from '@/lib/api/chat';
import {
  getPendingProfileViewRequests,
  processProfileViewRequest,
  type PendingProfileViewRequest,
} from '@/lib/api/blind-boxes';
import { getUnreadCount } from '@/lib/api/notifications';

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'interested' | 'mybox'>('interested');
  const router = useRouter();
  const { token } = useAuth();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    getUnreadCount(token).then(r => setNotifCount(r.count)).catch(() => {});
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex flex-col pb-16">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100">
        <div className="w-8" />
        <span className="text-[16px] font-semibold">消息</span>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="w-8 h-8 flex items-center justify-center relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {notifCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-6 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('interested')}
          className={`py-3 text-[15px] font-semibold border-b-2 transition-colors ${
            activeTab === 'interested'
              ? 'border-[#E8373F] text-gray-900'
              : 'border-transparent text-gray-400'
          }`}
        >
          我感兴趣
        </button>
        <button
          onClick={() => setActiveTab('mybox')}
          className={`py-3 text-[15px] font-semibold border-b-2 transition-colors ${
            activeTab === 'mybox'
              ? 'border-[#E8373F] text-gray-900'
              : 'border-transparent text-gray-400'
          }`}
        >
          我发的盒
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'interested' ? (
          <InterestedTab router={router} />
        ) : (
          <MyBoxTab router={router} />
        )}
      </div>
    </div>
  );
}

function InterestedTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getChatSessions(token);
      // Filter sessions where user is the applicant (not creator)
      setSessions(res.data.filter(s => !s.is_creator));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  if (loading) return <SessionSkeleton />;

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="text-6xl mb-4">😈</div>
        <p className="text-[14px] text-gray-500 mb-8">当前暂没有消息喔～</p>
        <button
          onClick={() => router.push('/')}
          className="w-full max-w-xs bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl"
        >
          去拆盲盒
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {sessions.map(session => (
        <SessionItem
          key={session.id}
          session={session}
          onClick={() => router.push(`/messages/${session.id}`)}
        />
      ))}
    </div>
  );
}

function MyBoxTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  // Group sessions by box
  const boxGroups = sessions.reduce<Record<number, { boxInfo: ChatSession['blind_box']; sessions: ChatSession[] }>>(
    (acc, s) => {
      if (!s.box_id) return acc;
      if (!acc[s.box_id]) acc[s.box_id] = { boxInfo: s.blind_box, sessions: [] };
      acc[s.box_id].sessions.push(s);
      return acc;
    },
    {}
  );

  const loadSessions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getChatSessions(token);
      // Filter sessions where user is the creator
      setSessions(res.data.filter(s => s.is_creator));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  if (loading) return <SessionSkeleton />;

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-[14px] text-gray-500 mb-2">还没有人来拆你的盒</p>
        <p className="text-[12px] text-gray-400">去广场看看别人的盲盒吧</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 flex flex-col gap-3">
      {token && <ProfileViewRequestSection token={token} />}
      {Object.entries(boxGroups).map(([boxId, group]) => (
        <div key={boxId} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {/* Box info card */}
          <div
            className="flex items-center gap-3 p-3 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #FFE0DC 0%, #FFF0E8 100%)' }}
            onClick={() => router.push(`/blind-box/${boxId}`)}
          >
            {group.boxInfo?.cover_image ? (
              <img src={group.boxInfo.cover_image} alt="" className="w-14 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-14 h-12 rounded-xl bg-white/60 flex items-center justify-center text-2xl shrink-0">🎁</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-gray-900 truncate">
                约会主题：{group.boxInfo?.title ?? '我的盲盒'}
              </p>
              {group.boxInfo?.meeting_time && (
                <p className="text-[12px] text-gray-500 mt-0.5">
                  约会时间：{new Date(group.boxInfo.meeting_time).toLocaleDateString('zh-CN', {
                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          {/* Applicant sessions */}
          <div className="divide-y divide-gray-50">
            {group.sessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                onClick={() => router.push(`/messages/${session.id}`)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileViewRequestSection({ token }: { token: string }) {
  const [requests, setRequests] = useState<PendingProfileViewRequest[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = useCallback(() => {
    getPendingProfileViewRequests(token)
      .then(r => setRequests(r.data))
      .catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (requests.length === 0) return null;

  async function handle(id: number, action: 'approve' | 'reject') {
    if (processing !== null) return;
    setProcessing(id);
    try {
      await processProfileViewRequest(id, action, token);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch {
      // ignore
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="px-3 pt-3 pb-1 flex items-center gap-1.5">
        <span className="text-[13px] font-semibold text-gray-700">相册查看申请</span>
        <span className="w-5 h-5 bg-[#E8373F] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
          {requests.length}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {requests.map(req => (
          <div key={req.id} className="flex items-center gap-3 px-3 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-pink-300 overflow-hidden shrink-0 flex items-center justify-center">
              {req.requester.avatar_url ? (
                <img src={req.requester.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base">{req.requester.gender === 2 ? '👩' : '👨'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-900 truncate">{req.requester.nickname}</p>
              <p className="text-[11px] text-gray-400 truncate">想查看《{req.box_title ?? '盲盒'}》的兴趣相册</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => handle(req.id, 'reject')}
                disabled={processing === req.id}
                className="px-3 py-1.5 rounded-full border border-gray-200 text-[12px] text-gray-500 font-medium disabled:opacity-40"
              >
                拒绝
              </button>
              <button
                onClick={() => handle(req.id, 'approve')}
                disabled={processing === req.id}
                className="px-3 py-1.5 rounded-full bg-gray-900 text-[12px] text-white font-medium disabled:opacity-40"
              >
                同意
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionItem({ session, onClick }: { session: ChatSession; onClick: () => void }) {
  const other = session.other_user;
  const hasUnread = false; // TODO: unread count from API

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {other?.avatar ? (
          <img src={other.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-pink-300 flex items-center justify-center text-xl">
            😊
          </div>
        )}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#E8373F] rounded-full flex items-center justify-center text-white text-[10px] font-bold">5</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[15px] font-medium text-gray-900">{other?.nickname ?? 'TA'}</span>
          <span className="text-[12px] text-gray-400">{session.last_message_time ?? ''}</span>
        </div>
        <p className="text-[13px] text-gray-500 truncate">
          {session.last_message ?? '你们开始产生连接～'}
        </p>
      </div>
    </button>
  );
}

function SessionSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
