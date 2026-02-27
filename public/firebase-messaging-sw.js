
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCLfVrwYOKRRhNam0PtRPDwITuw5WjkZwI",
  authDomain: "pdds-party.firebaseapp.com",
  projectId: "pdds-party",
  storageBucket: "pdds-party.firebasestorage.app",
  messagingSenderId: "291422728961",
  appId: "1:291422728961:web:fba714f20306fe6985a100"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
