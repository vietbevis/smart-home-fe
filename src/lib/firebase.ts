import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { toast } from 'sonner';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: Messaging | null = null;

// Only initialize messaging on client side
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Firebase messaging not supported:', error);
  }
}

// Register token with backend
async function registerTokenWithBackend(token: string) {
  try {
    const authToken = localStorage.getItem('token');
    if (!authToken) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token, platform: 'web' })
    });
    console.log('✅ FCM token registered with backend');
  } catch (error) {
    console.error('Failed to register token:', error);
  }
}

export async function initializeFCM() {
  if (typeof window === 'undefined' || !messaging) return;
  
  try {
    // Register service worker
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    
    if (token) {
      console.log('FCM Token:', token);
      await registerTokenWithBackend(token);
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log('📩 Foreground message:', payload);
      
      // Show toast notification
      toast(payload.notification?.title || 'Thông báo', {
        description: payload.notification?.body,
        duration: 5000,
      });

      // Play alert sound for critical notifications
      if (payload.data?.level === 'CRITICAL') {
        const audio = new Audio('/alert.mp3');
        audio.play().catch(() => {});
      }
    });

  } catch (error) {
    console.error('FCM initialization error:', error);
  }
}

export { app, messaging };
