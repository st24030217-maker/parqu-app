/**
 * =============================================================================
 * CONECTOR OFICIAL XAMPP MYSQL / MARIADB (parqu_db)
 * Sincroniza automáticamente el estado de la app con http://localhost/parqu-api/index.php
 * =============================================================================
 */

const DEFAULT_XAMPP_API_URL = 'http://localhost/parqu-api/index.php';

export const getXamppApiUrl = () => {
  try {
    if (typeof window !== 'undefined') {
      const custom = localStorage.getItem('parqu_xampp_api_url');
      if (custom) return custom;
    }
  } catch {
    // ignore
  }
  return DEFAULT_XAMPP_API_URL;
};

/**
 * Verifica si el servidor Apache + MySQL de XAMPP está activo y conectado a `parqu_db`
 */
export async function checkXamppDatabaseStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${getXamppApiUrl()}?action=status`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

/**
 * Obtiene el estado completo del vehículo/titular/tarjeta/historial desde MySQL en XAMPP
 */
export async function fetchStateFromXamppDb(plates = 'XYZ-7842') {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `${getXamppApiUrl()}?action=state&plates=${encodeURIComponent(plates)}`,
      {
        method: 'GET',
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.ok ? data : null;
  } catch {
    return null;
  }
}

/**
 * Sincroniza cualquier cambio (vehículo, titular, saldo, autocobro, sesión activa, recibos, multas)
 * directamente en las tablas de MySQL (`parqu_db`) en XAMPP.
 */
export async function syncStateToXamppDb(payload) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${getXamppApiUrl()}?action=sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.ok);
  } catch {
    return false;
  }
}
