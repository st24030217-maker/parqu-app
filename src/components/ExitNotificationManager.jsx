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
 * Al cerrar o salirse de la aplicación (visibilitychange === 'hidden' / pagehide),
 * desprende automáticamente el bloque de monitoreo y control en la barra de notificaciones
 * con controles para:
 *  - Monitorear el parquímetro en vivo
 *  - Aumentar las horas (+1 Hora)
 *  - Recargar saldo (Recargar +$50)
 *  - Cancelar o iniciar el parquímetro
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
    addParkingHours,
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

  // Escuchar los controles ejecutados desde el bloque en la barra de notificaciones
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PARQU_SW_ACTION') return;
      const { action, amount, hoursAdded, scheduledHours, enabled } = event.data;

      if (action === 'START_PARKING' && !latestContextRef.current.activeSession) {
        startParking('Espacio #1042 • Centro Histórico', 6.0, null, 1);
        sileo.success({
          title: 'Parquímetro Iniciado',
          description: 'Monitoreo activado desde la barra de notificaciones ($6.00/hr).',
        });
      } else if (action === 'ADD_HOUR') {
        const extra = Number(hoursAdded) || 1;
        if (typeof addParkingHours === 'function') {
          addParkingHours(extra);
        } else if (!latestContextRef.current.activeSession) {
          startParking('Espacio #1042 • Centro Histórico', 6.0, null, extra);
        }
        const totalH =
          Number(scheduledHours) ||
          (Number(latestContextRef.current.activeSession?.scheduledHours) || 1) + extra;
        sileo.success({
          title: `+${extra} Hora Agregada al Parquímetro`,
          description: `Tiempo programado actualizado a ${totalH}h ($${(totalH * 6).toFixed(2)} MXN).`,
        });
      } else if (
        (action === 'CANCEL_PARKING' || action === 'STOP_PARKING') &&
        latestContextRef.current.activeSession
      ) {
        const txn = stopParkingAndAutoCharge();
        if (txn) {
          sileo.success({
            title: 'Parquímetro Cancelado / Finalizado',
            description: `Folio ${txn.folio} • Cobrado: $${txn.amount.toFixed(2)} MXN`,
          });
        }
      } else if (action === 'ADD_BALANCE') {
        const addAmt = Number(amount) || 50;
        addBalance(addAmt);
        sileo.success({
          title: `Recarga +$${addAmt}.00 Aplicada`,
          description: 'Saldo actualizado desde el bloque de notificaciones.',
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
  }, [startParking, addParkingHours, stopParkingAndAutoCharge, addBalance, updateAutoPay, onOpenNFC]);

  // Integración con los controles del sistema móvil (MediaSession)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (!latestContextRef.current.activeSession) {
          startParking('Espacio #1042 • Centro Histórico', 6.0, null, 1);
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (latestContextRef.current.activeSession) {
          stopParkingAndAutoCharge();
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (typeof addParkingHours === 'function') addParkingHours(1);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        addBalance(50);
      });
    } catch {
      // ignore
    }
  }, [startParking, addParkingHours, stopParkingAndAutoCharge, addBalance]);

  // Registrar Service Worker y asegurar el permiso de notificaciones en cualquier toque del usuario
  useEffect(() => {
    registerParquServiceWorker();

    const ensureNotificationPermission = async () => {
      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
        }
      }
    };

    window.addEventListener('click', ensureNotificationPermission);
    window.addEventListener('touchend', ensureNotificationPermission);
    return () => {
      window.removeEventListener('click', ensureNotificationPermission);
      window.removeEventListener('touchend', ensureNotificationPermission);
    };
  }, []);

  // Desprender el bloque en la barra de notificaciones automáticamente al salir o cerrar la aplicación
  const triggerExitNotificationSync = useCallback(() => {
    const now = Date.now();
    if (now - lastNotificationSentAtRef.current < 3000) {
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

    const handlePageHide = () => {
      triggerExitNotificationSync();
    };

    const handlePageShow = () => {
      if (document.visibilityState === 'visible') {
        notifyAppForegrounded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [triggerExitNotificationSync]);

  return null;
};
