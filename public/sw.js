// Service Worker Oficial de Parqu - Notificacion Interactiva Estilo Uber / DiDi con Control Total en 2o Plano
const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';
const WAVE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

let latestParquState = null;
let pendingActionsQueue = [];
let backgroundIntervalId = null;
let waveFrame = 0;
let isShowingLock = false;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Barra de progreso estilo Uber / DiDi en vivo
function buildUberStyleTrack(frame, isActive) {
  const width = 12;
  if (!isActive) {
    return '○' + '─'.repeat(width) + '○';
  }
  const pos = frame % width;
  let track = '●';
  for (let i = 0; i < width; i += 1) {
    if (i < pos) {
      track += '━';
    } else if (i === pos) {
      track += '◈';
    } else {
      track += '─';
    }
  }
  track += '◉';
  return track;
}

function buildAnimatedWave(frame, length = 6, isActive = true) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const speed = isActive ? 0.8 : 0.4;
    const val = (Math.sin(frame * speed + i * 0.7) + 1) / 2;
    const idx = Math.min(
      WAVE_CHARS.length - 1,
      Math.max(0, Math.floor(val * WAVE_CHARS.length))
    );
    out += WAVE_CHARS[idx];
  }
  return out;
}

// Convierte un ArrayBuffer a Base64 Data URL dentro del Service Worker para mostrar imagen en vivo estilo Uber/DiDi
function arrayBufferToBase64DataUrl(buffer, mime = 'image/png') {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${self.btoa(binary)}`;
}

// Genera una tarjeta grafica en vivo con OffscreenCanvas (como el widget de viaje de Uber / DiDi)
async function buildUberLiveBannerImage(s, clockStr, cost, frame) {
  if (typeof OffscreenCanvas === 'undefined') return undefined;
  try {
    const width = 640;
    const height = 220;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Fondo oscuro elegante estilo Uber / Parqu
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Linea superior de acento
    ctx.fillStyle = s.isActive ? '#0033FF' : '#10b981';
    ctx.fillRect(0, 0, width, 6);

    // Etiqueta de estado superior izquierda
    ctx.fillStyle = s.isActive ? '#60a5fa' : '#34d399';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(
      s.isActive ? 'PARQU EN CURSO • CONTROL ACTIVO' : 'PARQU DISPONIBLE • CONTROL EN 2O PLANO',
      28,
      38
    );

    // Placas a la derecha
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(width - 168, 16, 140, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(String(s.plates || 'XYZ-7842'), width - 150, 38);

    // Reloj gigante y Costo estilo Uber Live Activity
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px monospace';
    ctx.fillText(s.isActive ? clockStr : '00:00:00', 28, 102);

    ctx.fillStyle = s.isActive ? '#38bdf8' : '#94a3b8';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(s.isActive ? `$${cost} MXN` : '$6.00/hr', 310, 98);

    // Barra de progreso tipo ruta Uber/DiDi
    const barX = 28;
    const barY = 132;
    const barW = width - 56;
    const barH = 10;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);

    const progressRatio = s.isActive ? ((frame % 20) + 1) / 20 : 0.15;
    ctx.fillStyle = s.isActive ? '#0033FF' : '#10b981';
    ctx.fillRect(barX, barY, Math.round(barW * progressRatio), barH);

    // Punto indicador animado en la barra
    const dotX = barX + Math.round(barW * progressRatio);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dotX, barY + barH / 2, 9, 0, Math.PI * 2);
    ctx.fill();

    // Ondas de telemetria a la derecha
    const waveXStart = width - 155;
    for (let i = 0; i < 10; i += 1) {
      const amp = (Math.sin(frame * 0.8 + i * 0.65) + 1) / 2;
      const h = Math.max(6, Math.round(amp * 34));
      ctx.fillStyle = s.isActive ? '#3b82f6' : '#10b981';
      ctx.fillRect(waveXStart + i * 12, 96 - h, 7, h);
    }

    // Pie de tarjeta: Vehiculo, Titular y Saldo NFC
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(
      `${s.carDesc || 'Volkswagen Jetta'} • Saldo NFC: $${s.balance || '320.00'} MXN • ${
        s.autoPayEnabled !== false ? 'Autocobro ON' : 'Autocobro OFF'
      }`,
      28,
      188
    );

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await blob.arrayBuffer();
    return arrayBufferToBase64DataUrl(buffer, 'image/png');
  } catch {
    return undefined;
  }
}

async function buildLiveBackgroundNotification(state, isSilentUpdate = true) {
  const s = state || latestParquState || {};
  const fullName = s.fullName || 'Sebastián Salinas';
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta Sportline';
  const balance = Number(s.balance ?? 320).toFixed(2);
  const autoPayEnabled = s.autoPayEnabled !== false;
  const autoPayLabel = autoPayEnabled ? 'Autocobro: ON' : 'Autocobro: OFF';

  const track = buildUberStyleTrack(waveFrame, Boolean(s.isActive));
  const wave = buildAnimatedWave(waveFrame, 6, Boolean(s.isActive));

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
    const bannerImage = await buildUberLiveBannerImage(s, clockStr, cost, waveFrame);

    const title = `PARQU EN CURSO • ${clockStr} • $${cost} MXN  ${wave}`;
    const body = [
      `${track}  ${s.zoneName || 'Espacio #1042'} ($${rate.toFixed(2)}/hr)`,
      `${carDesc} (${plates}) • ${fullName}`,
      `Saldo NFC: $${balance} MXN • ${autoPayLabel}${s.lastActionNote ? ` • ${s.lastActionNote}` : ''}`,
    ].join('\n');

    return {
      title,
      options: {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        image: bannerImage,
        tag: SINGLE_NOTIFICATION_TAG,
        renotify: !isSilentUpdate,
        silent: isSilentUpdate,
        requireInteraction: true,
        // Controles interactivos directos desde la notificacion (sin necesidad de abrir la app)
        actions: [
          { action: 'stop_parking', title: 'Finalizar y Cobrar' },
          { action: 'add_balance_50', title: '+$50 Saldo NFC' },
          {
            action: 'toggle_autopay',
            title: autoPayEnabled ? 'Pausar Autocobro' : 'Activar Autocobro',
          },
        ],
        data: {
          url: './',
          timestamp: Date.now(),
        },
      },
    };
  }

  const bannerImage = await buildUberLiveBannerImage(s, '00:00:00', '0.00', waveFrame);
  const title = `PARQU CONTROL • ${plates} • Saldo $${balance}  ${wave}`;
  const body = [
    `${track}  Listo para estacionar • Tarifa $6.00/hr`,
    `${carDesc} (${plates}) • ${fullName}`,
    `${autoPayLabel}${s.lastActionNote ? ` • ${s.lastActionNote}` : ' • Toca abajo para controlar desde aqui'}`,
  ].join('\n');

  return {
    title,
    options: {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: bannerImage,
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: !isSilentUpdate,
      silent: isSilentUpdate,
      requireInteraction: true,
      // Controles interactivos directos en la notificacion cuando esta en espera
      actions: [
        { action: 'start_parking', title: 'Iniciar ($6.00/hr)' },
        { action: 'add_balance_50', title: '+$50 Saldo NFC' },
        {
          action: 'toggle_autopay',
          title: autoPayEnabled ? 'Pausar Autocobro' : 'Activar Autocobro',
        },
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
    const { title, options } = await buildLiveBackgroundNotification(
      latestParquState,
      isSilentUpdate
    );
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

async function broadcastActionToClients(actionObj) {
  pendingActionsQueue.push(actionObj);
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clients && clients.length > 0) {
      clients.forEach((client) => {
        client.postMessage({
          type: 'PARQU_SW_ACTION',
          ...actionObj,
          state: latestParquState,
        });
      });
      pendingActionsQueue = [];
    }
  } catch {
    // ignore
  }
}

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_PARQU_STATE') {
    latestParquState = {
      ...(latestParquState || {}),
      ...(event.data.payload || {}),
    };
    return;
  }

  if (event.data.type === 'APP_FOREGROUNDED') {
    stopBackgroundLoop();
    // Si el usuario ejecuto acciones desde la notificacion mientras estaba fuera, sincronizarlas con la app
    if (pendingActionsQueue.length > 0 && event.source) {
      pendingActionsQueue.forEach((act) => {
        event.source.postMessage({
          type: 'PARQU_SW_ACTION',
          ...act,
          state: latestParquState,
        });
      });
      pendingActionsQueue = [];
    }
    // Cerrar la notificacion de segundo plano al entrar a la app para que no se duplique
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
      renderSingleNotificationFrame(true).finally(() => {
        startBackgroundLiveLoop(resolve);
      });
    });

    event.waitUntil(showAndMonitorPromise);
  }
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;

  // 1. INICIAR PARQUIMETRO DESDE LA NOTIFICACION (SIN ABRIR LA APP)
  if (action === 'start_parking') {
    const nowIso = new Date().toISOString();
    latestParquState = {
      ...(latestParquState || {}),
      isActive: true,
      startTime: nowIso,
      baseSeconds: 0,
      zoneName: 'Espacio #1042 • Centro Histórico',
      rate: '6.00',
      lastActionNote: 'Iniciado desde notificacion',
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
        broadcastActionToClients({ action: 'START_PARKING', startTime: nowIso }),
      ])
    );
    startBackgroundLiveLoop();
    return;
  }

  // 2. FINALIZAR Y COBRAR DESDE LA NOTIFICACION (SIN ABRIR LA APP)
  if (action === 'stop_parking') {
    const s = latestParquState || {};
    const elapsedSeconds = s.startTime
      ? Math.max(Number(s.baseSeconds) || 0, Math.floor((Date.now() - new Date(s.startTime).getTime()) / 1000))
      : 0;
    const rate = Number(s.rate || 6.0);
    const finalCharge = Math.max(2.0, Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2)));
    const prevBalance = Number(s.balance ?? 320);
    const nextBalance = Math.max(0, prevBalance - finalCharge).toFixed(2);

    latestParquState = {
      ...s,
      isActive: false,
      startTime: null,
      baseSeconds: 0,
      balance: nextBalance,
      lastActionNote: `Cobrado $${finalCharge.toFixed(2)} MXN`,
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
        broadcastActionToClients({ action: 'STOP_PARKING', amount: finalCharge }),
      ])
    );
    return;
  }

  // 3. RECARGAR +$50 MXN DESDE LA NOTIFICACION (SIN ABRIR LA APP)
  if (action === 'add_balance_50') {
    const s = latestParquState || {};
    const nextBalance = (Number(s.balance ?? 320) + 50).toFixed(2);
    latestParquState = {
      ...s,
      balance: nextBalance,
      lastActionNote: 'Recarga +$50 MXN aplicada',
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
        broadcastActionToClients({ action: 'ADD_BALANCE', amount: 50 }),
      ])
    );
    return;
  }

  // 4. ACTIVAR / PAUSAR AUTOCOBRO DESDE LA NOTIFICACION (SIN ABRIR LA APP)
  if (action === 'toggle_autopay') {
    const s = latestParquState || {};
    const nextAutoPay = !(s.autoPayEnabled !== false);
    latestParquState = {
      ...s,
      autoPayEnabled: nextAutoPay,
      autoPayStatus: nextAutoPay ? 'AUTOCOBRO ON' : 'AUTOCOBRO PAUSADO',
      lastActionNote: nextAutoPay ? 'Autocobro activado' : 'Autocobro pausado',
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
        broadcastActionToClients({ action: 'TOGGLE_AUTOPAY', enabled: nextAutoPay }),
      ])
    );
    return;
  }

  // Si toca el cuerpo general de la notificacion, lo lleva de regreso a Parqu
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
