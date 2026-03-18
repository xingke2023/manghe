'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/api/me';

const CITIES = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '西安', '南京', '重庆', '苏州', '天津', '长沙', '郑州', '东莞', '青岛', '沈阳', '宁波', '昆明', '厦门'];

export default function RegisterBasicPage() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState<1 | 2 | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          <div className="w-24 h-24 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden mb-2 shadow-sm">
            <div className="flex flex-col items-center text-gray-300">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>
          <span className="text-[12px] text-gray-400">上传头像</span>
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
