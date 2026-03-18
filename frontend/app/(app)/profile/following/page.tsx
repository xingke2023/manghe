'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMyFollowing, type FollowingUser } from '@/lib/api/me';

export default function FollowingPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getMyFollowing(token)
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">我关注的 TA</span>
        <div className="w-8" />
      </div>

      {/* Tips banner */}
      <div className="mx-3 mt-3 bg-white rounded-xl p-3 flex items-start gap-2.5 shadow-sm">
        <span className="text-lg shrink-0">⚠️</span>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          无论是你关注的人，还是对方关注你，只要发布了盲盒，系统都会通过微信提醒你第一时间知道！
        </p>
      </div>

      <div className="px-3 mt-3 flex flex-col gap-2">
        {loading ? (
          <FollowingSkeleton />
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-5xl mb-4">👀</div>
            <p className="text-[14px]">还没有关注任何人</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 bg-gray-900 text-white text-[14px] font-semibold px-8 py-3 rounded-2xl"
            >
              去广场发现 TA
            </button>
          </div>
        ) : (
          users.map(u => (
            <div key={u.id} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-pink-300 flex items-center justify-center text-xl shrink-0">😊</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-medium text-gray-900">{u.nickname}</span>
                  {u.gender === 1 ? (
                    <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px]">♂</span>
                  ) : u.gender === 2 ? (
                    <span className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center text-white text-[9px]">♀</span>
                  ) : null}
                </div>
                {u.generation_label && (
                  <span className="mt-0.5 inline-block text-[11px] border border-teal-400 text-teal-600 px-2 py-0.5 rounded-full">
                    {u.generation_label}
                  </span>
                )}
              </div>
              <button className="text-[13px] border border-gray-300 text-gray-500 px-4 py-1.5 rounded-full shrink-0">
                已关注
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FollowingSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
        </div>
      ))}
    </>
  );
}
