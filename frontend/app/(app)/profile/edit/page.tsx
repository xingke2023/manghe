'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getMyProfile, updateProfile, type MyProfile } from '@/lib/api/me';
import { getAvatarUrl } from '@/lib/utils';

function dicebearUrl(seed: string | number) {
  return `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=ffd6c8,fce4d6,fff0e8,e8f4ff,d6f0e8,f0e8ff`;
}

function buildSeeds(userId: number) {
  const offsets = [0, 7, 13, 21, 37, 42, 55, 68, 74, 81, 99, 103, 117, 128, 136, 145, 157, 163, 172, 189, 204, 213, 227, 238];
  return offsets.map(o => userId + o);
}

const DATING_PURPOSES = ['找兴趣搭子', '脱单', 'Dating', '婚恋'];
const INTERESTS_OPTIONS = [
  '热爱乐器', '野餐露营', '力量撸铁', '话剧脱口秀', '甜度满载奶茶',
  '放风筝', '健身游泳', '拍美照', '挑战极限运动', '吃饭',
];
const EDUCATION_OPTIONS = ['高中及以下', '大专', '本科', '硕士', '博士'];
const INCOME_OPTIONS = ['5万以下', '5-10万', '10-20万', '20-50万', '50万以上'];

export default function EditProfilePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | undefined>(undefined);
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Form state
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<number>(0);
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [city, setCity] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [datingPurposes, setDatingPurposes] = useState<string[]>([]);
  const [targetGender, setTargetGender] = useState<number>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [customInterest, setCustomInterest] = useState('');

  useEffect(() => {
    if (!token) return;
    getMyProfile(token).then(r => {
      const u = r.user;
      setUserId(u.id);
      setCurrentAvatarUrl(u.avatar_url);
      setNickname(u.nickname ?? '');
      setGender(u.gender ?? 0);
      setAge(u.age?.toString() ?? '');
      setHeight(u.height?.toString() ?? '');
      setCity(u.city ?? '');
      setAboutMe(u.profile?.about_me ?? '');
      setDatingPurposes(u.profile?.dating_purposes ?? []);
      setTargetGender(u.profile?.target_gender ?? 0);
      setInterests(u.profile?.interests ?? []);
      setOccupation(u.profile?.occupation ?? '');
      setEducation(u.profile?.education ?? '');
      setAnnualIncome(u.profile?.annual_income ?? '');
    }).finally(() => setLoading(false));
  }, [token]);

  const seeds = useMemo(() => (userId ? buildSeeds(userId) : []), [userId]);
  const currentSeed = selectedSeed ?? userId ?? 0;
  const avatarDisplayUrl = currentSeed ? dicebearUrl(currentSeed) : (currentAvatarUrl ?? undefined);

  function togglePurpose(p: string) {
    setDatingPurposes(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  function addCustomInterest() {
    const t = customInterest.trim();
    if (t && !interests.includes(t)) {
      setInterests(prev => [...prev, t]);
    }
    setCustomInterest('');
  }

  async function handleSave() {
    if (!token || saving) return;
    setSaving(true);
    try {
      await updateProfile({
        nickname: nickname || undefined,
        gender: gender || undefined,
        age: age ? Number(age) : undefined,
        height: height ? Number(height) : undefined,
        city: city || undefined,
        about_me: aboutMe || undefined,
        dating_purposes: datingPurposes,
        target_gender: targetGender,
        interests,
        occupation: occupation || undefined,
        education: education || undefined,
        annual_income: annualIncome || undefined,
        ...(avatarDisplayUrl ? { avatar_url: avatarDisplayUrl } : {}),
      } as Parameters<typeof updateProfile>[0], token);
      router.back();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse text-gray-300 text-4xl">😈</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold">编辑个人信息</span>
        <div className="w-8" />
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-5 border-b border-gray-50">
        <button
          onClick={() => setShowAvatarPicker(true)}
          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md active:scale-95 transition-transform mb-2 bg-gray-100"
        >
          {avatarDisplayUrl && (
            <img src={avatarDisplayUrl} alt="avatar" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/20 flex items-end justify-center pb-1.5">
            <span className="text-white text-[10px] font-semibold bg-black/40 px-2 py-0.5 rounded-full">换一换</span>
          </div>
        </button>
        <span className="text-[12px] text-gray-400">点击头像可以换风格</span>
      </div>

      <div className="px-4 divide-y divide-gray-50">
        {/* 昵称 */}
        <FormRow label="昵称">
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="请输入昵称"
            className="flex-1 text-right text-[14px] text-gray-700 outline-none placeholder:text-gray-300"
          />
        </FormRow>

        {/* 年龄 */}
        <FormRow label="年龄">
          <input
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="请选择年龄"
            type="number"
            className="flex-1 text-right text-[14px] text-gray-700 outline-none placeholder:text-gray-300"
          />
          <ChevronRight />
        </FormRow>

        {/* 身高 */}
        <FormRow label="身高">
          <input
            value={height}
            onChange={e => setHeight(e.target.value)}
            placeholder="请选择身高"
            type="number"
            className="flex-1 text-right text-[14px] text-gray-700 outline-none placeholder:text-gray-300"
          />
          <ChevronRight />
        </FormRow>

        {/* 常驻地 */}
        <FormRow label="常驻地">
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="请选择常驻地"
            className="flex-1 text-right text-[14px] text-gray-700 outline-none placeholder:text-gray-300"
          />
          <ChevronRight />
        </FormRow>

        {/* 性别 */}
        <div className="py-4">
          <span className="text-[14px] text-gray-700 font-medium block mb-3">性别</span>
          <div className="flex gap-2">
            {[{ v: 1, label: '♂ 男' }, { v: 2, label: '♀ 女' }, { v: 0, label: '😊 不限' }].map(opt => (
              <button
                key={opt.v}
                onClick={() => setGender(opt.v)}
                className={`px-5 py-2 rounded-full text-[13px] font-medium border transition-colors ${
                  gender === opt.v
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 约会目的 */}
        <div className="py-4">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[14px] text-gray-700 font-medium">约会目的（可多选）</span>
            <span className="text-[#E8373F] text-[12px]">*</span>
          </div>
          <p className="text-[11px] text-gray-400 mb-3">多选目的可扩大匹配范围，但需补充更多信息喔！</p>
          <div className="flex flex-wrap gap-2">
            {DATING_PURPOSES.map(p => (
              <button
                key={p}
                onClick={() => togglePurpose(p)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors ${
                  datingPurposes.includes(p)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 对象属性 */}
        <div className="py-4">
          <span className="text-[14px] text-gray-700 font-medium block mb-3">对象属性</span>
          <div className="flex gap-2">
            {[{ v: 1, label: '♂ 男' }, { v: 2, label: '♀ 女' }, { v: 0, label: '😊 不限' }].map(opt => (
              <button
                key={opt.v}
                onClick={() => setTargetGender(opt.v)}
                className={`px-5 py-2 rounded-full text-[13px] font-medium border transition-colors ${
                  targetGender === opt.v
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 关于我 */}
        <div className="py-4">
          <span className="text-[14px] text-gray-700 font-medium block mb-2">关于我</span>
          <textarea
            value={aboutMe}
            onChange={e => setAboutMe(e.target.value.slice(0, 80))}
            placeholder="关于你的性格、爱好等&#10;例：ISTP细节控，喜欢量身和独立电影，周末常在美术馆发呆"
            rows={3}
            className="w-full text-[13px] text-gray-700 placeholder:text-gray-300 outline-none resize-none leading-relaxed"
          />
          <div className="text-right text-[11px] text-gray-300">{aboutMe.length}/80</div>
        </div>

        {/* 兴趣爱好 */}
        <div className="py-4">
          <span className="text-[14px] text-gray-700 font-medium block mb-3">兴趣爱好</span>
          <div className="flex flex-wrap gap-2 mb-3">
            {INTERESTS_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => toggleInterest(opt)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                  interests.includes(opt)
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {opt}
              </button>
            ))}
            {/* custom interests */}
            {interests.filter(i => !INTERESTS_OPTIONS.includes(i)).map(i => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium bg-gray-900 text-white border border-gray-900"
              >
                {i} ×
              </button>
            ))}
            <div className="flex items-center gap-1 border border-dashed border-gray-300 rounded-full px-3 py-1.5">
              <input
                value={customInterest}
                onChange={e => setCustomInterest(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomInterest()}
                placeholder="+ 新增标签"
                className="text-[12px] text-gray-500 outline-none w-20 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* 职业 */}
        <FormRow label="职业">
          <input
            value={occupation}
            onChange={e => setOccupation(e.target.value)}
            placeholder="请输入职业名称"
            className="flex-1 text-right text-[14px] text-gray-700 outline-none placeholder:text-gray-300"
          />
        </FormRow>

        {/* 学历 */}
        <div className="py-4">
          <span className="text-[14px] text-gray-700 font-medium block mb-3">学历</span>
          <div className="flex flex-wrap gap-2">
            {EDUCATION_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEducation(education === e ? '' : e)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                  education === e
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 年收入 */}
        <div className="py-4">
          <span className="text-[14px] text-gray-700 font-medium block mb-3">年收入</span>
          <div className="flex flex-wrap gap-2">
            {INCOME_OPTIONS.map(i => (
              <button
                key={i}
                onClick={() => setAnnualIncome(annualIncome === i ? '' : i)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                  annualIncome === i
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Avatar Picker Sheet */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAvatarPicker(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-t-3xl w-full max-w-[480px] pb-8 flex flex-col"
            style={{ maxHeight: '72vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 mb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-5 py-3 border-b border-gray-100 shrink-0">
              <p className="text-[16px] font-bold text-gray-900">选择头像风格</p>
              <p className="text-[12px] text-gray-400 mt-0.5">24 种卡通形象，选一个最像你的</p>
            </div>

            {/* Preview current selected */}
            <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E8373F] shadow-md shrink-0">
                <img src={dicebearUrl(currentSeed)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900">当前选择</p>
                <p className="text-[11px] text-gray-400 mt-0.5">点击下方网格切换</p>
              </div>
              <button
                onClick={() => setSelectedSeed(Math.floor(Math.random() * 100000))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 text-[12px] text-gray-600 active:bg-gray-100"
              >
                🎲 随机
              </button>
            </div>

            {/* Grid */}
            <div className="overflow-y-auto flex-1 px-4 py-3">
              <div className="grid grid-cols-4 gap-3">
                {seeds.map(seed => {
                  const isSelected = seed === currentSeed;
                  return (
                    <button
                      key={seed}
                      onClick={() => setSelectedSeed(seed)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all active:scale-95 ${isSelected ? 'border-[#E8373F] shadow-md scale-105' : 'border-transparent'}`}
                    >
                      <img
                        src={dicebearUrl(seed)}
                        alt=""
                        className="w-full h-full object-cover bg-gray-100"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#E8373F] rounded-full flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm button */}
            <div className="px-5 pt-2 shrink-0">
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="w-full bg-gray-900 text-white font-bold text-[16px] py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
              >
                确定使用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      <div className="px-4 py-4 flex gap-3">
        <button
          onClick={() => router.push(`/blind-box/preview`)}
          className="flex-1 border-2 border-gray-900 text-gray-900 font-semibold text-[14px] py-3.5 rounded-2xl"
        >
          预览效果
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-[2] bg-gray-900 text-white font-semibold text-[15px] py-3.5 rounded-2xl disabled:bg-gray-400"
        >
          {saving ? '保存中...' : '保存修改'}
        </button>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-4">
      <span className="text-[14px] text-gray-700 font-medium w-16 shrink-0">{label}</span>
      <div className="flex-1 flex items-center justify-end gap-1">{children}</div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
