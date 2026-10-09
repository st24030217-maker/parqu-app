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
  const carW = 68;
  const carH = 30;
  const x = centerX - carW / 2;
  const y = centerY - carH / 2;

  if (isActive) {
    // Haz de luz de los faros delanteros
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

    // Estela luminosa trasera
    const trailGrad = ctx.createLinearGradient(x - 54, centerY, x + 4, centerY);
    trailGrad.addColorStop(0, 'rgba(0, 51, 255, 0)');
    trailGrad.addColorStop(1, 'rgba(56, 189, 248, 0.75)');
    ctx.fillStyle = trailGrad;
    drawRoundedRect(ctx, x - 52, centerY - 6, 56, 12, 6);
    ctx.fill();
  }

  // Sombra inferior del vehículo
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  drawRoundedRect(ctx, x + 2, y + 4, carW, carH, 12);
  ctx.fill();

  // Carrocería principal blanca perlada
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, x, y, carW, carH, 12);
  ctx.fill();

  // Parabrisas delantero
  ctx.fillStyle = '#0f172a';
  drawRoundedRect(ctx, x + 40, y + 4, 13, carH - 8, 4);
  ctx.fill();

  // Medallón trasero
  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, x + 7, y + 5, 9, carH - 10, 3);
  ctx.fill();

  // Toldo panorámico azul Parqu
  ctx.fillStyle = isActive ? '#0033FF' : '#475569';
  drawRoundedRect(ctx, x + 19, y + 4.5, 18, carH - 9, 4);
  ctx.fill();

  // Faros LED delanteros
  ctx.fillStyle = '#38bdf8';
  drawRoundedRect(ctx, x + carW - 4, y + 4, 3, 5, 1.5);
  ctx.fill();
  drawRoundedRect(ctx, x + carW - 4, y + carH - 9, 3, 5, 1.5);
  ctx.fill();
}

export function drawLiveUberBlockFrame(ctx, width, height, payload, smoothWaveRatio = null) {
  ctx.clearRect(0, 0, width, height);

  const plates = payload.plates || 'XYZ-7842';
  const carDesc = payload.carDesc || 'Volkswagen Jetta';
  const balance = Number(payload.balance ?? 320).toFixed(0);
  const clockStr = payload.clockStr || '00:00:00';
  const cost = payload.cost || '0.00';
  const remainingMinutes = payload.remainingMinutes ?? 60;
  const endTimeStr = payload.endTimeStr || '';
  const zoneName = payload.zoneName || 'Espacio #1042 • Centro Histórico';

  const cardX = 10;
  const cardY = 8;
  const cardW = width - 20;
  const cardH = height - 16;

  // Fondo oscuro profundo estilo Uber / Apple Live Activity
  const grad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  grad.addColorStop(0, '#0f131d');
  grad.addColorStop(1, '#07090e');
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = payload.isActive
    ? 'rgba(56, 189, 248, 0.42)'
    : 'rgba(255, 255, 255, 0.15)';
  ctx.stroke();

  // 1. FILA SUPERIOR: Badge En Vivo + Zona + Saldo NFC
  ctx.fillStyle = payload.isActive ? '#0033FF' : '#1e293b';
  drawRoundedRect(ctx, cardX + 28, cardY + 22, 166, 32, 16);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cardX + 46, cardY + 38, 5, 0, Math.PI * 2);
  ctx.fillStyle = payload.isActive ? '#34d399' : '#94a3b8';
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('PARQU EN VIVO', cardX + 60, cardY + 43);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(zoneName.slice(0, 34), cardX + 208, cardY + 43);

  // Pastilla derecha: Saldo NFC
  ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
  drawRoundedRect(ctx, cardX + cardW - 204, cardY + 22, 176, 32, 16);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`SALDO: $${balance} MXN`, cardX + cardW - 44, cardY + 43);

  // 2. FILA CENTRAL: Reloj Gigante en Vivo (Izquierda) + Cobro Acumulado (Derecha)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('TIEMPO EN PARQUÍMETRO', cardX + 28, cardY + 84);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px monospace';
  ctx.fillText(payload.isActive ? clockStr : '00:00:00', cardX + 28, cardY + 136);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(
    payload.isActive
      ? `Restan ${remainingMinutes} min${endTimeStr ? ` • Vence ${endTimeStr}` : ''}`
      : 'Tarifa oficial $6.00 MXN / hr',
    cardX + 28,
    cardY + 166
  );

  // Derecha: Cobro en vivo y Placas
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

  // 3. FILA INFERIOR: Barra de Progreso Estilo Uber con Auto en Movimiento (CERO ASCII)
  const barLeft = cardX + 34;
  const barRight = cardX + cardW - 38;
  const barWidth = barRight - barLeft;
  const barY = cardY + 222;

  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, barLeft, barY - 5, barWidth, 10, 5);
  ctx.fill();

  const progressRatio =
    typeof smoothWaveRatio === 'number'
      ? smoothWaveRatio
      : payload.isActive
        ? Math.min(0.9, Math.max(0.18, (payload.progressPercent || 25) / 100))
        : 0.22;

  const carX = barLeft + Math.round(barWidth * progressRatio);
  const fillWidth = Math.max(18, carX - barLeft);

  const barGrad = ctx.createLinearGradient(barLeft, barY, carX, barY);
  barGrad.addColorStop(0, '#0033FF');
  barGrad.addColorStop(0.6, '#38bdf8');
  barGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = barGrad;
  drawRoundedRect(ctx, barLeft, barY - 5, fillWidth, 10, 5);
  ctx.fill();

  // Punto inicial y punto meta
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

  drawTopDownCar(ctx, carX, barY, Boolean(payload.isActive));

  // Etiquetas debajo de la barra
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('INICIO ESTANCIA', barLeft, cardY + 262);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(
    endTimeStr ? `FIN PROGRAMADO: ${endTimeStr}` : `META: ${payload.scheduledHours || 1} HORA(S)`,
    barRight,
    cardY + 262
  );
}

export function buildUberCardDataUrlSync(payload) {
  if (typeof document === 'undefined') return undefined;
  try {
    const width = 800;
    const height = 292;
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

    let endTimeStr = '';
    try {
      const startMs = activeSession.startTime
        ? new Date(activeSession.startTime).getTime()
        : Date.now();
      const endMs = startMs + scheduledHours * 3600 * 1000;
      endTimeStr = new Date(endMs).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      endTimeStr = '';
    }

    const zoneName = activeSession.zoneName || 'Espacio #1042 • Centro Histórico';
    const title = `🟢 Parqu En Vivo • ${clockStr} (Restan ${remainingMinutes} min)`;
    const body = `${plates} • Cobro: $${cost} MXN${endTimeStr ? ` • Vence ${endTimeStr}` : ''} • ${zoneName}`;

    return {
      title,
      body,
      clockStr,
      timeLabel,
      endTimeStr,
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
      zoneName,
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
    endTimeStr: '',
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

export const resetNotificationExitLock = () => {
  lastClientDispatchAt = 0;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('parqu_single_exit_notify_ts');
    const targetWorker =
      ('serviceWorker' in navigator && navigator.serviceWorker.controller) ||
      (cachedSwRegistration && cachedSwRegistration.active);
    if (targetWorker) {
      targetWorker.postMessage({ type: 'RESET_EXIT_LOCK' });
    }
  } catch {
    // ignore
  }
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

// Dispara ESTRICTAMENTE 1 sola notificación al salir de la app ÚNICAMENTE cuando el parquímetro está activo
export const dispatchBackgroundNotificationImmediate = (contextData) => {
  const payload = buildParkingNotificationPayload(contextData);

  // Solo desplegar notificación si el parquímetro está ACTIVO
  if (!payload.isActive) {
    return { sent: false, payload };
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, payload };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, payload };
  }

  const now = Date.now();
  if (now - lastClientDispatchAt < 12000) {
    return { sent: false, payload };
  }
  lastClientDispatchAt = now;

  const cardImage = buildUberCardDataUrlSync(payload);
  const actions = getSupportedNotificationActions(payload.isActive);

  // Respaldo Web Push keepalive por si iOS/Android congela el hilo JS al cerrar la app
  try {
    const savedSubStr = localStorage.getItem('parqu_web_push_subscription_v2');
    if (savedSubStr) {
      const subJson = JSON.parse(savedSubStr);
      if (subJson && subJson.endpoint) {
        fetch('/api/push', {
          method: 'POST',
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subJson,
            delayMs: 0,
            payload: {
              title: payload.title,
              body: payload.body,
              priority: 'high',
              data: payload,
            },
          }),
        }).catch(() => {});
      }
    }
  } catch {
    // ignore
  }

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

// ============================================================================
// WEB PUSH ESTÁNDAR (VAPID / FCM / APPLE PUSH) + API SERVERLESS EN VERCEL
// ============================================================================

export const PARQU_VAPID_PUBLIC_KEY =
  'BFjAAnsl4IG6qPfODHCl4oVBDCVJc1ThM0aDeitfYKutnTN4TEtaypZunWrehoE64KZgp53RxMknC0Ko2yeqM_A';

const PUSH_SUB_STORAGE_KEY = 'parqu_web_push_subscription_v2';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToWebPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const perm = await requestParkingNotificationPermission();
    if (perm !== 'granted') return null;

    const reg = (await registerParquServiceWorker()) || (await navigator.serviceWorker.ready);
    if (!reg || !reg.pushManager) return null;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PARQU_VAPID_PUBLIC_KEY),
      });
    }

    if (sub) {
      try {
        localStorage.setItem(PUSH_SUB_STORAGE_KEY, JSON.stringify(sub.toJSON()));
      } catch {
        // ignore
      }
    }
    return sub;
  } catch {
    return null;
  }
}

export async function getActiveWebPushSubscription() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = cachedSwRegistration || (await navigator.serviceWorker.ready);
    if (reg && reg.pushManager) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) return sub.toJSON();
    }
  } catch {
    // ignore
  }
  try {
    const saved = localStorage.getItem(PUSH_SUB_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

/**
 * Envía una notificación Push real de Alta Prioridad a través de /api/push (FCM / Apple Push / VAPID).
 * Si el navegador no soporta PushManager (ej. HTTP local), usa el fallback nativo del Service Worker.
 */
export async function sendServerWebPushNotification(contextData, options = {}) {
  const payload = buildParkingNotificationPayload(contextData);
  const delayMs = Number(options.delayMs) || 0;
  const customTitle = options.title || payload.title;
  const customBody = options.body || payload.body;

  try {
    let subJson = await getActiveWebPushSubscription();
    if (!subJson) {
      const newSub = await subscribeToWebPush();
      if (newSub) subJson = newSub.toJSON();
    }

    if (subJson && subJson.endpoint) {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subJson,
          delayMs,
          payload: {
            title: customTitle,
            body: customBody,
            priority: 'high',
            data: {
              ...payload,
              alertReason: options.alertReason || 'HIGH_PRIORITY_PUSH',
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.ok) {
          return { sent: true, via: 'web-push-server', payload };
        }
      }
    }
  } catch {
    // Fallback al Service Worker local si no hay conexión al endpoint serverless
  }

  if (delayMs > 0) {
    await new Promise((r) => setTimeout(r, delayMs));
  }
  lastClientDispatchAt = 0; // Permitir disparo explícito solicitado por el usuario
  const fallback = dispatchBackgroundNotificationImmediate(contextData);
  return { ...fallback, via: 'service-worker-local' };
}

