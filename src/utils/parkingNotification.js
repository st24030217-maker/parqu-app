// Motor de Notificacion Unica Interactiva Estilo Uber con Linea Continua en Movimiento
const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';

let swRegistrationPromise = null;
let cachedSwRegistration = null;

function detectIsIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua);
}

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
}) => {
  const fullName = owner?.fullName || 'Sebastián Salinas';
  const plates = vehicle?.plates || 'XYZ-7842';
  const carDesc = `${vehicle?.brand || 'Volkswagen'} ${vehicle?.model || 'Jetta'}`.trim();
  const balance = Number(card?.balance ?? 0).toFixed(0);
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
    const remainingSeconds = Math.max(60, totalScheduledSeconds - elapsedSeconds);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const progressRatio = Math.min(0.95, Math.max(0.1, elapsedSeconds / totalScheduledSeconds));

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
    const progressPercent = Math.min(100, Math.max(8, Math.round(progressRatio * 100)));

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
      zoneName: activeSession.zoneName,
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

  const title = `Parqu listo • $6.00/hr • Saldo $${balance}`;
  const body = `${plates} • ${carDesc} • Usa los botones para iniciar o recargar`;

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
    progressPercent: 10,
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
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
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
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
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

export const dispatchBackgroundNotificationImmediate = (contextData) => {
  const payload = buildParkingNotificationPayload(contextData);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, payload };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, payload };
  }

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'APP_BACKGROUNDED',
        payload: {
          state: payload,
        },
      });
      return { sent: true, payload };
    }
  } catch {
    // ignore
  }

  const actions = payload.isActive
    ? [
        { action: 'add_hour', title: '+1 Hora ($6)' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
        { action: 'cancel_parking', title: 'Cancelar Parqu' },
      ]
    : [
        { action: 'start_parking', title: 'Iniciar Parqu' },
        { action: 'add_hour', title: '+1 Hora ($6)' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
      ];

  const options = {
    body: payload.body,
    icon: './parqu-logo-black.png',
    badge: './parqu-logo-black.png',
    tag: SINGLE_NOTIFICATION_TAG,
    renotify: true,
    silent: false,
    requireInteraction: true,
    actions,
    data: {
      url: window.location.href,
      timestamp: Date.now(),
    },
  };

  try {
    if (cachedSwRegistration && typeof cachedSwRegistration.showNotification === 'function') {
      cachedSwRegistration.showNotification(payload.title, options).catch(() => {});
      return { sent: true, payload };
    }
  } catch {
    // ignore
  }

  return { sent: false, payload };
};

export const sendParkingExitNotification = async (contextData) => {
  await registerParquServiceWorker();
  return dispatchBackgroundNotificationImmediate(contextData);
};
