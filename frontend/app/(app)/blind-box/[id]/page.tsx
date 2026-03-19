'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { getBlindBox, getProfileViewRequest, requestProfileView, type ProfileViewRequestStatus } from '@/lib/api/blind-boxes';
import { applyBlindBox, getOrCreateSession, getChatMessages, sendChatMessage, type ChatMessage, type SessionInfo } from '@/lib/api/chat';
import { getFollowStatus, followUser, unfollowUser, recordBoxView } from '@/lib/api/me';
import { useAuth } from '@/lib/auth-context';
import type { BlindBox } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/utils';

export default function BlindBoxDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [box, setBox] = useState<BlindBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoRequestStatus, setPhotoRequestStatus] = useState<ProfileViewRequestStatus | null>(null);
  const [photoRequestLoading, setPhotoRequestLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPaidResult, setShowPaidResult] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    getBlindBox(Number(id))
      .then((res) => {
        setBox(res.data);
        // Record view and deduct daily quota (fire-and-forget)
        if (token) recordBoxView(Number(id), token).catch(() => {});
        // Fetch profile view request status
        if (token) {
          getProfileViewRequest(Number(id), token).then(setPhotoRequestStatus).catch(() => {});
        }
      })
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id, router, token]);

  // Check if current user already follows the creator
  useEffect(() => {
    if (!token || !box?.creator?.id) return;
    getFollowStatus(box.creator.id, token).then((res) => {
      setIsFollowing(res.following);
    }).catch(() => {});
  }, [token, box?.creator?.id]);

  if (loading) return <DetailSkeleton />;
  if (!box) return null;

  const creator = box.creator;
  const profile = creator?.profile;

  // Determine bottom bar state
  const bottomBarState = box.status !== 1 ? 'closed' : applied ? 'applied' : 'apply';

  async function handleApply() {
    if (!token || applying) return;
    setShowPayModal(true);
  }

  async function confirmApply() {
    if (!token) return;
    setApplying(true);
    setShowPayModal(false);
    try {
      await applyBlindBox(Number(id), token);
      setApplied(true);
      setShowPaidResult(true); // show success result page
    } catch {
      // ignore
    } finally {
      setApplying(false);
    }
  }

  async function handleFollow() {
    if (!token || followLoading || !creator) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(creator.id, token);
        setIsFollowing(false);
      } else {
        await followUser(creator.id, token);
        setIsFollowing(true);
      }
    } catch {
      // ignore (e.g. non-member error)
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleRequestPhoto() {
    if (!token || photoRequestLoading) return;
    setPhotoRequestLoading(true);
    try {
      const res = await requestProfileView(Number(id), token);
      setPhotoRequestStatus({ status: res.status });
      setShowPhotoModal(false);
    } catch {
      // ignore — keep modal open so user sees feedback
    } finally {
      setPhotoRequestLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* Top nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 h-12 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center -ml-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold text-gray-900">TA的约会盲盒</span>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
              <circle cx="5" cy="12" r="1.5" fill="#666" />
              <circle cx="12" cy="12" r="1.5" fill="#666" />
              <circle cx="19" cy="12" r="1.5" fill="#666" />
            </svg>
          </button>
          <button className="w-8 h-8 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" fill="#666" />
            </svg>
          </button>
        </div>
      </div>

      {/* Creator hero */}
      <div
        className="relative px-4 pt-5 pb-4"
        style={{ background: 'linear-gradient(160deg, #FFE0DC 0%, #FFE8E0 40%, #FFF0E8 80%, #F5F5F5 100%)' }}
      >
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md shrink-0">
            {creator && (
              <Image src={getAvatarUrl(creator.id, creator.avatar_url)} alt={creator.nickname} fill className="object-cover" unoptimized />
            )}
          </div>

          {/* Hi decoration */}
          <div className="flex-1 relative h-20 flex items-center">
            <span className="absolute left-0 top-2 bg-[#E8373F] text-white text-[13px] font-bold px-3 py-1 rounded-xl rotate-[-3deg] shadow-sm">
              Hi~
            </span>
          </div>

          {/* Mascot placeholder */}
          <div className="text-5xl opacity-70 select-none">😈</div>
        </div>

        {/* Name + follow row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-gray-900">{creator?.nickname ?? '神秘发盒者'}</span>
            {creator?.is_member && (
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full">VIP</span>
            )}
          </div>
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`text-[13px] font-semibold px-4 py-1.5 rounded-full transition-colors ${
              isFollowing
                ? 'bg-gray-200 text-gray-500'
                : 'bg-[#E8373F] text-white'
            }`}
          >
            {isFollowing ? '已关注' : '关注 TA'}
          </button>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mt-2">
          {creator?.generation_label && (
            <span className="text-[11px] border border-teal-400 text-teal-600 px-2 py-0.5 rounded-full">
              {creator.generation_label}
            </span>
          )}
          {creator?.height && (
            <span className="text-[11px] border border-gray-300 text-gray-500 px-2 py-0.5 rounded-full">
              身高 {creator.height}cm
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-3 mt-3">
        {/* 约会计划 card */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-1">
              约会计划
              <span className="text-yellow-500">⚡</span>
            </h2>
            {box.experience_values.length > 0 && (
              <div className="flex items-center gap-1 text-[12px] text-gray-500">
                <span>🎯</span>
                {box.experience_values.map((v, i) => (
                  <span key={v}>
                    {i > 0 && <span className="mx-0.5 text-gray-300">|</span>}
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <DetailRow label="主题" value={box.title} />
            <DetailRow label="时间" value={box.meeting_time} />
            <div className="flex gap-3">
              <span className="text-[13px] text-gray-400 w-8 shrink-0">地区</span>
              <div className="flex-1 flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium text-gray-900">
                    {[box.city, box.district].filter(Boolean).join(' ')}
                  </p>
                  {box.location && (
                    <p className="text-[12px] text-gray-400 mt-0.5">{box.location}</p>
                  )}
                </div>
                <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0 ml-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-[13px] text-gray-400 w-8 shrink-0">费用</span>
              <span className={`text-[12px] font-semibold px-3 py-0.5 rounded-full text-white ${box.fee_type === 1 ? 'bg-gray-800' : 'bg-gray-900'}`}>
                {box.fee_label}
              </span>
            </div>
          </div>
        </div>

        {/* 期待同行者特质 */}
        {box.expected_traits.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">期待同行者特质</h3>
            <div className="flex flex-wrap gap-2">
              {box.expected_traits.map((trait) => (
                <span key={trait} className="border border-gray-200 text-gray-700 text-[13px] px-4 py-1.5 rounded-full">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 关于我 */}
        {profile?.about_me && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">关于我</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{profile.about_me}</p>
          </div>
        )}

        {/* 我的兴趣 */}
        {(profile?.interests?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">我的兴趣</h3>
            <div className="flex flex-wrap gap-2">
              {profile!.interests.map((interest) => (
                <span key={interest} className="bg-[#FFF5F0] text-gray-700 text-[12px] px-3 py-1.5 rounded-full border border-[#FFE0D8]">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 兴趣相册 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-gray-900">兴趣相册</h3>
            {photoRequestStatus?.status === 2 ? (
              <span className="text-[12px] text-green-500 font-medium">已解锁 ✓</span>
            ) : photoRequestStatus?.status === 1 ? (
              <span className="text-[12px] text-gray-400">申请中...</span>
            ) : (
              <button
                onClick={() => setShowPhotoModal(true)}
                className="text-[12px] text-[#E8373F]"
              >
                请求查看对方的图片
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => {
              const photo = profile?.interest_photos?.[i];
              return (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {photo ? (
                    <>
                      <Image src={photo} alt="" fill className="object-cover blur-md scale-110" unoptimized />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M12 1C8.676 1 6 3.676 6 7v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V11a2 2 0 00-2-2h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10a2 2 0 110 4 2 2 0 010-4z" />
                          </svg>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#ccc">
                        <path d="M12 1C8.676 1 6 3.676 6 7v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V11a2 2 0 00-2-2h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10a2 2 0 110 4 2 2 0 010-4z" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat FAB */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed right-4 bottom-28 w-12 h-12 bg-[#E8373F] rounded-full shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </button>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-gray-100 px-4 py-3 flex gap-3 z-20" style={{ maxWidth: 480 }}>
        <button className="flex-1 border-2 border-[#E8373F] text-[#E8373F] font-semibold text-[15px] py-3 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          分享
        </button>
        <BottomAction state={bottomBarState} onApply={handleApply} applying={applying} />
      </div>

      {/* Anti-flake fee payment modal — WeChat Pay style */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowPayModal(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-t-3xl w-full pb-8"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* WeChat pay header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <button onClick={() => setShowPayModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <span className="text-[13px] text-blue-500">使用密码</span>
            </div>

            {/* Amount */}
            <div className="text-center py-5 border-b border-gray-100">
              <p className="text-[14px] text-gray-500 mb-1">保证金</p>
              <p className="text-[36px] font-bold text-gray-900">¥ 100.00</p>
            </div>

            {/* Payment method */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-gray-400">付款方式</span>
                <span className="text-[13px] text-gray-400">更改 ∨</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🪙</span>
                  <span className="text-[14px] font-medium text-gray-900">零钱</span>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>

            {/* Pay button */}
            <div className="px-5 pt-5">
              <button
                onClick={confirmApply}
                disabled={applying}
                className="w-full bg-[#09BB07] text-white font-semibold text-[17px] py-4 rounded-xl disabled:bg-gray-300 transition-colors active:scale-[0.98]"
              >
                {applying ? '支付中...' : '支付'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment success result page */}
      {showPaidResult && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center"
          style={{ background: 'linear-gradient(180deg, #FFE0E0 0%, #FFF5F0 50%, #F5F5F5 100%)', maxWidth: 480, left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="text-8xl mb-6">😈</div>
            <p className="text-[17px] font-semibold text-gray-800 mb-1">请耐心等待对方的回复～</p>
            <p className="text-[13px] text-gray-400 mt-1">已成功报名，等待发盒者确认</p>
          </div>
          <div className="w-full px-5 pb-10">
            <button
              onClick={() => { setShowPaidResult(false); setShowChat(true); }}
              className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl"
            >
              继续聊聊天
            </button>
          </div>
        </div>
      )}

      {/* Photo unlock modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" onClick={() => setShowPhotoModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 text-center">
              <h3 className="text-[16px] font-bold text-gray-900 mb-2">请求对方解锁信息</h3>
              <p className="text-[13px] text-gray-500">对方同意后，即可查看此处信息</p>
            </div>
            <div className="border-t border-gray-100 flex">
              <button
                onClick={() => setShowPhotoModal(false)}
                className="flex-1 py-3.5 text-[15px] text-gray-500 border-r border-gray-100"
              >
                我想想
              </button>
              <button
                onClick={handleRequestPhoto}
                disabled={photoRequestLoading}
                className="flex-1 py-3.5 text-[15px] text-[#E8373F] font-medium disabled:text-gray-300"
              >
                {photoRequestLoading ? '发送中...' : '请求'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Bottom Sheet */}
      {showChat && token && (
        <ChatBottomSheet
          boxId={Number(id)}
          token={token}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-[13px] text-gray-400 w-8 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-gray-900 flex-1">{value}</span>
    </div>
  );
}

function BottomAction({ state, onApply, applying }: { state: string; onApply: () => void; applying: boolean }) {
  if (state === 'closed') {
    return (
      <button disabled className="flex-[2] bg-gray-200 text-gray-400 font-semibold text-[15px] py-3 rounded-full">
        盲盒已下架，等等机会
      </button>
    );
  }
  if (state === 'applied') {
    return (
      <button disabled className="flex-[2] bg-gray-200 text-gray-400 font-semibold text-[15px] py-3 rounded-full">
        已报名，待回复
      </button>
    );
  }
  if (state === 'matched') {
    return (
      <button className="flex-[2] bg-gray-900 text-white font-semibold text-[15px] py-3 rounded-full active:scale-[0.98] transition-transform">
        请准备赴约！与TA聊聊天
      </button>
    );
  }
  return (
    <button
      onClick={onApply}
      disabled={applying}
      className="flex-[2] bg-gray-900 text-white font-semibold text-[15px] py-3 rounded-full active:scale-[0.98] transition-transform disabled:bg-gray-400"
    >
      {applying ? '报名中...' : '去赴约'}
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] animate-pulse">
      <div className="h-12 bg-white" />
      <div className="h-40 bg-gradient-to-b from-pink-100 to-gray-100" />
      <div className="px-3 mt-3 flex flex-col gap-3">
        {[120, 80, 100, 80].map((h, i) => (
          <div key={i} className="bg-white rounded-2xl" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}

// ─── Chat Bottom Sheet ────────────────────────────────────────────────────────

function ChatBottomSheet({
  boxId,
  token,
  onClose,
}: {
  boxId: number;
  token: string;
  onClose: () => void;
}) {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  // "一句话盲聊": locked after first send until creator replies
  const [locked, setLocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async (sessionId: number) => {
    try {
      const res = await getChatMessages(sessionId, token);
      setMessages(res.data);
      // If user already sent a message and creator hasn't replied yet → locked
      const mySentCount = res.data.filter(m => m.is_mine).length;
      const creatorReplied = res.data.some(m => !m.is_mine);
      if (mySentCount > 0 && !creatorReplied) setLocked(true);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch {/* ignore */}
  }, [token]);

  useEffect(() => {
    getOrCreateSession(boxId, token)
      .then(info => {
        setSessionInfo(info);
        return loadMessages(info.session_id);
      })
      .finally(() => setLoadingSession(false));
  }, [boxId, token, loadMessages]);

  async function handleSend() {
    if (!input.trim() || sending || locked || !sessionInfo) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(sessionInfo.session_id, input.trim(), token);
      setMessages(prev => [...prev, msg]);
      setInput('');
      setLocked(true); // lock after first send
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {/* ignore */}
    finally { setSending(false); }
  }

  const creator = sessionInfo?.creator;
  const blindBox = sessionInfo?.blind_box;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white rounded-t-3xl z-50 flex flex-col"
        style={{ maxWidth: 480, maxHeight: '80vh' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            {creator && (
              <img src={getAvatarUrl(creator.id, creator.avatar)} alt="" className="w-9 h-9 rounded-full object-cover" />
            )}
            <span className="text-[15px] font-semibold text-gray-900">{creator?.nickname ?? 'TA'}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
          {loadingSession ? (
            <div className="flex justify-center py-8 text-gray-300 text-2xl animate-pulse">💬</div>
          ) : (
            <>
              {/* Time + hint */}
              <div className="text-center text-[11px] text-gray-400 my-1">
                {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {!locked && messages.length === 0 && (
                <div className="text-center text-[12px] text-gray-400">
                  对方回复你之前，只能发送一条文字消息
                </div>
              )}
              {locked && messages.length > 0 && !messages.some(m => !m.is_mine) && (
                <div className="text-center text-[12px] text-gray-400">
                  已发送消息，等待对方回复后可继续聊天
                </div>
              )}

              {/* Blind box system card */}
              {blindBox && (
                <div className="flex items-start gap-2">
                  {creator && (
                    <img src={getAvatarUrl(creator.id, creator.avatar)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm overflow-hidden border border-gray-100 max-w-[85%]">
                    {/* Banner */}
                    <div
                      className="px-3 py-2.5 flex items-center justify-between"
                      style={{ background: 'linear-gradient(135deg, #FFE8E0 0%, #FFF0E8 100%)' }}
                    >
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[11px] font-bold text-[#E8373F]">冲！约会盲盒</span>
                        </div>
                        <p className="text-[12px] font-semibold text-gray-800">约会盲盒期待你开</p>
                        <button className="text-[11px] text-blue-500 mt-0.5">查看盲盒详情 ▶</button>
                      </div>
                      <div className="text-3xl opacity-80">🎁</div>
                    </div>
                    {/* Info */}
                    <div className="px-3 py-2 flex items-center gap-1.5">
                      {creator && (
                        <img src={getAvatarUrl(creator.id, creator.avatar)} alt="" className="w-4 h-4 rounded-full object-cover" />
                      )}
                      <span className="text-[12px] text-gray-500">{creator?.nickname}</span>
                    </div>
                    <div className="px-3 pb-2.5">
                      <p className="text-[13px] font-semibold text-gray-900">
                        发起：《{blindBox.title}》约会盲盒
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map(msg => (
                <SheetBubble key={msg.id} message={msg} creatorId={creator?.id} creatorAvatar={creator?.avatar} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={locked ? '等待对方回复后可继续聊天' : '请输入聊天内容'}
            disabled={locked}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-[14px] outline-none disabled:text-gray-300 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || locked}
            className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center disabled:bg-gray-300 transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

function SheetBubble({ message, creatorId, creatorAvatar }: { message: ChatMessage; creatorId?: number; creatorAvatar?: string }) {
  if (message.is_mine) {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="max-w-[72%] bg-blue-500 text-white px-3.5 py-2.5 rounded-2xl rounded-br-sm text-[14px] leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      {creatorId !== undefined && (
        <img src={getAvatarUrl(creatorId, creatorAvatar)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mb-0.5" />
      )}
      <div className="max-w-[72%] bg-gray-100 text-gray-900 px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-[14px] leading-relaxed">
        {message.content}
      </div>
    </div>
  );
}
