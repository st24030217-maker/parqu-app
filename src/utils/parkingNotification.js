// Motor de Notificaciones Interactivas en Vivo en Segundo Plano (Sin Emojis)
let swRegistrationPromise = null;
let cachedSwRegistration = null;

export const registerParquServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then((reg) => {
        cachedSwRegistration = reg;
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
  return Notification.permission; // 'granted' | 'denied' | 'default'
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

const buildAsciiProgressBar = (elapsedSeconds) => {
  const ratio = Math.min(1, (elapsedSeconds % 3600) / 3600);
  const filled = Math.max(1, Math.round(ratio * 10));
  return '[' + '█'.repeat(filled) + '░'.repeat(10 - filled) + ']';
};

export const buildParkingNotificationPayload = ({
  owner = {},
  vehicle = {},
  card = {},
  autoPay = {},
  activeSession = null,
  transactions = [],
}) => {
  const fullName = owner?.fullName || 'Sebastián Salinas';
  const plates = vehicle?.plates || 'XYZ-7842';
  const carDesc = `${vehicle?.brand || 'Volkswagen'} ${vehicle?.model || 'Jetta Sportline'}`.trim();
  const balance = Number(card?.balance ?? 0).toFixed(2);
  const rfidTag = card?.rfidTag || 'NFC-MX-09142-PK';
  const autoPayEnabled = autoPay?.enabled !== false;
  const autoPayStatus = autoPayEnabled ? 'AUTOCOBRO ON' : 'AUTOCOBRO PAUSADO';

  const historyMinutes = Array.isArray(transactions)
    ? transactions.reduce((acc, t) => acc + (Number(t?.durationMinutes) || 0), 0)
    : 0;
  const histHours = Math.floor(historyMinutes / 60);
  const histRemMinutes = historyMinutes % 60;
  const historyText =
    historyMinutes > 0
      ? `${histHours} hr ${histRemMinutes} min acumulados`
      : '0 hr 00 min registrados';

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
    const bar = buildAsciiProgressBar(elapsedSeconds);
    const progressPercent = Math.min(100, Math.max(4, Math.round((Number(cost) / maxLimit) * 100)));

    const title = `PARQU EN VIVO • ${clockStr} • $${cost} MXN`;
    const body = [
      `${bar} ACTIVO • Placas ${plates} (${carDesc})`,
      `Zona: ${activeSession.zoneName} • Tarifa $${rate.toFixed(2)}/hr • ${autoPayStatus}`,
      `Titular: ${fullName} • Saldo NFC: $${balance} MXN`,
    ].join('\n');

    return {
      title,
      body,
      clockStr,
      timeLabel,
      hours,
      minutes,
      seconds,
      elapsedSeconds,
      cost,
      rate: rate.toFixed(2),
      maxLimit,
      progressPercent,
      zoneName: activeSession.zoneName,
      startTime: activeSession.startTime,
      baseSeconds: elapsedSeconds,
      isActive: true,
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

  const title = `PARQU MONITOR • ${plates} • EN ESPERA`;
  const body = [
    `[──────────] SIN COBRO ACTIVO (00:00:00) • ${autoPayStatus}`,
    `Vehículo: ${carDesc} (${plates}) • Tarifa: $6.00/hr`,
    `Titular: ${fullName} • Pase ${rfidTag} • Saldo: $${balance} MXN (${historyText})`,
  ].join('\n');

  return {
    title,
    body,
    clockStr: '00:00:00',
    timeLabel: '00m 00s',
    hours: 0,
    minutes: 0,
    seconds: 0,
    elapsedSeconds: 0,
    cost: '0.00',
    rate: '6.00',
    maxLimit: 180,
    progressPercent: 0,
    zoneName: 'Vigilancia NFC Activa • Listo para estacionar',
    startTime: null,
    baseSeconds: 0,
    isActive: false,
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
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_PARQU_STATE',
        payload,
      });
    }
  } catch {
    // ignore
  }

  // Actualizar MediaSession metadata sin emojis para pantalla de bloqueo móvil
  try {
    if ('mediaSession' in navigator && typeof window.MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: payload.isActive
          ? `PARQU EN VIVO • ${payload.clockStr} ($${payload.cost} MXN)`
          : `PARQU MONITOR • ${payload.plates} (${payload.autoPayStatus})`,
        artist: `${payload.fullName} • ${payload.carDesc} (${payload.plates})`,
        album: `Saldo NFC: $${payload.balance} MXN • Tarifa $6.00/hr`,
        artwork: [
          { src: './parqu-logo.png', sizes: '192x192', type: 'image/png' },
          { src: './parqu-logo.png', sizes: '512x512', type: 'image/png' },
        ],
      });
    }
  } catch {
    // ignore
  }
};

export const notifyAppForegrounded = () => {
  if (typeof window === 'undefined') return;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'APP_FOREGROUNDED',
      });
    }
  } catch {
    // ignore
  }
};

export const dispatchBackgroundNotificationImmediate = (contextData, isSilentUpdate = false) => {
  const payload = buildParkingNotificationPayload(contextData);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, payload };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, payload };
  }

  const options = {
    body: payload.body,
    icon: './parqu-logo-black.png',
    badge: './parqu-logo-black.png',
    tag: 'parqu-live-parking-status',
    renotify: !isSilentUpdate,
    silent: isSilentUpdate,
    requireInteraction: Boolean(payload.isActive),
    vibrate: isSilentUpdate ? undefined : [140, 60, 140],
    actions: payload.isActive
      ? [
          { action: 'stop_parking', title: 'Finalizar Estancia' },
          { action: 'open_app', title: 'Abrir Panel en Vivo' },
        ]
      : [
          { action: 'start_parking', title: 'Iniciar Parquimetro ($6/hr)' },
          { action: 'open_app', title: 'Abrir Parqu' },
        ],
    data: {
      url: window.location.href,
      timestamp: Date.now(),
    },
  };

  let sent = false;

  // 1. Disparo síncrono vía Service Worker para que continúe en vivo al salir de la app
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'APP_BACKGROUNDED',
        payload: {
          title: payload.title,
          options,
          state: payload,
        },
      });
      sent = true;
    }
  } catch {
    // ignore
  }

  // 2. Respaldo directo en el registro del Service Worker en memoria
  try {
    if (cachedSwRegistration && typeof cachedSwRegistration.showNotification === 'function') {
      cachedSwRegistration.showNotification(payload.title, options).catch(() => {});
      sent = true;
    }
  } catch {
    // ignore
  }

  // 3. Fallback Notification constructor para Safari / Desktop
  if (!sent) {
    try {
      const { actions, ...fallbackOptions } = options;
      new Notification(payload.title, fallbackOptions);
      sent = true;
    } catch {
      // ignore
    }
  }

  return { sent, payload };
};

export const sendParkingExitNotification = async (contextData) => {
  await registerParquServiceWorker();
  return dispatchBackgroundNotificationImmediate(contextData, false);
};
