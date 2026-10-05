// Service Worker Oficial de Parqu - Notificacion Interactiva Estilo Dynamic Island en 2o Plano
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

// Mini onda compacta tipo Dynamic Island (solo 5 barras, nunca larga)
function buildIslandWave(frame, isActive = true) {
  let out = '';
  for (let i = 0; i < 5; i += 1) {
    const speed = isActive ? 0.85 : 0.45;
    const val = (Math.sin(frame * speed + i * 0.75) + 1) / 2;
    const idx = Math.min(
      WAVE_CHARS.length - 1,
      Math.max(0, Math.floor(val * WAVE_CHARS.length))
    );
    out += WAVE_CHARS[idx];
  }
  return out;
}

function arrayBufferToBase64DataUrl(buffer, mime = 'image/png') {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${self.btoa(binary)}`;
}

// Dibuja una pildora redondeada en Canvas
function drawRoundedPill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Genera una capsula estilo Dynamic Island de iPhone + Mini Centro de Control (sin barras largas)
async function buildDynamicIslandImage(s, clockStr, cost, frame) {
  if (typeof OffscreenCanvas === 'undefined') return undefined;
  try {
    const width = 600;
    const height = 210;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.clearRect(0, 0, width, height);

    // Capsula Dynamic Island centrada (no abarca todo el ancho)
    const pillW = 476;
    const pillH = 122;
    const pillX = Math.round((width - pillW) / 2);
    const pillY = 14;

    ctx.fillStyle = '#07080c';
    drawRoundedPill(ctx, pillX, pillY, pillW, pillH, 61);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = s.isActive ? '#38bdf8' : 'rgba(255,255,255,0.22)';
    ctx.stroke();

    // Izquierda de la Isla: Estado + Reloj en vivo
    ctx.textAlign = 'left';
    ctx.fillStyle = s.isActive ? '#38bdf8' : '#34d399';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      s.isActive ? `PARQU • ${s.plates || 'XYZ-7842'}` : `LISTO • ${s.plates || 'XYZ-7842'}`,
      pillX + 32,
      pillY + 40
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(s.isActive ? clockStr : '00:00:00', pillX + 32, pillY + 86);

    // Centro: Mini ondas estilo Dynamic Island
    const waveX = pillX + 250;
    for (let i = 0; i < 6; i += 1) {
      const amp = (Math.sin(frame * 0.85 + i * 0.7) + 1) / 2;
      const barH = Math.max(8, Math.round(amp * 34));
      const barY = pillY + Math.round((pillH - barH) / 2);
      ctx.fillStyle = s.isActive ? '#f59e0b' : '#38bdf8';
      drawRoundedPill(ctx, waveX + i * 9, barY, 5, barH, 2.5);
      ctx.fill();
    }

    // Derecha de la Isla: Cobro / Saldo
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(s.isActive ? 'COBRO ($6/H)' : 'SALDO NFC', pillX + pillW - 32, pillY + 40);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(
      s.isActive ? `$${cost}` : `$${s.balance || '320'}`,
      pillX + pillW - 32,
      pillY + 84
    );

    // Fila inferior: Mini Centro de Control de Accesos Rapidos (3 pildoras compactas)
    const autoPayOn = s.autoPayEnabled !== false;
    const pills = [
      {
        label: s.isActive ? 'FINALIZAR ESTANCIA' : 'INICIAR $6.00/HR',
        bg: s.isActive ? '#f59e0b' : '#0033ff',
        fg: s.isActive ? '#050505' : '#ffffff',
      },
      {
        label: '+$50 SALDO NFC',
        bg: '#111827',
        fg: '#38bdf8',
      },
      {
        label: autoPayOn ? 'AUTOCOBRO ON' : 'AUTOCOBRO OFF',
        bg: '#111827',
        fg: autoPayOn ? '#34d399' : '#94a3b8',
      },
    ];

    const dockW = 476;
    const dockX = pillX;
    const dockY = 148;
    const gap = 8;
    const itemW = Math.floor((dockW - gap * 2) / 3);
    const itemH = 44;

    pills.forEach((p, idx) => {
      const x = dockX + idx * (itemW + gap);
      ctx.fillStyle = p.bg;
      drawRoundedPill(ctx, x, dockY, itemW, itemH, 22);
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = p.fg;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(p.label, x + Math.round(itemW / 2), dockY + 26);
    });

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await blob.arrayBuffer();
    return arrayBufferToBase64DataUrl(buffer, 'image/png');
  } catch {
    return undefined;
  }
}

async function buildLiveBackgroundNotification(state, isSilentUpdate = true) {
  const s = state || latestParquState || {};
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta';
  const balance = Number(s.balance ?? 320).toFixed(2);
  const autoPayEnabled = s.autoPayEnabled !== false;
  const autoPayLabel = autoPayEnabled ? 'Auto ON' : 'Auto OFF';
  const wave = buildIslandWave(waveFrame, Boolean(s.isActive));

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
    const islandImage = await buildDynamicIslandImage(s, clockStr, cost, waveFrame);

    const title = `Centro Parqu  ${wave}  ${clockStr} • $${cost}`;
    const body = `Accesos Rápidos • ${plates} (${carDesc}) • Saldo $${balance} • ${autoPayLabel}`;

    return {
      title,
      options: {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        image: islandImage,
        tag: SINGLE_NOTIFICATION_TAG,
        renotify: !isSilentUpdate,
        silent: isSilentUpdate,
        requireInteraction: true,
        actions: [
          { action: 'stop_parking', title: 'Finalizar' },
          { action: 'add_balance_50', title: '+$50 NFC' },
          {
            action: 'toggle_autopay',
            title: autoPayEnabled ? 'Auto OFF' : 'Auto ON',
          },
        ],
        data: {
          url: './',
          timestamp: Date.now(),
        },
      },
    };
  }

  const islandImage = await buildDynamicIslandImage(s, '00:00:00', '0.00', waveFrame);
  const title = `Centro Parqu  ${wave}  ${plates} • $${balance}`;
  const body = `Accesos Rápidos ($6.00/hr) • ${carDesc} • ${autoPayLabel}`;

  return {
    title,
    options: {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: islandImage,
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: !isSilentUpdate,
      silent: isSilentUpdate,
      requireInteraction: true,
      actions: [
        { action: 'start_parking', title: 'Iniciar $6/h' },
        { action: 'add_balance_50', title: '+$50 NFC' },
        {
          action: 'toggle_autopay',
          title: autoPayEnabled ? 'Auto OFF' : 'Auto ON',
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

  if (action === 'start_parking') {
    const nowIso = new Date().toISOString();
    latestParquState = {
      ...(latestParquState || {}),
      isActive: true,
      startTime: nowIso,
      baseSeconds: 0,
      zoneName: 'Espacio #1042 • Centro Histórico',
      rate: '6.00',
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
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
        broadcastActionToClients({ action: 'STOP_PARKING', amount: finalCharge }),
      ])
    );
    return;
  }

  if (action === 'add_balance_50') {
    const s = latestParquState || {};
    const nextBalance = (Number(s.balance ?? 320) + 50).toFixed(2);
    latestParquState = {
      ...s,
      balance: nextBalance,
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
        broadcastActionToClients({ action: 'ADD_BALANCE', amount: 50 }),
      ])
    );
    return;
  }

  if (action === 'toggle_autopay') {
    const s = latestParquState || {};
    const nextAutoPay = !(s.autoPayEnabled !== false);
    latestParquState = {
      ...s,
      autoPayEnabled: nextAutoPay,
      autoPayStatus: nextAutoPay ? 'AUTOCOBRO ON' : 'AUTOCOBRO PAUSADO',
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationFrame(true),
        broadcastActionToClients({ action: 'TOGGLE_AUTOPAY', enabled: nextAutoPay }),
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
