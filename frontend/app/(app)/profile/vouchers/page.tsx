'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMyVouchers } from '@/lib/api/me';

export default function VouchersPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getMyVouchers(token)
      .then(r => setAvailable(r.available))
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
        <span className="text-[15px] font-semibold">发盒凭证</span>
        <div className="w-8" />
      </div>

      <div className="flex flex-col items-center py-16 px-8">
        <div
          className="w-full max-w-xs rounded-3xl p-8 text-center text-white shadow-lg mb-6"
          style={{ background: 'linear-gradient(135deg, #E8373F 0%, #FF6B6B 100%)' }}
        >
          <div className="text-6xl font-bold mb-2">{loading ? '—' : available}</div>
          <div className="text-[15px] opacity-90">张可用凭证</div>
          <div className="mt-4 text-[12px] opacity-70">每张凭证可发布一个约会盲盒</div>
        </div>

        <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-3">使用说明</h3>
          <ul className="space-y-2">
            {[
              '通过价值观测试后，即可使用凭证发布盲盒',
              '每次发布消耗 1 张凭证',
              '凭证由平台发放，不可购买',
              '凭证有效期为发放后 180 天',
            ].map((tip, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-gray-500">
                <span className="text-[#E8373F] shrink-0">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {available === 0 && (
          <p className="mt-6 text-[13px] text-gray-400 text-center">暂无可用凭证，请联系客服获取</p>
        )}
      </div>
    </div>
  );
}
