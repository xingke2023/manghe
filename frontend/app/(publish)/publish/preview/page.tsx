'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createBlindBox } from '@/lib/api/publish';

interface Draft {
  title: string;
  meetingTime: string;
  location: string;
  city: string;
  district: string;
  feeType: number;
  expectedTraits: string[];
  experienceValues: string[];
}

export default function PreviewPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('publish_draft');
    if (!raw) { router.replace('/publish/create'); return; }
    setDraft(JSON.parse(raw));
  }, [router]);

  async function handlePublish() {
    if (!draft || !token || submitting) return;
    setSubmitting(true);
    try {
      const res = await createBlindBox({
        title: draft.title,
        meeting_time: new Date(draft.meetingTime).toISOString(),
        location: draft.location,
        city: draft.city,
        district: draft.district,
        fee_type: draft.feeType,
        expected_traits: draft.expectedTraits,
        experience_values: draft.experienceValues,
      }, token);
      sessionStorage.removeItem('publish_draft');
      router.push(`/publish/success?id=${res.id}`);
    } catch {
      setSubmitting(false);
    }
  }

  if (!draft) return null;

  const feeLabel = draft.feeType === 1 ? 'AA' : 'TA请客';
  const meetingDisplay = draft.meetingTime
    ? new Date(draft.meetingTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">效果预览</span>
        <div className="w-8" />
      </div>

      {/* Creator hero */}
      <div className="relative px-4 pt-5 pb-4" style={{ background: 'linear-gradient(160deg, #FFE0DC 0%, #FFE8E0 40%, #FFF0E8 80%, #F5F5F5 100%)' }}>
        <div className="flex items-end gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-300 border-4 border-white shadow-md shrink-0 flex items-center justify-center text-3xl">
            😈
          </div>
          <div className="flex-1 relative h-20 flex items-center">
            <span className="absolute left-0 top-2 bg-[#E8373F] text-white text-[13px] font-bold px-3 py-1 rounded-xl rotate-[-3deg] shadow-sm">Hi~</span>
          </div>
          <div className="text-5xl opacity-70">😈</div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-[17px] font-bold text-gray-900">{(user as { nickname?: string })?.nickname ?? '我'}</span>
          <button className="bg-[#E8373F] text-white text-[13px] font-semibold px-4 py-1.5 rounded-full opacity-50 cursor-not-allowed">关注 TA</button>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-[11px] border border-teal-400 text-teal-600 px-2 py-0.5 rounded-full">预览模式</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3 mt-3">
        {/* 约会计划 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-1">约会计划 <span className="text-yellow-500">⚡</span></h2>
            {draft.experienceValues.length > 0 && (
              <div className="flex items-center gap-1 text-[12px] text-gray-500">
                <span>🎯</span>
                {draft.experienceValues.slice(0, 2).join(' | ')}
              </div>
            )}
          </div>
          <div className="space-y-2.5">
            <Row label="主题" value={draft.title} />
            <Row label="时间" value={meetingDisplay} />
            <div className="flex gap-3">
              <span className="text-[13px] text-gray-400 w-8 shrink-0">地区</span>
              <div>
                <p className="text-[13px] font-medium text-gray-900">{[draft.city, draft.district].filter(Boolean).join(' ')}</p>
                {draft.location && <p className="text-[12px] text-gray-400 mt-0.5">{draft.location}</p>}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-[13px] text-gray-400 w-8 shrink-0">费用</span>
              <span className="text-[12px] font-semibold px-3 py-0.5 rounded-full text-white bg-gray-900">{feeLabel}</span>
            </div>
          </div>
        </div>

        {/* 期待特质 */}
        {draft.expectedTraits.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">期待同行者特质</h3>
            <div className="flex flex-wrap gap-2">
              {draft.expectedTraits.map(t => (
                <span key={t} className="border border-gray-200 text-gray-700 text-[13px] px-4 py-1.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* About me placeholder */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-[15px] font-bold text-gray-900 mb-2">关于我</h3>
          <p className="text-[13px] text-gray-400 italic">（发布后展示你的个人介绍）</p>
        </div>

        {/* Interests placeholder */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-[15px] font-bold text-gray-900 mb-2">我的兴趣</h3>
          <p className="text-[13px] text-gray-400 italic">（发布后展示你的兴趣标签）</p>
        </div>

        {/* Photo album placeholder */}
        <div className="bg-white rounded-2xl p-4">
          <h3 className="text-[15px] font-bold text-gray-900 mb-3">兴趣相册</h3>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 text-2xl">🔒</div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-gray-100 px-4 py-3 z-20" style={{ maxWidth: 480 }}>
        <button
          onClick={handlePublish}
          disabled={submitting}
          className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl disabled:bg-gray-300"
        >
          {submitting ? '发布中...' : '去发布'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-[13px] text-gray-400 w-8 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-gray-900 flex-1">{value}</span>
    </div>
  );
}
