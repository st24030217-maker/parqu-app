/**
 * SISTEMA DE RESPALDO TRIPLE DE DATOS PARQU (LocalStorage + IndexedDB + Nube)
 * Garantiza que los datos del usuario (Titular, Vehículo, Placas, Diseño de Tarjeta,
 * Saldo, Autocobro, Historial de Cobros y Ubicaciones) queden respaldados automáticamente
 * y puedan restaurarse en cualquier momento.
 */

const IDB_NAME = 'ParquBackupVaultDB';
const IDB_VERSION = 1;
const IDB_STORE = 'backups';
const BACKUP_RECORD_KEY = 'parqu_master_backup_v1';
const CLOUD_BACKUP_PREFIX = 'parqu_user_backup_v2_';
const NTFY_BASE_URL = 'https://ntfy.sh';

function openBackupIndexedDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Guarda una copia completa en IndexedDB (persiste incluso si se limpia caché parcial).
 */
export async function saveBackupToIndexedDB(backupPayload) {
  try {
    const db = await openBackupIndexedDB();
    if (!db) return false;
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(backupPayload, BACKUP_RECORD_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Lee la copia de respaldo guardada en IndexedDB.
 */
export async function loadBackupFromIndexedDB() {
  try {
    const db = await openBackupIndexedDB();
    if (!db) return null;
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(BACKUP_RECORD_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function getCloudBackupTopic(identifier = '') {
  const clean = String(identifier || 'default_parqu_user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return `${CLOUD_BACKUP_PREFIX}${clean || 'default'}`;
}

/**
 * Guarda el respaldo completo del usuario en la nube asociado a su correo y placas.
 */
export async function saveBackupToCloud(data) {
  if (!data) return false;

  const snapshot = {
    _type: 'PARQU_FULL_BACKUP_V2',
    version: '2.0',
    savedAt: new Date().toISOString(),
    timestamp: Date.now(),
    vehicle: data.vehicle,
    owner: data.owner,
    card: data.card,
    autoPay: data.autoPay,
    transactions: data.transactions || [],
    pinnedLocations: data.pinnedLocations || [],
    activeSession: data.activeSession || null,
  };

  // Guardar también en IndexedDB local
  await saveBackupToIndexedDB(snapshot);

  const topics = new Set();
  if (data.owner?.email) {
    topics.add(getCloudBackupTopic(data.owner.email));
  }
  if (data.vehicle?.plates) {
    topics.add(getCloudBackupTopic(data.vehicle.plates));
  }

  try {
    const body = JSON.stringify(snapshot);
    await Promise.allSettled(
      Array.from(topics).map((topic) =>
        fetch(`${NTFY_BASE_URL}/${topic}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
            Title: `PARQU BACKUP ${data.vehicle?.plates || ''}`,
          },
          body,
        })
      )
    );
    return snapshot;
  } catch {
    return snapshot;
  }
}

/**
 * Restaura el respaldo más reciente desde la nube usando el correo electrónico o las placas.
 */
export async function restoreBackupFromCloud(identifier) {
  const topic = getCloudBackupTopic(identifier);
  try {
    const res = await fetch(`${NTFY_BASE_URL}/${topic}/json?poll=1&since=720h`, {
      method: 'GET',
      headers: { Accept: 'application/x-ndjson, application/json, text/plain' },
    });

    if (!res.ok) {
      return await loadBackupFromIndexedDB();
    }

    const text = await res.text();
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let latestBackup = null;

    for (const line of lines) {
      try {
        const evt = JSON.parse(line);
        if (evt.event === 'message' && evt.message) {
          const parsed = JSON.parse(evt.message);
          if (
            parsed &&
            parsed._type === 'PARQU_FULL_BACKUP_V2' &&
            (!latestBackup || (parsed.timestamp || 0) >= (latestBackup.timestamp || 0))
          ) {
            latestBackup = parsed;
          }
        }
      } catch {
        // ignore invalid lines
      }
    }

    if (latestBackup) {
      await saveBackupToIndexedDB(latestBackup);
      return latestBackup;
    }

    return await loadBackupFromIndexedDB();
  } catch {
    return await loadBackupFromIndexedDB();
  }
}

/**
 * Descarga un archivo físico .json con todo el respaldo del usuario en su dispositivo.
 */
export function exportBackupAsJsonFile(data) {
  const snapshot = {
    _type: 'PARQU_FULL_BACKUP_V2',
    version: '2.0',
    savedAt: new Date().toISOString(),
    timestamp: Date.now(),
    vehicle: data.vehicle,
    owner: data.owner,
    card: data.card,
    autoPay: data.autoPay,
    transactions: data.transactions || [],
    pinnedLocations: data.pinnedLocations || [],
    activeSession: data.activeSession || null,
  };

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const plateSlug = String(data.vehicle?.plates || 'parqu')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  a.href = url;
  a.download = `respaldo-parqu-${plateSlug}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return snapshot;
}
