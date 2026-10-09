import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  PlusCircle,
  StopCircle,
  Play,
  CreditCard,
  ShieldCheck,
  X,
  Send,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { sileo } from 'sileo';
import { useParking } from '../../context/ParkingContext';
import {
  buildParkingNotificationPayload,
  drawLiveUberBlockFrame,
  subscribeToWebPush,
  getActiveWebPushSubscription,
  sendServerWebPushNotification,
} from '../../utils/parkingNotification';

export const HighPriorityPushModal = ({ isOpen, onClose, onNavigateToMeter }) => {
  const {
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
    startParking,
    addParkingHours,
    stopParkingAndAutoCharge,
    addBalance,
  } = useParking();

  const [tick, setTick] = useState(0);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [sendingDelayedPush, setSendingDelayedPush] = useState(false);
  const previewCanvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    getActiveWebPushSubscription().then((sub) => {
      setPushSubscribed(Boolean(sub && sub.endpoint));
    });

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 250);

    return () => clearInterval(interval);
  }, [isOpen]);

  const payload = buildParkingNotificationPayload({
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
  });

  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseRatio = payload.isActive
      ? Math.min(0.88, Math.max(0.18, (payload.progressPercent || 25) / 100))
      : 0.24;
    const smoothRatio = Math.min(0.9, Math.max(0.16, baseRatio + Math.sin(tick * 0.25) * 0.015));

    drawLiveUberBlockFrame(ctx, canvas.width, canvas.height, payload, smoothRatio);
  }, [isOpen, tick, payload]);

  if (!isOpen) return null;

  const isActive = Boolean(activeSession);

  const handleExtendOrStart = () => {
    if (isActive) {
      if (typeof addParkingHours === 'function') {
        addParkingHours(1);
      }
      const nextH = (Number(activeSession?.scheduledHours) || 1) + 1;
      sileo.success({
        title: '+1 Hora Aceptada ($6.00 MXN)',
        description: `Estancia extendida a ${nextH}h para ${payload.plates}.`,
      });
    } else {
      startParking('Espacio #1042 • Centro Histórico', 6.0, null, 1);
      sileo.success({
        title: 'Parquímetro Iniciado ($6.00/hr)',
        description: `Monitoreo activado para ${payload.plates}. Ahora puedes salir de la app para ver el seguimiento en tu barra.`,
      });
    }
  };

  const handleStopStay = () => {
    if (!isActive) return;
    const txn = stopParkingAndAutoCharge();
    if (txn) {
      sileo.success({
        title: 'Estancia Finalizada y Cobrada',
        description: `Folio ${txn.folio} • Total cobrado: $${txn.amount.toFixed(2)} MXN`,
      });
    }
    onClose();
  };

  const handleQuickRecharge50 = () => {
    addBalance(50);
    sileo.success({
      title: 'Recarga Express +$50.00 MXN',
      description: 'Saldo acreditado al instante en tu tarjeta Parqu.',
    });
  };

  const handleTestDelayedServerPush = async () => {
    setSendingDelayedPush(true);
    try {
      const sub = await subscribeToWebPush();
      if (sub) {
        setPushSubscribed(true);
      }
      sileo.info({
        title: 'Notificación programada en 3 segundos',
        description: 'Sal de la app o bloquea tu pantalla ahora para ver la notificación en vivo.',
      });

      await sendServerWebPushNotification(
        { owner, vehicle, card, autoPay, activeSession, transactions },
        {
          delayMs: 3000,
          alertReason: 'LOCK_SCREEN_TEST',
        }
      );
    } finally {
      setSendingDelayedPush(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Seguimiento en Vivo de Parquímetro"
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#0b0d13] text-white border border-white/15 shadow-2xl overflow-hidden font-sans">
        {/* Barra Superior */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0033FF] via-[#0a2599] to-[#01033E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-white">
              BLOQUE EN VIVO • UBER / LIVE ACTIVITY
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Vista en vivo exacta de la tarjeta gráfica de la notificación */}
          <div className="rounded-2xl overflow-hidden border border-sky-500/30 bg-[#07090e] shadow-xl">
            <canvas
              ref={previewCanvasRef}
              width={800}
              height={292}
              className="w-full h-auto block"
            />
          </div>

          {/* Botones Interactivos (+1 Hora / Finalizar / Iniciar) */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExtendOrStart}
                className="py-3 px-4 rounded-2xl bg-[#0033FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                {isActive ? (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>+1 Hora ($6.00)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Iniciar Parquímetro ($6)</span>
                  </>
                )}
              </button>

              {isActive ? (
                <button
                  type="button"
                  onClick={handleStopStay}
                  className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Finalizar Estancia</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickRecharge50}
                  className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Recargar +$50 MXN</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToMeter) onNavigateToMeter();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Ir al Parquímetro en el Panel Principal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Estado Web Push y Prueba con Pantalla Bloqueada */}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modo de actualización en barra:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {pushSubscribed ? '1 SOLA NOTIFICACIÓN • EN VIVO' : '1 SOLA NOTIFICACIÓN ACTIVA'}
              </span>
            </div>

            <button
              type="button"
              disabled={sendingDelayedPush}
              onClick={handleTestDelayedServerPush}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-sky-300 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {sendingDelayedPush
                  ? 'Enviando en 3s (sal de la app ahora)...'
                  : 'Probar Notificación Fuera de la App (3s)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
