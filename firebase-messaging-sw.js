importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyD3z4gPaTzVigmBQQvG_cTVPpQDC_mXJQ4",
  authDomain:        "goldbullsfx-125e0.firebaseapp.com",
  projectId:         "goldbullsfx-125e0",
  storageBucket:     "goldbullsfx-125e0.firebasestorage.app",
  messagingSenderId: "384063050053",
  appId:             "1:384063050053:web:889dc7ae5e72db2aa02e2c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
  });
});
