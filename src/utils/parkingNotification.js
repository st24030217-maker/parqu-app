// Motor de Notificacion Unica con Animacion en Vivo en la Barra de Notificaciones (Sin Duplicados)
const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';
const WAVE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

let swRegistrationPromise = null;
let cachedSwRegistration = null;
let localWaveFrame = 0;

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

const buildAnimatedWave = (frame, length = 10, isActive = true) => {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const speed = isActive ? 0.75 : 0.4;
    const val = (Math.sin(frame * speed + i * 0.65) + 1) / 2;
    const idx = Math.min(
      WAVE_CHARS.length - 1,
      Math.max(0, Math.floor(val * WAVE_CHARS.length))
    );
    out += WAVE_CHARS[idx];
  }
  return out;
};

const buildSweepingBar = (frame, width = 10) => {
  const pos = frame % width;
  let bar = '[';
  for (let i = 0; i < width; i += 1) {
    if (i === pos) {
      bar += '●';
    } else if (i < pos) {
      bar += '━';
    } else {
      bar += '─';
    }
  }
  bar += ']';
  return bar;
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

  const wave = buildAnimatedWave(localWaveFrame, 10, Boolean(activeSession));
  const sweep = buildSweepingBar(localWaveFrame, 10);

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
    const progressPercent = Math.min(100, Math.max(4, Math.round((Number(cost) / maxLimit) * 100)));

    const title = `PARQU ${wave} ${clockStr} • $${cost} MXN`;
    const body = [
      `${sweep} ACTIVO • Placas ${plates} (${carDesc})`,
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

  const title = `PARQU ${wave} ${plates} • EN VIVO`;
  const body = [
    `${sweep} EN ESPERA (00:00:00) • ${autoPayStatus}`,
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

// Dispara UNICAMENTE UNA notificacion (por un solo canal) para que jamas aparezcan varias
export const dispatchBackgroundNotificationImmediate = (contextData) => {
  localWaveFrame += 1;
  const payload = buildParkingNotificationPayload(contextData);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, payload };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, payload };
  }

  // Canal 1 (Preferido y Unico): Delegar al Service Worker para que anime la UNICA notificacion en la barra
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

  // Canal 2 (Solo si el SW aun no controla la pagina): Mostrar 1 sola notificacion con tag unico y renotify: false
  const options = {
    body: payload.body,
    icon: './parqu-logo-black.png',
    badge: './parqu-logo-black.png',
    tag: SINGLE_NOTIFICATION_TAG,
    renotify: false,
    silent: true,
    requireInteraction: Boolean(payload.isActive),
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

  try {
    new Notification(payload.title, options);
    return { sent: true, payload };
  } catch {
    return { sent: false, payload };
  }
};

export const sendParkingExitNotification = async (contextData) => {
  await registerParquServiceWorker();
  return dispatchBackgroundNotificationImmediate(contextData);
};
