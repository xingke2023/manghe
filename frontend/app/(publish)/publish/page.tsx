'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getPublishStatus } from '@/lib/api/publish';

export default function PublishEntryPage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }

    getPublishStatus(token).then((s) => {
      if (s.value_test_status === 0) {
        router.replace('/publish/value-test');
      } else if (s.value_test_status === 2) {
        router.replace('/publish/value-test/result?status=pending');
      } else if (!s.has_deposit) {
        router.replace('/publish/deposit');
      } else {
        router.replace('/publish/create');
      }
    }).catch(() => router.replace('/publish/value-test'));
  }, [isAuthenticated, token, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}
