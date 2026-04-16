'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ThemeMode = 'light' | 'dark' | 'auto';

export function ThemeQuickSwitch() {
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
    { value: 'light' as ThemeMode, icon: Sun, label: 'Sáng' },
    { value: 'dark' as ThemeMode, icon: Moon, label: 'Tối' },
    { value: 'auto' as ThemeMode, icon: Clock, label: 'Tự động' }
  ];

  return (
    <div>
      <span className="text-sm text-muted-foreground mb-2 block">Giao diện</span>
      <div className="flex items-center gap-2">
        {themes.map((theme) => {
          const Icon = theme.icon;
          const isSelected = themeMode === theme.value;
          
          return (
            <button
              key={theme.value}
              onClick={() => handleThemeChange(theme.value)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
              title={theme.label}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{theme.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
