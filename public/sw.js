// Service Worker Oficial de Parqu - Notificacion Unica Estructurada (Cero Spam, Sin Bucles)
const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';

let latestParquState = null;
let pendingActionsQueue = [];
let isShowingLock = false;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function arrayBufferToBase64DataUrl(buffer, mime = 'image/png') {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mime};base64,${self.btoa(binary)}`;
}

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

async function buildControlBlockImage(s, clockStr, cost) {
  if (typeof OffscreenCanvas === 'undefined') return undefined;
  try {
    const width = 600;
    const height = 220;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.clearRect(0, 0, width, height);

    const scheduledHours = Math.max(1, Number(s.scheduledHours) || 1);
    const plates = s.plates || 'XYZ-7842';
    const balance = Number(s.balance ?? 320).toFixed(2);

    const pillW = 520;
    const pillH = 126;
    const pillX = Math.round((width - pillW) / 2);
    const pillY = 12;

    ctx.fillStyle = '#07080c';
    drawRoundedPill(ctx, pillX, pillY, pillW, pillH, 63);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = s.isActive ? '#38bdf8' : 'rgba(255,255,255,0.24)';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = s.isActive ? '#38bdf8' : '#34d399';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      s.isActive
        ? `MONITOREO • ${plates} • ${scheduledHours}H`
        : `EN ESPERA • ${plates}`,
      pillX + 32,
      pillY + 40
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(s.isActive ? clockStr : '00:00:00', pillX + 32, pillY + 84);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(
      s.isActive
        ? `TIEMPO: ${scheduledHours} HORA${scheduledHours > 1 ? 'S' : ''} ($${(scheduledHours * 6).toFixed(2)} MXN)`
        : 'TARIFA OFICIAL: $6.00 MXN / HORA',
      pillX + 32,
      pillY + 108
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(s.isActive ? 'COBRO ACTUAL' : 'SALDO NFC', pillX + pillW - 32, pillY + 40);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(
      s.isActive ? `$${cost}` : `$${balance}`,
      pillX + pillW - 32,
      pillY + 80
    );

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`SALDO: $${balance} MXN`, pillX + pillW - 32, pillY + 108);

    const pills = [
      {
        label: '+1 HORA ($6.00)',
        bg: '#0033ff',
        fg: '#ffffff',
      },
      {
        label: 'RECARGAR +$50',
        bg: '#111827',
        fg: '#38bdf8',
      },
      {
        label: s.isActive ? 'CANCELAR PARQU' : 'INICIAR PARQU',
        bg: s.isActive ? '#dc2626' : '#059669',
        fg: '#ffffff',
      },
    ];

    const dockW = 520;
    const dockX = pillX;
    const dockY = 152;
    const gap = 8;
    const itemW = Math.floor((dockW - gap * 2) / 3);
    const itemH = 48;

    pills.forEach((p, idx) => {
      const x = dockX + idx * (itemW + gap);
      ctx.fillStyle = p.bg;
      drawRoundedPill(ctx, x, dockY, itemW, itemH, 24);
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = p.fg;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(p.label, x + Math.round(itemW / 2), dockY + 29);
    });

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await blob.arrayBuffer();
    return arrayBufferToBase64DataUrl(buffer, 'image/png');
  } catch {
    return undefined;
  }
}

async function buildSingleStructuredNotification(state) {
  const s = state || latestParquState || {};
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta';
  const balance = Number(s.balance ?? 320).toFixed(2);
  const scheduledHours = Math.max(1, Number(s.scheduledHours) || 1);

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
    const islandImage = await buildControlBlockImage(s, clockStr, cost);

    const title = `Parquímetro Activo • ${plates}`;
    const body = `Tiempo: ${scheduledHours}h ($6.00/hr)  |  Cobro: $${cost} MXN\nSaldo NFC: $${balance} MXN  |  Controles activos`;

    return {
      title,
      options: {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        image: islandImage,
        tag: SINGLE_NOTIFICATION_TAG,
        renotify: false,
        silent: false,
        requireInteraction: true,
        actions: [
          { action: 'add_hour', title: '+1 Hora ($6)' },
          { action: 'add_balance_50', title: 'Recargar +$50' },
          { action: 'cancel_parking', title: 'Cancelar Parqu' },
        ],
        data: {
          url: './',
          timestamp: Date.now(),
        },
      },
    };
  }

  const islandImage = await buildControlBlockImage(s, '00:00:00', '0.00');
  const title = `Parqu Digital • ${plates}`;
  const body = `En espera ($6.00/hr)  |  ${carDesc}\nSaldo NFC: $${balance} MXN  |  Controles listos`;

  return {
    title,
    options: {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: islandImage,
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: false,
      silent: false,
      requireInteraction: true,
      actions: [
        { action: 'start_parking', title: 'Iniciar Parqu' },
        { action: 'add_hour', title: '+1 Hora ($6)' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
      ],
      data: {
        url: './',
        timestamp: Date.now(),
      },
    },
  };
}

async function closeAllPreviousNotifications() {
  if (!self.registration || typeof self.registration.getNotifications !== 'function') return;
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach((n) => n.close());
  } catch {
    // ignore
  }
}

// Muestra ESTRICTAMENTE 1 sola notificacion (sin intervalos ni repeticiones)
async function renderSingleNotificationOnce() {
  if (isShowingLock || !self.registration || !self.registration.showNotification) return;
  isShowingLock = true;
  try {
    await closeAllPreviousNotifications();
    const { title, options } = await buildSingleStructuredNotification(latestParquState);
    await self.registration.showNotification(title, options);
  } catch {
    // ignore
  } finally {
    isShowingLock = false;
  }
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
    event.waitUntil(closeAllPreviousNotifications());
    return;
  }

  if (event.data.type === 'SHOW_PARQU_NOTIFICATION' || event.data.type === 'APP_BACKGROUNDED') {
    if (event.data.payload && event.data.payload.state) {
      latestParquState = event.data.payload.state;
    } else if (event.data.payload) {
      latestParquState = event.data.payload;
    }

    // Dispara UNICAMENTE 1 notificacion limpia al salir (cero bucles setInterval)
    event.waitUntil(renderSingleNotificationOnce());
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
      scheduledHours: 1,
      zoneName: 'Espacio #1042 • Centro Histórico',
      rate: '6.00',
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationOnce(),
        broadcastActionToClients({ action: 'START_PARKING', startTime: nowIso }),
      ])
    );
    return;
  }

  if (action === 'add_hour') {
    const s = latestParquState || {};
    const nowIso = s.startTime || new Date().toISOString();
    const nextHours = s.isActive ? (Number(s.scheduledHours) || 1) + 1 : 1;

    latestParquState = {
      ...s,
      isActive: true,
      startTime: nowIso,
      scheduledHours: nextHours,
      zoneName: s.zoneName || 'Espacio #1042 • Centro Histórico',
      rate: '6.00',
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationOnce(),
        broadcastActionToClients({ action: 'ADD_HOUR', hoursAdded: 1, scheduledHours: nextHours }),
      ])
    );
    return;
  }

  if (action === 'cancel_parking' || action === 'stop_parking') {
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
      scheduledHours: 1,
      balance: nextBalance,
    };

    event.waitUntil(
      Promise.all([
        renderSingleNotificationOnce(),
        broadcastActionToClients({ action: 'CANCEL_PARKING', amount: finalCharge }),
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
        renderSingleNotificationOnce(),
        broadcastActionToClients({ action: 'ADD_BALANCE', amount: 50 }),
      ])
    );
    return;
  }

  event.notification.close();

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
