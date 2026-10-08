// Motor de 1 Sola Notificación Nativa en la Barra de Notificaciones
// - Desregistra cualquier /sw.js viejo en caché y usa /parqu-sw-v2.js
// - Candado de 15 segundos: jamás envía más de 1 notificación

const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';

let swRegistrationPromise = null;
let cachedSwRegistration = null;
let lastClientDispatchAt = 0;

function detectIsIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua);
}

export function getSupportedNotificationActions(isActive) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return [];
  }

  const maxSupported =
    typeof Notification.maxActions === 'number' ? Notification.maxActions : 2;

  if (maxSupported <= 0) {
    return [];
  }

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
  const carW = 56;
  const carH = 26;
  const x = centerX - carW / 2;
  const y = centerY - carH / 2;

  if (isActive) {
    const trailGrad = ctx.createLinearGradient(x - 42, centerY, x + 4, centerY);
    trailGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0.65)');
    ctx.fillStyle = trailGrad;
    drawRoundedRect(ctx, x - 40, centerY - 5, 44, 10, 5);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  drawRoundedRect(ctx, x + 2, y + 3, carW, carH, 10);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, x, y, carW, carH, 10);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, x + 34, y + 3, 11, carH - 6, 3.5);
  ctx.fill();

  ctx.fillStyle = '#334155';
  drawRoundedRect(ctx, x + 6, y + 4, 7, carH - 8, 2.5);
  ctx.fill();

  ctx.fillStyle = isActive ? '#0033FF' : '#d97706';
  drawRoundedRect(ctx, x + 16, y + 4, 14, carH - 8, 3);
  ctx.fill();
}

export function drawLiveUberBlockFrame(ctx, width, height, payload, smoothWaveRatio = null) {
  ctx.clearRect(0, 0, width, height);

  const plates = payload.plates || 'XYZ-7842';
  const carDesc = payload.carDesc || 'Volkswagen Jetta';
  const balance = Number(payload.balance ?? 320).toFixed(0);
  const clockStr = payload.clockStr || '00:00:00';
  const cost = payload.cost || '0.00';
  const remainingLabel = `${payload.remainingMinutes || 60}m`;

  const cardX = 8;
  const cardY = 6;
  const cardW = width - 16;
  const cardH = height - 12;

  const grad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  grad.addColorStop(0, '#14161b');
  grad.addColorStop(1, '#0b0d11');
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = payload.isActive
    ? 'rgba(56, 189, 248, 0.38)'
    : 'rgba(255, 255, 255, 0.14)';
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText('Parqu', cardX + 30, cardY + 40);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`Saldo NFC: $${balance} MXN`, cardX + cardW - 30, cardY + 40);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(
    payload.isActive
      ? `Estancia activa • ${clockStr}`
      : `Parqu listo • $6.00/hr`,
    cardX + 30,
    cardY + 90
  );

  ctx.fillStyle = '#9ca3af';
  ctx.font = '21px sans-serif';
  ctx.fillText(
    payload.isActive
      ? `${plates} • ${carDesc} • $${cost} MXN (Restan ${remainingLabel})`
      : `${plates} • ${carDesc} • Saldo $${balance} MXN`,
    cardX + 30,
    cardY + 124
  );

  const barLeft = cardX + 30;
  const barRight = cardX + cardW - 34;
  const barWidth = barRight - barLeft;
  const barY = cardY + 174;

  ctx.fillStyle = '#4b5563';
  drawRoundedRect(ctx, barLeft, barY - 3.5, barWidth, 7, 3.5);
  ctx.fill();

  const progressRatio =
    typeof smoothWaveRatio === 'number'
      ? smoothWaveRatio
      : payload.isActive
        ? Math.min(0.88, Math.max(0.22, (payload.progressPercent || 28) / 100))
        : 0.28;

  const carX = barLeft + Math.round(barWidth * progressRatio);
  const fillWidth = Math.max(14, carX - barLeft);

  const barGrad = ctx.createLinearGradient(barLeft, barY, carX, barY);
  barGrad.addColorStop(0, '#0033FF');
  barGrad.addColorStop(0.55, '#38bdf8');
  barGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = barGrad;
  drawRoundedRect(ctx, barLeft, barY - 3.5, fillWidth, 7, 3.5);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(barRight, barY, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#6b7280';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(barRight, barY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#111318';
  ctx.fill();

  drawTopDownCar(ctx, carX, barY, Boolean(payload.isActive));
}

export function buildUberCardDataUrlSync(payload) {
  if (typeof document === 'undefined') return undefined;
  try {
    const width = 640;
    const height = 236;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    drawLiveUberBlockFrame(ctx, width, height, payload);
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

export const registerParquServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    // Detener y eliminar cualquier Service Worker antiguo (/sw.js) que tuviera setInterval en caché
    if (typeof navigator.serviceWorker.getRegistrations === 'function') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          regs.forEach((r) => {
            if (r.active) {
              r.active.postMessage({ type: 'APP_FOREGROUNDED' });
              r.active.postMessage({ type: 'STOP_ALL_LOOPS' });
            }
            const scriptUrl =
              (r.active && r.active.scriptURL) ||
              (r.installing && r.installing.scriptURL) ||
              (r.waiting && r.waiting.scriptURL) ||
              '';
            if (scriptUrl && !scriptUrl.includes('parqu-sw-v2.js')) {
              r.unregister().catch(() => {});
            }
          });
        })
        .catch(() => {});
    }

    swRegistrationPromise = navigator.serviceWorker
      .register('./parqu-sw-v2.js', { scope: './', updateViaCache: 'none' })
      .then((reg) => {
        cachedSwRegistration = reg;
        if (typeof reg.update === 'function') {
          reg.update().catch(() => {});
        }
        return reg;
      })
      .catch(() => null);

    navigator.serviceWorker.ready
      .then((reg) => {
        cachedSwRegistration = reg;
      })
      .catch(() => {});
  }
  return swRegistrationPromise;
};

export const getNotificationPermissionState = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const requestParkingNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    await registerParquServiceWorker();
    return 'granted';
  }
  try {
    const result = await new Promise((resolve) => {
      let settled = false;
      const done = (val) => {
        if (!settled) {
          settled = true;
          resolve(val);
        }
      };
      try {
        const maybePromise = Notification.requestPermission((perm) => done(perm));
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(done).catch(() => done(Notification.permission));
        }
      } catch {
        done(Notification.permission);
      }
    });

    if (result === 'granted') {
      await registerParquServiceWorker();
    }
    return result;
  } catch {
    return Notification.permission;
  }
};

export const buildParkingNotificationPayload = ({
  owner = {},
  vehicle = {},
  card = {},
  autoPay = {},
  activeSession = null,
  transactions = [],
} = {}) => {
  const fullName = owner?.fullName || 'Sebastián Salinas';
  const plates = vehicle?.plates || 'XYZ-7842';
  const carDesc = `${vehicle?.brand || 'Volkswagen'} ${vehicle?.model || 'Jetta'}`.trim();
  const balance = Number(card?.balance ?? 320).toFixed(0);
  const rfidTag = card?.rfidTag || 'NFC-MX-09142-PK';
  const autoPayEnabled = autoPay?.enabled !== false;
  const autoPayStatus = autoPayEnabled ? 'Auto ON' : 'Auto OFF';
  const isIOS = detectIsIOS();

  const historyMinutes = Array.isArray(transactions)
    ? transactions.reduce((acc, t) => acc + (Number(t?.durationMinutes) || 0), 0)
    : 0;
  const histHours = Math.floor(historyMinutes / 60);
  const histRemMinutes = historyMinutes % 60;
  const historyText =
    historyMinutes > 0
      ? `${histHours}h ${histRemMinutes}m acumulados`
      : '0h 00m registrados';

  if (activeSession) {
    const elapsedSeconds = Math.max(
      Number(activeSession.secondsElapsed) || 0,
      activeSession.startTime
        ? Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000)
        : 0
    );
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const rate = Number(activeSession.ratePerHour || 6.0);
    const scheduledHours = Math.max(1, Number(activeSession.scheduledHours) || 1);
    const totalScheduledSeconds = scheduledHours * 3600;
    const remainingSeconds = Math.max(0, totalScheduledSeconds - elapsedSeconds);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const progressRatio = Math.min(0.88, Math.max(0.22, elapsedSeconds / totalScheduledSeconds));

    const maxLimit = Number(activeSession.maxLimit || 180.0);
    const cost = Math.min(
      maxLimit,
      Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2))
    ).toFixed(2);

    const clockStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const timeLabel =
      hours > 0
        ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
        : `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    const progressPercent = Math.min(100, Math.max(18, Math.round(progressRatio * 100)));

    const title = `Estancia activa • ${clockStr} (${scheduledHours}h)`;
    const body = `${plates} • ${carDesc} • Cobro: $${cost} MXN • Saldo: $${balance} MXN`;

    return {
      title,
      body,
      clockStr,
      timeLabel,
      hours,
      minutes,
      seconds,
      elapsedSeconds,
      scheduledHours,
      remainingMinutes,
      cost,
      rate: rate.toFixed(2),
      maxLimit,
      progressPercent,
      zoneName: activeSession.zoneName || 'Espacio #1042 • Centro Histórico',
      startTime: activeSession.startTime,
      baseSeconds: elapsedSeconds,
      isActive: true,
      isIOS,
      fullName,
      plates,
      carDesc,
      balance,
      rfidTag,
      autoPayEnabled,
      autoPayStatus,
      historyText,
    };
  }

  const title = `Parqu • Tarifa $6.00/hr • Saldo $${balance} MXN`;
  const body = `${plates} • ${carDesc} • Listo para estacionar`;

  return {
    title,
    body,
    clockStr: '00:00:00',
    timeLabel: '00m 00s',
    hours: 0,
    minutes: 0,
    seconds: 0,
    elapsedSeconds: 0,
    scheduledHours: 1,
    remainingMinutes: 60,
    cost: '0.00',
    rate: '6.00',
    maxLimit: 180,
    progressPercent: 28,
    zoneName: 'Listo para estacionar ($6.00/hr)',
    startTime: null,
    baseSeconds: 0,
    isActive: false,
    isIOS,
    fullName,
    plates,
    carDesc,
    balance,
    rfidTag,
    autoPayEnabled,
    autoPayStatus,
    historyText,
  };
};

export const syncParquStateToServiceWorker = (contextData) => {
  if (typeof window === 'undefined') return;
  const payload = buildParkingNotificationPayload(contextData);

  try {
    const targetWorker =
      ('serviceWorker' in navigator && navigator.serviceWorker.controller) ||
      (cachedSwRegistration && cachedSwRegistration.active);

    if (targetWorker) {
      targetWorker.postMessage({
        type: 'SYNC_PARQU_STATE',
        payload,
      });
    }
  } catch {
    // ignore
  }
};

export const notifyAppForegrounded = () => {
  if (typeof window === 'undefined') return;
  try {
    const targetWorker =
      ('serviceWorker' in navigator && navigator.serviceWorker.controller) ||
      (cachedSwRegistration && cachedSwRegistration.active);

    if (targetWorker) {
      targetWorker.postMessage({
        type: 'APP_FOREGROUNDED',
        closeNotifications: false,
      });
    }
  } catch {
    // ignore
  }
};

// Dispara ESTRICTAMENTE 1 sola notificación con candado duro de 15 segundos
export const dispatchBackgroundNotificationImmediate = (contextData) => {
  const payload = buildParkingNotificationPayload(contextData);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, payload };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, payload };
  }

  const now = Date.now();
  if (now - lastClientDispatchAt < 15000) {
    return { sent: false, payload };
  }
  lastClientDispatchAt = now;

  const cardImage = buildUberCardDataUrlSync(payload);
  const actions = getSupportedNotificationActions(payload.isActive);

  try {
    const targetWorker =
      (cachedSwRegistration && cachedSwRegistration.active) ||
      ('serviceWorker' in navigator && navigator.serviceWorker.controller);

    if (targetWorker) {
      targetWorker.postMessage({
        type: 'PARQU_SINGLE_NOTIFY_V2',
        payload: {
          state: {
            ...payload,
            preRenderedImage: cardImage,
          },
        },
      });
      return { sent: true, payload };
    }
  } catch {
    // ignore
  }

  if (cachedSwRegistration && typeof cachedSwRegistration.showNotification === 'function') {
    const richOptions = {
      body: payload.body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: cardImage,
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: false,
      silent: true,
      requireInteraction: true,
      actions,
      data: {
        url: window.location.href,
        timestamp: now,
      },
    };

    cachedSwRegistration.showNotification(payload.title, richOptions).catch(() => {});
    return { sent: true, payload };
  }

  return { sent: false, payload };
};

export const sendParkingExitNotification = async (contextData) => {
  await registerParquServiceWorker();
  return dispatchBackgroundNotificationImmediate(contextData);
};
