'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/api/me';

const DATING_PURPOSES = ['找兴趣搭子', '脱单', 'Dating', '婚恋'];
const PERSONAL_ATTRS = ['无偏好', 'LGBTQ+'];

export default function RegisterPreferencesPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [purposes, setPurposes] = useState<string[]>([]);
  const [targetGender, setTargetGender] = useState<number | null>(null); // 1=男 2=女 0=不限
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(36);
  const [personalAttr, setPersonalAttr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function togglePurpose(p: string) {
    setPurposes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function handleNext() {
    if (purposes.length === 0) { setError('请选择至少一个约会目的'); return; }
    if (targetGender === null) { setError('请选择对象属性'); return; }
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      await updateProfile({
        dating_purposes: purposes,
        target_gender: targetGender,
        target_age_min: ageMin,
        target_age_max: ageMax,
      }, token);
      router.push('/register/interests');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-6">
          <div className="h-1 rounded-full bg-[#E8373F]" style={{ width: '66%' }} />
          <div className="h-1 rounded-full bg-gray-200 flex-1" />
        </div>
        <button onClick={() => router.back()} className="mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 bg-[#F5F5F5] px-4 pt-4 pb-28 flex flex-col gap-5">
        {/* Warning */}
        <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2.5">
          <span className="text-[15px]">⚠️</span>
          <span className="text-[12px] text-orange-600">以下信息只用于算法配对，不会公开展示～</span>
        </div>

        {/* Dating purposes */}
        <section className="bg-white rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-[15px] font-semibold text-gray-900">约会目的（可多选）</h3>
            <span className="text-[#E8373F] text-[15px]">*</span>
          </div>
          <p className="text-[12px] text-gray-400 mb-3">*若选"婚恋"，需额外完成学历/资产认证</p>
          <div className="flex flex-wrap gap-2">
            {DATING_PURPOSES.map(p => (
              <button
                key={p}
                onClick={() => togglePurpose(p)}
                className={`px-4 py-2 rounded-full border-2 text-[14px] font-medium transition-colors ${purposes.includes(p) ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Target gender */}
        <section className="bg-white rounded-2xl p-4">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-3">对象属性</h3>
          <div className="flex gap-2">
            {[{ val: 1, label: '男', icon: '♂', iconCls: 'text-blue-500' }, { val: 2, label: '女', icon: '♀', iconCls: 'text-[#E8373F]' }, { val: 0, label: '不限', icon: '😊', iconCls: '' }].map(opt => (
              <button
                key={opt.val}
                onClick={() => setTargetGender(opt.val)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-[14px] font-medium transition-colors ${targetGender === opt.val ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'}`}
              >
                <span className={targetGender === opt.val ? 'text-white' : opt.iconCls}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Age range */}
        <section className="bg-white rounded-2xl p-4">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-4">年龄偏好</h3>
          <div className="flex justify-between text-[16px] font-bold text-gray-900 mb-3">
            <span>{ageMin}</span>
            <span>{ageMax}</span>
          </div>
          <div className="relative h-6 flex items-center">
            <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full" />
            <div
              className="absolute h-1 bg-gray-900 rounded-full"
              style={{
                left: `${((ageMin - 18) / (50 - 18)) * 100}%`,
                right: `${100 - ((ageMax - 18) / (50 - 18)) * 100}%`,
              }}
            />
            <input
              type="range" min={18} max={50} value={ageMin}
              onChange={e => { const v = parseInt(e.target.value); if (v < ageMax) setAgeMin(v); }}
              className="absolute w-full appearance-none bg-transparent pointer-events-auto"
              style={{ zIndex: ageMin > ageMax - 2 ? 5 : 3 }}
            />
            <input
              type="range" min={18} max={50} value={ageMax}
              onChange={e => { const v = parseInt(e.target.value); if (v > ageMin) setAgeMax(v); }}
              className="absolute w-full appearance-none bg-transparent"
              style={{ zIndex: 4 }}
            />
          </div>
        </section>

        {/* Personal attribute */}
        <section className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-gray-900">个人属性</h3>
            <span className="text-[12px] text-gray-400">此信息仅用于匹配，默认不公开</span>
          </div>
          <div className="flex gap-2">
            {PERSONAL_ATTRS.map(a => (
              <button
                key={a}
                onClick={() => setPersonalAttr(personalAttr === a ? null : a)}
                className={`px-4 py-2 rounded-full border-2 text-[14px] font-medium transition-colors ${personalAttr === a ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="text-[13px] text-[#E8373F] text-center">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-8 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold text-[17px] py-4 rounded-2xl disabled:bg-gray-300 transition-colors active:scale-[0.98]"
        >
          {loading ? '保存中...' : '下一步'}
        </button>
      </div>
    </div>
  );
}
