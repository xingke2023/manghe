'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get('id');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100">
        <div className="w-8" />
        <span className="text-[15px] font-semibold">发布成功</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full bg-[#FFF5F0] flex items-center justify-center text-7xl shadow-inner border-4 border-[#FFE0D8]">
            🎁
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#E8373F] rounded-full flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">约会盲盒发布成功！</h1>
        <p className="text-[14px] text-gray-500 leading-relaxed">
          你可以等待别人来拆盒，<br />也可以继续看看其他盲盒～
        </p>

        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {['🎉','✨','🎊','🎈','✨','🎉'].map((e, i) => (
            <span key={i} className="absolute text-xl" style={{
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 12}%`,
              animation: `bounce ${1 + i * 0.15}s ease-in-out infinite alternate`,
            }}>{e}</span>
          ))}
        </div>
      </div>

      <div className="px-5 pb-8 flex flex-col gap-3">
        {id && (
          <button
            onClick={() => router.push(`/blind-box/${id}`)}
            className="w-full border-2 border-gray-900 text-gray-900 font-semibold text-[15px] py-3.5 rounded-2xl"
          >
            查看我的盲盒
          </button>
        )}
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl"
        >
          继续看看
        </button>
      </div>
    </div>
  );
}

export default function PublishSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
