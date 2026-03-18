'use client';

import { useState, useEffect } from 'react';

interface TimeFilterSheetProps {
  open: boolean;
  initialDateFrom?: string;
  initialDateTo?: string;
  onConfirm: (dateFrom: string, dateTo: string) => void;
  onClose: () => void;
}

type QuickOption = 'weekend' | 'week' | 'month' | '';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekendRange(): [string, string] {
  const today = new Date();
  const dow = today.getDay();
  const daysToSat = (6 - dow + 7) % 7 || 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysToSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return [formatDate(sat), formatDate(sun)];
}

function getWeekRange(): [string, string] {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 7);
  return [formatDate(today), formatDate(end)];
}

function getMonthRange(): [string, string] {
  const today = new Date();
  const end = new Date(today);
  end.setMonth(today.getMonth() + 1);
  return [formatDate(today), formatDate(end)];
}

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function TimeFilterSheet({ open, initialDateFrom, initialDateTo, onConfirm, onClose }: TimeFilterSheetProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedFrom, setSelectedFrom] = useState(initialDateFrom ?? '');
  const [selectedTo, setSelectedTo] = useState(initialDateTo ?? '');
  const [quickOption, setQuickOption] = useState<QuickOption>('');

  useEffect(() => {
    if (open) {
      setSelectedFrom(initialDateFrom ?? '');
      setSelectedTo(initialDateTo ?? '');
      setQuickOption('');
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function selectQuick(opt: QuickOption) {
    setQuickOption(opt);
    if (opt === 'weekend') {
      const [f, t] = getWeekendRange();
      setSelectedFrom(f);
      setSelectedTo(t);
    } else if (opt === 'week') {
      const [f, t] = getWeekRange();
      setSelectedFrom(f);
      setSelectedTo(t);
    } else if (opt === 'month') {
      const [f, t] = getMonthRange();
      setSelectedFrom(f);
      setSelectedTo(t);
    }
  }

  function handleDayClick(dateStr: string) {
    setQuickOption('');
    if (!selectedFrom || (selectedFrom && selectedTo)) {
      setSelectedFrom(dateStr);
      setSelectedTo('');
    } else if (dateStr < selectedFrom) {
      setSelectedTo(selectedFrom);
      setSelectedFrom(dateStr);
    } else {
      setSelectedTo(dateStr);
    }
  }

  function handleReset() {
    setSelectedFrom('');
    setSelectedTo('');
    setQuickOption('');
  }

  function handleConfirm() {
    onConfirm(selectedFrom, selectedTo || selectedFrom);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = formatDate(today);

  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, dateStr });
  }

  function getDayStyle(dateStr: string): string {
    const isToday = dateStr === todayStr;
    const isFrom = dateStr === selectedFrom;
    const isTo = dateStr === selectedTo;
    const inRange = selectedFrom && selectedTo && dateStr > selectedFrom && dateStr < selectedTo;

    if (isFrom || isTo) {
      return 'bg-gray-900 text-white rounded-full';
    }
    if (inRange) {
      return 'bg-gray-100 text-gray-900';
    }
    if (isToday) {
      return 'bg-gray-900 text-white rounded-full';
    }
    return 'text-gray-700';
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl pb-8 shadow-xl"
        style={{ maxWidth: 480, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <h2 className="text-[16px] font-semibold text-gray-900 flex-1 text-center">请选择日期</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick options */}
        <div className="flex gap-3 px-4 mb-5">
          {([
            { key: 'weekend', label: '本周末' },
            { key: 'week', label: '一个周内' },
            { key: 'month', label: '一月内' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => selectQuick(key)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-colors relative ${
                quickOption === key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {label}
              {quickOption === key && (
                <span className="absolute bottom-1.5 right-2 text-[10px]">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 mb-3">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold text-gray-900">
            {viewYear}年{viewMonth + 1}月
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-4 mb-1">
          {WEEK_DAYS.map(d => (
            <div key={d} className="text-center text-[12px] text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-4 gap-y-1">
          {cells.map((cell, i) => (
            <div key={i} className="flex items-center justify-center h-10">
              {cell ? (
                <button
                  onClick={() => handleDayClick(cell.dateStr)}
                  className={`w-9 h-9 flex items-center justify-center text-[13px] font-medium transition-colors ${getDayStyle(cell.dateStr)}`}
                >
                  {cell.day}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Bottom buttons */}
        <div className="flex gap-3 px-4 mt-5">
          <button
            onClick={handleReset}
            className="flex-1 py-3 rounded-2xl bg-[#FF4D4F]/10 text-[#FF4D4F] text-[15px] font-semibold"
          >
            重置
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] py-3 rounded-2xl bg-gray-900 text-white text-[15px] font-semibold"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
