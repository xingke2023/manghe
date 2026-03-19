'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/api/me';

const CITIES = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '西安', '南京', '重庆', '苏州', '天津', '长沙', '郑州', '东莞', '青岛', '沈阳', '宁波', '昆明', '厦门'];

// 生成 DiceBear open-peeps 头像 URL
function dicebearUrl(seed: string | number) {
  return `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=ffd6c8,fce4d6,fff0e8,e8f4ff,d6f0e8,f0e8ff`;
}

// 预生成 24 个可选 seed
function buildSeeds(userId: number) {
  const offsets = [0, 7, 13, 21, 37, 42, 55, 68, 74, 81, 99, 103, 117, 128, 136, 145, 157, 163, 172, 189, 204, 213, 227, 238];
  return offsets.map(o => userId + o);
}

export default function RegisterBasicPage() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<1 | 2 | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const seeds = useMemo(() => (user?.id ? buildSeeds(user.id) : []), [user?.id]);
  const currentSeed = selectedSeed ?? user?.id ?? 0;
  const avatarUrl = currentSeed ? dicebearUrl(currentSeed) : null;

  async function handleNext() {
    if (!nickname.trim()) { setError('请填写昵称'); return; }
    if (!gender) { setError('请选择性别'); return; }
    if (!token) return;
    setError('');
    setLoading(true);
    try {
      await updateProfile({
        nickname: nickname.trim(),
        birth_date: birthDate || undefined,
        height: height ? parseInt(height) : undefined,
        city: city || undefined,
        gender,
        // 将选中的头像 URL 保存到 avatar_url
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      }, token);
      router.push('/register/preferences');
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Pink header */}
      <div className="px-5 pt-12 pb-6" style={{ background: 'linear-gradient(180deg, #FFD6D0 0%, #FFF5F3 100%)' }}>
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8">
          <div className="h-1 rounded-full bg-[#E8373F]" style={{ width: '33%' }} />
          <div className="h-1 rounded-full bg-gray-200 flex-1" />
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-black text-gray-900 leading-tight">开启约会盲盒之旅！</h1>
            <p className="text-[13px] text-gray-400 mt-1">找圈子，让每个周末都好玩～</p>
          </div>
          <div className="text-[60px] leading-none select-none -mt-2">😈</div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 bg-[#F5F5F5] px-4 pt-4 pb-24">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="relative w-24 h-24 rounded-full border-2 border-white overflow-hidden shadow-md active:scale-95 transition-transform mb-2 bg-gray-100"
          >
            {avatarUrl && (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            )}
            {/* Edit overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-1.5">
              <span className="text-white text-[10px] font-semibold bg-black/40 px-2 py-0.5 rounded-full">换一换</span>
            </div>
          </button>
          <span className="text-[12px] text-gray-400">点击头像可以换风格</span>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <FieldRow label="昵称">
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="请输入昵称"
              maxLength={20}
              className="flex-1 text-[15px] text-gray-900 outline-none bg-transparent"
            />
          </FieldRow>

          <FieldRow label="年龄">
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="flex-1 text-[15px] text-gray-900 outline-none bg-transparent"
              max={new Date().toISOString().slice(0, 10)}
            />
          </FieldRow>

          <FieldRow label="身高">
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="cm"
              min={140}
              max={220}
              className="flex-1 text-[15px] text-gray-900 outline-none bg-transparent"
            />
          </FieldRow>

          <FieldRow label="常驻地" onClick={() => setShowCityPicker(true)} hasArrow>
            <span className={`flex-1 text-[15px] ${city ? 'text-gray-900' : 'text-gray-300'}`}>
              {city || '请选择城市'}
            </span>
          </FieldRow>

          {/* Gender */}
          <div className="bg-white rounded-2xl px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-[15px] text-gray-500 w-12 shrink-0">性别</span>
              <div className="flex gap-3 flex-1">
                <button
                  onClick={() => setGender(1)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-[15px] font-medium transition-colors ${gender === 1 ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600'}`}
                >
                  <span className="text-blue-500">♂</span> 男
                </button>
                <button
                  onClick={() => setGender(2)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-[15px] font-medium transition-colors ${gender === 2 ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600'}`}
                >
                  <span className="text-[#E8373F]">♀</span> 女
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-[13px] text-[#E8373F] text-center mt-3">{error}</p>}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-8 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold text-[17px] py-4 rounded-2xl disabled:bg-gray-300 transition-colors active:scale-[0.98]"
        >
          {loading ? '保存中...' : '下一步'}
        </button>
      </div>

      {/* Avatar Picker Sheet */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAvatarPicker(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-t-3xl w-full max-w-[480px] pb-8 flex flex-col"
            style={{ maxHeight: '72vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 mb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-5 py-3 border-b border-gray-100 shrink-0">
              <p className="text-[16px] font-bold text-gray-900">选择头像风格</p>
              <p className="text-[12px] text-gray-400 mt-0.5">24 种卡通形象，选一个最像你的</p>
            </div>

            {/* Preview current selected */}
            <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E8373F] shadow-md shrink-0">
                <img src={dicebearUrl(currentSeed)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900">当前选择</p>
                <p className="text-[11px] text-gray-400 mt-0.5">点击下方网格切换</p>
              </div>
              <button
                onClick={() => setSelectedSeed(Math.floor(Math.random() * 100000))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 text-[12px] text-gray-600 active:bg-gray-100"
              >
                🎲 随机
              </button>
            </div>

            {/* Grid */}
            <div className="overflow-y-auto flex-1 px-4 py-3">
              <div className="grid grid-cols-4 gap-3">
                {seeds.map(seed => {
                  const isSelected = seed === currentSeed;
                  return (
                    <button
                      key={seed}
                      onClick={() => setSelectedSeed(seed)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all active:scale-95 ${isSelected ? 'border-[#E8373F] shadow-md scale-105' : 'border-transparent'}`}
                    >
                      <img
                        src={dicebearUrl(seed)}
                        alt=""
                        className="w-full h-full object-cover bg-gray-100"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#E8373F] rounded-full flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm button */}
            <div className="px-5 pt-2 shrink-0">
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="w-full bg-gray-900 text-white font-bold text-[16px] py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
              >
                确定使用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* City Picker */}
      {showCityPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowCityPicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl w-full max-w-[480px] pb-8 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 mb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <p className="text-[15px] font-semibold text-gray-900 text-center py-3 border-b border-gray-100">选择城市</p>
            <div className="overflow-y-auto flex-1">
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => { setCity(c); setShowCityPicker(false); }}
                  className={`w-full px-6 py-3.5 text-left text-[15px] border-b border-gray-50 ${city === c ? 'text-[#E8373F] font-semibold' : 'text-gray-700'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, children, onClick, hasArrow }: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  hasArrow?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl px-4 py-3 flex items-center gap-4 ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <span className="text-[15px] text-gray-500 w-12 shrink-0">{label}</span>
      {children}
      {hasArrow && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </div>
  );
}
