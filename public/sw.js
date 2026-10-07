// Service Worker Oficial de Parqu - ESTRICTAMENTE 1 SOLA NOTIFICACIÓN AL SALIR DE LA APP
// - CERO bucles setInterval (nunca re-envía notificaciones en bucle)
// - CERO spam: 1 sola notificación estática/interactiva cuando el usuario sale de la app
// - Solo se actualiza si el usuario toca un botón de la propia notificación (+1 Hora, Cancelar, Iniciar, Recargar)

const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';
const NTFY_BASE_URL = 'https://ntfy.sh';

let latestParquState = null;
let pendingActionsQueue = [];
let isShowingLock = false;
let lastActionFeedback = '';
let lastActionFeedbackUntil = 0;
let lastShownTimestamp = 0;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function getSupportedSwActions(isActive) {
  const maxSupported =
    typeof self.Notification !== 'undefined' &&
    typeof self.Notification.maxActions === 'number'
      ? self.Notification.maxActions
      : 2;

  if (maxSupported <= 0) return [];

  const fullActions = isActive
    ? [
        { action: 'add_hour', title: '+1 Hora ($6)' },
        { action: 'cancel_parking', title: 'Cancelar Parqu' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
      ]
    : [
        { action: 'start_parking', title: 'Iniciar Parqu ($6)' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
        { action: 'add_hour', title: '+1 Hora ($6)' },
      ];

  return fullActions.slice(0, maxSupported);
}

// Publica en la nube cuando el usuario ejecuta una acción desde la notificación fuera de la aplicación
async function publishStateFromServiceWorker(s) {
  if (!s || !s.plates) return;
  try {
    const cleanPlate = String(s.plates)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (!cleanPlate) return;
    const topic = `parqu_v2_plate_${cleanPlate}`;

    const envelope = {
      _type: 'PARQU_LIVE_STATE',
      deviceId: 'SW_OUTSIDE_APP',
      timestamp: Date.now(),
      updatedAt: new Date().toISOString(),
      plates: String(s.plates).trim().toUpperCase(),
      vehicle: {
        plates: s.plates || 'XYZ-7842',
      },
      owner: {
        fullName: s.fullName || 'Sebastián Salinas',
      },
      card: {
        balance: Number(s.balance ?? 320),
        rfidTag: s.rfidTag || 'NFC-MX-09142-PK',
        status: s.isActive ? 'EN_PARQUIMETRO' : 'ACTIVA',
      },
      activeSession: s.isActive
        ? {
            id: 'SESS-SW',
            zoneName: s.zoneName || 'Espacio #1042 • Centro Histórico',
            ratePerHour: Number(s.rate || 6.0),
            startTime: s.startTime || new Date().toISOString(),
            secondsElapsed: Number(s.baseSeconds || 0),
            currentCost: Number(s.cost || 0),
            scheduledHours: Number(s.scheduledHours || 1),
            maxLimit: Number(s.maxLimit || 180),
          }
        : null,
    };

    await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        Title: `Parqu Notificacion: ${envelope.plates}`,
        Priority: 'default',
      },
      body: JSON.stringify(envelope),
    });
  } catch {
    // ignore offline errors
  }
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

function drawRoundedRect(ctx, x, y, w, h, r) {
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

function drawTopDownCar(ctx, centerX, centerY, isActive) {
  const carW = 50;
  const carH = 24;
  const x = centerX - carW / 2;
  const y = centerY - carH / 2;

  if (isActive) {
    const trailGrad = ctx.createLinearGradient(x - 36, centerY, x + 4, centerY);
    trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0.55)');
    ctx.fillStyle = trailGrad;
    drawRoundedRect(ctx, x - 34, centerY - 5, 38, 10, 5);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  drawRoundedRect(ctx, x + 2, y + 3, carW, carH, 9);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, x, y, carW, carH, 9);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, x + 31, y + 3, 10, carH - 6, 3);
  ctx.fill();

  ctx.fillStyle = '#334155';
  drawRoundedRect(ctx, x + 6, y + 4, 6, carH - 8, 2);
  ctx.fill();

  ctx.fillStyle = isActive ? '#0033ff' : '#d97706';
  drawRoundedRect(ctx, x + 15, y + 4, 13, carH - 8, 3);
  ctx.fill();
}

async function buildUberCardImage(s, clockStr, remainingLabel, cost, progressRatio) {
  if (s && s.preRenderedImage && !(Date.now() < lastActionFeedbackUntil && lastActionFeedback)) {
    return s.preRenderedImage;
  }
  if (typeof OffscreenCanvas === 'undefined') {
    return s && s.preRenderedImage ? s.preRenderedImage : undefined;
  }
  try {
    const width = 640;
    const height = 256;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return s && s.preRenderedImage ? s.preRenderedImage : undefined;

    ctx.clearRect(0, 0, width, height);

    const scheduledHours = Math.max(1, Number(s.scheduledHours) || 1);
    const plates = s.plates || 'XYZ-7842';
    const carDesc = s.carDesc || 'Volkswagen Jetta';
    const balance = Number(s.balance ?? 320).toFixed(0);
    const hasFeedback = Date.now() < lastActionFeedbackUntil && lastActionFeedback;

    const cardX = 14;
    const cardY = 8;
    const cardW = width - 28;
    const cardH = height - 16;

    const grad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    grad.addColorStop(0, '#16181d');
    grad.addColorStop(1, '#0d0f13');
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 34);
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = s.isActive ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.14)';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Parqu', cardX + 30, cardY + 38);

    ctx.textAlign = 'right';
    ctx.fillStyle = hasFeedback ? '#34d399' : '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(
      hasFeedback ? lastActionFeedback : `Saldo NFC: $${balance} MXN`,
      cardX + cardW - 30,
      cardY + 38
    );

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(
      s.isActive
        ? `Estancia activa • ${clockStr}`
        : 'Listo para estacionar ($6/hr)',
      cardX + 30,
      cardY + 84
    );

    ctx.fillStyle = '#9ca3af';
    ctx.font = '20px sans-serif';
    ctx.fillText(
      s.isActive
        ? `${plates} • ${carDesc} • ${scheduledHours}h ($${cost} MXN) • Restan ${remainingLabel}`
        : `${plates} • ${carDesc} • Saldo disponible $${balance} MXN`,
      cardX + 30,
      cardY + 116
    );

    const barLeft = cardX + 32;
    const barRight = cardX + cardW - 38;
    const barWidth = barRight - barLeft;
    const barY = cardY + 156;

    ctx.fillStyle = '#374151';
    drawRoundedRect(ctx, barLeft, barY - 4, barWidth, 8, 4);
    ctx.fill();

    const carX = barLeft + Math.round(barWidth * progressRatio);
    const fillWidth = Math.max(14, carX - barLeft);

    const barGrad = ctx.createLinearGradient(barLeft, barY, carX, barY);
    barGrad.addColorStop(0, '#0033ff');
    barGrad.addColorStop(0.5, '#38bdf8');
    barGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = barGrad;
    drawRoundedRect(ctx, barLeft, barY - 4, fillWidth, 8, 4);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(barLeft, barY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(barRight, barY, 9, 0, Math.PI * 2);
    ctx.fillStyle = s.isActive ? 'rgba(56, 189, 248, 0.35)' : '#4b5563';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(barRight, barY, 5, 0, Math.PI * 2);
    ctx.fillStyle = s.isActive ? '#38bdf8' : '#9ca3af';
    ctx.fill();

    drawTopDownCar(ctx, carX, barY, Boolean(s.isActive));

    const controls = [
      { label: '+1 Hora ($6)', bg: '#0033ff', fg: '#ffffff' },
      { label: 'Recargar +$50', bg: '#1e293b', fg: '#38bdf8' },
      {
        label: s.isActive ? 'Cancelar Parqu' : 'Iniciar Parqu',
        bg: s.isActive ? '#7f1d1d' : '#065f46',
        fg: '#ffffff',
      },
    ];

    const btnGap = 10;
    const btnW = Math.floor((barWidth - btnGap * 2) / 3);
    const btnH = 38;
    const btnY = cardY + 186;

    controls.forEach((c, idx) => {
      const bx = barLeft + idx * (btnW + btnGap);
      ctx.fillStyle = c.bg;
      drawRoundedRect(ctx, bx, btnY, btnW, btnH, 19);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = c.fg;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(c.label, bx + Math.round(btnW / 2), btnY + 24);
    });

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await blob.arrayBuffer();
    return arrayBufferToBase64DataUrl(buffer, 'image/png');
  } catch {
    return s && s.preRenderedImage ? s.preRenderedImage : undefined;
  }
}

async function buildSingleNotificationPayload(state) {
  const s = state || latestParquState || {};
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta';
  const balance = Number(s.balance ?? 320).toFixed(0);
  const scheduledHours = Math.max(1, Number(s.scheduledHours) || 1);
  const hasFeedback = Date.now() < lastActionFeedbackUntil && lastActionFeedback;

  if (s.isActive && s.startTime) {
    const elapsedSeconds = Math.max(
      Number(s.baseSeconds) || 0,
      Math.floor((Date.now() - new Date(s.startTime).getTime()) / 1000)
    );
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const clockStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const totalScheduledSeconds = scheduledHours * 3600;
    const remainingSeconds = Math.max(0, totalScheduledSeconds - elapsedSeconds);
    const remH = Math.floor(remainingSeconds / 3600);
    const remM = Math.floor((remainingSeconds % 3600) / 60);
    const remS = remainingSeconds % 60;
    const remainingLabel =
      remH > 0
        ? `${remH}h ${String(remM).padStart(2, '0')}m`
        : `${remM}m ${String(remS).padStart(2, '0')}s`;

    const rate = Number(s.rate || 6.0);
    const maxLimit = Number(s.maxLimit || 180.0);
    const cost = Math.min(
      maxLimit,
      Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2))
    ).toFixed(2);

    const progressRatio = Math.min(0.92, Math.max(0.18, elapsedSeconds / totalScheduledSeconds));
    const cardImage = await buildUberCardImage(
      s,
      clockStr,
      remainingLabel,
      cost,
      progressRatio
    );

    const title = hasFeedback
      ? `✅ ${lastActionFeedback} • ${clockStr}`
      : `Estancia activa • ${clockStr} (${scheduledHours}h)`;
    const body = `${plates} • ${carDesc} • Cobro: $${cost} MXN • Saldo: $${balance} MXN`;

    return {
      title,
      options: {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        image: cardImage,
        tag: SINGLE_NOTIFICATION_TAG,
        renotify: false,
        silent: true,
        requireInteraction: false,
        actions: getSupportedSwActions(true),
        data: {
          url: './',
          timestamp: Date.now(),
        },
      },
    };
  }

  const cardImage = await buildUberCardImage(
    s,
    '00:00:00',
    '60m 00s',
    '0.00',
    0.25
  );
  const title = hasFeedback
    ? `✅ ${lastActionFeedback}`
    : `Parqu listo • $6.00/hr • Saldo $${balance}`;
  const body = `${plates} • ${carDesc} • Controles rápidos activos fuera de la app`;

  return {
    title,
    options: {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: cardImage,
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: false,
      silent: true,
      requireInteraction: false,
      actions: getSupportedSwActions(false),
      data: {
        url: './',
        timestamp: Date.now(),
      },
    },
  };
}

async function closeAllNotifications() {
  if (!self.registration || typeof self.registration.getNotifications !== 'function') return;
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach((n) => n.close());
  } catch {
    // ignore
  }
}

async function closeOtherTagNotifications() {
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

// Muestra ESTRICTAMENTE 1 sola notificación sin bucles ni repeticiones
async function showSingleNotificationOnce(allowCooldownBypass = false) {
  if (isShowingLock || !self.registration || !self.registration.showNotification) return;

  const now = Date.now();
  if (!allowCooldownBypass && now - lastShownTimestamp < 4000) {
    return;
  }

  isShowingLock = true;
  lastShownTimestamp = now;

  try {
    await closeOtherTagNotifications();
    const { title, options } = await buildSingleNotificationPayload(latestParquState);
    try {
      await self.registration.showNotification(title, options);
    } catch {
      try {
        const noActionsOpts = { ...options };
        delete noActionsOpts.actions;
        await self.registration.showNotification(title, noActionsOpts);
      } catch {
        await self.registration.showNotification(title, {
          body: options.body,
          icon: './parqu-logo-black.png',
          badge: './parqu-logo-black.png',
          tag: SINGLE_NOTIFICATION_TAG,
          renotify: false,
          silent: true,
        });
      }
    }
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
    event.waitUntil(closeAllNotifications());
    return;
  }

  if (event.data.type === 'SHOW_PARQU_NOTIFICATION' || event.data.type === 'APP_BACKGROUNDED') {
    if (event.data.payload && event.data.payload.state) {
      latestParquState = event.data.payload.state;
    } else if (event.data.payload) {
      latestParquState = event.data.payload;
    }

    // Mostrar 1 sola vez (CERO setInterval)
    event.waitUntil(showSingleNotificationOnce(false));
  }
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action;

  if (action === 'start_parking') {
    const nowIso = new Date().toISOString();
    lastActionFeedback = 'PARQUÍMETRO INICIADO ($6/HR)';
    lastActionFeedbackUntil = Date.now() + 6000;

    latestParquState = {
      ...(latestParquState || {}),
      isActive: true,
      startTime: nowIso,
      baseSeconds: 0,
      scheduledHours: 1,
      zoneName: 'Espacio #1042 • Centro Histórico',
      rate: '6.00',
      preRenderedImage: null,
    };

    event.waitUntil(
      Promise.all([
        showSingleNotificationOnce(true),
        broadcastActionToClients({ action: 'START_PARKING', startTime: nowIso }),
        publishStateFromServiceWorker(latestParquState),
      ])
    );
    return;
  }

  if (action === 'add_hour') {
    const s = latestParquState || {};
    const nowIso = s.startTime || new Date().toISOString();
    const nextHours = s.isActive ? (Number(s.scheduledHours) || 1) + 1 : 1;
    lastActionFeedback = `+1 HORA APLICADA (TOTAL ${nextHours}H)`;
    lastActionFeedbackUntil = Date.now() + 6000;

    latestParquState = {
      ...s,
      isActive: true,
      startTime: nowIso,
      scheduledHours: nextHours,
      zoneName: s.zoneName || 'Espacio #1042 • Centro Histórico',
      rate: '6.00',
      preRenderedImage: null,
    };

    event.waitUntil(
      Promise.all([
        showSingleNotificationOnce(true),
        broadcastActionToClients({ action: 'ADD_HOUR', hoursAdded: 1, scheduledHours: nextHours }),
        publishStateFromServiceWorker(latestParquState),
      ])
    );
    return;
  }

  if (action === 'cancel_parking' || action === 'stop_parking') {
    const s = latestParquState || {};
    const elapsedSeconds = s.startTime
      ? Math.max(
          Number(s.baseSeconds) || 0,
          Math.floor((Date.now() - new Date(s.startTime).getTime()) / 1000)
        )
      : 0;
    const rate = Number(s.rate || 6.0);
    const finalCharge = Math.max(2.0, Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2)));
    const prevBalance = Number(s.balance ?? 320);
    const nextBalance = Math.max(0, prevBalance - finalCharge).toFixed(2);

    lastActionFeedback = `ESTANCIA FINALIZADA (-$${finalCharge.toFixed(2)})`;
    lastActionFeedbackUntil = Date.now() + 6000;

    latestParquState = {
      ...s,
      isActive: false,
      startTime: null,
      baseSeconds: 0,
      scheduledHours: 1,
      balance: nextBalance,
      preRenderedImage: null,
    };

    event.waitUntil(
      Promise.all([
        showSingleNotificationOnce(true),
        broadcastActionToClients({ action: 'CANCEL_PARKING', amount: finalCharge }),
        publishStateFromServiceWorker(latestParquState),
      ])
    );
    return;
  }

  if (action === 'add_balance_50') {
    const s = latestParquState || {};
    const nextBalance = (Number(s.balance ?? 320) + 50).toFixed(2);
    lastActionFeedback = `+$50 RECARGADOS (SALDO $${Number(nextBalance).toFixed(0)})`;
    lastActionFeedbackUntil = Date.now() + 6000;

    latestParquState = {
      ...s,
      balance: nextBalance,
      preRenderedImage: null,
    };

    event.waitUntil(
      Promise.all([
        showSingleNotificationOnce(true),
        broadcastActionToClients({ action: 'ADD_BALANCE', amount: 50 }),
        publishStateFromServiceWorker(latestParquState),
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
