// Legacy sw.js killer - CERO notificaciones, se desregistra de inmediato para limpiar cachés viejos.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (self.registration && typeof self.registration.getNotifications === 'function') {
          const list = await self.registration.getNotifications();
          list.forEach((n) => n.close());
        }
        await self.registration.unregister();
      } catch {
        // ignore
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  event.waitUntil(
    (async () => {
      try {
        if (self.registration && typeof self.registration.getNotifications === 'function') {
          const list = await self.registration.getNotifications();
          list.forEach((n) => n.close());
        }
        await self.registration.unregister();
      } catch {
        // ignore
      }
    })()
  );
});
