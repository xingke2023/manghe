'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status'); // 'pass' | 'pending'
  const passed = status === 'pass';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100">
        <button onClick={() => router.push('/')} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">{passed ? '审核成功' : '审核中'}</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {passed ? (
          <>
            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-6xl border-4 border-gray-900 shadow-lg">
                😈
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
            </div>
            {/* Confetti */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {['🎊','🎉','✨','🎈','🎊','✨'].map((e, i) => (
                <div key={i} className="absolute text-2xl animate-bounce" style={{
                  left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 10}%`,
                  animationDelay: `${i * 0.2}s`, animationDuration: '1.5s'
                }}>{e}</div>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">恭喜你通过测试</h1>
            <p className="text-[14px] text-gray-500">现在开始发第一个约会盲盒吧！</p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-5xl mb-6">
              ⏳
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">审核中</h1>
            <p className="text-[14px] text-gray-500 mb-4">我们将在24小时内完成审核，请耐心等待</p>
            <div className="bg-[#FFF5F0] rounded-xl p-4 text-left w-full">
              <p className="text-[13px] text-gray-600 leading-relaxed">
                <strong className="text-gray-900">温馨提示：</strong>审核期间你仍可正常浏览盲盒广场。如有疑问请联系小恶魔客服。
              </p>
            </div>
          </>
        )}
      </div>

      <div className="px-5 pb-8">
        <button
          onClick={() => passed ? router.push('/publish/deposit') : router.push('/')}
          className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl"
        >
          {passed ? '去发布' : '先去看看'}
        </button>
      </div>
    </div>
  );
}

export default function ValueTestResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
