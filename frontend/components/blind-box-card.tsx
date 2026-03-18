'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { BlindBox } from '@/lib/api/types';

interface BlindBoxCardProps {
  box: BlindBox;
  viewed?: boolean;
}

export function BlindBoxCard({ box, viewed = false }: BlindBoxCardProps) {
  const creator = box.creator;

  return (
    <Link href={`/blind-box/${box.id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.99] transition-transform">
        {/* Title row */}
        <div className="flex items-start justify-between px-3 pt-3 pb-2 gap-2">
          <h3 className="font-bold text-[15px] text-gray-900 leading-snug flex-1">{box.title}</h3>
          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white ${box.fee_type === 1 ? 'bg-gray-800' : 'bg-gray-900'}`}>
            {box.fee_label}
          </span>
        </div>

        {/* Content row: image + creator info */}
        <div className="flex gap-3 px-3 pb-3">
          {/* Cover image */}
          <div className="relative w-[130px] h-[100px] rounded-xl overflow-hidden shrink-0 bg-gray-100">
            {box.cover_image ? (
              <Image
                src={box.cover_image}
                alt={box.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-200" />
            )}
            {viewed && (
              <span className="absolute top-1.5 left-1.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                拆过
              </span>
            )}
          </div>

          {/* Creator info */}
          <div className="flex-1 flex flex-col justify-between py-0.5">
            {/* Creator top row */}
            <div className="flex items-center gap-1.5">
              <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                {creator?.avatar_url ? (
                  <Image src={creator.avatar_url} alt={creator.nickname} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-200 to-pink-300" />
                )}
              </div>
              <span className="text-[13px] font-medium text-gray-900 truncate max-w-[80px]">
                {creator?.nickname ?? '匿名'}
              </span>
              {creator?.gender && (
                <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${creator.gender === 1 ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                  {creator.gender === 1 ? '♂' : '♀'}
                </span>
              )}
              {creator?.generation_label && (
                <span className="text-[10px] border border-teal-400 text-teal-600 px-1.5 py-0 rounded-full leading-4">
                  {creator.generation_label}
                </span>
              )}
            </div>

            {/* Time */}
            <div className="flex items-center gap-1 text-[12px] text-gray-500">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 4.5v4l2.5 1.5" strokeLinecap="round" />
              </svg>
              <span>时间：{box.meeting_time}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-[12px] text-gray-500">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.485-2.015-4.5-4.5-4.5z" />
                <circle cx="8" cy="6" r="1.5" fill="currentColor" />
              </svg>
              <span className="truncate">地区：{[box.city, box.district].filter(Boolean).join(' ')}</span>
            </div>

            {/* Expected traits */}
            {box.expected_traits.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-gray-500 overflow-hidden">
                <span className="text-yellow-500">★</span>
                <span className="font-medium text-gray-700 shrink-0">期待同行者</span>
                <span className="truncate">{box.expected_traits.join(' | ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
