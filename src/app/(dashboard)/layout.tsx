'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMqtt } from '@/hooks/useMqtt';
import { Navbar } from '@/components/layout/Navbar';
import { UserPanel } from '@/components/layout/UserPanel';
import { initializeFCM } from '@/lib/firebase';
import { User } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, updateUser } = useAuth();
  const { connected } = useMqtt();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      initializeFCM();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar connected={connected} />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 lg:px-6">
        {children}
      </main>
      <UserPanel 
        user={user} 
        connected={connected} 
        onLogout={logout}
        onUserUpdate={(updates) => updateUser(updates as Partial<User>)}
      />
    </div>
  );
}
