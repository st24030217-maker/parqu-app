// Service Worker v2 de Parqu - BLOQUE ESTILO UBER / LIVE ACTIVITY OSCURO
// - 1 SOLA notificación al salir de la app con el parquímetro activo.
// - Actualización silenciosa IN-PLACE del reloj y auto (SOLO si la notificación ya está abierta en la barra y el SO soporta renotify:false).
// - Si el usuario desliza/cierra la notificación, se detiene de inmediato y JAMÁS vuelve a abrir otra.

const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';
const NTFY_BASE_URL = 'https://ntfy.sh';

let latestParquState = null;
let pendingActionsQueue = [];
let isShowingLock = false;
let lastShownAt = 0;
let inPlaceClockTimer = null;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function isIOSDevice(state) {
  if (state && state.isIOS) return true;
  const ua = (self.navigator && self.navigator.userAgent) || '';
  return /iPhone|iPad|iPod/i.test(ua);
}

function stopInPlaceClockTimer() {
  if (inPlaceClockTimer) {
    clearInterval(inPlaceClockTimer);
    inPlaceClockTimer = null;
  }
}

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
        { action: 'cancel_parking', title: 'Finalizar Estancia' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
      ]
    : [
        { action: 'start_parking', title: 'Iniciar Parqu ($6)' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
      ];

  return fullActions.slice(0, maxSupported);
}

function formatEndTime(startTimeIso, scheduledHours) {
  try {
    const startMs = startTimeIso ? new Date(startTimeIso).getTime() : Date.now();
    const endMs = startMs + Math.max(1, Number(scheduledHours) || 1) * 3600 * 1000;
    return new Date(endMs).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
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
  const carW = 68;
  const carH = 30;
  const x = centerX - carW / 2;
  const y = centerY - carH / 2;

  if (isActive) {
    ctx.save();
    const beamGrad = ctx.createLinearGradient(x + carW - 2, centerY, x + carW + 38, centerY);
    beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
    beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(x + carW - 2, y + 4);
    ctx.lineTo(x + carW + 38, y - 6);
    ctx.lineTo(x + carW + 38, y + carH + 6);
    ctx.lineTo(x + carW - 2, y + carH - 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const trailGrad = ctx.createLinearGradient(x - 54, centerY, x + 4, centerY);
    trailGrad.addColorStop(0, 'rgba(0, 51, 255, 0)');
    trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0.75)');
    ctx.fillStyle = trailGrad;
    drawRoundedRect(ctx, x - 52, centerY - 6, 56, 12, 6);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  drawRoundedRect(ctx, x + 2, y + 4, carW, carH, 12);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, x, y, carW, carH, 12);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  drawRoundedRect(ctx, x + 40, y + 4, 13, carH - 8, 4);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, x + 7, y + 5, 9, carH - 10, 3);
  ctx.fill();

  ctx.fillStyle = isActive ? '#0033FF' : '#475569';
  drawRoundedRect(ctx, x + 19, y + 4.5, 18, carH - 9, 4);
  ctx.fill();

  ctx.fillStyle = '#38bdf8';
  drawRoundedRect(ctx, x + carW - 4, y + 4, 3, 5, 1.5);
  ctx.fill();
  drawRoundedRect(ctx, x + carW - 4, y + carH - 9, 3, 5, 1.5);
  ctx.fill();
}

async function renderUberCardDataUrlInSw(s, clockStr, cost, remainingMinutes, endTimeStr, progressRatio) {
  if (typeof OffscreenCanvas === 'undefined') {
    return s.preRenderedImage || undefined;
  }
  try {
    const width = 800;
    const height = 292;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return s.preRenderedImage || undefined;

    const plates = s.plates || 'XYZ-7842';
    const carDesc = s.carDesc || 'Volkswagen Jetta';
    const balance = Number(s.balance ?? 320).toFixed(0);
    const zoneName = s.zoneName || 'Espacio #1042 • Centro Histórico';

    const cardX = 10;
    const cardY = 8;
    const cardW = width - 20;
    const cardH = height - 16;

    const grad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    grad.addColorStop(0, '#0f131d');
    grad.addColorStop(1, '#07090e');
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.42)';
    ctx.stroke();

    // 1. Fila Superior
    ctx.fillStyle = '#0033FF';
    drawRoundedRect(ctx, cardX + 28, cardY + 22, 166, 32, 16);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cardX + 46, cardY + 38, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#34d399';
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('PARQU EN VIVO', cardX + 60, cardY + 43);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(zoneName.slice(0, 34), cardX + 208, cardY + 43);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    drawRoundedRect(ctx, cardX + cardW - 204, cardY + 22, 176, 32, 16);
    ctx.fill();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`SALDO: $${balance} MXN`, cardX + cardW - 44, cardY + 43);

    // 2. Fila Central: Reloj en vivo + Cobro
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('TIEMPO EN PARQUÍMETRO', cardX + 28, cardY + 84);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px monospace';
    ctx.fillText(clockStr, cardX + 28, cardY + 136);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(
      `Restan ${remainingMinutes} min${endTimeStr ? ` • Vence ${endTimeStr}` : ''}`,
      cardX + 28,
      cardY + 166
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('COBRO ACUMULADO ($6/HR)', cardX + cardW - 28, cardY + 84);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 46px monospace';
    ctx.fillText(`$${cost} MXN`, cardX + cardW - 28, cardY + 136);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${plates} • ${carDesc}`, cardX + cardW - 28, cardY + 166);

    // 3. Fila Inferior: Barra de progreso con auto
    const barLeft = cardX + 34;
    const barRight = cardX + cardW - 38;
    const barWidth = barRight - barLeft;
    const barY = cardY + 222;

    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, barLeft, barY - 5, barWidth, 10, 5);
    ctx.fill();

    const carX = barLeft + Math.round(barWidth * progressRatio);
    const fillWidth = Math.max(18, carX - barLeft);

    const barGrad = ctx.createLinearGradient(barLeft, barY, carX, barY);
    barGrad.addColorStop(0, '#0033FF');
    barGrad.addColorStop(0.6, '#38bdf8');
    barGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = barGrad;
    drawRoundedRect(ctx, barLeft, barY - 5, fillWidth, 10, 5);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(barLeft, barY, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(barRight, barY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(barRight, barY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    drawTopDownCar(ctx, carX, barY, true);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('INICIO ESTANCIA', barLeft, cardY + 262);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(
      endTimeStr ? `FIN PROGRAMADO: ${endTimeStr}` : `META: ${s.scheduledHours || 1} HORA(S)`,
      barRight,
      cardY + 262
    );

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return s.preRenderedImage || undefined;
  }
}

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
    // ignore
  }
}

async function closeAllNotifications() {
  stopInPlaceClockTimer();
  if (!self.registration || typeof self.registration.getNotifications !== 'function') return;
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach((n) => n.close());
  } catch {
    // ignore
  }
}

function computeLiveMetrics(s) {
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta';
  const balance = Number(s.balance ?? 320).toFixed(0);
  const scheduledHours = Math.max(1, Number(s.scheduledHours) || 1);
  const zoneName = s.zoneName || 'Espacio #1042 • Centro Histórico';

  const elapsedSeconds = s.startTime
    ? Math.max(
        Number(s.baseSeconds) || 0,
        Math.floor((Date.now() - new Date(s.startTime).getTime()) / 1000)
      )
    : 0;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const clockStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalScheduledSeconds = scheduledHours * 3600;
  const remainingSeconds = Math.max(0, totalScheduledSeconds - elapsedSeconds);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  const endTimeStr = formatEndTime(s.startTime, scheduledHours);
  const progressRatio = Math.min(0.9, Math.max(0.18, elapsedSeconds / totalScheduledSeconds));

  const rate = Number(s.rate || 6.0);
  const cost = Math.min(
    Number(s.maxLimit || 180),
    Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2))
  ).toFixed(2);

  const title = `🟢 Parqu En Vivo • ${clockStr} • $${cost} MXN`;
  const body = `${plates} (${carDesc}) • Restan ${remainingMinutes} min${endTimeStr ? ` (Vence ${endTimeStr})` : ''} • Saldo: $${balance} MXN`;

  return {
    title,
    body,
    clockStr,
    cost,
    remainingMinutes,
    endTimeStr,
    progressRatio,
  };
}

/**
 * Actualiza silenciosamente EN SU MISMO LUGAR la única notificación existente.
 * REGLA DE ORO: Primero verifica `getNotifications({ tag })`.
 * Si el usuario cerró la notificación (openList.length === 0), detiene el reloj y JAMÁS crea otra notificación.
 */
async function updateNotificationClockInPlace() {
  if (isShowingLock || !latestParquState || !latestParquState.isActive) {
    stopInPlaceClockTimer();
    return;
  }
  if (!self.registration || typeof self.registration.getNotifications !== 'function') {
    stopInPlaceClockTimer();
    return;
  }

  try {
    // Si la app ya está visible en primer plano, detener el reloj de la barra
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const anyVisible = clients.some((c) => c.visibilityState === 'visible');
    if (anyVisible) {
      stopInPlaceClockTimer();
      return;
    }

    const openList = await self.registration.getNotifications({ tag: SINGLE_NOTIFICATION_TAG });
    if (!openList || openList.length === 0) {
      // El usuario descartó/cerró la notificación: detener el reloj y NO lanzar ninguna más
      stopInPlaceClockTimer();
      return;
    }

    if (openList.length > 1) {
      openList.slice(1).forEach((n) => n.close());
    }

    isShowingLock = true;
    const s = latestParquState;
    const metrics = computeLiveMetrics(s);
    const liveImage = await renderUberCardDataUrlInSw(
      s,
      metrics.clockStr,
      metrics.cost,
      metrics.remainingMinutes,
      metrics.endTimeStr,
      metrics.progressRatio
    );

    await self.registration.showNotification(metrics.title, {
      body: metrics.body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: liveImage,
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: false,
      silent: true,
      requireInteraction: false,
      actions: getSupportedSwActions(true),
      data: {
        url: './?modal=push',
        openModal: true,
        timestamp: Date.now(),
      },
    });
  } catch {
    // ignore
  } finally {
    isShowingLock = false;
  }
}

function startInPlaceClockTimerIfSupported(state) {
  stopInPlaceClockTimer();
  // En iOS WebKit, showNotification siempre lanza un banner nuevo; en iOS se muestra 1 sola vez sin timer.
  if (isIOSDevice(state)) return;
  if (!state || !state.isActive) return;

  inPlaceClockTimer = setInterval(() => {
    updateNotificationClockInPlace();
  }, 4000);
}

async function showOneNotification(state, isActionUpdate = false, customOverride = null) {
  if (isShowingLock || !self.registration || !self.registration.showNotification) return;

  const s = state || latestParquState || {};
  if (!s.isActive && !isActionUpdate && !customOverride) {
    return;
  }

  const now = Date.now();
  if (!isActionUpdate && now - lastShownAt < 12000) {
    return;
  }

  isShowingLock = true;
  lastShownAt = now;

  try {
    // Cerrar cualquier notificación sobrante antes de mostrar la única notificación oficial
    if (typeof self.registration.getNotifications === 'function') {
      const existing = await self.registration.getNotifications();
      existing.forEach((n) => {
        if (n.tag !== SINGLE_NOTIFICATION_TAG) n.close();
      });
    }

    const metrics = computeLiveMetrics(s);
    const title = customOverride?.title || metrics.title;
    const body = customOverride?.body || metrics.body;

    const liveImage = await renderUberCardDataUrlInSw(
      s,
      metrics.clockStr,
      metrics.cost,
      metrics.remainingMinutes,
      metrics.endTimeStr,
      metrics.progressRatio
    );

    const options = {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: liveImage,
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: false,
      silent: true,
      requireInteraction: false,
      actions: getSupportedSwActions(Boolean(s.isActive)),
      data: {
        url: './?modal=push',
        openModal: true,
        timestamp: now,
      },
    };

    try {
      await self.registration.showNotification(title, options);
    } catch {
      await self.registration.showNotification(title, {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        tag: SINGLE_NOTIFICATION_TAG,
        renotify: false,
        silent: true,
        data: {
          url: './?modal=push',
          openModal: true,
          timestamp: now,
        },
      });
    }

    if (s.isActive) {
      startInPlaceClockTimerIfSupported(s);
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

self.addEventListener('push', (event) => {
  let pushPayload = {};
  if (event.data) {
    try {
      pushPayload = event.data.json();
    } catch {
      pushPayload = { body: event.data.text() };
    }
  }

  if (pushPayload.data && typeof pushPayload.data === 'object') {
    latestParquState = {
      ...(latestParquState || {}),
      ...pushPayload.data,
    };
  }

  const isExplicitTest = pushPayload.data?.alertReason === 'LOCK_SCREEN_TEST';

  event.waitUntil(
    showOneNotification(
      latestParquState,
      isExplicitTest,
      pushPayload.title ? { title: pushPayload.title, body: pushPayload.body } : null
    )
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_PARQU_STATE') {
    const nextPayload = event.data.payload || {};
    const wasActive = Boolean(latestParquState?.isActive);
    latestParquState = {
      ...(latestParquState || {}),
      ...nextPayload,
    };
    if (!wasActive && latestParquState.isActive) {
      lastShownAt = 0;
    }
    if (wasActive && !latestParquState.isActive) {
      lastShownAt = 0;
      event.waitUntil(closeAllNotifications());
    }
    return;
  }

  if (event.data.type === 'RESET_EXIT_LOCK') {
    lastShownAt = 0;
    return;
  }

  if (event.data.type === 'APP_FOREGROUNDED' || event.data.type === 'STOP_ALL_LOOPS') {
    stopInPlaceClockTimer();
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
    if (event.data.closeNotifications === true) {
      event.waitUntil(closeAllNotifications());
    }
    return;
  }

  if (event.data.type === 'PARQU_SINGLE_NOTIFY_V2') {
    if (event.data.payload && event.data.payload.state) {
      latestParquState = event.data.payload.state;
    }
    event.waitUntil(showOneNotification(latestParquState, false));
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
        showOneNotification(latestParquState, true),
        broadcastActionToClients({
          action: 'START_PARKING',
          startTime: nowIso,
          openHighPriorityModal: true,
        }),
        publishStateFromServiceWorker(latestParquState),
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
        showOneNotification(latestParquState, true),
        broadcastActionToClients({
          action: 'ADD_HOUR',
          hoursAdded: 1,
          scheduledHours: nextHours,
          openHighPriorityModal: true,
        }),
        publishStateFromServiceWorker(latestParquState),
      ])
    );
    return;
  }

  if (action === 'cancel_parking' || action === 'stop_parking') {
    stopInPlaceClockTimer();
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

    latestParquState = {
      ...s,
      isActive: false,
      startTime: null,
      baseSeconds: 0,
      scheduledHours: 1,
      balance: nextBalance,
    };

    event.notification.close();

    event.waitUntil(
      Promise.all([
        closeAllNotifications(),
        broadcastActionToClients({
          action: 'CANCEL_PARKING',
          amount: finalCharge,
          openHighPriorityModal: true,
        }),
        publishStateFromServiceWorker(latestParquState),
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
        showOneNotification(latestParquState, true),
        broadcastActionToClients({
          action: 'ADD_BALANCE',
          amount: 50,
          openHighPriorityModal: true,
        }),
        publishStateFromServiceWorker(latestParquState),
      ])
    );
    return;
  }

  stopInPlaceClockTimer();
  event.notification.close();

  event.waitUntil(
    Promise.all([
      broadcastActionToClients({
        action: 'OPEN_HIGH_PRIORITY_MODAL',
        alertReason: 'NOTIFICATION_TAP',
      }),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('./?modal=push');
        }
        return null;
      }),
    ])
  );
});
