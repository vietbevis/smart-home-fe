'use client';

import { Lock } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { SecuritySettings } from '@/components/settings/SecuritySettings';

/**
 * Security Settings Page - Admin Only
 * RFID and Keypad configuration
 */
export default function SettingsPage() {
  const { can } = usePermissions();

  // Access denied for non-admins
  if (!can('security:manage')) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 mb-4">
          <Lock className="h-8 w-8 text-danger" />
        </div>
        <h1 className="text-xl font-bold mb-2">Truy cập bị từ chối</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể
          quản lý cài đặt bảo mật.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Cài đặt bảo mật</h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý RFID, mã PIN và cấu hình bảo mật
        </p>
      </div>

      {/* Security Settings Component */}
      <SecuritySettings />
    </div>
  );
}
