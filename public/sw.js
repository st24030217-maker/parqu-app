// Service Worker Oficial de Parqu - Notificacion Unica con Animacion en Vivo en la Barra del Telefono
const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';
const WAVE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

let latestParquState = null;
let backgroundIntervalId = null;
let waveFrame = 0;
let isShowingLock = false;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Genera una onda armonica en movimiento (estilo Anime.js) para la barra de notificaciones
function buildAnimatedWave(frame, length = 12, isActive = true) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const speed = isActive ? 0.75 : 0.4;
    const val = (Math.sin(frame * speed + i * 0.65) + 1) / 2; // 0..1
    const idx = Math.min(
      WAVE_CHARS.length - 1,
      Math.max(0, Math.floor(val * WAVE_CHARS.length))
    );
    out += WAVE_CHARS[idx];
  }
  return out;
}

// Genera una barra con pulso deslizante en vivo
function buildSweepingBar(frame, width = 10) {
  const pos = frame % width;
  let bar = '[';
  for (let i = 0; i < width; i += 1) {
    if (i === pos) {
      bar += '●';
    } else if (i < pos) {
      bar += '━';
    } else {
      bar += '─';
    }
  }
  bar += ']';
  return bar;
}

function buildLiveBackgroundNotification(state, isSilentUpdate = true) {
  const s = state || latestParquState || {};
  const fullName = s.fullName || 'Sebastián Salinas';
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta Sportline';
  const balance = s.balance || '320.00';
  const rfidTag = s.rfidTag || 'NFC-MX-09142-PK';
  const autoPayStatus = s.autoPayEnabled !== false ? 'AUTOCOBRO ON' : 'AUTOCOBRO PAUSADO';

  const wave = buildAnimatedWave(waveFrame, 10, Boolean(s.isActive));
  const sweep = buildSweepingBar(waveFrame, 10);

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

    const title = `PARQU ${wave} ${clockStr} • $${cost} MXN`;
    const body = [
      `${sweep} ACTIVO • Placas ${plates} (${carDesc})`,
      `Zona: ${s.zoneName || 'Centro Histórico'} • Tarifa $${rate.toFixed(2)}/hr • ${autoPayStatus}`,
      `Titular: ${fullName} • Saldo NFC: $${balance} MXN`,
    ].join('\n');

    return {
      title,
      options: {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        tag: SINGLE_NOTIFICATION_TAG,
        // renotify: false + silent: true evita que salgan multiples popups y actualiza la MISMA notificacion en vivo
        renotify: !isSilentUpdate,
        silent: isSilentUpdate,
        requireInteraction: true,
        actions: [
          { action: 'stop_parking', title: 'Finalizar Estancia' },
          { action: 'open_app', title: 'Abrir Parqu' },
        ],
        data: {
          url: './',
          timestamp: Date.now(),
        },
      },
    };
  }

  const histText = s.historyText || '0h 00m registrados';
  const title = `PARQU ${wave} ${plates} • EN VIVO`;
  const body = [
    `${sweep} EN ESPERA (00:00:00) • ${autoPayStatus}`,
    `Vehículo: ${carDesc} (${plates}) • Tarifa: $6.00/hr`,
    `Titular: ${fullName} • Pase ${rfidTag} • Saldo: $${balance} MXN (${histText})`,
  ].join('\n');

  return {
    title,
    options: {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: !isSilentUpdate,
      silent: isSilentUpdate,
      requireInteraction: false,
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

// Cierra cualquier notificacion duplicada con tags antiguos para garantizar SOLO UNA notificacion
async function closeOldDuplicateNotifications() {
  if (!self.registration || typeof self.registration.getNotifications !== 'function') return;
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach((n) => {
      if (n.tag !== SINGLE_NOTIFICATION_TAG) {
        n.close();
      }
    });
  } catch {
    // ignore
  }
}

async function renderSingleNotificationFrame(isSilentUpdate = true) {
  if (isShowingLock || !self.registration || !self.registration.showNotification) return;
  isShowingLock = true;
  try {
    await closeOldDuplicateNotifications();
    waveFrame += 1;
    const { title, options } = buildLiveBackgroundNotification(latestParquState, isSilentUpdate);
    await self.registration.showNotification(title, options);
  } catch {
    // ignore
  } finally {
    isShowingLock = false;
  }
}

function startBackgroundLiveLoop(resolvePromise) {
  stopBackgroundLoop();
  let ticks = 0;
  // Actualiza in-place la UNICA notificacion cada 1.5s para que la onda y el reloj se muevan en vivo en la barra
  backgroundIntervalId = setInterval(() => {
    ticks += 1;
    if (ticks > 120) {
      stopBackgroundLoop();
      if (resolvePromise) resolvePromise();
      return;
    }
    renderSingleNotificationFrame(true);
  }, 1500);
}

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_PARQU_STATE') {
    latestParquState = event.data.payload || latestParquState;
    return;
  }

  if (event.data.type === 'APP_FOREGROUNDED') {
    stopBackgroundLoop();
    // Al volver a entrar a la app, cerramos la notificacion de segundo plano para que no se acumulen
    if (self.registration && typeof self.registration.getNotifications === 'function') {
      event.waitUntil(
        self.registration
          .getNotifications()
          .then((list) => list.forEach((n) => n.close()))
          .catch(() => {})
      );
    }
    return;
  }

  if (event.data.type === 'SHOW_PARQU_NOTIFICATION' || event.data.type === 'APP_BACKGROUNDED') {
    if (event.data.payload && event.data.payload.state) {
      latestParquState = event.data.payload.state;
    } else if (event.data.payload) {
      latestParquState = event.data.payload;
    }

    stopBackgroundLoop();

    const showAndMonitorPromise = new Promise((resolve) => {
      // Primer cuadro silencioso o suave pero con un unico tag para que NUNCA salgan varias notificaciones
      renderSingleNotificationFrame(true).finally(() => {
        startBackgroundLiveLoop(resolve);
      });
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

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
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

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
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
