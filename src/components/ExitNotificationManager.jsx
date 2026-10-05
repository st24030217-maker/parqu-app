import { useEffect, useRef, useCallback } from 'react';
import { sileo } from 'sileo';
import { useParking } from '../context/ParkingContext';
import {
  registerParquServiceWorker,
  getNotificationPermissionState,
  requestParkingNotificationPermission,
  syncParquStateToServiceWorker,
  notifyAppForegrounded,
  dispatchBackgroundNotificationImmediate,
} from '../utils/parkingNotification';

/**
 * ExitNotificationManager (100% Invisible en la interfaz del sistema)
 * No muestra ningún popup ni barra dentro de la aplicación.
 * Únicamente cuando el usuario se sale de la app (visibilityState === 'hidden'),
 * despliega un pequeño Centro de Control en el Centro de Notificaciones del teléfono
 * con accesos rápidos para controlar Parqu en segundo plano.
 */
export const ExitNotificationManager = ({ onOpenNFC }) => {
  const {
    owner,
    vehicle,
    card,
    autoPay,
    updateAutoPay,
    addBalance,
    activeSession,
    startParking,
    stopParkingAndAutoCharge,
    transactions,
  } = useParking();

  const latestContextRef = useRef({
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
  });

  useEffect(() => {
    const ctx = { owner, vehicle, card, autoPay, activeSession, transactions };
    latestContextRef.current = ctx;
    syncParquStateToServiceWorker(ctx);
  }, [owner, vehicle, card, autoPay, activeSession, transactions]);

  const lastNotificationSentAtRef = useRef(0);

  // Escuchar los accesos rápidos ejecutados desde el Centro de Notificaciones del teléfono
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PARQU_SW_ACTION') return;
      const { action, amount, enabled } = event.data;

      if (action === 'START_PARKING' && !latestContextRef.current.activeSession) {
        startParking('Espacio #1042 • Centro Histórico', 6.0);
        sileo.success({
          title: 'Parquímetro Iniciado',
          description: 'Activado desde el Centro de Notificaciones ($6.00/hr).',
        });
      } else if (action === 'STOP_PARKING' && latestContextRef.current.activeSession) {
        const txn = stopParkingAndAutoCharge();
        if (txn) {
          sileo.success({
            title: 'Estancia Finalizada',
            description: `Folio ${txn.folio} • Cobrado: $${txn.amount.toFixed(2)} MXN`,
          });
        }
      } else if (action === 'ADD_BALANCE') {
        const addAmt = Number(amount) || 50;
        addBalance(addAmt);
        sileo.success({
          title: `Recarga +$${addAmt}.00 Aplicada`,
          description: 'Saldo NFC actualizado desde tus accesos rápidos.',
        });
      } else if (action === 'TOGGLE_AUTOPAY') {
        const nextEnabled =
          typeof enabled === 'boolean' ? enabled : !latestContextRef.current.autoPay?.enabled;
        updateAutoPay({ enabled: nextEnabled });
      } else if (action === 'OPEN_NFC' && onOpenNFC) {
        onOpenNFC();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, [startParking, stopParkingAndAutoCharge, addBalance, updateAutoPay, onOpenNFC]);

  // Integración con los controles del Centro de Control / Pantalla de Bloqueo del teléfono (MediaSession)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (!latestContextRef.current.activeSession) {
          startParking('Espacio #1042 • Centro Histórico', 6.0);
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (latestContextRef.current.activeSession) {
          stopParkingAndAutoCharge();
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        addBalance(50);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        updateAutoPay({ enabled: !latestContextRef.current.autoPay?.enabled });
      });
    } catch {
      // ignore
    }
  }, [startParking, stopParkingAndAutoCharge, addBalance, updateAutoPay]);

  // Registrar Service Worker y solicitar permiso de forma transparente al primer toque del usuario
  useEffect(() => {
    registerParquServiceWorker();

    const unlockNotificationsOnFirstGesture = async () => {
      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
        }
      }
    };

    window.addEventListener('click', unlockNotificationsOnFirstGesture, { once: true });
    window.addEventListener('touchend', unlockNotificationsOnFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', unlockNotificationsOnFirstGesture);
      window.removeEventListener('touchend', unlockNotificationsOnFirstGesture);
    };
  }, []);

  // Disparar el Centro de Control en la barra del teléfono ÚNICAMENTE cuando el usuario se sale de la app
  const triggerExitNotificationSync = useCallback(() => {
    const now = Date.now();
    if (now - lastNotificationSentAtRef.current < 3500) {
      return null;
    }
    lastNotificationSentAtRef.current = now;
    return dispatchBackgroundNotificationImmediate(latestContextRef.current);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerExitNotificationSync();
      } else if (document.visibilityState === 'visible') {
        notifyAppForegrounded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerExitNotificationSync]);

  // No renderiza nada dentro del sistema web: todo ocurre en el Centro de Notificaciones al salir
  return null;
};
