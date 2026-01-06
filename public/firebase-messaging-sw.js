/* eslint-disable no-undef */

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCcpwlH9LumJuIWRGEEKg8vmILVhm9D8h8",
  authDomain: "smarthome-babad.firebaseapp.com",
  projectId: "smarthome-babad",
  storageBucket: "smarthome-babad.firebasestorage.app",
  messagingSenderId: "633175270592",
  appId: "1:633175270592:web:8a4050204512b5bce9b925",
});

const messaging = firebase.messaging();

// Nhận message khi app ở background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message ', payload);

  const title = payload.notification?.title || 'Smart Home';
  const options = {
    body: payload.notification?.body,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: payload.data,
  };

  self.registration.showNotification(title, options);
});

// Click notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
