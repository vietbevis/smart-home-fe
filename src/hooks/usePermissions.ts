'use client';

import { useAuth } from '@/context/AuthContext';
import { Permission, Role } from '@/types';

// Centralized permission definitions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'device:control',
    'emergency:control',
    'security:view',
    'security:manage',
    'alerts:view',
  ],
  USER: [
    'device:control',
    'emergency:control',
    'alerts:view',
  ],
};

/**
 * Hook for checking user permissions
 * Centralizes all permission logic in one place
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  };

  const canAny = (permissions: Permission[]): boolean => {
    return permissions.some(p => can(p));
  };

  const canAll = (permissions: Permission[]): boolean => {
    return permissions.every(p => can(p));
  };

  return {
    can,
    canAny,
    canAll,
    isAdmin: role === 'ADMIN',
    isAuthenticated: !!user,
  };
}
