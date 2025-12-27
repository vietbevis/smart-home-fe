'use client';

import { DoorHistory } from '@/components/devices/DoorHistory';

export default function DoorHistoryPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Lịch sử ra vào</h1>
        <p className="text-sm text-muted-foreground">
          Xem lịch sử đóng/mở cửa từ thiết bị ESP32
        </p>
      </div>

      <DoorHistory />
    </div>
  );
}
