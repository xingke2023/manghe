'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Notification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/api/notifications';

const TYPE_ICON: Record<string, string> = {
  new_application: '📩',
  application_locked: '🎉',
  application_rejected: '😔',
  profile_view_request: '👀',
  profile_view_approved: '✅',
  profile_view_rejected: '❌',
  fulfillment_perfect: '🌟',
  fulfillment_creator_missed: '😢',
  fulfillment_applicant_missed: '😤',
  value_test_approved: '🎊',
  value_test_rejected: '📋',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  return `${d}天前`;
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getNotifications(token);
      setItems(res.data);
      setUnreadCount(res.unread_count);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (n: Notification) => {
    if (!token) return;
    if (!n.is_read) {
      await markNotificationRead(n.id, token);
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    }
    if (n.link_url) router.push(n.link_url);
  };

  const handleMarkAll = async () => {
    if (!token || unreadCount === 0) return;
    await markAllNotificationsRead(token);
    setItems(prev => prev.map(x => ({ ...x, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-600">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-900">通知</h1>
        <button
          onClick={handleMarkAll}
          className={`text-xs ${unreadCount > 0 ? 'text-pink-500' : 'text-gray-300'}`}
          disabled={unreadCount === 0}
        >
          全部已读
        </button>
      </div>

      {/* List */}
      <div className="px-3 py-3 space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-4">🔔</span>
            <p className="text-sm">暂无通知</p>
          </div>
        ) : (
          items.map(n => (
            <button
              key={n.id}
              onClick={() => handleRead(n)}
              className="w-full bg-white rounded-2xl px-4 py-3.5 flex gap-3 items-start text-left active:bg-gray-50 transition-colors"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${n.is_read ? 'bg-gray-100' : 'bg-pink-50'}`}>
                {TYPE_ICON[n.type] ?? '🔔'}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium leading-snug ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.content}</p>
                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
