'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/api/me';

const PRESET_INTERESTS = [
  { emoji: '🎸', label: '热衷乐器' },
  { emoji: '⛺', label: '野餐露营' },
  { emoji: '🏋️', label: '撸铁' },
  { emoji: '🎭', label: '话剧脱口秀' },
  { emoji: '🧋', label: '甜度满载奶茶' },
  { emoji: '🪁', label: '放风筝' },
  { emoji: '🏊', label: '健身游泳' },
  { emoji: '📷', label: '拍美照' },
  { emoji: '🚵', label: '挑战极限运动' },
  { emoji: '🎮', label: '电竞游戏' },
  { emoji: '🍳', label: '下厨做饭' },
  { emoji: '🎵', label: '音乐达人' },
];

export default function RegisterInterestsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [aboutMe, setAboutMe] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleInterest(label: string) {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
    );
  }

  function addCustomTag() {
    const tag = customTagInput.trim();
    if (tag && !selectedInterests.includes(tag)) {
      setSelectedInterests(prev => [...prev, tag]);
    }
    setCustomTagInput('');
    setShowTagInput(false);
  }

  async function handleNext() {
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      await updateProfile({
        about_me: aboutMe.trim() || undefined,
        interests: selectedInterests,
      }, token);
      router.push('/register/success');
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
          <div className="h-1 rounded-full bg-[#E8373F] w-full" />
        </div>
        <button onClick={() => router.back()} className="mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className="flex-1 bg-[#F5F5F5] px-4 pt-4 pb-28 flex flex-col gap-5">
        {/* About me */}
        <section className="bg-white rounded-2xl p-4">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-3">关于我</h3>
          <div className="relative">
            <textarea
              value={aboutMe}
              onChange={e => setAboutMe(e.target.value.slice(0, 80))}
              placeholder={'关于你的性格、爱好等\n例：ISTP细节控，喜欢攀岩和独立电影，周末常在美术馆发呆。'}
              rows={4}
              className="w-full text-[14px] text-gray-800 placeholder-gray-300 outline-none resize-none leading-relaxed"
            />
            <span className="absolute bottom-0 right-0 text-[12px] text-gray-300">{aboutMe.length}/80</span>
          </div>
        </section>

        {/* Interests */}
        <section className="bg-white rounded-2xl p-4">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-3">兴趣爱好</h3>
          <div className="flex flex-wrap gap-2">
            {PRESET_INTERESTS.map(({ emoji, label }) => {
              const selected = selectedInterests.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => toggleInterest(label)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-[13px] font-medium transition-colors ${selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                  {selected && <span className="text-[10px] opacity-70">✕</span>}
                </button>
              );
            })}
            {/* Custom tags */}
            {selectedInterests
              .filter(t => !PRESET_INTERESTS.map(p => p.label).includes(t))
              .map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-900 bg-gray-900 text-white text-[13px] font-medium"
                >
                  <span>{tag}</span>
                  <span className="text-[10px] opacity-70">✕</span>
                </button>
              ))}
            {/* Add tag button */}
            {showTagInput ? (
              <div className="flex items-center gap-1 border border-dashed border-gray-400 rounded-full px-3 py-1.5">
                <input
                  autoFocus
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                  onBlur={() => { if (!customTagInput.trim()) setShowTagInput(false); }}
                  placeholder="输入标签"
                  maxLength={10}
                  className="text-[13px] outline-none w-20 bg-transparent"
                />
                <button onClick={addCustomTag} className="text-[#E8373F] text-[13px] font-semibold">确认</button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="flex items-center gap-1 border border-dashed border-gray-300 rounded-full px-3 py-2 text-[13px] text-gray-400"
              >
                <span>+</span>
                <span>新增标签</span>
              </button>
            )}
          </div>
        </section>

        {/* Life photos */}
        <section className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-gray-900">生活照片</h3>
            <span className="text-[12px] text-gray-400">只有在约会时，且您同意后才会公开</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {photos.map((_, i) => (
              <div key={i} className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden relative">
                <button
                  onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 text-[28px]">
                +
              </div>
            )}
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
