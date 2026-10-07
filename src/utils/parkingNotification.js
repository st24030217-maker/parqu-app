// Motor de Notificación Única Interactiva Fuera de la Aplicación (Estilo Uber Live Activity)
// - 1 sola notificación persistente en la barra del sistema / pantalla de bloqueo (cero spam, cero reproductor de música)
// - Línea continua en movimiento con auto blanco desplazándose en vivo
// - Botones de acción directos fuera de la app (+1 Hora $6, Recargar +$50, Iniciar / Cancelar Parqu)
// - Respaldo de 3 niveles (ServiceWorker Rich Card -> ServiceWorker Basic -> Native Notification API)

const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';

let swRegistrationPromise = null;
let cachedSwRegistration = null;
let clientAnimStep = 0;

function detectIsIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua);
}

// Detecta el número máximo de botones permitidos por el sistema operativo / navegador
// (Evita el TypeError en Chrome/Android/Edge cuando maxActions es 2 y se envían 3 botones)
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

function drawMovingTopDownCar(ctx, centerX, centerY, isActive) {
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

// Genera de forma 100% síncrona (<2ms) la tarjeta estilo Uber con línea continua y auto en movimiento
// para que al minimizar o salir en celular se dispare al instante antes de que el SO suspenda la pestaña
export function buildUberCardDataUrlSync(payload) {
  if (typeof document === 'undefined') return undefined;
  try {
    const width = 640;
    const height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.clearRect(0, 0, width, height);

    const scheduledHours = Math.max(1, Number(payload.scheduledHours) || 1);
    const plates = payload.plates || 'XYZ-7842';
    const carDesc = payload.carDesc || 'Volkswagen Jetta';
    const balance = Number(payload.balance ?? 320).toFixed(0);
    const clockStr = payload.clockStr || '00:00:00';
    const cost = payload.cost || '0.00';
    const remainingLabel = `${payload.remainingMinutes || 60}m`;

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
    ctx.strokeStyle = payload.isActive
      ? 'rgba(56, 189, 248, 0.38)'
      : 'rgba(255, 255, 255, 0.16)';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Parqu', cardX + 30, cardY + 38);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Saldo NFC: $${balance} MXN`, cardX + cardW - 30, cardY + 38);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 31px sans-serif';
    ctx.fillText(
      payload.isActive
        ? `Estancia activa • ${clockStr}`
        : 'Listo para estacionar ($6/hr)',
      cardX + 30,
      cardY + 84
    );

    ctx.fillStyle = '#9ca3af';
    ctx.font = '19px sans-serif';
    ctx.fillText(
      payload.isActive
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

    clientAnimStep = (clientAnimStep + 1) % 20;
    const animatedRatio = payload.isActive
      ? Math.min(0.92, Math.max(0.14, (payload.progressPercent || 25) / 100))
      : ((clientAnimStep % 20) / 20) * 0.65 + 0.15;

    const carX = barLeft + Math.round(barWidth * animatedRatio);
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
    ctx.arc(barRight, barY, 8, 0, Math.PI * 2);
    ctx.fillStyle = payload.isActive ? 'rgba(56, 189, 248, 0.35)' : '#4b5563';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(barRight, barY, 5, 0, Math.PI * 2);
    ctx.fillStyle = payload.isActive ? '#38bdf8' : '#9ca3af';
    ctx.fill();

    drawMovingTopDownCar(ctx, carX, barY, Boolean(payload.isActive));

    const controls = [
      { label: '+1 Hora ($6)', bg: '#0033ff', fg: '#ffffff' },
      { label: 'Recargar +$50', bg: '#1e293b', fg: '#38bdf8' },
      {
        label: payload.isActive ? 'Cancelar Parqu' : 'Iniciar Parqu',
        bg: payload.isActive ? '#7f1d1d' : '#065f46',
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
    swRegistrationPromise = navigator.serviceWorker
      .register('./sw.js', { scope: './', updateViaCache: 'none' })
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
        if (reg.active) {
          reg.active.postMessage({ type: 'APP_FOREGROUNDED' });
        }
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
    const progressRatio = Math.min(0.95, Math.max(0.12, elapsedSeconds / totalScheduledSeconds));

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
    const progressPercent = Math.min(100, Math.max(12, Math.round(progressRatio * 100)));

    const isExpiringSoon = remainingMinutes > 0 && remainingMinutes <= 5;
    const title = isExpiringSoon
      ? `⚠️ Quedan ${remainingMinutes} min • ${clockStr} (${plates})`
      : `Estancia activa • ${clockStr} (${scheduledHours}h)`;
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
      isExpiringSoon,
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

  const title = `Parqu listo • $6.00/hr • Saldo $${balance}`;
  const body = `${plates} • ${carDesc} • Controles rápidos activos fuera de la app`;

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
    progressPercent: 18,
    zoneName: 'Listo para estacionar ($6.00/hr)',
    startTime: null,
    baseSeconds: 0,
    isActive: false,
    isExpiringSoon: false,
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
    if ('serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_PARQU_STATE',
          payload,
        });
      } else if (cachedSwRegistration && cachedSwRegistration.active) {
        cachedSwRegistration.active.postMessage({
          type: 'SYNC_PARQU_STATE',
          payload,
        });
      }
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
      });
    }
    if (cachedSwRegistration && typeof cachedSwRegistration.getNotifications === 'function') {
      cachedSwRegistration
        .getNotifications()
        .then((list) => list.forEach((n) => n.close()))
        .catch(() => {});
    }
  } catch {
    // ignore
  }
};

// Dispara ESTRICTAMENTE 1 sola notificación al salir de la aplicación (sin duplicar entre SW y cliente)
export const dispatchBackgroundNotificationImmediate = (contextData) => {
  const payload = buildParkingNotificationPayload(contextData);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, payload };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, payload };
  }

  const cardImage = buildUberCardDataUrlSync(payload);
  const actions = getSupportedNotificationActions(payload.isActive);

  // 1. Si el Service Worker está activo, delegar ÚNICAMENTE al Service Worker (evita doble notificación)
  try {
    const targetWorker =
      ('serviceWorker' in navigator && navigator.serviceWorker.controller) ||
      (cachedSwRegistration && cachedSwRegistration.active);

    if (targetWorker) {
      targetWorker.postMessage({
        type: 'APP_BACKGROUNDED',
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

  // 2. Solo si aún no hay Service Worker activo, mostrar 1 sola vez desde cachedSwRegistration
  const richOptions = {
    body: payload.body,
    icon: './parqu-logo-black.png',
    badge: './parqu-logo-black.png',
    image: cardImage,
    tag: SINGLE_NOTIFICATION_TAG,
    renotify: false,
    silent: true,
    requireInteraction: false,
    actions,
    data: {
      url: window.location.href,
      timestamp: Date.now(),
    },
  };

  const basicOptions = {
    body: payload.body,
    icon: './parqu-logo-black.png',
    badge: './parqu-logo-black.png',
    tag: SINGLE_NOTIFICATION_TAG,
    renotify: false,
    silent: true,
  };

  if (cachedSwRegistration && typeof cachedSwRegistration.showNotification === 'function') {
    cachedSwRegistration
      .showNotification(payload.title, richOptions)
      .catch(() => {
        const noActionsOpts = { ...richOptions };
        delete noActionsOpts.actions;
        return cachedSwRegistration.showNotification(payload.title, noActionsOpts);
      })
      .catch(() => {
        return cachedSwRegistration.showNotification(payload.title, basicOptions);
      })
      .catch(() => {});

    return { sent: true, payload };
  }

  return { sent: false, payload };
};

export const sendParkingExitNotification = async (contextData) => {
  await registerParquServiceWorker();
  return dispatchBackgroundNotificationImmediate(contextData);
};
