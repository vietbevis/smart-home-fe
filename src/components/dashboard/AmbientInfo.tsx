'use client';

import { useEffect, useState } from 'react';
import { Sensors } from '@/types';

interface AmbientInfoProps {
  sensors: Sensors;
}

export function AmbientInfo({ sensors }: AmbientInfoProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTemperatureStatus = (temp: number) => {
    if (temp < 20) return { label: 'Lạnh', color: 'text-blue-500', icon: 'M12 2v10m0 0L9 9m3 3l3-3' };
    if (temp > 28) return { label: 'Nóng', color: 'text-red-500', icon: 'M12 14v8m0 0l-3-3m3 3l3-3' };
    return { label: 'Dễ chịu', color: 'text-green-500', icon: 'M5 13l4 4L19 7' };
  };

  const getHumidityStatus = (humidity: number) => {
    if (humidity < 40) return { label: 'Khô', color: 'text-orange-500' };
    if (humidity > 70) return { label: 'Ẩm', color: 'text-blue-500' };
    return { label: 'Tốt', color: 'text-green-500' };
  };

  const tempStatus = getTemperatureStatus(sensors.temperature ?? 25);
  const humidityStatus = getHumidityStatus(sensors.humidity ?? 50);

  const hour = currentTime.getHours();
  const getTimeIcon = () => {
    if (hour >= 5 && hour < 12) {
      return 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
    } else if (hour >= 12 && hour < 18) {
      return 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
    } else {
      return 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Temperature Card */}
      <div className="rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nhiệt độ</p>
            <p className="text-3xl font-bold">{sensors.temperature ?? '--'}°C</p>
            <p className={`text-sm font-medium mt-1 ${tempStatus.color}`}>
              {tempStatus.label}
            </p>
          </div>
          <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {/* Humidity Card */}
      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Độ ẩm</p>
            <p className="text-3xl font-bold">{sensors.humidity ?? '--'}%</p>
            <p className={`text-sm font-medium mt-1 ${humidityStatus.color}`}>
              {humidityStatus.label}
            </p>
          </div>
          <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
      </div>

      {/* Time of Day Card */}
      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Thời gian</p>
            <p className="text-3xl font-bold">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-sm font-medium mt-1 text-purple-500">
              {hour >= 5 && hour < 12 ? 'Buổi sáng' : 
               hour >= 12 && hour < 18 ? 'Buổi chiều' : 
               hour >= 18 && hour < 22 ? 'Buổi tối' : 'Đêm khuya'}
            </p>
          </div>
          <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTimeIcon()} />
          </svg>
        </div>
      </div>
    </div>
  );
}
