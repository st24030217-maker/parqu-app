// Service Worker v2 de Parqu - ESTRICTAMENTE 1 SOLA NOTIFICACIÓN + WEB PUSH (FCM / VAPID)
// CERO intervalos, CERO repeticiones, CERO spam.

const SINGLE_NOTIFICATION_TAG = 'parqu-single-live-notification';
const NTFY_BASE_URL = 'https://ntfy.sh';

let latestParquState = null;
let pendingActionsQueue = [];
let isShowingLock = false;
let lastShownAt = 0;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function getSupportedSwActions(isActive) {
  const maxSupported =
    typeof self.Notification !== 'undefined' &&
    typeof self.Notification.maxActions === 'number'
      ? self.Notification.maxActions
      : 2;

  if (maxSupported <= 0) return [];

  const fullActions = isActive
    ? [
        { action: 'add_hour', title: '+1 Hora ($6)' },
        { action: 'cancel_parking', title: 'Finalizar Estancia' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
      ]
    : [
        { action: 'start_parking', title: 'Iniciar Parqu ($6)' },
        { action: 'add_balance_50', title: 'Recargar +$50' },
        { action: 'add_hour', title: '+1 Hora ($6)' },
      ];

  return fullActions.slice(0, maxSupported);
}

async function publishStateFromServiceWorker(s) {
  if (!s || !s.plates) return;
  try {
    const cleanPlate = String(s.plates)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (!cleanPlate) return;
    const topic = `parqu_v2_plate_${cleanPlate}`;

    const envelope = {
      _type: 'PARQU_LIVE_STATE',
      deviceId: 'SW_OUTSIDE_APP',
      timestamp: Date.now(),
      updatedAt: new Date().toISOString(),
      plates: String(s.plates).trim().toUpperCase(),
      vehicle: {
        plates: s.plates || 'XYZ-7842',
      },
      owner: {
        fullName: s.fullName || 'Sebastián Salinas',
      },
      card: {
        balance: Number(s.balance ?? 320),
        rfidTag: s.rfidTag || 'NFC-MX-09142-PK',
        status: s.isActive ? 'EN_PARQUIMETRO' : 'ACTIVA',
      },
      activeSession: s.isActive
        ? {
            id: 'SESS-SW',
            zoneName: s.zoneName || 'Espacio #1042 • Centro Histórico',
            ratePerHour: Number(s.rate || 6.0),
            startTime: s.startTime || new Date().toISOString(),
            secondsElapsed: Number(s.baseSeconds || 0),
            currentCost: Number(s.cost || 0),
            scheduledHours: Number(s.scheduledHours || 1),
            maxLimit: Number(s.maxLimit || 180),
          }
        : null,
    };

    await fetch(`${NTFY_BASE_URL}/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        Title: `Parqu Notificacion: ${envelope.plates}`,
        Priority: 'default',
      },
      body: JSON.stringify(envelope),
    });
  } catch {
    // ignore
  }
}

async function closeAllNotifications() {
  if (!self.registration || typeof self.registration.getNotifications !== 'function') return;
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach((n) => n.close());
  } catch {
    // ignore
  }
}

async function showOneNotification(state, isActionUpdate = false, customOverride = null) {
  if (isShowingLock || !self.registration || !self.registration.showNotification) return;

  const now = Date.now();
  // Si no es un clic directo o push explícito, bloquear cualquier duplicado por 15 segundos
  if (!isActionUpdate && now - lastShownAt < 15000) {
    return;
  }

  isShowingLock = true;
  lastShownAt = now;

  try {
    const s = state || latestParquState || {};
    const plates = s.plates || 'XYZ-7842';
    const carDesc = s.carDesc || 'Volkswagen Jetta';
    const balance = Number(s.balance ?? 320).toFixed(0);
    const scheduledHours = Math.max(1, Number(s.scheduledHours) || 1);

    let title = customOverride?.title || `Parqu • Tarifa $6.00/hr • Saldo $${balance} MXN`;
    let body = customOverride?.body || `${plates} • ${carDesc} • Toca para abrir control rápido`;

    if (!customOverride?.title && s.isActive && s.startTime) {
      const elapsedSeconds = Math.max(
        Number(s.baseSeconds) || 0,
        Math.floor((Date.now() - new Date(s.startTime).getTime()) / 1000)
      );
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      const clockStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      const rate = Number(s.rate || 6.0);
      const cost = Math.min(
        Number(s.maxLimit || 180),
        Number(((elapsedSeconds * (rate / 3600)) || 0).toFixed(2))
      ).toFixed(2);

      title = `Estancia activa • ${clockStr} (${scheduledHours}h)`;
      body = `${plates} • ${carDesc} • Cobro: $${cost} MXN • Saldo: $${balance} MXN`;
    }

    const options = {
      body,
      icon: './parqu-logo-black.png',
      badge: './parqu-logo-black.png',
      image: s.preRenderedImage || undefined,
      tag: SINGLE_NOTIFICATION_TAG,
      renotify: false,
      silent: true,
      requireInteraction: true,
      actions: getSupportedSwActions(Boolean(s.isActive)),
      data: {
        url: './?modal=push',
        openModal: true,
        timestamp: now,
      },
    };

    try {
      await self.registration.showNotification(title, options);
    } catch {
      const fallbackOpts = {
        body,
        icon: './parqu-logo-black.png',
        badge: './parqu-logo-black.png',
        tag: SINGLE_NOTIFICATION_TAG,
        renotify: false,
        silent: true,
        data: {
          url: './?modal=push',
          openModal: true,
          timestamp: now,
        },
      };
      await self.registration.showNotification(title, fallbackOpts);
    }
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

// Listener nativo de Web Push (RFC 8030 / FCM / Apple Push Service)
self.addEventListener('push', (event) => {
  let pushPayload = {};
  if (event.data) {
    try {
      pushPayload = event.data.json();
    } catch {
      pushPayload = { body: event.data.text() };
    }
  }

  if (pushPayload.data && typeof pushPayload.data === 'object') {
    latestParquState = {
      ...(latestParquState || {}),
      ...pushPayload.data,
    };
  }

  event.waitUntil(
    Promise.all([
      showOneNotification(
        latestParquState,
        Boolean(pushPayload.priority === 'high'),
        pushPayload.title ? { title: pushPayload.title, body: pushPayload.body } : null
      ),
      broadcastActionToClients({
        action: 'OPEN_HIGH_PRIORITY_MODAL',
        alertReason: pushPayload.data?.alertReason || 'PUSH_RECEIVED',
      }),
    ])
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_PARQU_STATE') {
    latestParquState = {
      ...(latestParquState || {}),
      ...(event.data.payload || {}),
    };
    return;
  }

  if (event.data.type === 'APP_FOREGROUNDED' || event.data.type === 'STOP_ALL_LOOPS') {
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
    if (event.data.closeNotifications === true) {
      event.waitUntil(closeAllNotifications());
    }
    return;
  }

  // Canal único v2: muestra 1 sola vez y jamás repite
  if (event.data.type === 'PARQU_SINGLE_NOTIFY_V2') {
    if (event.data.payload && event.data.payload.state) {
      latestParquState = event.data.payload.state;
    }
    event.waitUntil(showOneNotification(latestParquState, false));
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
        showOneNotification(latestParquState, true),
        broadcastActionToClients({
          action: 'START_PARKING',
          startTime: nowIso,
          openHighPriorityModal: true,
        }),
        publishStateFromServiceWorker(latestParquState),
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
        showOneNotification(latestParquState, true),
        broadcastActionToClients({
          action: 'ADD_HOUR',
          hoursAdded: 1,
          scheduledHours: nextHours,
          openHighPriorityModal: true,
        }),
        publishStateFromServiceWorker(latestParquState),
      ])
    );
    return;
  }

  if (action === 'cancel_parking' || action === 'stop_parking') {
    const s = latestParquState || {};
    const elapsedSeconds = s.startTime
      ? Math.max(
          Number(s.baseSeconds) || 0,
          Math.floor((Date.now() - new Date(s.startTime).getTime()) / 1000)
        )
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
        showOneNotification(latestParquState, true),
        broadcastActionToClients({
          action: 'CANCEL_PARKING',
          amount: finalCharge,
          openHighPriorityModal: true,
        }),
        publishStateFromServiceWorker(latestParquState),
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
        showOneNotification(latestParquState, true),
        broadcastActionToClients({
          action: 'ADD_BALANCE',
          amount: 50,
          openHighPriorityModal: true,
        }),
        publishStateFromServiceWorker(latestParquState),
      ])
    );
    return;
  }

  event.notification.close();

  event.waitUntil(
    Promise.all([
      broadcastActionToClients({
        action: 'OPEN_HIGH_PRIORITY_MODAL',
        alertReason: 'NOTIFICATION_TAP',
      }),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('./?modal=push');
        }
        return null;
      }),
    ])
  );
});
