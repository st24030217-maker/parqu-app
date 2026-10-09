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

const EXIT_LOCK_STORAGE_KEY = 'parqu_single_exit_notify_ts';
const MIN_COOLDOWN_MS = 15000;

/**
 * ExitNotificationManager
 * - Envía ESTRICTAMENTE 1 SOLA notificación al salir de la aplicación.
 * - Suscribe al dispositivo a Web Push estándar (VAPID / FCM / Apple Push Service).
 * - Abre el Modal Interactivo de Alta Prioridad cuando el usuario toca la notificación Push
 *   o cuando faltan 10 minutos para vencer la estancia.
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

  const hasSentForCurrentSessionExitRef = useRef(false);
  const lastExitTimestampRef = useRef(0);
  const warnedTenMinForSessionRef = useRef(null);

  // Sincronizar el estado en memoria del Service Worker
  useEffect(() => {
    const ctx = { owner, vehicle, card, autoPay, activeSession, transactions };
    latestContextRef.current = ctx;
    syncParquStateToServiceWorker(ctx);
  }, [owner, vehicle, card, autoPay, activeSession, transactions]);

  // Abrir el modal si el usuario entró desde una notificación Push (?modal=push) o evento global
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

  // Alerta automática de Alta Prioridad cuando falten <= 10 minutos de la estancia activa
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

  // Escuchar los botones de la notificación y el toque en la alerta Push
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

  // Inicializar el Service Worker (parqu-sw-v2.js) y suscripción Web Push (VAPID / FCM)
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

  return (
    <HighPriorityPushModal
      isOpen={showHighPriorityModal}
      onClose={() => setShowHighPriorityModal(false)}
      onNavigateToMeter={onNavigateToMeter}
    />
  );
};
