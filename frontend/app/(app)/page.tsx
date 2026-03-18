'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { BlindBoxCard } from '@/components/blind-box-card';
import { TimeFilterSheet } from '@/components/time-filter-sheet';
import { DistrictFilterSheet } from '@/components/district-filter-sheet';
import { getBlindBoxes, getFollowingBoxes, getFilterOptions, type BlindBoxListParams, type FollowingCreatorGroup } from '@/lib/api/blind-boxes';
import { getDailyViews } from '@/lib/api/me';
import { useAuth } from '@/lib/auth-context';
import type { BlindBox } from '@/lib/api/types';

const CATEGORIES = ['美食探索', '文艺沉浸', '技能交换', '观影交流', '深度对话'];

export default function HomePage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'plaza' | 'following'>('plaza');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sort, setSort] = useState<'created_at' | 'meeting_time'>('created_at');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [district, setDistrict] = useState('');
  const [boxes, setBoxes] = useState<BlindBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<{ remaining: number; limit: number } | null>(null);
  const [followingGroups, setFollowingGroups] = useState<FollowingCreatorGroup[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingError, setFollowingError] = useState<string>('');
  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [showDistrictSheet, setShowDistrictSheet] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    getDailyViews(token).then(r => setQuota({ remaining: r.remaining, limit: r.limit })).catch(() => {});
    getFilterOptions().then(r => setAvailableDistricts(r.districts)).catch(() => {});
  }, [token]);

  const loadBoxes = useCallback(async () => {
    setLoading(true);
    try {
      const params: BlindBoxListParams = {};
      if (selectedCategory) params.category = selectedCategory;
      if (sort === 'meeting_time') params.sort = 'meeting_time';
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (district) params.district = district;
      const res = await getBlindBoxes(params);
      setBoxes(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sort, dateFrom, dateTo, district]);

  useEffect(() => {
    if (activeTab === 'plaza') loadBoxes();
    if (activeTab === 'following' && token) {
      setFollowingLoading(true);
      setFollowingError('');
      getFollowingBoxes(token)
        .then((r) => setFollowingGroups(r.data))
        .catch((e) => setFollowingError(e?.message ?? '加载失败'))
        .finally(() => setFollowingLoading(false));
    }
  }, [activeTab, loadBoxes, token]);

  return (
    <div className="min-h-screen">
      {/* Header with gradient background */}
      <div
        className="relative px-4 pt-12 pb-4 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #FFE8E0 0%, #FFF0E8 40%, #FFF5F0 70%, #F5F5F5 100%)',
        }}
      >
        {/* Top right icons */}
        <div className="absolute top-12 right-4 flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
              <circle cx="12" cy="12" r="1.5" fill="#666" />
              <circle cx="19" cy="12" r="1.5" fill="#666" />
              <circle cx="5" cy="12" r="1.5" fill="#666" />
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="#666" />
            </svg>
          </button>
        </div>

        {/* Logo row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg">
            🎁
          </div>
          <h1 className="text-2xl font-bold text-gray-900">约会盲盒</h1>
        </div>

        {/* View quota badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1 text-[12px] text-gray-700">
          <span>🎲</span>
          {quota ? (
            <span>今日剩余拆盒 <strong className={quota.remaining === 0 ? 'text-[#E8373F]' : ''}>{quota.remaining}</strong>/{quota.limit} 次</span>
          ) : (
            <span>拆盒次数加载中...</span>
          )}
        </div>

        {/* Mascot decoration (placeholder) */}
        <div className="absolute right-0 bottom-0 w-32 h-28 flex items-end justify-end pr-3 pb-1 opacity-60 select-none pointer-events-none">
          <div className="text-5xl">😈</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white sticky top-0 z-10 shadow-[0_1px_0_0_#f0f0f0]">
        <div className="flex px-4">
          {(['plaza', 'following'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 mr-6 text-[15px] font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400'
              }`}
            >
              {tab === 'plaza' ? '盲盒广场' : '我关注的'}
            </button>
          ))}
        </div>

        {activeTab === 'plaza' && (
          <div className="px-4 pb-3 flex flex-col gap-2">
            {/* Sort/filter chips */}
            <div className="flex gap-2">
              <button
                onClick={() => setSort('created_at')}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  sort === 'created_at' && !dateFrom && !district
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setShowTimeSheet(true)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1 ${
                  dateFrom
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {dateFrom ? `${dateFrom.slice(5)}${dateTo && dateTo !== dateFrom ? '~' + dateTo.slice(5) : ''}` : '时间'}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => setShowDistrictSheet(true)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1 ${
                  district
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {district || '地区'}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                  className={`shrink-0 px-3.5 py-1 rounded-full text-[12px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-600 bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        {activeTab === 'plaza' ? (
          loading ? (
            <PlazaSkeleton />
          ) : boxes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-3">
              {boxes.map((box) => (
                <BlindBoxCard key={box.id} box={box} />
              ))}
            </div>
          )
        ) : (
          followingLoading ? (
            <PlazaSkeleton />
          ) : followingError ? (
            followingError.includes('会员') ? (
              <MemberOnly />
            ) : (
              <FollowingEmpty />
            )
          ) : followingGroups.length === 0 ? (
            <FollowingEmpty />
          ) : (
            <FollowingList groups={followingGroups} />
          )
        )}
      </div>

      {/* FAB: 我要发盒 */}
      <Link
        href="/publish"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg flex flex-col items-center justify-center gap-0 z-40 active:scale-95 transition-transform"
        style={{ maxWidth: 56 }}
      >
        <span className="text-xl leading-none">🎁</span>
        <span className="text-[9px] leading-tight font-medium">我要发盒</span>
      </Link>

      <TimeFilterSheet
        open={showTimeSheet}
        initialDateFrom={dateFrom}
        initialDateTo={dateTo}
        onConfirm={(f, t) => { setDateFrom(f); setDateTo(t); if (f) setSort('meeting_time'); setShowTimeSheet(false); }}
        onClose={() => setShowTimeSheet(false)}
      />
      <DistrictFilterSheet
        open={showDistrictSheet}
        districts={availableDistricts}
        initialDistrict={district}
        onConfirm={(d) => { setDistrict(d); setShowDistrictSheet(false); }}
        onClose={() => setShowDistrictSheet(false)}
      />
    </div>
  );
}

function PlazaSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-3 animate-pulse">
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-3/5" />
            <div className="h-5 bg-gray-200 rounded-full w-14" />
          </div>
          <div className="flex gap-3">
            <div className="w-[130px] h-[100px] bg-gray-200 rounded-xl" />
            <div className="flex-1 flex flex-col gap-2 py-1">
              <div className="flex gap-1.5 items-center">
                <div className="w-7 h-7 bg-gray-200 rounded-full" />
                <div className="h-3.5 bg-gray-200 rounded w-20" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-200 rounded w-28" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-5xl mb-4">📦</div>
      <p className="text-[14px]">暂无盲盒，快去发布一个吧！</p>
    </div>
  );
}

function FollowingEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-5xl mb-4">👀</div>
      <p className="text-[14px]">还没有关注的 TA</p>
      <p className="text-[12px] mt-1">去广场发现感兴趣的人吧</p>
    </div>
  );
}

function MemberOnly() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="text-5xl mb-4">🔒</div>
      <p className="text-[14px] font-medium text-gray-600">关注功能为会员专属</p>
      <p className="text-[12px] mt-1">开通会员解锁更多权益</p>
    </div>
  );
}

function FollowingList({ groups }: { groups: FollowingCreatorGroup[] }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.creator.id} className="bg-white rounded-2xl overflow-hidden">
          {/* Creator header */}
          <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {group.creator.avatar_url ? (
                <img src={group.creator.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                  {group.creator.gender === 2 ? '👩' : '👨'}
                </div>
              )}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">{group.creator.nickname}</p>
              <p className="text-[11px] text-gray-400">
                {group.creator.gender === 1 ? '男' : group.creator.gender === 2 ? '女' : ''} · {group.boxes.length} 个盲盒
              </p>
            </div>
          </div>

          {/* Boxes horizontal scroll */}
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-3 pb-3">
            {group.boxes.map((box) => (
              <Link key={box.id} href={`/blind-box/${box.id}`} className="shrink-0 w-[140px]">
                <div className="w-full h-[100px] rounded-xl bg-gray-100 overflow-hidden mb-1.5">
                  {box.cover_image ? (
                    <img src={box.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>
                  )}
                </div>
                <p className="text-[12px] font-medium text-gray-800 line-clamp-1">{box.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-gray-400">{box.meeting_time ?? ''}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${box.fee_type === 1 ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                    {box.fee_label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
