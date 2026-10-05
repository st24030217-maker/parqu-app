// Utilidad de Notificaciones Nativas y en Segundo Plano para Parqu
let swRegistrationPromise = null;

export const registerParquServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('./sw.js')
      .catch(() => null);
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
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      await registerParquServiceWorker();
    }
    return result;
  } catch {
    return Notification.permission;
  }
};

export const formatHoursAndMinutes = (totalSeconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s (${hours} hr ${minutes} min)`;
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds} seg (0h ${minutes}m)`;
  }
  return `${seconds} seg (0h 00m)`;
};

export const buildParkingNotificationPayload = ({
  owner = {},
  vehicle = {},
  card = {},
  activeSession = null,
  transactions = [],
}) => {
  const fullName = owner?.fullName || 'Conductor Parqu';
  const plates = vehicle?.plates || 'XYZ-7842';
  const carDesc = `${vehicle?.brand || 'Vehículo'} ${vehicle?.model || ''}`.trim();
  const balance = Number(card?.balance ?? 0).toFixed(2);
  const rfidTag = card?.rfidTag || 'NFC-MX-09142-PK';

  // Calcular tiempo acumulado del historial en minutos/horas
  const historyMinutes = Array.isArray(transactions)
    ? transactions.reduce((acc, t) => acc + (Number(t?.durationMinutes) || 0), 0)
    : 0;
  const histHours = Math.floor(historyMinutes / 60);
  const histRemMinutes = historyMinutes % 60;

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
    const cost = Math.min(
      Number(activeSession.maxLimit || 180),
      Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2))
    ).toFixed(2);

    const timeLabel =
      hours > 0
        ? `${hours} hr ${minutes} min ${seconds} seg`
        : `${minutes} min ${seconds} seg`;

    const title = `⏱️ Parquímetro Activo: ${timeLabel} • ${plates}`;
    const body = [
      `👤 Titular: ${fullName} | 🚘 ${carDesc} (${plates})`,
      `⏳ Tiempo: ${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s • 📍 ${activeSession.zoneName}`,
      `💳 Cobro actual: $${cost} MXN ($${rate.toFixed(2)}/hr) • Saldo NFC: $${balance} MXN`,
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
      zoneName: activeSession.zoneName,
      isActive: true,
      fullName,
      plates,
      carDesc,
      balance,
      rfidTag,
    };
  }

  const totalTimeText =
    historyMinutes > 0
      ? `${histHours} hr ${histRemMinutes} min acumulados`
      : '0 hr 00 min (Sin sesión en curso)';

  const title = `🚗 Parqu NFC • ${plates} (${fullName})`;
  const body = [
    `👤 Titular: ${fullName} | 🚘 ${carDesc} (${plates})`,
    `⏱️ Parquímetro: 0h 00m activos (${totalTimeText}) • Tarifa: $6.00/hr`,
    `💳 Pase NFC: ${rfidTag} • Saldo disponible: $${balance} MXN`,
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
    zoneName: 'Sin parquímetro activo • Listo para NFC',
    isActive: false,
    fullName,
    plates,
    carDesc,
    balance,
    rfidTag,
    historyText: totalTimeText,
  };
};

export const sendParkingExitNotification = async (contextData) => {
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
    vibrate: [180, 80, 180],
    data: {
      url: window.location.href,
      timestamp: Date.now(),
    },
  };

  try {
    // 1. Intentar vía Service Worker (Requerido en Android Chrome y PWA móvil)
    if ('serviceWorker' in navigator) {
      const reg = (await navigator.serviceWorker.getRegistration()) || (await registerParquServiceWorker());
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(payload.title, options);
        return { sent: true, payload };
      }
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_PARQU_NOTIFICATION',
          payload: { title: payload.title, options },
        });
        return { sent: true, payload };
      }
    }

    // 2. Fallback directo para navegadores de escritorio / Safari
    new Notification(payload.title, options);
    return { sent: true, payload };
  } catch {
    try {
      new Notification(payload.title, options);
      return { sent: true, payload };
    } catch {
      return { sent: false, payload };
    }
  }
};
