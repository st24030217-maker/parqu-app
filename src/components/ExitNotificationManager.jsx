import { useEffect, useRef } from 'react';
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
 * ExitNotificationManager (100% Invisible dentro del sistema)
 * - CERO bucles, CERO spam: envía ESTRICTAMENTE 1 SOLA notificación cuando el usuario sale de la app
 *   (document.visibilityState === 'hidden') usando un candado estricto por salida (hasSentWhileHiddenRef).
 * - Nunca envía notificaciones mientras el usuario está dentro de la app.
 * - Al regresar a la app (visibilityState === 'visible'), cierra la notificación y reinicia el candado.
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

  // Candado estricto: garantiza que SOLO se envíe 1 notificación por cada vez que el usuario sale de la app
  const hasSentWhileHiddenRef = useRef(false);
  const lastExitTimestampRef = useRef(0);

  // Sincronizar el estado en memoria del Service Worker (sin disparar notificaciones)
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

  // Registrar Service Worker y pedir permiso en el primer toque (sin disparar notificación dentro de la app)
  useEffect(() => {
    registerParquServiceWorker();

    const handleUserInteraction = async () => {
      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
        }
      }
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  // Disparar ESTRICTAMENTE 1 sola notificación únicamente cuando visibilityState pasa a 'hidden'
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (hasSentWhileHiddenRef.current) return;
        const now = Date.now();
        if (now - lastExitTimestampRef.current < 5000) return;

        hasSentWhileHiddenRef.current = true;
        lastExitTimestampRef.current = now;
        dispatchBackgroundNotificationImmediate(latestContextRef.current);
      } else if (document.visibilityState === 'visible') {
        hasSentWhileHiddenRef.current = false;
        notifyAppForegrounded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
};
