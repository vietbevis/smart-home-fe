'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ThemeMode = 'light' | 'dark' | 'auto';

export function ThemeSettings() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('themeMode') as ThemeMode) || 'auto';
    }
    return 'auto';
  });

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
    
    // Trigger theme update
    window.dispatchEvent(new CustomEvent('themeChange', { detail: mode }));
  };

  const themes = [
    {
      value: 'light' as ThemeMode,
      label: 'Sáng',
      description: 'Giao diện sáng luôn',
      icon: Sun,
      gradient: 'from-blue-50 to-cyan-50'
    },
    {
      value: 'dark' as ThemeMode,
      label: 'Tối',
      description: 'Giao diện tối luôn',
      icon: Moon,
      gradient: 'from-indigo-950 to-blue-950'
    },
    {
      value: 'auto' as ThemeMode,
      label: 'Tự động',
      description: 'Thay đổi theo thời gian',
      icon: Clock,
      gradient: 'from-orange-50 via-blue-50 to-indigo-950'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-1">Chế độ giao diện</h4>
        <p className="text-sm text-muted-foreground">
          Chọn giao diện hiển thị của ứng dụng
        </p>
      </div>

      <div className="space-y-3">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = themeMode === theme.value;
          
          return (
            <button
              key={theme.value}
              onClick={() => handleThemeChange(theme.value)}
              className={cn(
                'w-full p-4 rounded-xl border-2 transition-all text-left',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                  `bg-gradient-to-br ${theme.gradient}`,
                  theme.value === 'dark' && 'text-white'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{theme.label}</span>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {theme.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {themeMode === 'auto' && (
        <div className="p-4 rounded-xl bg-muted/50 border">
          <p className="text-sm font-medium mb-2">Lịch tự động:</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              <span>5:00 - 11:59: Buổi sáng (sáng)</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-orange-500" />
              <span>12:00 - 17:59: Buổi trưa (vàng)</span>
            </div>
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-400" />
              <span>18:00 - 4:59: Buổi tối (tối)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
