import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BellRing } from 'lucide-react';
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
 * ExitNotificationManager
 * - Sin reproductor de música (cero audio / cero MediaSession).
 * - Cero spam: envía ESTRICTAMENTE 1 sola notificación interactiva estilo Uber Live Activity (mismo tag).
 * - Se dispara automáticamente al salir/minimizar la app (visibilitychange, pagehide, blur),
 *   al iniciar/finalizar parquímetro, al agregar horas o recargar saldo, y cuando restan <= 5 min.
 * - Incluye controles directos fuera de la app: +1 Hora ($6), Recargar +$50 y Cancelar/Iniciar Parqu.
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

  const [permissionState, setPermissionState] = useState(() =>
    getNotificationPermissionState()
  );

  const latestContextRef = useRef({
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
  });

  const lastNotificationSentAtRef = useRef(0);
  const prevSessionActiveRef = useRef(Boolean(activeSession));
  const prevScheduledHoursRef = useRef(Number(activeSession?.scheduledHours || 0));
  const prevBalanceRef = useRef(Number(card?.balance || 0));
  const alertedExpiringSessionIdRef = useRef(null);

  // Sincronizar continuamente el estado con el Service Worker
  useEffect(() => {
    const ctx = { owner, vehicle, card, autoPay, activeSession, transactions };
    latestContextRef.current = ctx;
    syncParquStateToServiceWorker(ctx);
  }, [owner, vehicle, card, autoPay, activeSession, transactions]);

  // Actualizar automáticamente la notificación externa cuando se inicia/detiene parquímetro, se suma +1 hora o se recarga saldo
  useEffect(() => {
    const isNowActive = Boolean(activeSession);
    const currentHours = Number(activeSession?.scheduledHours || 0);
    const currentBalance = Number(card?.balance || 0);

    const sessionChanged = isNowActive !== prevSessionActiveRef.current;
    const hoursChanged = isNowActive && currentHours !== prevScheduledHoursRef.current;
    const balanceChanged = Math.abs(currentBalance - prevBalanceRef.current) >= 1;

    prevSessionActiveRef.current = isNowActive;
    prevScheduledHoursRef.current = currentHours;
    prevBalanceRef.current = currentBalance;

    if (
      (sessionChanged || hoursChanged || balanceChanged) &&
      getNotificationPermissionState() === 'granted'
    ) {
      dispatchBackgroundNotificationImmediate(latestContextRef.current, {
        forceAlert: sessionChanged,
      });
    }
  }, [activeSession?.id, activeSession?.scheduledHours, card?.balance]);

  // Alerta automática fuera de la app cuando quedan <= 5 minutos de tiempo programado
  useEffect(() => {
    if (!activeSession || getNotificationPermissionState() !== 'granted') return;

    const scheduledSeconds = (Number(activeSession.scheduledHours) || 1) * 3600;
    const elapsed = Number(activeSession.secondsElapsed) || 0;
    const remainingSeconds = scheduledSeconds - elapsed;

    if (
      remainingSeconds > 0 &&
      remainingSeconds <= 300 &&
      alertedExpiringSessionIdRef.current !== `${activeSession.id}-${activeSession.scheduledHours}`
    ) {
      alertedExpiringSessionIdRef.current = `${activeSession.id}-${activeSession.scheduledHours}`;
      dispatchBackgroundNotificationImmediate(latestContextRef.current, {
        forceAlert: true,
      });
    }
  }, [activeSession?.id, activeSession?.scheduledHours, activeSession?.secondsElapsed]);

  // Escuchar los controles ejecutados desde la notificación fuera de la aplicación
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PARQU_SW_ACTION') return;
      const { action, amount, hoursAdded, scheduledHours, enabled } = event.data;

      if (action === 'START_PARKING' && !latestContextRef.current.activeSession) {
        startParking('Espacio #1042 • Centro Histórico', 6.0, null, 1);
        sileo.success({
          title: 'Parquímetro Iniciado desde Notificación',
          description: 'Monitoreo activado fuera de la aplicación ($6.00/hr).',
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
            title: 'Parquímetro Finalizado desde Notificación',
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

  // Registrar Service Worker y solicitar permiso en el primer toque si aún está en 'default'
  useEffect(() => {
    registerParquServiceWorker();

    const handleUserInteraction = async () => {
      const currentPerm = getNotificationPermissionState();
      setPermissionState(currentPerm);
      if (currentPerm === 'default') {
        const res = await requestParkingNotificationPermission();
        setPermissionState(res);
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
          dispatchBackgroundNotificationImmediate(latestContextRef.current, {
            forceAlert: false,
          });
        }
      }
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  // Enviar ESTRICTAMENTE 1 sola notificación estilo Uber al salir/minimizar la aplicación
  const triggerExitNotificationOnce = useCallback((forceAlert = true) => {
    const now = Date.now();
    if (now - lastNotificationSentAtRef.current < 2500) {
      return null;
    }
    lastNotificationSentAtRef.current = now;
    return dispatchBackgroundNotificationImmediate(latestContextRef.current, {
      forceAlert,
    });
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerExitNotificationOnce(true);
      } else if (document.visibilityState === 'visible') {
        // Mantener la notificación viva en la barra del teléfono mientras usa la app
        notifyAppForegrounded(true);
      }
    };

    const handlePageHide = () => {
      triggerExitNotificationOnce(true);
    };

    const handleWindowBlur = () => {
      // Si el usuario cambia de aplicación o bloquea pantalla
      triggerExitNotificationOnce(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [triggerExitNotificationOnce]);

  const handleEnableNotificationsClick = async () => {
    const res = await requestParkingNotificationPermission();
    setPermissionState(res);
    if (res === 'granted') {
      syncParquStateToServiceWorker(latestContextRef.current);
      dispatchBackgroundNotificationImmediate(latestContextRef.current, {
        forceAlert: true,
      });
      sileo.success({
        title: 'Notificación en Vivo Activada',
        description:
          'Al salir de la app verás tu barra de parquímetro con controles rápidos (+1 Hora, Recargar y Cancelar).',
      });
    }
  };

  // Mostrar píldora flotante discreta únicamente si el usuario aún no ha autorizado las notificaciones
  if (permissionState === 'default') {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={handleEnableNotificationsClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#01033E] hover:bg-[#0033FF] text-white text-xs font-bold shadow-xl border border-white/15 transition-all cursor-pointer active:scale-95"
        >
          <BellRing className="w-3.5 h-3.5 text-emerald-300 animate-bounce" />
          <span>Activar Notificación Fuera de la App</span>
        </button>
      </div>
    );
  }

  return null;
};
