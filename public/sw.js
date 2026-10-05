// Service Worker Oficial de Parqu - Telemetría Interactiva en Vivo en Segundo Plano (Sin Emojis)
let latestParquState = null;
let backgroundIntervalId = null;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function buildProgressBar(elapsedSeconds) {
  // Barra visual de progreso por cada hora (3600s)
  const ratio = Math.min(1, (elapsedSeconds % 3600) / 3600);
  const filled = Math.max(1, Math.round(ratio * 10));
  return '[' + '█'.repeat(filled) + '░'.repeat(10 - filled) + ']';
}

function buildLiveBackgroundNotification(state, isSilentUpdate = false) {
  const s = state || latestParquState || {};
  const fullName = s.fullName || 'Sebastián Salinas';
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta Sportline';
  const balance = s.balance || '320.00';
  const rfidTag = s.rfidTag || 'NFC-MX-09142-PK';
  const autoPayStatus = s.autoPayEnabled !== false ? 'AUTOCOBRO ON' : 'AUTOCOBRO PAUSADO';

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
    const cost = Math.min(
      maxLimit,
      Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2))
    ).toFixed(2);

    const clockStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const bar = buildProgressBar(elapsedSeconds);

    const title = `PARQU EN VIVO • ${clockStr} • $${cost} MXN`;
    const body = [
      `${bar} ACTIVO • Placas ${plates} (${carDesc})`,
      `Zona: ${s.zoneName || 'Centro Histórico'} • Tarifa $${rate.toFixed(2)}/hr • ${autoPayStatus}`,
      `Titular: ${fullName} • Saldo NFC: $${balance} MXN`,
    ].join('\n');

    return {
      title,
      options: {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        tag: 'parqu-live-parking-status',
        renotify: !isSilentUpdate,
        silent: isSilentUpdate,
        requireInteraction: true,
        vibrate: isSilentUpdate ? undefined : [140, 60, 140],
        actions: [
          { action: 'stop_parking', title: 'Finalizar Estancia' },
          { action: 'open_app', title: 'Abrir Panel en Vivo' },
        ],
        data: {
          url: './',
          timestamp: Date.now(),
        },
      },
    };
  }

  const histText = s.historyText || '0h 00m registrados';
  const title = `PARQU MONITOR • ${plates} • EN ESPERA`;
  const body = [
    `[──────────] SIN COBRO ACTIVO (00:00:00) • ${autoPayStatus}`,
    `Vehículo: ${carDesc} (${plates}) • Tarifa: $6.00/hr`,
    `Titular: ${fullName} • Pase ${rfidTag} • Saldo: $${balance} MXN (${histText})`,
  ].join('\n');

  return {
    title,
    options: {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      tag: 'parqu-live-parking-status',
      renotify: !isSilentUpdate,
      silent: isSilentUpdate,
      requireInteraction: false,
      vibrate: isSilentUpdate ? undefined : [120, 50, 120],
      actions: [
        { action: 'start_parking', title: 'Iniciar Parquimetro ($6/hr)' },
        { action: 'open_app', title: 'Abrir Parqu' },
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

function startBackgroundLiveLoop(resolvePromise) {
  stopBackgroundLoop();
  let ticks = 0;
  // Actualizar cada 5 segundos en vivo de forma silenciosa para que el reloj avance en la barra del teléfono
  backgroundIntervalId = setInterval(() => {
    ticks += 1;
    if (ticks > 60) {
      stopBackgroundLoop();
      if (resolvePromise) resolvePromise();
      return;
    }
    const updated = buildLiveBackgroundNotification(latestParquState, true);
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(updated.title, updated.options).catch(() => {});
    }
  }, 5000);
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

    const built = buildLiveBackgroundNotification(latestParquState, false);
    const title = (event.data.payload && event.data.payload.title) || built.title;
    const options = (event.data.payload && event.data.payload.options) || built.options;

    stopBackgroundLoop();

    const showAndMonitorPromise = new Promise((resolve) => {
      if (self.registration && self.registration.showNotification) {
        self.registration
          .showNotification(title, options)
          .catch(() => {})
          .finally(() => {
            if (event.data.type === 'APP_BACKGROUNDED') {
              startBackgroundLiveLoop(resolve);
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
  const action = event.action;

  if (action === 'start_parking') {
    latestParquState = {
      ...(latestParquState || {}),
      isActive: true,
      startTime: new Date().toISOString(),
      baseSeconds: 0,
      zoneName: 'Espacio #1042 • Centro Histórico',
      rate: '6.00',
    };
    const updated = buildLiveBackgroundNotification(latestParquState, false);

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(updated.title, updated.options),
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'PARQU_SW_ACTION', action: 'START_PARKING' });
          });
        }),
      ])
    );
    startBackgroundLiveLoop();
    return;
  }

  if (action === 'stop_parking') {
    latestParquState = {
      ...(latestParquState || {}),
      isActive: false,
      startTime: null,
      baseSeconds: 0,
    };
    stopBackgroundLoop();
    const updated = buildLiveBackgroundNotification(latestParquState, false);

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(updated.title, updated.options),
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'PARQU_SW_ACTION', action: 'STOP_PARKING' });
          });
        }),
      ])
    );
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
