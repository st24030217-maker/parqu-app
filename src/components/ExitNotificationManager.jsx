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
  unlockParquLiveControlBlock,
  syncParquLiveControlBlock,
} from '../utils/parkingNotification';

/**
 * ExitNotificationManager (100% Invisible dentro del sistema web)
 * - Cero spam de notificaciones: envía ESTRICTAMENTE 1 sola notificación al salir de la app.
 * - Activa el Bloque Interactivo de Control en la Barra de Notificaciones / Pantalla de Bloqueo
 *   con cronómetro en vivo y botones físicos/táctiles para:
 *   1. |<< Recargar +$50 MXN
 *   2. Pausa/Play: Cancelar o Iniciar Parquímetro
 *   3. >>| Aumentar +1 Hora ($6.00)
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

  const handleLockScreenRecharge50 = useCallback(() => {
    addBalance(50);
    sileo.success({
      title: 'Recarga +$50.00 Aplicada',
      description: 'Saldo actualizado desde tu bloque de notificaciones.',
    });
  }, [addBalance]);

  const handleLockScreenAddHour = useCallback(() => {
    if (typeof addParkingHours === 'function') {
      addParkingHours(1);
    } else if (!latestContextRef.current.activeSession) {
      startParking('Espacio #1042 • Centro Histórico', 6.0, null, 1);
    }
    sileo.success({
      title: '+1 Hora Agregada ($6.00)',
      description: 'Tiempo del parquímetro aumentado desde tus controles.',
    });
  }, [addParkingHours, startParking]);

  const handleLockScreenToggleParking = useCallback(() => {
    if (latestContextRef.current.activeSession) {
      const txn = stopParkingAndAutoCharge();
      if (txn) {
        sileo.success({
          title: 'Parquímetro Cancelado / Finalizado',
          description: `Folio ${txn.folio} • Cobrado: $${txn.amount.toFixed(2)} MXN`,
        });
      }
    } else {
      startParking('Espacio #1042 • Centro Histórico', 6.0, null, 1);
      sileo.success({
        title: 'Parquímetro Iniciado',
        description: 'Monitoreo activado desde tu bloque de control ($6.00/hr).',
      });
    }
  }, [stopParkingAndAutoCharge, startParking]);

  useEffect(() => {
    const ctx = { owner, vehicle, card, autoPay, activeSession, transactions };
    latestContextRef.current = ctx;
    syncParquStateToServiceWorker(ctx);
    syncParquLiveControlBlock(ctx, {
      onRecharge50: handleLockScreenRecharge50,
      onAddHour: handleLockScreenAddHour,
      onToggleParking: handleLockScreenToggleParking,
    });
  }, [
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
    handleLockScreenRecharge50,
    handleLockScreenAddHour,
    handleLockScreenToggleParking,
  ]);

  const lastNotificationSentAtRef = useRef(0);

  // Escuchar los botones de acción del Service Worker
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

  // Registrar Service Worker y desbloquear el Bloque Interactivo de Control al tocar la pantalla
  useEffect(() => {
    registerParquServiceWorker();

    const handleUserInteraction = async () => {
      unlockParquLiveControlBlock();
      syncParquLiveControlBlock(latestContextRef.current, {
        onRecharge50: handleLockScreenRecharge50,
        onAddHour: handleLockScreenAddHour,
        onToggleParking: handleLockScreenToggleParking,
      });

      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
        }
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchend', handleUserInteraction);
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchend', handleUserInteraction);
    };
  }, [handleLockScreenRecharge50, handleLockScreenAddHour, handleLockScreenToggleParking]);

  // Enviar ESTRICTAMENTE 1 sola notificación cuando el usuario se sale de la app
  const triggerExitNotificationOnce = useCallback(() => {
    const now = Date.now();
    if (now - lastNotificationSentAtRef.current < 4000) {
      return null;
    }
    lastNotificationSentAtRef.current = now;
    return dispatchBackgroundNotificationImmediate(latestContextRef.current);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerExitNotificationOnce();
      } else if (document.visibilityState === 'visible') {
        notifyAppForegrounded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerExitNotificationOnce]);

  return null;
};
