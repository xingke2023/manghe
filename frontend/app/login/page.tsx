'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const TEST_USERS = [
  { id: 1, nickname: '小熊饼干' },
  { id: 2, nickname: '金鑫鑫鑫' },
  { id: 3, nickname: '海边的毛毛' },
  { id: 4, nickname: '独行侠' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!agreed) { setError('请先阅读并同意用户协议'); return; }
    if (!phone.trim()) return;
    setError('');
    setLoading(true);
    try {
      await login({ phone: phone.trim() });
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  async function loginAsTestUser(userId: number) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dev/login-as`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '登录失败');
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #FFD6D0 0%, #FFF0EC 50%, #FFFFFF 100%)',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* Brand header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-4">
        <h1 className="text-[36px] font-black text-gray-900 tracking-tight mb-2">约会盲盒</h1>
        <p className="text-[14px] text-gray-400 mb-10">走，好玩的体验正式开始～</p>

        {/* Mascot */}
        <div className="text-[120px] leading-none select-none mb-6" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))' }}>
          😈
        </div>
      </div>

      {/* Bottom section */}
      <div className="px-5 pb-10 flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 text-red-500 text-[13px] px-4 py-2.5 rounded-xl text-center">{error}</div>
        )}

        {showPhoneInput ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="请输入手机号"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] outline-none focus:border-gray-400"
            />
            <button
              onClick={handleLogin}
              disabled={!phone.trim() || loading}
              className="w-full bg-gray-900 text-white font-bold text-[16px] py-4 rounded-2xl disabled:bg-gray-300 transition-colors active:scale-[0.98]"
            >
              {loading ? '登录中...' : '确认登录'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { if (!agreed) { setError('请先阅读并同意用户协议'); return; } setShowPhoneInput(true); setError(''); }}
            className="w-full bg-gray-900 text-white font-bold text-[17px] py-4 rounded-2xl active:scale-[0.98] transition-transform"
          >
            一键登录
          </button>
        )}

        {/* Agreement */}
        <button
          onClick={() => { setAgreed(!agreed); setError(''); }}
          className="flex items-center gap-2 mx-auto"
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${agreed ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`}>
            {agreed && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-[12px] text-gray-500">
            已阅读并同意
            <span className="text-[#E8373F]">《用户协议》</span>
            <span className="text-[#E8373F]">《隐私政策》</span>
          </span>
        </button>

        {/* Dev test */}
        <div className="mt-1 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-300 mb-2 text-center">开发测试快捷登录</p>
          <div className="grid grid-cols-4 gap-2">
            {TEST_USERS.map(u => (
              <button
                key={u.id}
                onClick={() => loginAsTestUser(u.id)}
                disabled={loading}
                className="border border-gray-200 rounded-xl py-2 text-[11px] text-gray-500 active:bg-gray-50 disabled:opacity-40"
              >
                {u.nickname}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
