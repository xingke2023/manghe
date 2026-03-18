'use client';

import { useRouter } from 'next/navigation';

export default function RegisterSuccessPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between"
      style={{
        maxWidth: 480,
        margin: '0 auto',
        background: 'linear-gradient(180deg, #FFD6D0 0%, #FFF0EC 40%, #F5F5F5 100%)',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-[28px] font-black text-gray-900 mb-2">约会盲盒，开盒遇知己</h1>
        <p className="text-[14px] text-gray-400 mb-12">解锁休闲活动，打卡潮酷体验，邂逅志同道合的朋友！</p>

        {/* Mascot */}
        <div className="text-[120px] leading-none select-none mb-4" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.10))' }}>
          🛵
        </div>

        {/* Success badge */}
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[14px] font-semibold text-gray-700">资料填写完成！</span>
        </div>
      </div>

      <div className="w-full px-5 pb-12">
        <button
          onClick={() => router.replace('/')}
          className="w-full bg-gray-900 text-white font-bold text-[17px] py-4 rounded-2xl active:scale-[0.98] transition-transform"
        >
          立即体验
        </button>
      </div>
    </div>
  );
}
