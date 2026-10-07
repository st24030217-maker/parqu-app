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
  buildParkingNotificationPayload,
  drawLiveUberBlockFrame,
} from '../utils/parkingNotification';

/**
 * ExitNotificationManager
 * - CERO símbolos ASCII anticuados
 * - CERO spam: envía ESTRICTAMENTE 1 sola notificación al salir de la app (hasSentWhileHiddenRef)
 * - Motor en vivo a 30/60 FPS en Canvas + autoPictureInPicture para mostrar el bloque estilo Uber
 *   con el auto y el reloj moviéndose en tiempo real fuera de la aplicación.
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

  const hasSentWhileHiddenRef = useRef(false);
  const lastExitTimestampRef = useRef(0);
  const liveCanvasRef = useRef(null);
  const liveVideoRef = useRef(null);
  const streamInitializedRef = useRef(false);

  // Sincronizar el estado en memoria del Service Worker
  useEffect(() => {
    const ctx = { owner, vehicle, card, autoPay, activeSession, transactions };
    latestContextRef.current = ctx;
    syncParquStateToServiceWorker(ctx);
  }, [owner, vehicle, card, autoPay, activeSession, transactions]);

  // Motor de renderizado en vivo (30 FPS) para el bloque flotante nativo (Picture-in-Picture Live Activity)
  useEffect(() => {
    const canvas = liveCanvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animTick = 0;
    const renderTick = () => {
      animTick += 1;
      const payload = buildParkingNotificationPayload(latestContextRef.current);
      // Movimiento continuo fluido en vivo del auto sobre la barra
      const baseRatio = payload.isActive
        ? Math.min(0.86, Math.max(0.18, (payload.progressPercent || 25) / 100))
        : 0.25;
      const liveWave = Math.min(
        0.9,
        Math.max(0.14, baseRatio + Math.sin(animTick * 0.08) * 0.04)
      );
      drawLiveUberBlockFrame(ctx, canvas.width, canvas.height, payload, liveWave);
    };

    renderTick();
    const intervalId = setInterval(renderTick, 120);
    return () => clearInterval(intervalId);
  }, []);

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

  // Inicializar Service Worker y stream de video silencioso en vivo al primer toque del usuario
  useEffect(() => {
    registerParquServiceWorker();

    const handleUserInteraction = async () => {
      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
        }
      }

      // Activar el stream del canvas en vivo para autoPictureInPicture al salir de la app
      if (
        !streamInitializedRef.current &&
        liveCanvasRef.current &&
        liveVideoRef.current &&
        typeof liveCanvasRef.current.captureStream === 'function'
      ) {
        try {
          const stream = liveCanvasRef.current.captureStream(15);
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.autoPictureInPicture = true;
          liveVideoRef.current.play().catch(() => {});
          streamInitializedRef.current = true;
        } catch {
          // ignore
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

        // Intentar abrir el bloque flotante en vivo (Picture-in-Picture) si el navegador lo permite
        if (
          liveVideoRef.current &&
          streamInitializedRef.current &&
          document.pictureInPictureEnabled &&
          !document.pictureInPictureElement &&
          typeof liveVideoRef.current.requestPictureInPicture === 'function'
        ) {
          liveVideoRef.current.requestPictureInPicture().catch(() => {});
        }
      } else if (document.visibilityState === 'visible') {
        hasSentWhileHiddenRef.current = false;
        notifyAppForegrounded();
        if (
          document.pictureInPictureElement &&
          typeof document.exitPictureInPicture === 'function'
        ) {
          document.exitPictureInPicture().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed -left-[9999px] -top-[9999px] w-px h-px overflow-hidden opacity-0 pointer-events-none"
    >
      <canvas ref={liveCanvasRef} width={640} height={236} />
      <video
        ref={liveVideoRef}
        muted
        playsInline
        autoPictureInPicture
        width={320}
        height={118}
      />
    </div>
  );
};
