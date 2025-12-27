'use client';

import { ReactNode } from 'react';
import { Permission } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
}

/**
 * Role-based component guard
 * Renders children only if user has the required permission
 */
export function RoleGuard({ children, permission, fallback = null }: RoleGuardProps) {
  const { can } = useAuth();
  
  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Convenience wrapper for admin-only content
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
