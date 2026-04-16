'use client';

import { useEffect, useState, useRef } from 'react';
import { UserCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export function PendingUsersBadge() {
  const [pendingCount, setPendingCount] = useState(0);
  const { isAdmin } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    const fetchPendingUsers = async () => {
      // Prevent concurrent requests
      if (isFetchingRef.current) return;
      
      isFetchingRef.current = true;
      try {
        const users = await api.getPendingUsers();
        setPendingCount(users.length);
      } catch (error) {
        console.error('Failed to fetch pending users:', error);
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Initial fetch
    fetchPendingUsers();
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Poll every 60 seconds (increased from 30)
    intervalRef.current = setInterval(fetchPendingUsers, 60000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAdmin]);

  if (!isAdmin || pendingCount === 0) return null;

  return (
    <Link
      href="/users"
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-warning text-warning-foreground shadow-lg hover:bg-warning/90 transition-all animate-pulse"
    >
      <UserCheck className="h-5 w-5" />
      <span className="font-medium">
        {pendingCount} người dùng chờ duyệt
      </span>
    </Link>
  );
}
