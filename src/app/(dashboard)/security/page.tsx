'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Security page - redirects to /settings
 * The security settings are now consolidated in the settings page
 */
export default function SecurityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
