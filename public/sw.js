// Service Worker Oficial de Parqu - Notificacion Unica Estilo Uber Live Activity (Sin Reproductor de Musica, Sin Spam)
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

// Dibuja el auto blanco visto desde arriba sobre la barra de progreso (exactamente como Uber Live Activity)
function drawTopDownCar(ctx, centerX, centerY) {
  const carW = 46;
  const carH = 22;
  const x = centerX - carW / 2;
  const y = centerY - carH / 2;

  // Sombra suave del auto
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  drawRoundedRect(ctx, x + 2, y + 3, carW, carH, 8);
  ctx.fill();

  // Carroceria blanca
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, x, y, carW, carH, 8);
  ctx.fill();

  // Parabrisas delantero (derecha)
  ctx.fillStyle = '#374151';
  drawRoundedRect(ctx, x + 28, y + 3, 9, carH - 6, 3);
  ctx.fill();

  // Medallon trasero (izquierda)
  ctx.fillStyle = '#4b5563';
  drawRoundedRect(ctx, x + 6, y + 4, 6, carH - 8, 2);
  ctx.fill();

  // Techo / detalle ambar tipo Uber
  ctx.fillStyle = '#d97706';
  drawRoundedRect(ctx, x + 15, y + 4, 10, carH - 8, 2);
  ctx.fill();
}

// Barra de progreso limpia en texto para iOS/Android: ━━━━━━━━●────
function buildCleanProgressTrack(progressRatio) {
  const totalSegments = 14;
  const clamped = Math.min(1, Math.max(0.08, Number(progressRatio) || 0.15));
  const filled = Math.min(totalSegments - 1, Math.max(1, Math.round(clamped * totalSegments)));
  const left = '━'.repeat(filled);
  const right = '─'.repeat(Math.max(1, totalSegments - filled - 1));
  return `${left}●${right}`;
}

// Genera la tarjeta oscura estilo Uber Live Activity (Pickup in 2 min / barra con auto)
async function buildUberStyleCardImage(s, remainingMinutes, cost, progressRatio) {
  if (typeof OffscreenCanvas === 'undefined') return undefined;
  try {
    const width = 640;
    const height = 250;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.clearRect(0, 0, width, height);

    const scheduledHours = Math.max(1, Number(s.scheduledHours) || 1);
    const plates = s.plates || 'XYZ-7842';
    const carDesc = s.carDesc || 'Volkswagen Jetta';
    const balance = Number(s.balance ?? 320).toFixed(0);

    // Tarjeta oscura redondeada estilo Uber Lock Screen
    const cardX = 16;
    const cardY = 10;
    const cardW = width - 32;
    const cardH = height - 20;

    const grad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    grad.addColorStop(0, '#18191c');
    grad.addColorStop(1, '#101114');
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 36);
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.stroke();

    // Marca arriba a la izquierda ("Parqu" como "Uber")
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Parqu', cardX + 32, cardY + 42);

    // Estado derecha superior (Saldo NFC)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Saldo $${balance} MXN`, cardX + cardW - 32, cardY + 42);

    // Titulo principal grande ("Estancia: 58 min" como "Pickup in 2 min")
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(
      s.isActive
        ? `Tiempo restante: ${remainingMinutes} min`
        : 'Listo para estacionar',
      cardX + 32,
      cardY + 92
    );

    // Subtitulo ("XYZ-7842 • Volkswagen Jetta" como "3XFH2C • Silver Honda Civic")
    ctx.fillStyle = '#9ca3af';
    ctx.font = '21px sans-serif';
    ctx.fillText(
      `${plates} • ${carDesc} • ${scheduledHours}h ($${cost})`,
      cardX + 32,
      cardY + 124
    );

    // Barra de progreso horizontal con el auto blanco avanzando hacia el punto final
    const barLeft = cardX + 32;
    const barRight = cardX + cardW - 36;
    const barWidth = barRight - barLeft;
    const barY = cardY + 162;

    // Linea gris de fondo
    ctx.fillStyle = '#4b5563';
    drawRoundedRect(ctx, barLeft, barY - 3, barWidth, 6, 3);
    ctx.fill();

    // Linea blanca de avance
    const clampedRatio = s.isActive
      ? Math.min(0.92, Math.max(0.12, Number(progressRatio) || 0.2))
      : 0.12;
    const carX = barLeft + Math.round(barWidth * clampedRatio);

    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, barLeft, barY - 3, Math.max(12, carX - barLeft), 6, 3);
    ctx.fill();

    // Circulo destino al final de la barra (derecha)
    ctx.beginPath();
    ctx.arc(barRight, barY, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#4b5563';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(barRight, barY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#101114';
    ctx.fill();

    // Auto blanco visto desde arriba sobre la barra
    drawTopDownCar(ctx, carX, barY);

    // Fila inferior de los 3 controles dentro del bloque
    const controls = [
      { label: '+1 Hora ($6)', bg: '#262930', fg: '#ffffff' },
      { label: 'Recargar +$50', bg: '#262930', fg: '#38bdf8' },
      {
        label: s.isActive ? 'Cancelar Parqu' : 'Iniciar Parqu',
        bg: s.isActive ? '#3f1d24' : '#143829',
        fg: s.isActive ? '#fca5a5' : '#6ee7b7',
      },
    ];

    const btnGap = 10;
    const btnW = Math.floor((barWidth - btnGap * 2) / 3);
    const btnH = 34;
    const btnY = cardY + 186;

    controls.forEach((c, idx) => {
      const bx = barLeft + idx * (btnW + btnGap);
      ctx.fillStyle = c.bg;
      drawRoundedRect(ctx, bx, btnY, btnW, btnH, 17);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = c.fg;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(c.label, bx + Math.round(btnW / 2), btnY + 22);
    });

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await blob.arrayBuffer();
    return arrayBufferToBase64DataUrl(buffer, 'image/png');
  } catch {
    return undefined;
  }
}

async function buildSingleUberStyleNotification(state) {
  const s = state || latestParquState || {};
  const plates = s.plates || 'XYZ-7842';
  const carDesc = s.carDesc || 'Volkswagen Jetta';
  const balance = Number(s.balance ?? 320).toFixed(0);
  const scheduledHours = Math.max(1, Number(s.scheduledHours) || 1);

  if (s.isActive && s.startTime) {
    const elapsedSeconds = Math.max(
      Number(s.baseSeconds) || 0,
      Math.floor((Date.now() - new Date(s.startTime).getTime()) / 1000)
    );
    const totalScheduledSeconds = scheduledHours * 3600;
    const remainingSeconds = Math.max(60, totalScheduledSeconds - elapsedSeconds);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const progressRatio = Math.min(0.95, Math.max(0.1, elapsedSeconds / totalScheduledSeconds));

    const rate = Number(s.rate || 6.0);
    const maxLimit = Number(s.maxLimit || 180.0);
    const cost = Math.min(
      maxLimit,
      Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2))
    ).toFixed(2);

    const trackBar = buildCleanProgressTrack(progressRatio);
    const cardImage = await buildUberStyleCardImage(s, remainingMinutes, cost, progressRatio);

    // Estructura identica a Uber:
    // Titulo: Tiempo restante: 59 min (o Xh Ym)
    // Subtitulo: XYZ-7842 • Volkswagen Jetta • Saldo $320
    // Barra: ━━━━━━━━●────  1h ($6.00/hr)
    const timeHeadline =
      remainingMinutes >= 60
        ? `Estancia activa • ${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`
        : `Estancia activa • ${remainingMinutes} min`;

    const title = timeHeadline;
    const body = `${plates} • ${carDesc} • Saldo $${balance}\n${trackBar}  ${scheduledHours}h ($${(scheduledHours * 6).toFixed(0)} MXN)`;

    return {
      title,
      options: {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        image: cardImage,
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

  const trackBar = buildCleanProgressTrack(0.1);
  const cardImage = await buildUberStyleCardImage(s, 60, '0.00', 0.1);
  const title = 'Parqu listo • $6.00/hr';
  const body = `${plates} • ${carDesc} • Saldo $${balance}\n${trackBar}  En espera`;

  return {
    title,
    options: {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: cardImage,
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

async function renderSingleNotificationOnce() {
  if (isShowingLock || !self.registration || !self.registration.showNotification) return;
  isShowingLock = true;
  try {
    await closeAllPreviousNotifications();
    const { title, options } = await buildSingleUberStyleNotification(latestParquState);
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
