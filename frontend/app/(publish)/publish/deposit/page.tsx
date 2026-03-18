'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { payDeposit } from '@/lib/api/publish';

const RULES = [
  { title: '缴纳保证金如何让约会顺畅', desc: '将要缴纳首次约会保证金，确保约会顺利进行，体现对约会的认真态度。' },
  { title: '约会完成后自动退还', desc: '完成约会后保证金将会退回到您的账号中，无需担心损失。' },
  { title: '失约则扣除相应费用', desc: '若您确认赴约后临时爽约，保证金将被部分扣除以补偿对方。' },
];

export default function DepositPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    if (!agreed || loading || !token) return;
    setLoading(true);
    try {
      await payDeposit(token);
      router.push('/publish/create');
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">交保证金</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-3">
        {/* Main card - notebook style */}
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Notebook holes */}
          <div className="flex justify-around py-2 bg-gray-50 border-b border-gray-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-300" />
            ))}
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-gray-900">✨ 交保证金</h2>
            </div>

            <div className="bg-[#FFF5F0] rounded-xl p-4 relative overflow-hidden">
              <div className="space-y-3 pr-16">
                <div className="flex gap-2">
                  <span className="text-[11px] bg-gray-900 text-white px-1.5 py-0.5 rounded font-bold shrink-0">01</span>
                  <p className="text-[13px] text-gray-700 leading-relaxed">将要缴纳首次约会保证金，确保首次约会顺利进行，对这次约会的认真态度。</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[11px] bg-gray-900 text-white px-1.5 py-0.5 rounded font-bold shrink-0">02</span>
                  <p className="text-[13px] text-gray-700 leading-relaxed">完成约会后将会退回到您的账号中。</p>
                </div>
              </div>
              <div className="absolute right-2 bottom-0 text-5xl opacity-60">😈</div>
            </div>
          </div>
        </div>

        {/* Rules list */}
        <div className="bg-white rounded-2xl p-5 space-y-4">
          {RULES.map((rule, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF0E8] flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8373F" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{rule.title}</p>
                <p className="text-[12px] text-gray-500 mt-0.5">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="px-5 pb-8 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={handlePay}
          disabled={!agreed || loading}
          className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl disabled:bg-gray-300 disabled:text-gray-400 transition-colors mb-3"
        >
          {loading ? '处理中...' : '缴纳保证金 ¥50'}
        </button>
        <label className="flex items-center justify-center gap-2 cursor-pointer">
          <button
            onClick={() => setAgreed(a => !a)}
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${agreed ? 'border-[#E8373F] bg-[#E8373F]' : 'border-gray-400'}`}
          >
            {agreed && <div className="w-2 h-2 bg-white rounded-full" />}
          </button>
          <span className="text-[12px] text-gray-500">已阅读并同意
            <span className="text-[#E8373F]">《保证金协议》</span>
          </span>
        </label>
      </div>
    </div>
  );
}
