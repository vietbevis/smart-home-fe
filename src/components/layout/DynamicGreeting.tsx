'use client';

import { useTimeBasedGreeting } from '@/hooks/useTimeBasedGreeting';
import { User } from '@/types';

interface DynamicGreetingProps {
  user: User;
  deviceCount?: number;
  activeDevices?: number;
}

export function DynamicGreeting({ user, deviceCount = 0, activeDevices = 0 }: DynamicGreetingProps) {
  const { greeting, timeOfDay, animation } = useTimeBasedGreeting(user.username);

  const getContextMessage = () => {
    if (activeDevices === 0) {
      return 'Không có thiết bị nào đang hoạt động';
    }
    return `${activeDevices}/${deviceCount} thiết bị đang hoạt động`;
  };

  const getGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30';
      case 'afternoon':
        return 'from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-yellow-950/30';
      case 'evening':
        return 'from-indigo-950 via-purple-950 to-blue-950 dark:from-indigo-950 dark:via-purple-950 dark:to-blue-950';
    }
  };

  const textColor = timeOfDay === 'evening' ? 'text-white' : 'text-foreground';
  const subtextColor = timeOfDay === 'evening' ? 'text-blue-200' : 'text-muted-foreground';

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${getGradient()} p-4 sm:p-6 shadow-lg transition-all duration-1000 ease-in-out`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 sm:gap-4 mb-2">
            <div className="transition-transform duration-500 hover:scale-110 shrink-0">
              {animation}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-lg sm:text-2xl font-bold ${textColor} break-words transition-colors duration-700`}>
                {greeting}
              </h1>
              <p className={`text-xs sm:text-sm ${subtextColor} mt-1 transition-colors duration-700`}>
                {getContextMessage()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 w-full sm:w-auto justify-between sm:justify-start">
          <div className={`text-xs ${subtextColor} text-left sm:text-right transition-colors duration-700`}>
            {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'short', 
              day: 'numeric',
              month: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className={`text-base sm:text-lg font-semibold ${textColor} transition-colors duration-700`}>
            {new Date().toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
