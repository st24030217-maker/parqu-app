// Service Worker Oficial de Parqu - Monitor en Segundo Plano (Android / iOS / Desktop)
let latestParquState = null;
let backgroundIntervalId = null;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function buildLiveBackgroundNotification(state) {
  const s = state || latestParquState || {};
  const fullName = s.fullName || 'Sebastián Salinas';
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta Sportline';
  const balance = s.balance || '320.00';
  const rfidTag = s.rfidTag || 'NFC-MX-09142-PK';
  const autoPayStatus = s.autoPayEnabled !== false ? 'Autocobro Activo' : 'Autocobro en Pausa';

  if (s.isActive && s.startTime) {
    const elapsedSeconds = Math.max(
      Number(s.baseSeconds) || 0,
      Math.floor((Date.now() - new Date(s.startTime).getTime()) / 1000)
    );
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const rate = Number(s.rate || 6.0);
    const maxLimit = Number(s.maxLimit || 180.0);
    const cost = Math.min(maxLimit, Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2))).toFixed(2);

    const timeStr =
      hours > 0
        ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
        : `${minutes} min ${String(seconds).padStart(2, '0')} seg`;

    const title = `🟢 Parqu en 2º Plano • ${timeStr} ($${cost} MXN)`;
    const body = [
      `🚗 En Parquímetro: ${carDesc} • Placas ${plates}`,
      `📍 ${s.zoneName || 'Centro Histórico'} • Tarifa $${rate.toFixed(2)}/hr (${autoPayStatus})`,
      `👤 ${fullName} • 💳 Saldo NFC: $${balance} MXN`,
    ].join('\n');

    return {
      title,
      options: {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        tag: 'parqu-live-parking-status',
        renotify: false,
        requireInteraction: true,
        silent: false,
        vibrate: [160, 70, 160],
        actions: [
          { action: 'open', title: 'Abrir Parqu' },
          { action: 'refresh', title: 'Actualizar Tiempo' },
        ],
        data: {
          url: './',
          timestamp: Date.now(),
        },
      },
    };
  }

  // Cuando no hay parquímetro corriendo pero el usuario sale de la app: informa qué está pasando en Parqu
  const histText = s.historyText || '0 hr 00 min hoy';
  const title = `🛡️ Parqu en 2º Plano • ${plates} (${autoPayStatus})`;
  const body = [
    `🚗 ${carDesc} (${plates}) • Sin cobro activo (0h 00m)`,
    `💳 Pase NFC ${rfidTag} listo • Saldo: $${balance} MXN • Tarifa $6.00/hr`,
    `👤 ${fullName} • Historial: ${histText}`,
  ].join('\n');

  return {
    title,
    options: {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      tag: 'parqu-live-parking-status',
      renotify: true,
      requireInteraction: false,
      vibrate: [140, 60, 140],
      actions: [
        { action: 'open', title: 'Volver a Parqu' },
      ],
      data: {
        url: './',
        timestamp: Date.now(),
      },
    },
  };
}

function stopBackgroundLoop() {
  if (backgroundIntervalId) {
    clearInterval(backgroundIntervalId);
    backgroundIntervalId = null;
  }
}

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_PARQU_STATE') {
    latestParquState = event.data.payload || latestParquState;
    return;
  }

  if (event.data.type === 'APP_FOREGROUNDED') {
    stopBackgroundLoop();
    return;
  }

  if (event.data.type === 'SHOW_PARQU_NOTIFICATION' || event.data.type === 'APP_BACKGROUNDED') {
    if (event.data.payload && event.data.payload.state) {
      latestParquState = event.data.payload.state;
    }

    const { title, options } =
      event.data.payload && event.data.payload.title
        ? event.data.payload
        : buildLiveBackgroundNotification(latestParquState);

    stopBackgroundLoop();

    const showAndMonitorPromise = new Promise((resolve) => {
      if (self.registration && self.registration.showNotification) {
        self.registration
          .showNotification(title, options)
          .catch(() => {})
          .finally(() => {
            // Si el usuario salió de la app con sesión activa, actualizar la notificación cada 15s en segundo plano
            if (event.data.type === 'APP_BACKGROUNDED' && latestParquState && latestParquState.isActive) {
              let ticks = 0;
              backgroundIntervalId = setInterval(() => {
                ticks += 1;
                if (ticks > 12) {
                  stopBackgroundLoop();
                  resolve();
                  return;
                }
                const updated = buildLiveBackgroundNotification(latestParquState);
                self.registration.showNotification(updated.title, updated.options).catch(() => {});
              }, 15000);
            } else {
              resolve();
            }
          });
      } else {
        resolve();
      }
    });

    event.waitUntil(showAndMonitorPromise);
  }
});

self.addEventListener('notificationclick', (event) => {
  if (event.action === 'refresh') {
    const updated = buildLiveBackgroundNotification(latestParquState);
    event.waitUntil(self.registration.showNotification(updated.title, updated.options));
    return;
  }

  event.notification.close();
  stopBackgroundLoop();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
      return null;
    })
  );
});
