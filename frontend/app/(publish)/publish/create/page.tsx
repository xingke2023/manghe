'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { redeemVoucher, createBlindBox } from '@/lib/api/publish';

const EXPERIENCE_VALUES = [
  { emoji: '🎸', label: '热衷乐器' },
  { emoji: '⛺', label: '野餐露营' },
  { emoji: '💪', label: '撸铁' },
  { emoji: '🎭', label: '话剧脱口秀' },
  { emoji: '🧋', label: '甜度满载奶茶' },
  { emoji: '🪁', label: '放风筝' },
  { emoji: '🏊', label: '健身游泳' },
  { emoji: '📷', label: '拍美照' },
  { emoji: '🍜', label: '美食探索' },
  { emoji: '🎬', label: '观影交流' },
  { emoji: '💬', label: '深度对话' },
  { emoji: '🔧', label: '技能交换' },
];

export default function CreateBlindBoxPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [step, setStep] = useState<'voucher' | 'form'>('voucher');
  const [voucher, setVoucher] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('深圳');
  const [district, setDistrict] = useState('');
  const [feeType, setFeeType] = useState(1); // 1=AA, 2=我请客
  const [traits, setTraits] = useState<string[]>([]);
  const [traitInput, setTraitInput] = useState('');
  const [expValues, setExpValues] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title && meetingTime && location && agreed;

  async function handleVoucher() {
    if (!voucher.trim() || !token) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      await redeemVoucher(voucher.trim(), token);
      setStep('form');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '凭证无效或已被使用，请重试';
      setVoucherError(msg);
    } finally {
      setVoucherLoading(false);
    }
  }

  function addTrait() {
    const t = traitInput.trim();
    if (t && !traits.includes(t)) setTraits(prev => [...prev, t]);
    setTraitInput('');
  }

  function toggleExpValue(label: string) {
    setExpValues(prev =>
      prev.includes(label) ? prev.filter(v => v !== label) : [...prev, label]
    );
  }

  async function handlePreview() {
    if (!canSubmit || submitting || !token) return;
    // Store form data in sessionStorage for preview page
    sessionStorage.setItem('publish_draft', JSON.stringify({
      title, meetingTime, location, city, district, feeType,
      expectedTraits: traits, experienceValues: expValues,
    }));
    router.push('/publish/preview');
  }

  // Voucher step
  if (step === 'voucher') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold">发布约会盲盒</span>
          <div className="w-8" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-5xl mb-6">🎁</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">请输入发盒凭证</h2>
          <p className="text-[13px] text-gray-500 mb-8 text-center">每次发布都需要一个有效的发盒凭证</p>

          <div className="w-full">
            <input
              value={voucher}
              onChange={e => { setVoucher(e.target.value.toUpperCase()); setVoucherError(''); }}
              placeholder="请输入6位凭证码"
              maxLength={6}
              className={`w-full border-2 rounded-xl px-4 py-3.5 text-center text-[18px] font-mono tracking-[0.3em] outline-none transition-colors ${
                voucherError ? 'border-[#E8373F]' : 'border-gray-200 focus:border-gray-900'
              }`}
            />
            {voucherError && (
              <p className="text-[12px] text-[#E8373F] mt-2 text-center">{voucherError}</p>
            )}
          </div>
        </div>

        <div className="px-5 pb-8">
          <button
            onClick={handleVoucher}
            disabled={voucher.length !== 6 || voucherLoading}
            className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl disabled:bg-gray-300 disabled:text-gray-400"
          >
            {voucherLoading ? '验证中...' : '验证并继续'}
          </button>
        </div>
      </div>
    );
  }

  // Form step
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100">
        <button onClick={() => setStep('voucher')} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">发布您的约会内容</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {/* Cover */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[14px] font-semibold text-gray-900 mb-3">盲盒封面</p>
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 shrink-0">
              <span className="text-2xl">+</span>
            </div>
            <div className="text-[12px] text-gray-400 leading-relaxed">
              <p>1、图片比例为 1:1</p>
              <p>2、文件大小上限：500MB</p>
            </div>
          </div>
        </div>

        {/* Main form */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[14px] font-semibold text-gray-900 mb-3">约会主题</p>
          <div className="space-y-3">
            <FormRow label="标题">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="一句话描述一起去做什么"
                className="flex-1 text-[14px] outline-none text-gray-900 placeholder-gray-400"
                maxLength={50}
              />
            </FormRow>
            <FormRow label="时间">
              <input
                type="datetime-local"
                value={meetingTime}
                onChange={e => setMeetingTime(e.target.value)}
                className="flex-1 text-[14px] outline-none text-gray-900"
              />
            </FormRow>
            <FormRow label="地点">
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="请输入约会地点"
                className="flex-1 text-[14px] outline-none text-gray-900 placeholder-gray-400"
              />
            </FormRow>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[13px] text-gray-500 w-8 shrink-0">费用</span>
              <div className="flex gap-2">
                {[{ val: 1, label: 'AA' }, { val: 2, label: '我请客' }].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setFeeType(opt.val)}
                    className={`px-6 py-2 rounded-xl text-[14px] font-medium border-2 transition-colors ${
                      feeType === opt.val ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Traits */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[14px] font-semibold text-gray-900 mb-1">期待同行者特质</p>
          <p className="text-[12px] text-gray-400 mb-3">写期望同行者的特质，比如说E人、异性、好奇心等等</p>
          <div className="flex flex-wrap gap-2">
            {traits.map(t => (
              <span key={t} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-[13px] px-3 py-1.5 rounded-full">
                {t}
                <button onClick={() => setTraits(prev => prev.filter(x => x !== t))} className="text-gray-400 hover:text-gray-600">×</button>
              </span>
            ))}
            <div className="flex items-center gap-1 border border-dashed border-gray-300 rounded-full px-3 py-1.5">
              <input
                value={traitInput}
                onChange={e => setTraitInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTrait()}
                placeholder="+ 新增标签"
                className="text-[13px] outline-none text-gray-600 placeholder-gray-400 w-20"
              />
              {traitInput && (
                <button onClick={addTrait} className="text-[#E8373F] text-[12px]">添加</button>
              )}
            </div>
          </div>
        </div>

        {/* Experience values */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[14px] font-semibold text-gray-900 mb-3">体验价值</p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_VALUES.map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => toggleExpValue(label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] border transition-colors ${
                  expValues.includes(label)
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-5 pb-8 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={handlePreview}
          disabled={!canSubmit || submitting}
          className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl disabled:bg-gray-300 disabled:text-gray-400 transition-colors mb-3"
        >
          预览盲盒
        </button>
        <label className="flex items-center justify-center gap-2 cursor-pointer" onClick={() => setAgreed(a => !a)}>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${agreed ? 'border-[#E8373F] bg-[#E8373F]' : 'border-gray-400'}`}>
            {agreed && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
          <span className="text-[12px] text-gray-500">已阅读并同意<span className="text-[#E8373F]">《发布协议》</span></span>
        </label>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-[13px] text-gray-500 w-8 shrink-0">{label}</span>
      {children}
    </div>
  );
}
