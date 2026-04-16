'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Home, Shield } from 'lucide-react';

interface WelcomeMessageProps {
  isRegister: boolean;
}

export function WelcomeMessage({ isRegister }: WelcomeMessageProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  const messages = {
    login: {
      title: 'Chào cậu chủ đã trở lại',
      subtitle: 'Ngôi nhà của bạn đang chờ đợi...',
      icon: Home
    },
    register: {
      title: 'Chào mừng đến với SmartHome',
      subtitle: 'Hãy để chúng tôi chăm sóc ngôi nhà của bạn',
      icon: Sparkles
    }
  };

  const currentMessage = isRegister ? messages.register : messages.login;
  const fullText = currentMessage.title;

  useEffect(() => {
    // Reset when switching tabs
    setDisplayedText('');
    setCurrentIndex(0);
  }, [isRegister]);

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const Icon = currentMessage.icon;

  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20 backdrop-blur-sm">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Typing text */}
        <div className="text-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient min-h-[28px]">
            {displayedText}
            {currentIndex < fullText.length && (
              <span className={`inline-block w-0.5 h-5 bg-primary ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
            )}
          </h2>
          
          {/* Subtitle with fade in */}
          {currentIndex >= fullText.length && (
            <p className="text-sm text-muted-foreground mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {currentMessage.subtitle}
            </p>
          )}
        </div>

        {/* Decorative elements */}
        {currentIndex >= fullText.length && (
          <div className="flex justify-center gap-1 mt-4 animate-in fade-in duration-700 delay-300">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine" />
    </div>
  );
}
