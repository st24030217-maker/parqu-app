/**
 * PARQU LIVE CLOUD SYNC ENGINE
 * Sincronización en tiempo real entre distintos dispositivos (Conductor <-> Oficial de Tránsito NFC)
 * - Canal 1: Cloud Pub/Sub + Cache persistente vía HTTPS (ntfy.sh SSE & JSON poll) sin necesidad de llaves manuales.
 * - Canal 2: Supabase Realtime / REST (opcional si se configuran VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).
 * - Canal 3: BroadcastChannel + LocalStorage para sincronización en 0ms entre pestañas del mismo dispositivo.
 */

const CLOUD_TOPIC_PREFIX = 'parqu_live_mx_v2_plate_';
const CLOUD_REGISTRY_TOPIC = 'parqu_live_mx_v2_registry';
const NTFY_BASE_URL = 'https://ntfy.sh';
const BROADCAST_CHANNEL_NAME = 'parqu_realtime_cloud_v2';

// Identificador único de esta instancia/dispositivo para evitar eco propio
const DEVICE_INSTANCE_ID =
  'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase();

let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  } catch {
    broadcastChannel = null;
  }
}

export const normalizePlateKey = (plate = '') =>
  String(plate || 'XYZ-7842')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') || 'XYZ7842';

export const getPlateTopic = (plate) =>
  `${CLOUD_TOPIC_PREFIX}${normalizePlateKey(plate)}`;

/**
 * Publica el estado en vivo de un vehículo/placa hacia la nube para que cualquier
 * otro celular (ej. Inspector de Tránsito al leer el chip NFC) lo vea en tiempo real.
 */
export async function publishVehicleStateToCloud(payload) {
  if (!payload || !payload.vehicle?.plates) return false;

  const cleanPlate = normalizePlateKey(payload.vehicle.plates);
  const topic = getPlateTopic(cleanPlate);

  const envelope = {
    _type: 'PARQU_LIVE_STATE',
    deviceId: DEVICE_INSTANCE_ID,
    updatedAt: new Date().toISOString(),
    timestamp: Date.now(),
    plateKey: cleanPlate,
    plates: payload.vehicle.plates,
    vehicle: payload.vehicle,
    owner: payload.owner,
    card: {
      cardNumber: payload.card?.cardNumber,
      status: payload.card?.status,
      balance: payload.card?.balance,
      rfidTag: payload.card?.rfidTag,
      designId: payload.card?.designId,
    },
    activeSession: payload.activeSession || null,
    infractions: payload.infractions || [],
    lastInspection: payload.lastInspection || null,
    lastTransaction: payload.transactions?.[0] || null,
  };

  // 1. Guardar copia local indexada por placa
  try {
    localStorage.setItem(`parqu_cloud_cache_${cleanPlate}`, JSON.stringify(envelope));
  } catch {
    // ignore storage quota errors
  }

  // 2. Emitir por BroadcastChannel inmediato
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(envelope);
    } catch {
      // ignore
    }
  }

  // 3. Publicar a la nube en tiempo real (HTTPS POST a ntfy.sh topic de la placa y registro global)
  try {
    const bodyString = JSON.stringify(envelope);
    await Promise.allSettled([
      fetch(`${NTFY_BASE_URL}/${topic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          Title: `PARQU LIVE ${payload.vehicle.plates}`,
          Priority: 'default',
        },
        body: bodyString,
      }),
      fetch(`${NTFY_BASE_URL}/${CLOUD_REGISTRY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          Title: `PARQU REGISTRY ${payload.vehicle.plates}`,
        },
        body: bodyString,
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Consulta el estado más reciente de una placa en la base de datos en tiempo real.
 */
export async function fetchVehicleStateFromCloud(plate) {
  const cleanPlate = normalizePlateKey(plate);
  const topic = getPlateTopic(cleanPlate);

  let localCached = null;
  try {
    const raw = localStorage.getItem(`parqu_cloud_cache_${cleanPlate}`);
    if (raw) {
      localCached = JSON.parse(raw);
    }
  } catch {
    localCached = null;
  }

  try {
    const response = await fetch(`${NTFY_BASE_URL}/${topic}/json?poll=1&since=12h`, {
      method: 'GET',
      headers: { Accept: 'application/x-ndjson, application/json, text/plain' },
    });

    if (!response.ok) {
      return localCached;
    }

    const text = await response.text();
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let latestEnvelope = localCached;

    for (const line of lines) {
      try {
        const eventObj = JSON.parse(line);
        if (eventObj.event === 'message' && eventObj.message) {
          const parsedMsg = JSON.parse(eventObj.message);
          if (
            parsedMsg &&
            parsedMsg._type === 'PARQU_LIVE_STATE' &&
            (!latestEnvelope || (parsedMsg.timestamp || 0) >= (latestEnvelope.timestamp || 0))
          ) {
            latestEnvelope = parsedMsg;
          }
        }
      } catch {
        // ignore non-JSON lines
      }
    }

    if (latestEnvelope) {
      try {
        localStorage.setItem(
          `parqu_cloud_cache_${cleanPlate}`,
          JSON.stringify(latestEnvelope)
        );
      } catch {
        // ignore
      }
    }

    return latestEnvelope;
  } catch {
    return localCached;
  }
}

/**
 * Suscribe un dispositivo en vivo (SSE + BroadcastChannel) a los cambios de una placa específica.
 * Devuelve una función `unsubscribe()`.
 */
export function subscribeToVehiclePlate(plate, onUpdate, onConnectionStatus) {
  const cleanPlate = normalizePlateKey(plate);
  const topic = getPlateTopic(cleanPlate);
  let eventSource = null;
  let isClosed = false;

  const handleIncomingEnvelope = (envelope) => {
    if (!envelope || envelope._type !== 'PARQU_LIVE_STATE') return;
    if (normalizePlateKey(envelope.plates || envelope.plateKey) !== cleanPlate) return;

    try {
      localStorage.setItem(`parqu_cloud_cache_${cleanPlate}`, JSON.stringify(envelope));
    } catch {
      // ignore
    }

    if (typeof onUpdate === 'function') {
      onUpdate(envelope);
    }
  };

  // Escuchar cambios locales entre pestañas
  const handleBroadcast = (event) => {
    if (event?.data) {
      handleIncomingEnvelope(event.data);
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // Conectar flujo Server-Sent Events (SSE) en tiempo real desde la nube
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      eventSource = new EventSource(`${NTFY_BASE_URL}/${topic}/sse`);

      eventSource.onopen = () => {
        if (!isClosed && typeof onConnectionStatus === 'function') {
          onConnectionStatus('CONNECTED');
        }
      };

      eventSource.onmessage = (event) => {
        if (isClosed || !event?.data) return;
        try {
          const data = JSON.parse(event.data);
          // ntfy SSE envía el JSON dentro de `data.message` o directamente
          const inner = data.message ? JSON.parse(data.message) : data;
          handleIncomingEnvelope(inner);
        } catch {
          // ignore keepalive pings
        }
      };

      eventSource.onerror = () => {
        if (!isClosed && typeof onConnectionStatus === 'function') {
          onConnectionStatus('RECONNECTING');
        }
      };
    } catch {
      if (typeof onConnectionStatus === 'function') {
        onConnectionStatus('LOCAL_ONLY');
      }
    }
  }

  // Hacer consulta inicial inmediata del estado cacheado en la nube
  fetchVehicleStateFromCloud(cleanPlate).then((initialState) => {
    if (!isClosed && initialState) {
      handleIncomingEnvelope(initialState);
    }
  });

  return () => {
    isClosed = true;
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    if (eventSource) {
      eventSource.close();
    }
  };
}

export { DEVICE_INSTANCE_ID };
