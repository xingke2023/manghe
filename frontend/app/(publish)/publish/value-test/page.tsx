'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { submitValueTest, type ValueTestAnswers } from '@/lib/api/publish';

const QUESTIONS = [
  {
    id: 'q1',
    text: '您认为自己的社交吸引力主要体现在哪些方面？',
    options: [
      { key: 'A', text: '颜值/身材' },
      { key: 'B', text: '经济实力/学历' },
      { key: 'C', text: '兴趣爱好/技能' },
      { key: 'D', text: '性格/情商' },
    ],
  },
  {
    id: 'q2',
    text: '您对匹配对象的期待更接近以下哪种描述？',
    options: [
      { key: 'A', text: '必须完全符合我的硬性条件（如身高、收入）' },
      { key: 'B', text: '可以接受部分条件不符，但核心三观要一致' },
      { key: 'C', text: '更看重相处体验，条件可以灵活调整' },
      { key: 'D', text: '没有明确标准，随缘即可' },
    ],
  },
  {
    id: 'q3',
    text: '如果连续3次匹配的用户都与您的预期不符，您会如何应对？',
    options: [
      { key: 'A', text: '认为平台算法有问题，要求人工介入' },
      { key: 'B', text: '调整自己的标签或筛选条件，继续尝试' },
      { key: 'C', text: '暂时停止使用，过段时间再回来' },
      { key: 'D', text: '直接卸载小程序，不再使用' },
    ],
  },
  {
    id: 'q4',
    text: '您能接受匹配对象的真实颜值与照片有多大差距？',
    options: [
      { key: 'A', text: '必须和照片完全一致，否则是欺骗' },
      { key: 'B', text: '允许轻微差异（如妆容、角度不同）' },
      { key: 'C', text: '只要整体气质符合，可以接受' },
      { key: 'D', text: '不关注颜值，更在意性格' },
    ],
  },
  {
    id: 'q5',
    text: '见面后发现对方与描述严重不符（如职业造假），您会如何处理？',
    options: [
      { key: 'A', text: '当场质问并终止约会，向平台举报' },
      { key: 'B', text: '保持礼貌完成约会，事后给差评' },
      { key: 'C', text: '反思自己的筛选标准是否有问题' },
      { key: 'D', text: '无所谓，继续接触其他用户' },
    ],
  },
  {
    id: 'q6',
    text: '若对方因临时有事取消约会，您会更倾向于？',
    options: [
      { key: 'A', text: '认为对方不尊重人，扣除其信用分' },
      { key: 'B', text: '理解突发情况，协商改期' },
      { key: 'C', text: '直接寻找其他匹配对象' },
      { key: 'D', text: '对平台失去信任，暂停使用' },
    ],
  },
  {
    id: 'q7',
    text: '您如何看待平台收取的"防鸽费"和信用分机制？',
    options: [
      { key: 'A', text: '完全支持，能有效约束用户行为' },
      { key: 'B', text: '可以接受，但希望费用更低' },
      { key: 'C', text: '觉得麻烦，影响使用体验' },
      { key: 'D', text: '反对，认为这是变相收费' },
    ],
  },
  {
    id: 'q8',
    text: '如果发盒后长时间无人响应，您会？',
    options: [
      { key: 'A', text: '质疑平台的用户质量' },
      { key: 'B', text: '优化自己的盲盒描述或调整标签' },
      { key: 'C', text: '降低标准，扩大匹配范围' },
      { key: 'D', text: '放弃发盒，转为拆盒用户' },
    ],
  },
  {
    id: 'q9',
    text: '您认为"线下约会"的核心价值在于？',
    options: [
      { key: 'A', text: '快速筛选结婚对象' },
      { key: 'B', text: '拓展社交圈，认识有趣的人' },
      { key: 'C', text: '享受约会过程，结果不重要' },
      { key: 'D', text: '其他' },
    ],
  },
  {
    id: 'q10',
    text: '如果多次约会均未建立深度关系，您会如何归因？',
    options: [
      { key: 'A', text: '平台匹配机制有问题' },
      { key: 'B', text: '自己要求过高或表达方式不当' },
      { key: 'C', text: '运气不好，暂时没遇到对的人' },
      { key: 'D', text: '对线上社交彻底失望' },
    ],
  },
];

type Step = 'intro' | 'quiz';

export default function ValueTestPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState<Step>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const q = QUESTIONS[current];
  const selected = answers[q?.id];
  const progress = (current / QUESTIONS.length) * 100;

  async function handleSubmit() {
    if (submitting || !token) return;
    setSubmitting(true);
    try {
      const res = await submitValueTest(answers as unknown as ValueTestAnswers, token);
      router.push(`/publish/value-test/result?status=${res.status === 1 ? 'pass' : 'pending'}`);
    } catch {
      setSubmitting(false);
    }
  }

  if (step === 'intro') {
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

        <div className="flex-1 px-5 py-6">
          <div className="bg-[#FFF5F0] rounded-2xl p-5 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">发布约会盲盒</h1>
            <p className="text-[13px] text-gray-500 mb-4">能帮你更高效筛选到「对的人」</p>
            <div className="bg-white rounded-xl p-4">
              <p className="text-[14px] font-semibold text-gray-900 mb-2">
                🌟 发布前，请先完成小恶魔的灵魂考验～
              </p>
              <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                我们希望能给你找到最匹配的约会对象。在你发布盲盒之前，帮我们回答
                <span className="text-[#E8373F] font-semibold"> 10个小问题</span>吧！
              </p>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                这些问题能够让我们更好地了解你的兴趣、价值观，帮助你遇见
                <span className="text-[#E8373F] font-semibold">「对的人」</span>。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5">
            <p className="text-[14px] font-semibold text-gray-900 mb-3">🔍 小恶魔 Tips：</p>
            <ul className="space-y-2.5">
              {[
                '通过测试证明你愿意认真对待每一次约会；',
                '尊重他人是获得优质匹配的前提；',
                '违反道德或平台规则的行为将被永久限制！',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-gray-600">
                  <span className="text-[#E8373F] shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-5 pb-8 pt-3">
          <button
            onClick={() => setStep('quiz')}
            className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl"
          >
            进入测试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100">
        <button onClick={() => current === 0 ? setStep('intro') : setCurrent(c => c - 1)} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">约会盲盒测试题 {current + 1}/10</span>
        <div className="w-8" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-[#E8373F] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 px-5 py-6">
        <div className="mb-2">
          <span className="text-[11px] bg-gray-900 text-white px-2 py-0.5 rounded-md font-medium">单选题</span>
        </div>
        <h2 className="text-[16px] font-semibold text-gray-900 mb-6 leading-snug">{q.text}</h2>

        <div className="space-y-3">
          {q.options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
              className={`w-full text-left px-4 py-4 rounded-xl border text-[14px] transition-all ${
                selected === opt.key
                  ? 'border-gray-900 bg-gray-900 text-white font-medium'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {opt.key}. {opt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom button */}
      <div className="px-5 pb-8 pt-3">
        {current < QUESTIONS.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            disabled={!selected}
            className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl disabled:bg-gray-300 disabled:text-gray-400 transition-colors"
          >
            下一题
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="w-full bg-gray-900 text-white font-semibold text-[16px] py-4 rounded-2xl disabled:bg-gray-300 disabled:text-gray-400 transition-colors"
          >
            {submitting ? '提交中...' : '完成'}
          </button>
        )}
      </div>
    </div>
  );
}
