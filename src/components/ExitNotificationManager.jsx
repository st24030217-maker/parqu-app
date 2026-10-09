import React, { useState, useEffect, useRef } from 'react';
import { sileo } from 'sileo';
import { useParking } from '../context/ParkingContext';
import { HighPriorityPushModal } from './modals/HighPriorityPushModal';
import {
  registerParquServiceWorker,
  getNotificationPermissionState,
  requestParkingNotificationPermission,
  syncParquStateToServiceWorker,
  notifyAppForegrounded,
  dispatchBackgroundNotificationImmediate,
  subscribeToWebPush,
} from '../utils/parkingNotification';

/**
 * ExitNotificationManager
 * - 1 Estancia de Parquímetro = ESTRICTAMENTE 1 SOLA Notificación al salir de la app.
 * - Bloqueado por sessionId en memoria, localStorage y Service Worker.
 * - Jamás se rearma por toques ni por parpadeos de la barra de notificaciones.
 */
export const ExitNotificationManager = ({ onOpenNFC, onNavigateToMeter }) => {
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

  const [showHighPriorityModal, setShowHighPriorityModal] = useState(false);

  const latestContextRef = useRef({
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
  });

  const notifiedSessionIdRef = useRef(null);
  const warnedTenMinForSessionRef = useRef(null);

  // Sincronizar el estado en memoria del Service Worker
  useEffect(() => {
    const ctx = { owner, vehicle, card, autoPay, activeSession, transactions };
    latestContextRef.current = ctx;
    syncParquStateToServiceWorker(ctx);

    if (!activeSession) {
      notifiedSessionIdRef.current = null;
    }
  }, [owner, vehicle, card, autoPay, activeSession, transactions]);

  // Abrir el modal si el usuario entró tocando la notificación (?modal=push) o evento global
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('modal') === 'push') {
        setShowHighPriorityModal(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {
      // ignore
    }

    const handleOpenCustomModal = () => setShowHighPriorityModal(true);
    window.addEventListener('parqu:open-push-modal', handleOpenCustomModal);
    return () => window.removeEventListener('parqu:open-push-modal', handleOpenCustomModal);
  }, []);

  // Alerta automática dentro de la app cuando falten <= 10 minutos de la estancia activa
  useEffect(() => {
    if (!activeSession || !activeSession.startTime) return;
    const sessionKey = activeSession.id || activeSession.startTime;
    if (warnedTenMinForSessionRef.current === sessionKey) return;

    const scheduledHours = Math.max(1, Number(activeSession.scheduledHours) || 1);
    const totalSeconds = scheduledHours * 3600;
    const elapsed = Math.max(
      Number(activeSession.secondsElapsed) || 0,
      Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000)
    );
    const remainingSec = totalSeconds - elapsed;

    if (remainingSec > 0 && remainingSec <= 600) {
      warnedTenMinForSessionRef.current = sessionKey;
      setShowHighPriorityModal(true);
    }
  }, [activeSession]);

  // Escuchar los botones de la notificación (+1 Hora, Finalizar Estancia, Recargar +$50)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PARQU_SW_ACTION') return;
      const { action, amount, hoursAdded, scheduledHours, enabled, openHighPriorityModal } =
        event.data;

      if (action === 'OPEN_HIGH_PRIORITY_MODAL' || openHighPriorityModal) {
        setShowHighPriorityModal(true);
      }

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

  // Inicializar el Service Worker (parqu-sw-v2.js) y suscripción Web Push
  useEffect(() => {
    registerParquServiceWorker();

    const handleFirstInteraction = async () => {
      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
          subscribeToWebPush().catch(() => {});
        }
      } else if (getNotificationPermissionState() === 'granted') {
        subscribeToWebPush().catch(() => {});
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // 1 SOLA notificación por sesión de parquímetro activa al salir de la app
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const currentSession = latestContextRef.current.activeSession;
        if (!currentSession) return;

        const sessionKey = currentSession.id || currentSession.startTime;
        if (!sessionKey) return;

        if (notifiedSessionIdRef.current === sessionKey) return;
        notifiedSessionIdRef.current = sessionKey;

        dispatchBackgroundNotificationImmediate(latestContextRef.current);
      } else if (document.visibilityState === 'visible') {
        notifyAppForegrounded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <HighPriorityPushModal
      isOpen={showHighPriorityModal}
      onClose={() => setShowHighPriorityModal(false)}
      onNavigateToMeter={onNavigateToMeter}
    />
  );
};
