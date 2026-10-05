// Motor de Notificaciones en Segundo Plano para Teléfono (Android / iOS / Web / PWA)
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
    // Soportar tanto la promesa moderna como el callback legacy en WebViews móviles
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
}) => {
  const fullName = owner?.fullName || 'Sebastián Salinas';
  const plates = vehicle?.plates || 'XYZ-7842';
  const carDesc = `${vehicle?.brand || 'Volkswagen'} ${vehicle?.model || 'Jetta Sportline'}`.trim();
  const balance = Number(card?.balance ?? 0).toFixed(2);
  const rfidTag = card?.rfidTag || 'NFC-MX-09142-PK';
  const autoPayEnabled = autoPay?.enabled !== false;
  const autoPayStatus = autoPayEnabled ? 'Autocobro Activo' : 'Autocobro en Pausa';

  // Calcular tiempo acumulado del historial en minutos/horas
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

    const timeLabel =
      hours > 0
        ? `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
        : `${minutes} min ${String(seconds).padStart(2, '0')} seg`;

    const title = `🟢 Parqu en 2º Plano • ${timeLabel} ($${cost} MXN)`;
    const body = [
      `🚗 En Parquímetro: ${carDesc} • Placas ${plates}`,
      `📍 ${activeSession.zoneName} • Tarifa $${rate.toFixed(2)}/hr (${autoPayStatus})`,
      `👤 ${fullName} • 💳 Saldo NFC: $${balance} MXN`,
    ].join('\n');

    return {
      title,
      body,
      timeLabel,
      hours,
      minutes,
      seconds,
      cost,
      rate: rate.toFixed(2),
      maxLimit,
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

  const title = `🛡️ Parqu en 2º Plano • ${plates} (${autoPayStatus})`;
  const body = [
    `🚗 ${carDesc} (${plates}) • Sin cobro activo (0h 00m)`,
    `💳 Pase NFC ${rfidTag} listo • Saldo: $${balance} MXN • Tarifa $6.00/hr`,
    `👤 ${fullName} • Historial: ${historyText}`,
  ].join('\n');

  return {
    title,
    body,
    timeLabel: '0 hr 00 min (En espera)',
    hours: 0,
    minutes: 0,
    seconds: 0,
    cost: '0.00',
    rate: '6.00',
    maxLimit: 180,
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

// Sincronizar el estado actual con el Service Worker y MediaSession para que al salir de la app ya esté listo
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

  // Actualizar MediaSession metadata (útil en pantallas de bloqueo móviles)
  try {
    if ('mediaSession' in navigator && typeof window.MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: payload.isActive
          ? `Parquímetro: ${payload.timeLabel} ($${payload.cost})`
          : `Parqu NFC • ${payload.plates}`,
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

// Disparo SÍNCRONO inmediato para usar dentro de visibilitychange ('hidden') y pagehide en teléfonos
export const dispatchBackgroundNotificationImmediate = (contextData) => {
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
    renotify: true,
    requireInteraction: Boolean(payload.isActive),
    vibrate: [160, 70, 160],
    data: {
      url: window.location.href,
      timestamp: Date.now(),
    },
  };

  let sent = false;

  // 1. Enviar mensaje síncrono al Service Worker (no se congela al salir de la app en el teléfono)
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

  // 2. Llamar showNotification directamente sobre el registro cacheado en memoria (sin await previo)
  try {
    if (cachedSwRegistration && typeof cachedSwRegistration.showNotification === 'function') {
      cachedSwRegistration.showNotification(payload.title, options).catch(() => {});
      sent = true;
    }
  } catch {
    // ignore
  }

  // 3. Fallback Notification constructor para Safari / Desktop si no hay SW activo aún
  if (!sent) {
    try {
      new Notification(payload.title, options);
      sent = true;
    } catch {
      // En Android Chrome new Notification lanza excepción y requiere el SW
    }
  }

  return { sent, payload };
};

export const sendParkingExitNotification = async (contextData) => {
  await registerParquServiceWorker();
  return dispatchBackgroundNotificationImmediate(contextData);
};
