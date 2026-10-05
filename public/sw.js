// Service Worker Oficial de Parqu para Notificaciones Nativas en Segundo Plano (Android / iOS / Desktop)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
      return null;
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SHOW_PARQU_NOTIFICATION') return;
  const { title, options } = event.data.payload || {};
  if (title && self.registration && self.registration.showNotification) {
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
