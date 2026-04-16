import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

interface GreetingData {
  greeting: string;
  timeOfDay: TimeOfDay;
  animation: JSX.Element;
}

export function useTimeBasedGreeting(userName?: string): GreetingData {
  const [greetingData, setGreetingData] = useState<GreetingData>(() => 
    getGreetingData(userName)
  );

  useEffect(() => {
    const updateGreeting = () => {
      setGreetingData(getGreetingData(userName));
    };

    // Update every minute
    const interval = setInterval(updateGreeting, 60000);
    
    return () => clearInterval(interval);
  }, [userName]);

  return greetingData;
}

function getGreetingData(userName?: string): GreetingData {
  const hour = new Date().getHours();
  const name = userName || 'bạn';

  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Chào buổi sáng tốt lành, ${name}`,
      timeOfDay: 'morning',
      animation: (
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 animate-spin-slow" viewBox="0 0 100 100" fill="none">
            {/* Sun rays */}
            <g className="text-yellow-400">
              <line x1="50" y1="10" x2="50" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="50" y1="80" x2="50" y2="90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="10" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="80" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="21" y1="21" x2="28" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="72" y1="72" x2="79" y2="79" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="79" y1="21" x2="72" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="28" y1="72" x2="21" y2="79" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </g>
            {/* Sun circle */}
            <circle cx="50" cy="50" r="18" fill="currentColor" className="text-yellow-400" />
            <circle cx="50" cy="50" r="15" fill="currentColor" className="text-yellow-300" />
          </svg>
        </div>
      )
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      greeting: `Chào buổi trưa, ${name}`,
      timeOfDay: 'afternoon',
      animation: (
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none">
            {/* Outer glow */}
            <circle cx="50" cy="50" r="30" fill="currentColor" className="text-orange-200 opacity-30 animate-ping" />
            {/* Middle glow */}
            <circle cx="50" cy="50" r="22" fill="currentColor" className="text-orange-300 opacity-50 animate-pulse" />
            {/* Sun core */}
            <circle cx="50" cy="50" r="16" fill="currentColor" className="text-orange-400" />
          </svg>
        </div>
      )
    };
  } else {
    return {
      greeting: `Chúc buổi tối tốt lành, ${name}`,
      timeOfDay: 'evening',
      animation: (
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none">
            {/* Moon - larger and brighter */}
            <path 
              d="M70 20 A 30 30 0 1 1 70 80 A 25 25 0 1 0 70 20" 
              fill="currentColor" 
              className="text-yellow-100 animate-pulse"
            />
            {/* Moon glow */}
            <path 
              d="M70 20 A 30 30 0 1 1 70 80 A 25 25 0 1 0 70 20" 
              fill="currentColor" 
              className="text-yellow-200/30 blur-sm"
              transform="scale(1.1) translate(-2, -2)"
            />
          </svg>
          {/* Stars - bigger and more visible */}
          <div className="absolute top-1 left-2 w-2 h-2 bg-yellow-100 rounded-full animate-twinkle shadow-lg shadow-yellow-100/50" />
          <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-blue-100 rounded-full animate-twinkle shadow-lg shadow-blue-100/50" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-4 left-3 w-1.5 h-1.5 bg-yellow-100 rounded-full animate-twinkle shadow-lg shadow-yellow-100/50" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-2 right-3 w-2 h-2 bg-blue-100 rounded-full animate-twinkle shadow-lg shadow-blue-100/50" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-8 left-1 w-1 h-1 bg-white rounded-full animate-twinkle" style={{ animationDelay: '0.3s' }} />
          <div className="absolute bottom-8 right-1 w-1 h-1 bg-white rounded-full animate-twinkle" style={{ animationDelay: '1.2s' }} />
        </div>
      )
    };
  }
}
