import React, { useEffect, useRef } from 'react';
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

const EXIT_LOCK_STORAGE_KEY = 'parqu_single_exit_notify_ts';
const MIN_COOLDOWN_MS = 15000;

/**
 * ExitNotificationManager
 * - Envía ESTRICTAMENTE 1 SOLA notificación al salir de la aplicación.
 * - NO se desbloquea automáticamente por parpadeos de visibilityState al bajar la barra de notificaciones.
 * - Solo permite una nueva notificación cuando el usuario vuelve a tocar activamente dentro de la app
 *   después de al menos 15 segundos.
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

  const hasSentForCurrentSessionExitRef = useRef(false);
  const lastExitTimestampRef = useRef(0);

  // Sincronizar el estado en memoria del Service Worker
  useEffect(() => {
    const ctx = { owner, vehicle, card, autoPay, activeSession, transactions };
    latestContextRef.current = ctx;
    syncParquStateToServiceWorker(ctx);
  }, [owner, vehicle, card, autoPay, activeSession, transactions]);

  // Escuchar los botones de la notificación (+1 Hora, Recargar +$50, Cancelar / Iniciar Parqu)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PARQU_SW_ACTION') return;
      const { action, amount, hoursAdded, scheduledHours, enabled } = event.data;

      if (action === 'START_PARKING' && !latestContextRef.current.activeSession) {
        startParking('Espacio #1042 • Centro Histórico', 6.0, null, 1);
        sileo.success({
          title: 'Parquímetro Iniciado',
          description: 'Monitoreo activado desde la notificación ($6.00/hr).',
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
            title: 'Parquímetro Finalizado',
            description: `Folio ${txn.folio} • Cobrado: $${txn.amount.toFixed(2)} MXN`,
          });
        }
      } else if (action === 'ADD_BALANCE') {
        const addAmt = Number(amount) || 50;
        addBalance(addAmt);
        sileo.success({
          title: `Recarga +$${addAmt}.00 Aplicada`,
          description: 'Saldo actualizado desde la notificación.',
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
  }, [
    startParking,
    addParkingHours,
    stopParkingAndAutoCharge,
    addBalance,
    updateAutoPay,
    onOpenNFC,
  ]);

  // Inicializar el nuevo Service Worker (parqu-sw-v2.js) y limpiar cualquier SW viejo en caché
  useEffect(() => {
    registerParquServiceWorker();

    const handleFirstInteraction = async () => {
      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
        }
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Candado estricto: 1 sola notificación al salir de la app
  useEffect(() => {
    const readLastSavedTs = () => {
      try {
        return Number(sessionStorage.getItem(EXIT_LOCK_STORAGE_KEY) || 0);
      } catch {
        return 0;
      }
    };

    const writeLastSavedTs = (ts) => {
      try {
        sessionStorage.setItem(EXIT_LOCK_STORAGE_KEY, String(ts));
      } catch {
        // ignore
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (hasSentForCurrentSessionExitRef.current) return;

        const now = Date.now();
        const lastTs = Math.max(lastExitTimestampRef.current, readLastSavedTs());
        if (now - lastTs < MIN_COOLDOWN_MS) return;

        hasSentForCurrentSessionExitRef.current = true;
        lastExitTimestampRef.current = now;
        writeLastSavedTs(now);

        dispatchBackgroundNotificationImmediate(latestContextRef.current);
      } else if (document.visibilityState === 'visible') {
        notifyAppForegrounded();
      }
    };

    // Solo re-armar el candado cuando el usuario toca activamente dentro de la app visible
    const handleActiveUserReturn = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      const lastTs = Math.max(lastExitTimestampRef.current, readLastSavedTs());
      if (now - lastTs >= MIN_COOLDOWN_MS) {
        hasSentForCurrentSessionExitRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handleActiveUserReturn, { passive: true });
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handleActiveUserReturn);
    };
  }, []);

  return null;
};
