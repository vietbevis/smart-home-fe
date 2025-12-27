import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCcpwlH9LumJuIWRGEEKg8vmILVhm9D8h8",
  authDomain: "smarthome-babad.firebaseapp.com",
  projectId: "smarthome-babad",
  storageBucket: "smarthome-babad.firebasestorage.app",
  messagingSenderId: "633175270592",
  appId: "1:633175270592:web:8a4050204512b5bce9b925",
  measurementId: "G-SCRRX5E1QK"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Background message:', payload);

  const notificationTitle = payload.notification?.title || 'Smart Home';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
