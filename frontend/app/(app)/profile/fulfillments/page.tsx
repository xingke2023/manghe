'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  getFulfillments,
  submitCheckin,
  generateMeetingCode,
  verifyMeetingCode,
  submitAppeal,
  type Fulfillment,
} from '@/lib/api/fulfillment';

export default function FulfillmentsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal states
  const [checkinBox, setCheckinBox] = useState<Fulfillment | null>(null);
  const [qrBox, setQrBox] = useState<Fulfillment | null>(null);
  const [scanBox, setScanBox] = useState<Fulfillment | null>(null);
  const [appealBox, setAppealBox] = useState<Fulfillment | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    getFulfillments(token)
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleCheckin(item: Fulfillment) {
    if (!token || actionLoading) return;
    setActionLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const result = await submitCheckin(
        item.box_id,
        pos.coords.latitude,
        pos.coords.longitude,
        token
      );
      showToast(result.message, result.is_valid);
      if (result.is_valid) {
        setCheckinBox(null);
        load();
      }
    } catch {
      showToast('获取位置失败，请开启定位权限', false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerateQr(item: Fulfillment) {
    if (!token || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await generateMeetingCode(item.box_id, token);
      setQrCode(res.qr_code);
      setQrBox(item);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '生成失败，请先完成打卡';
      showToast(msg, false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleScan(item: Fulfillment) {
    if (!token || actionLoading || !scanInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await verifyMeetingCode(item.box_id, scanInput.trim().toUpperCase(), token);
      showToast(res.message, res.is_valid);
      if (res.is_valid) {
        setScanBox(null);
        setScanInput('');
        load();
      }
    } catch {
      showToast('核销失败', false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAppeal(item: Fulfillment) {
    if (!token || actionLoading || appealReason.trim().length < 10) return;
    setActionLoading(true);
    try {
      const res = await submitAppeal(item.box_id, appealReason.trim(), token);
      showToast(res.message, true);
      setAppealBox(null);
      setAppealReason('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '提交失败';
      showToast(msg, false);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">我的赴约</span>
        <div className="w-8" />
      </div>

      <div className="px-3 py-3 flex flex-col gap-3">
        {loading ? (
          <FulfillSkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <p className="text-[14px] mb-1">暂无赴约记录</p>
            <p className="text-[12px]">先去拆个盲盒，约定赴约吧～</p>
            <button onClick={() => router.push('/')} className="mt-8 bg-gray-900 text-white text-[14px] font-semibold px-8 py-3 rounded-2xl">
              去拆盲盒
            </button>
          </div>
        ) : (
          items.map(item => (
            <FulfillCard
              key={item.application_id}
              item={item}
              actionLoading={actionLoading}
              onCheckin={() => setCheckinBox(item)}
              onGenerateQr={() => handleGenerateQr(item)}
              onScan={() => setScanBox(item)}
              onAppeal={() => setAppealBox(item)}
            />
          ))
        )}
      </div>

      {/* ─── GPS Checkin Modal ─── */}
      {checkinBox && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">GPS 打卡</h3>
            <p className="text-[13px] text-gray-500 mb-1">请到达约定地点后打卡</p>
            <p className="text-[12px] text-gray-400 mb-6">需在约会地点 300 米范围内</p>
            <div className="flex gap-3">
              <button
                onClick={() => setCheckinBox(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl text-[14px]"
              >
                取消
              </button>
              <button
                onClick={() => handleCheckin(checkinBox)}
                disabled={actionLoading}
                className="flex-[2] bg-gray-900 text-white font-semibold py-3.5 rounded-2xl text-[15px] disabled:bg-gray-300"
              >
                {actionLoading ? '定位中...' : '立即打卡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── QR Code Modal ─── */}
      {qrBox && qrCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-8">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 text-center">
            <p className="text-[13px] text-gray-500 mb-3">展示给发盒者扫描</p>
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6 mb-4">
              <div className="w-36 h-36 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center mb-3">
                <div className="grid grid-cols-4 gap-0.5 p-2">
                  {Array.from(qrCode).map((c, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{ background: c.charCodeAt(0) % 2 === 0 ? '#111' : '#ddd' }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[18px] font-bold tracking-[0.2em] text-gray-900">{qrCode}</p>
            </div>
            <button
              onClick={() => { setQrBox(null); setQrCode(null); }}
              className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-2xl text-[15px]"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* ─── Scan Input Modal (creator) ─── */}
      {scanBox && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-gray-900 mb-2">扫码核销</h3>
            <p className="text-[13px] text-gray-500 mb-4">输入拆盒者展示的见面码</p>
            <input
              value={scanInput}
              onChange={e => setScanInput(e.target.value.toUpperCase())}
              placeholder="请输入 12 位见面码"
              maxLength={12}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] font-mono tracking-widest text-center outline-none focus:border-gray-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setScanBox(null); setScanInput(''); }}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl text-[14px]"
              >
                取消
              </button>
              <button
                onClick={() => handleScan(scanBox)}
                disabled={scanInput.length < 6 || actionLoading}
                className="flex-[2] bg-gray-900 text-white font-semibold py-3.5 rounded-2xl text-[15px] disabled:bg-gray-300"
              >
                {actionLoading ? '核销中...' : '确认核销'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Appeal Modal ─── */}
      {appealBox && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6">
            <h3 className="text-[17px] font-bold text-gray-900 mb-1">提交申诉</h3>
            <p className="text-[13px] text-gray-400 mb-4">已打卡但对方未完成核销？说明情况</p>
            <textarea
              value={appealReason}
              onChange={e => setAppealReason(e.target.value)}
              placeholder="请详细描述情况，至少 10 个字..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-gray-400 resize-none mb-1"
            />
            <p className="text-[12px] text-gray-400 text-right mb-4">{appealReason.length}/500</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setAppealBox(null); setAppealReason(''); }}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl text-[14px]"
              >
                取消
              </button>
              <button
                onClick={() => handleAppeal(appealBox)}
                disabled={appealReason.trim().length < 10 || actionLoading}
                className="flex-[2] bg-[#E8373F] text-white font-semibold py-3.5 rounded-2xl text-[15px] disabled:bg-gray-300"
              >
                {actionLoading ? '提交中...' : '提交申诉'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-white text-[14px] font-medium shadow-lg z-50 transition-all ${toast.ok ? 'bg-green-500' : 'bg-[#E8373F]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Fulfillment Card ─────────────────────────────────────────────────────────

function FulfillCard({
  item,
  actionLoading,
  onCheckin,
  onGenerateQr,
  onScan,
  onAppeal,
}: {
  item: Fulfillment;
  actionLoading: boolean;
  onCheckin: () => void;
  onGenerateQr: () => void;
  onScan: () => void;
  onAppeal: () => void;
}) {
  const isSettled = item.fulfill_status > 0;
  const roleLabel = item.role === 'creator' ? '我发布的' : '我参与的';
  const roleLabelCls = item.role === 'creator'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-green-100 text-green-600';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Top: role tag + result badge */}
      <div className="px-3 pt-2.5 flex items-center justify-between">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${roleLabelCls}`}>
          {roleLabel}
        </span>
        {isSettled && <ResultBadge status={item.fulfill_status} />}
      </div>

      {/* Card body */}
      <div className="flex items-center gap-3 px-3 py-3">
        {item.cover_image ? (
          <img src={item.cover_image} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-20 h-16 rounded-xl bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center text-2xl shrink-0">🎁</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-gray-900 truncate mb-1">{item.title}</p>
          {item.meeting_time && (
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-0.5">
              <span>🕐</span>
              <span>约会时间：{item.meeting_time}</span>
            </div>
          )}
          {(item.city || item.district || item.location) && (
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
              <span>📍</span>
              <span className="truncate">
                {[item.city, item.district, item.location].filter(Boolean).join(' ')}
              </span>
            </div>
          )}
        </div>

        {/* Action area */}
        <div className="shrink-0 ml-1">
          {isSettled ? (
            // Settled — show result action
            item.fulfill_status === 3 && item.has_checked_in ? (
              // 对方失约且我已打卡 → 申诉按钮
              <button
                onClick={onAppeal}
                className="text-[12px] text-[#E8373F] font-semibold border border-[#E8373F] px-3 py-1.5 rounded-full"
              >
                申诉
              </button>
            ) : null
          ) : item.role === 'creator' ? (
            // Creator: scan QR
            item.box_status === 4 ? (
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><circle cx="17.5" cy="17.5" r="2" />
                </svg>
              </div>
            ) : (
              <button
                onClick={onScan}
                className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><circle cx="17.5" cy="17.5" r="2.5" />
                  <path d="M14 17.5h1.5M17.5 14v1.5" />
                </svg>
              </button>
            )
          ) : (
            // Applicant: checkin or show QR
            item.box_status === 4 ? (
              <span className="text-[12px] text-green-500 font-semibold">已完成</span>
            ) : item.has_checked_in ? (
              <button
                onClick={onGenerateQr}
                disabled={actionLoading}
                className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200 disabled:opacity-50"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            ) : (
              <button
                onClick={onCheckin}
                className="bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 rounded-full active:scale-95 transition-transform"
              >
                打卡
              </button>
            )
          )}
        </div>
      </div>

      {/* Result detail row */}
      {isSettled && <ResultDetail status={item.fulfill_status} role={item.role} />}
    </div>
  );
}

function ResultBadge({ status }: { status: number }) {
  if (status === 1) return (
    <span className="text-[11px] font-semibold bg-green-100 text-green-600 px-2.5 py-1 rounded-full">完美履约 🎉</span>
  );
  if (status === 2) return (
    <span className="text-[11px] font-semibold bg-red-100 text-red-500 px-2.5 py-1 rounded-full">我失约</span>
  );
  if (status === 3) return (
    <span className="text-[11px] font-semibold bg-orange-100 text-orange-500 px-2.5 py-1 rounded-full">对方失约</span>
  );
  return null;
}

function ResultDetail({ status, role }: { status: number; role: string }) {
  const details: Record<number, { text: string; hint: string }> = {
    1: { text: '约会圆满完成，保证金已退还', hint: '期待你们的下一次相遇 ✨' },
    2: { text: '您未按时赴约，防鸽费已扣除', hint: '下次一定要守时哦！' },
    3: {
      text: role === 'applicant' ? '发盒者未赴约，已获得补偿' : '拆盒者未赴约',
      hint: role === 'applicant' ? '如有异议可点击申诉按钮' : '对方的防鸽费已处理',
    },
  };

  const d = details[status];
  if (!d) return null;

  return (
    <div className={`mx-3 mb-3 rounded-xl px-3 py-2.5 ${status === 1 ? 'bg-green-50' : status === 2 ? 'bg-red-50' : 'bg-orange-50'}`}>
      <p className={`text-[12px] font-medium ${status === 1 ? 'text-green-700' : status === 2 ? 'text-red-600' : 'text-orange-600'}`}>
        {d.text}
      </p>
      <p className="text-[11px] text-gray-400 mt-0.5">{d.hint}</p>
    </div>
  );
}

function FulfillSkeleton() {
  return (
    <>
      {[1, 2].map(i => (
        <div key={i} className="bg-white rounded-2xl p-3 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-16 mb-3" />
          <div className="flex gap-3 items-center">
            <div className="w-20 h-16 bg-gray-100 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
