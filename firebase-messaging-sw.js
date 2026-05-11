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

// Show notification when app is in background
messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    data:  { url: payload.fcmOptions?.link || 'https://goldbullsfx.pages.dev' },
  });
});

// Open app when notification is tapped
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || 'https://goldbullsfx.pages.dev';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
