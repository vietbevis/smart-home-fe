import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartHome - Bảng điều khiển nhà thông minh',
  description: 'Hệ thống giám sát và điều khiển nhà thông minh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster 
            richColors 
            position="top-right"
            toastOptions={{
              className: 'rounded-xl',
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
