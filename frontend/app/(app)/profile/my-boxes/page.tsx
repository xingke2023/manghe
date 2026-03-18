'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMyBlindBoxes, type MyBlindBox } from '@/lib/api/me';
import { unpublishBlindBox } from '@/lib/api/blind-boxes';

export default function MyBoxesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [boxes, setBoxes] = useState<MyBlindBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuBox, setMenuBox] = useState<MyBlindBox | null>(null);
  const [confirmBox, setConfirmBox] = useState<MyBlindBox | null>(null);
  const [unpublishing, setUnpublishing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getMyBlindBoxes(token)
      .then(r => setBoxes(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleUnpublish(box: MyBlindBox) {
    if (!token || unpublishing) return;
    setUnpublishing(true);
    try {
      await unpublishBlindBox(box.id, token);
      showToast('已下架', true);
      setConfirmBox(null);
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '下架失败';
      showToast(msg, false);
    } finally {
      setUnpublishing(false);
    }
  }

  const statusLabel = (s: number) => {
    if (s === 1) return { text: '进行中', cls: 'bg-green-100 text-green-600' };
    if (s === 2) return { text: '已满员', cls: 'bg-blue-100 text-blue-600' };
    if (s === 3) return { text: '已下架', cls: 'bg-gray-100 text-gray-400' };
    return { text: '已过期', cls: 'bg-gray-100 text-gray-400' };
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">发盒记录</span>
        <div className="w-8" />
      </div>

      <div className="px-3 py-3 flex flex-col gap-3">
        {loading ? (
          <BoxSkeleton />
        ) : boxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-[14px]">还没有发布过盲盒</p>
            <button
              onClick={() => router.push('/publish')}
              className="mt-6 bg-gray-900 text-white text-[14px] font-semibold px-8 py-3 rounded-2xl"
            >
              去发布
            </button>
          </div>
        ) : (
          boxes.map(box => {
            const st = statusLabel(box.status);
            return (
              <div key={box.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Status row */}
                <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${st.cls}`}>{st.text}</span>
                  <button
                    onClick={() => setMenuBox(box)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 active:text-gray-600"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>
                </div>

                {/* Card body */}
                <button
                  onClick={() => router.push(`/blind-box/${box.id}`)}
                  className="flex gap-3 px-3 py-3 w-full text-left"
                >
                  {box.cover_image ? (
                    <img src={box.cover_image} alt="" className="w-28 h-20 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-28 h-20 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center text-3xl shrink-0">🎁</div>
                  )}
                  <div className="flex-1 flex flex-col gap-1.5 py-0.5 text-[12px] text-gray-500">
                    <p className="text-[14px] font-semibold text-gray-900 leading-snug line-clamp-2">{box.title}</p>
                    {box.meeting_time && (
                      <div className="flex items-center gap-1.5">
                        <span>🕐</span>
                        <span>时间：{box.meeting_time}</span>
                      </div>
                    )}
                    {(box.city || box.district) && (
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>地区：{[box.city, box.district].filter(Boolean).join(' ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="text-[11px] bg-gray-900 text-white px-2 py-0.5 rounded-full">{box.fee_label}</span>
                      <span className="text-gray-400">{box.view_count} 人看过</span>
                      {box.apply_count > 0 && (
                        <span className="text-[#E8373F] font-medium">{box.apply_count} 人报名</span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Action Sheet ─── */}
      {menuBox && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setMenuBox(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-t-3xl w-full pb-8"
            style={{ maxWidth: 480 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 mb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{menuBox.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{statusLabel(menuBox.status).text}</p>
            </div>

            {/* Actions */}
            <button
              onClick={() => { setMenuBox(null); router.push(`/blind-box/${menuBox.id}`); }}
              className="flex items-center gap-3 w-full px-5 py-4 text-left active:bg-gray-50"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="text-[15px] text-gray-900">查看盲盒详情</span>
            </button>

            {menuBox.status === 1 && (
              <button
                onClick={() => { setMenuBox(null); setConfirmBox(menuBox); }}
                className="flex items-center gap-3 w-full px-5 py-4 text-left active:bg-gray-50"
              >
                <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8373F" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] text-[#E8373F]">下架盲盒</p>
                  <p className="text-[12px] text-gray-400">已锁定报名者的盲盒无法下架</p>
                </div>
              </button>
            )}

            <button
              onClick={() => setMenuBox(null)}
              className="mx-4 mt-2 w-[calc(100%-2rem)] bg-gray-100 text-gray-600 font-semibold py-3.5 rounded-2xl text-[15px]"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* ─── Confirm Unpublish Dialog ─── */}
      {confirmBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" onClick={() => setConfirmBox(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-xs overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="text-4xl mb-3">📤</div>
              <h3 className="text-[16px] font-bold text-gray-900 mb-2">确认下架？</h3>
              <p className="text-[13px] text-gray-500">下架后盲盒将不再对外展示，无法撤销。</p>
            </div>
            <div className="border-t border-gray-100 flex">
              <button
                onClick={() => setConfirmBox(null)}
                className="flex-1 py-3.5 text-[15px] text-gray-500 border-r border-gray-100"
              >
                取消
              </button>
              <button
                onClick={() => handleUnpublish(confirmBox)}
                disabled={unpublishing}
                className="flex-1 py-3.5 text-[15px] text-[#E8373F] font-semibold disabled:text-gray-300"
              >
                {unpublishing ? '下架中...' : '确认下架'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-white text-[14px] font-medium shadow-lg z-50 ${toast.ok ? 'bg-green-500' : 'bg-[#E8373F]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function BoxSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl p-3 animate-pulse">
          <div className="flex gap-3">
            <div className="w-28 h-20 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
