import { Role, Permission } from '@/types';

// Centralized permission definitions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'device:control',
    'emergency:control',
    'security:view',
    'security:manage',
    'users:manage',
    'alerts:view',
  ],
  USER: [
    'device:control',
    'emergency:control',
    'alerts:view',
  ],
};

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role | undefined, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
