// Motor de Notificacion Unica + Bloque Interactivo en Barra de Notificaciones / Pantalla de Bloqueo
const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';

let swRegistrationPromise = null;
let cachedSwRegistration = null;
let silentAudioEl = null;
let silentAudioUrl = null;
let cachedArtworkDataUrl = null;
let lastArtworkKey = '';

// Genera un archivo WAV de 2 segundos virtualmente inaudible (amplitud 1/32767)
// para mantener activo el bloque interactivo de controles en iOS Lock Screen / Dynamic Island y Android
function getSilentKeepAliveWavUrl() {
  if (silentAudioUrl) return silentAudioUrl;
  try {
    const sampleRate = 8000;
    const numSeconds = 2;
    const numSamples = sampleRate * numSeconds;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i += 1) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i += 1) {
      view.setInt16(44 + i * 2, i % 2 === 0 ? 1 : -1, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    silentAudioUrl = URL.createObjectURL(blob);
    return silentAudioUrl;
  } catch {
    return null;
  }
}

// Dibuja el bloque visual 512x512 para el widget interactivo de Pantalla de Bloqueo / Centro de Notificaciones
function buildLockScreenArtwork(payload) {
  if (typeof document === 'undefined') return './parqu-logo-black.png';
  const key = `${payload.isActive}-${payload.plates}-${payload.scheduledHours}-${payload.balance}`;
  if (key === lastArtworkKey && cachedArtworkDataUrl) {
    return cachedArtworkDataUrl;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return './parqu-logo-black.png';

    // Fondo oscuro profundo tipo Dynamic Island
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#01033E');
    grad.addColorStop(1, '#070913');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Borde interior brillante
    ctx.strokeStyle = payload.isActive ? '#38bdf8' : '#34d399';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 472, 472);

    // Encabezado
    ctx.fillStyle = payload.isActive ? '#38bdf8' : '#34d399';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      payload.isActive ? 'PARQUIMETRO ACTIVO' : 'PARQU DIGITAL LISTO',
      256,
      86
    );

    // Placas del vehiculo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px monospace';
    ctx.fillText(payload.plates || 'XYZ-7842', 256, 175);

    // Horas programadas y tarifa
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(
      payload.isActive
        ? `TIEMPO: ${payload.scheduledHours} HORA${payload.scheduledHours > 1 ? 'S' : ''}`
        : 'TARIFA: $6.00 / HR',
      256,
      255
    );

    // Saldo NFC
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('SALDO NFC DISPONIBLE', 256, 330);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 54px monospace';
    ctx.fillText(`$${payload.balance} MXN`, 256, 395);

    // Guia inferior de controles
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 21px monospace';
    ctx.fillText('|<< +$50   |   PAUSA: CANCELAR   |   >>| +1H', 256, 462);

    cachedArtworkDataUrl = canvas.toDataURL('image/png');
    lastArtworkKey = key;
    return cachedArtworkDataUrl;
  } catch {
    return './parqu-logo-black.png';
  }
}

export const unlockParquLiveControlBlock = () => {
  if (typeof window === 'undefined') return;
  try {
    if (!silentAudioEl) {
      const wavUrl = getSilentKeepAliveWavUrl();
      if (!wavUrl) return;
      silentAudioEl = new Audio(wavUrl);
      silentAudioEl.loop = true;
      silentAudioEl.volume = 0.01;
      silentAudioEl.playsInline = true;
      silentAudioEl.setAttribute('playsinline', 'true');
      silentAudioEl.setAttribute('webkit-playsinline', 'true');
    }
    if (silentAudioEl.paused) {
      silentAudioEl.play().catch(() => {});
    }
  } catch {
    // ignore
  }
};

export const syncParquLiveControlBlock = (contextData, handlers = {}) => {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  const payload = buildParkingNotificationPayload(contextData);
  const artworkSrc = buildLockScreenArtwork(payload);

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: payload.isActive
        ? `Parquímetro • ${payload.plates} • ${payload.scheduledHours}h ($${payload.cost})`
        : `Parqu Listo • ${payload.plates} ($6.00/hr)`,
      artist: `Saldo NFC: $${payload.balance} MXN  |  Tiempo: ${payload.scheduledHours}h`,
      album: '⏮ Recargar +$50   •   ⏸ Cancelar   •   +1 Hora ⏭',
      artwork: [
        { src: artworkSrc, sizes: '512x512', type: 'image/png' },
      ],
    });

    navigator.mediaSession.playbackState = 'playing';

    if (typeof navigator.mediaSession.setPositionState === 'function') {
      const totalDuration = Math.max(3600, (Number(payload.scheduledHours) || 1) * 3600);
      const currentPos = payload.isActive
        ? Math.min(totalDuration - 1, Math.max(0, Number(payload.elapsedSeconds) || 0))
        : 0;

      navigator.mediaSession.setPositionState({
        duration: totalDuration,
        playbackRate: payload.isActive ? 1.0 : 0.0001,
        position: currentPos,
      });
    }

    // Controles interactivos directos en la barra de notificaciones / pantalla de bloqueo:
    // 1. Botón Izquierdo (|<<): Recargar +$50 MXN
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (handlers.onRecharge50) handlers.onRecharge50();
    });

    // 2. Botón Derecho (>>|): Aumentar +1 Hora ($6.00)
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (handlers.onAddHour) handlers.onAddHour();
    });

    // 3. Botón Central (Pausa / Play): Cancelar o Iniciar Parquímetro
    navigator.mediaSession.setActionHandler('pause', () => {
      if (handlers.onToggleParking) handlers.onToggleParking();
      if (silentAudioEl && silentAudioEl.paused) {
        silentAudioEl.play().catch(() => {});
      }
    });

    navigator.mediaSession.setActionHandler('play', () => {
      if (handlers.onToggleParking) handlers.onToggleParking();
      if (silentAudioEl && silentAudioEl.paused) {
        silentAudioEl.play().catch(() => {});
      }
    });

    // Desactivar seekbackward/seekforward para que iOS muestre siempre los botones |<< y >>|
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
  } catch {
    // ignore
  }
};

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
  unlockParquLiveControlBlock();

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
  const balance = Number(card?.balance ?? 0).toFixed(2);
  const rfidTag = card?.rfidTag || 'NFC-MX-09142-PK';
  const autoPayEnabled = autoPay?.enabled !== false;
  const autoPayStatus = autoPayEnabled ? 'Auto ON' : 'Auto OFF';

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

    const title = `Parquímetro Activo • ${plates}`;
    const body = `Tiempo: ${scheduledHours}h ($6.00/hr)  |  Cobro: $${cost} MXN\nSaldo NFC: $${balance} MXN  |  Controles activos`;

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

  const title = `Parqu Digital • ${plates}`;
  const body = `En espera ($6.00/hr)  |  ${carDesc}\nSaldo NFC: $${balance} MXN  |  Controles listos`;

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
    cost: '0.00',
    rate: '6.00',
    maxLimit: 180,
    progressPercent: 0,
    zoneName: 'Listo para estacionar ($6.00/hr)',
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

// Envia ESTRICTAMENTE 1 sola notificacion al salir de la app (sin duplicados)
export const dispatchBackgroundNotificationImmediate = (contextData) => {
  unlockParquLiveControlBlock();
  const payload = buildParkingNotificationPayload(contextData);

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { sent: false, payload };
  }

  if (Notification.permission !== 'granted') {
    return { sent: false, payload };
  }

  // Ruta 1: Si el Service Worker controla la pagina, que el SW muestre la UNICA notificacion
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

  // Ruta 2 (Respaldo): Si aun no hay controller, mostrar 1 sola vez desde el registro cerrando previas
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
    renotify: false,
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
      if (typeof cachedSwRegistration.getNotifications === 'function') {
        cachedSwRegistration
          .getNotifications()
          .then((list) => list.forEach((n) => n.close()))
          .finally(() => {
            cachedSwRegistration.showNotification(payload.title, options).catch(() => {});
          });
      } else {
        cachedSwRegistration.showNotification(payload.title, options).catch(() => {});
      }
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
