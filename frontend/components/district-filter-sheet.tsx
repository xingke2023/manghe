'use client';

import { useState, useEffect, useRef } from 'react';

interface DistrictFilterSheetProps {
  open: boolean;
  districts: string[];
  initialDistrict?: string;
  onConfirm: (district: string) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

export function DistrictFilterSheet({ open, districts, initialDistrict, onConfirm, onClose }: DistrictFilterSheetProps) {
  const allOptions = ['全部区域', ...districts];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  useEffect(() => {
    if (open) {
      const idx = initialDistrict ? allOptions.indexOf(initialDistrict) : 0;
      setSelectedIndex(Math.max(0, idx));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = selectedIndex * ITEM_HEIGHT;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedIndex]);

  function snapToIndex(scrollTop: number) {
    const idx = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(allOptions.length - 1, idx));
    setSelectedIndex(clamped);
    if (listRef.current) {
      listRef.current.scrollTop = clamped * ITEM_HEIGHT;
    }
  }

  function handleScroll() {
    if (!isDragging.current && listRef.current) {
      clearTimeout((listRef.current as HTMLDivElement & { _snapTimer?: ReturnType<typeof setTimeout> })._snapTimer);
      (listRef.current as HTMLDivElement & { _snapTimer?: ReturnType<typeof setTimeout> })._snapTimer = setTimeout(() => {
        if (listRef.current) snapToIndex(listRef.current.scrollTop);
      }, 150);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    startScrollTop.current = listRef.current?.scrollTop ?? 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!listRef.current) return;
    const dy = startY.current - e.touches[0].clientY;
    listRef.current.scrollTop = startScrollTop.current + dy;
  }

  function handleTouchEnd() {
    isDragging.current = false;
    if (listRef.current) snapToIndex(listRef.current.scrollTop);
  }

  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    startY.current = e.clientY;
    startScrollTop.current = listRef.current?.scrollTop ?? 0;

    const onMove = (me: MouseEvent) => {
      if (!listRef.current) return;
      const dy = startY.current - me.clientY;
      listRef.current.scrollTop = startScrollTop.current + dy;
    };
    const onUp = () => {
      isDragging.current = false;
      if (listRef.current) snapToIndex(listRef.current.scrollTop);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleConfirm() {
    const val = allOptions[selectedIndex];
    onConfirm(val === '全部区域' ? '' : val);
  }

  if (!open) return null;

  const pickerHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  const centerOffset = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl shadow-xl overflow-hidden"
        style={{ maxWidth: 480, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="text-[15px] text-gray-500">取消</button>
          <h2 className="text-[16px] font-semibold text-gray-900">地区</h2>
          <button onClick={handleConfirm} className="text-[15px] font-semibold text-gray-900">确定</button>
        </div>

        {/* Scroll picker */}
        <div className="relative select-none" style={{ height: pickerHeight }}>
          {/* Center highlight */}
          <div
            className="absolute left-0 right-0 pointer-events-none border-t border-b border-gray-200 bg-gray-50/80"
            style={{ top: centerOffset, height: ITEM_HEIGHT }}
          />

          {/* Top/bottom fade masks */}
          <div
            className="absolute left-0 right-0 top-0 pointer-events-none z-10"
            style={{
              height: centerOffset,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.3))',
            }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-none z-10"
            style={{
              height: centerOffset,
              background: 'linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.3))',
            }}
          />

          {/* Scrollable list */}
          <div
            ref={listRef}
            className="absolute inset-0 overflow-y-scroll"
            style={{ scrollbarWidth: 'none' }}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            {/* Top padding */}
            <div style={{ height: centerOffset }} />
            {allOptions.map((opt, i) => {
              const dist = Math.abs(i - selectedIndex);
              const scale = dist === 0 ? 1 : dist === 1 ? 0.88 : 0.76;
              const opacity = dist === 0 ? 1 : dist === 1 ? 0.6 : 0.3;
              const fontWeight = dist === 0 ? 600 : 400;
              return (
                <div
                  key={opt}
                  className="flex items-center justify-center cursor-pointer transition-all duration-150"
                  style={{ height: ITEM_HEIGHT }}
                  onClick={() => {
                    setSelectedIndex(i);
                    if (listRef.current) listRef.current.scrollTop = i * ITEM_HEIGHT;
                  }}
                >
                  <span
                    className="text-gray-900 transition-all duration-150"
                    style={{
                      fontSize: dist === 0 ? 18 : dist === 1 ? 16 : 14,
                      transform: `scale(${scale})`,
                      opacity,
                      fontWeight,
                    }}
                  >
                    {opt}
                  </span>
                </div>
              );
            })}
            {/* Bottom padding */}
            <div style={{ height: centerOffset }} />
          </div>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
}
