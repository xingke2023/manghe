'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUnreadCount } from '@/lib/api/notifications';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    const nick = (user as unknown as { nickname?: string }).nickname;
    if (!nick || /^用户\d{4}$/.test(nick)) {
      router.replace('/register');
    }
  }, [user, loading, router, pathname]);

  const pollUnread = useCallback(async () => {
    if (!token) return;
    try {
      const { count } = await getUnreadCount(token);
      setUnreadCount(count);
    } catch {
      // ignore
    }
  }, [token]);

  // Poll unread count every 30s
  useEffect(() => {
    pollUnread();
    const id = setInterval(pollUnread, 30000);
    return () => clearInterval(id);
  }, [pollUnread]);

  const tabs = [
    {
      href: '/',
      label: '首页',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
          <path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" fill="none" />
        </svg>
      ),
    },
    {
      href: '/messages',
      label: '消息',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: '我的',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]" style={{ maxWidth: 480, margin: '0 auto' }}>
      <main className="flex-1 pb-16">
        {children}
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-white border-t border-gray-100 flex z-50" style={{ maxWidth: 480 }}>
        {tabs.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          const showBadge = href === '/messages' && unreadCount > 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${active ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <span className="relative">
                {icon(active)}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-pink-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
