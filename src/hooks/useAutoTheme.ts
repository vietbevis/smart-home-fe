import { useState, useEffect } from 'react';

export type TimeTheme = 'morning' | 'afternoon' | 'evening';
export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeConfig {
  timeTheme: TimeTheme;
}

export function useAutoTheme(): ThemeConfig {
  const [timeTheme, setTimeTheme] = useState<TimeTheme>(() => getTimeTheme());

  useEffect(() => {
    const updateTheme = () => {
      const mode = (localStorage.getItem('themeMode') as ThemeMode) || 'auto';
      
      if (mode === 'light') {
        // Force light theme
        document.documentElement.classList.remove('dark', 'theme-morning', 'theme-afternoon', 'theme-evening');
        document.documentElement.classList.add('theme-morning');
        setTimeTheme('morning');
      } else if (mode === 'dark') {
        // Force dark theme
        document.documentElement.classList.remove('theme-morning', 'theme-afternoon', 'theme-evening');
        document.documentElement.classList.add('dark', 'theme-evening');
        setTimeTheme('evening');
      } else {
        // Auto mode - based on time
        const newTheme = getTimeTheme();
        setTimeTheme(newTheme);

        document.documentElement.classList.remove('theme-morning', 'theme-afternoon', 'theme-evening');
        document.documentElement.classList.add(`theme-${newTheme}`);
        
        // Apply dark mode for evening
        if (newTheme === 'evening') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    updateTheme();

    // Listen for theme changes from settings
    const handleThemeChange = () => updateTheme();
    window.addEventListener('themeChange', handleThemeChange);

    // Update every minute for auto mode
    const interval = setInterval(() => {
      const mode = localStorage.getItem('themeMode') || 'auto';
      if (mode === 'auto') {
        updateTheme();
      }
    }, 60000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  return { timeTheme };
}

function getTimeTheme(): TimeTheme {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'morning'; // 5:00 - 11:59: Buổi sáng
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon'; // 12:00 - 17:59: Buổi trưa/chiều
  } else {
    return 'evening'; // 18:00 - 4:59: Buổi tối
  }
}
