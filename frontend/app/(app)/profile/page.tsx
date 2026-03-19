'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMyProfile, getMyVouchers, type MyProfile } from '@/lib/api/me';
import { getAvatarUrl } from '@/lib/utils';

export default function ProfilePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [vouchers, setVouchers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getMyProfile(token).then(r => setProfile(r.user)),
      getMyVouchers(token).then(r => setVouchers(r.available)),
    ]).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <ProfileSkeleton />;

  const nickname = profile?.nickname ?? '神秘用户';
  const isMember = profile?.is_member;
  const memberExpire = profile?.member_expire_date;

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div
        className="relative px-4 pt-10 pb-6"
        style={{ background: 'linear-gradient(160deg, #FFE8E0 0%, #FFF0E8 50%, #FFF5F0 100%)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[17px] font-bold text-gray-900">我的</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                <circle cx="12" cy="12" r="1.5" fill="#666" /><circle cx="19" cy="12" r="1.5" fill="#666" /><circle cx="5" cy="12" r="1.5" fill="#666" />
              </svg>
            </button>
            <button className="w-8 h-8 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" fill="#666" />
              </svg>
            </button>
          </div>
        </div>

        {/* User card */}
        <div className="flex items-center gap-4 mt-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile ? (
              <img src={getAvatarUrl(profile.id, profile.avatar_url)} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-200 to-pink-300 border-4 border-white shadow-md" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold text-gray-900 truncate">{nickname}</span>
              <button onClick={() => router.push('/profile/edit')} className="shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            {isMember ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  💎 VIP
                </span>
                {memberExpire && (
                  <span className="text-[11px] text-gray-500">有效期 {memberExpire}</span>
                )}
              </div>
            ) : (
              <div className="mt-1">
                <span className="text-[12px] text-gray-400">开通会员享更多特权</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu list */}
      <div className="mx-3 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm">
        <MenuItem
          icon="📋"
          label="发盒凭证"
          badge={vouchers > 0 ? `${vouchers}张可用` : undefined}
          onClick={() => router.push('/profile/vouchers')}
        />
        <MenuItem
          icon="🤝"
          label="我的履约"
          onClick={() => router.push('/profile/fulfillments')}
        />
        <MenuItem
          icon="📦"
          label="发盒记录"
          onClick={() => router.push('/profile/my-boxes')}
        />
        <MenuItem
          icon="⭐"
          label="关注的 TA"
          crown={true}
          onClick={() => router.push('/profile/following')}
        />
        <MenuItem
          icon="🎧"
          label="小恶魔客服"
          last={true}
          onClick={() => {}}
        />
      </div>

      {/* FAB */}
      <Link
        href="/publish"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg flex flex-col items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <span className="text-xl leading-none">🎁</span>
        <span className="text-[9px] leading-tight font-medium">我要发盒</span>
      </Link>
    </div>
  );
}

function MenuItem({
  icon, label, badge, crown, last, onClick,
}: {
  icon: string;
  label: string;
  badge?: string;
  crown?: boolean;
  last?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors ${!last ? 'border-b border-gray-50' : ''}`}
    >
      <span className="text-xl w-7 text-center shrink-0">{icon}</span>
      <span className="flex-1 text-[15px] text-gray-900 text-left font-medium">
        {label}
        {crown && <span className="ml-1">👑</span>}
      </span>
      {badge && (
        <span className="text-[11px] text-green-600 border border-green-400 px-2 py-0.5 rounded-full mr-1">
          {badge}
        </span>
      )}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] animate-pulse">
      <div className="h-44 bg-gradient-to-b from-pink-100 to-orange-50" />
      <div className="mx-3 mt-3 bg-white rounded-2xl p-4 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-6 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}
