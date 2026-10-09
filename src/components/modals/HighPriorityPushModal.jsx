import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Clock,
  PlusCircle,
  StopCircle,
  Play,
  CreditCard,
  ShieldCheck,
  X,
  Send,
  Car,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { sileo } from 'sileo';
import { useParking } from '../../context/ParkingContext';
import {
  buildParkingNotificationPayload,
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

  useEffect(() => {
    if (!isOpen) return undefined;

    getActiveWebPushSubscription().then((sub) => {
      setPushSubscribed(Boolean(sub && sub.endpoint));
    });

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const payload = buildParkingNotificationPayload({
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
  });

  const isActive = Boolean(activeSession);
  const carProgressPct = isActive
    ? Math.min(88, Math.max(18, payload.progressPercent || 28))
    : 24 + Math.round(Math.sin(tick * 0.6) * 4);

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
        description: `Monitoreo activado para ${payload.plates}.`,
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
        title: 'Alerta Push programada en 3 segundos',
        description: 'Sal de la app o bloquea tu pantalla ahora para recibir la notificación Push.',
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
      aria-label="Alerta Push de Alta Prioridad Parqu"
      className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#0d0f14] text-white border border-white/15 shadow-2xl overflow-hidden font-sans">
        {/* Barra Superior de Alta Prioridad */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0033FF] via-[#0a2599] to-[#01033E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-mono font-black uppercase tracking-widest text-white">
              ALERTA PUSH DE ALTA PRIORIDAD
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

        <div className="p-5 space-y-5">
          {/* Encabezado Vehículo y Saldo */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 border border-white/15 font-mono text-xs font-black text-white">
                  {payload.plates}
                </span>
                <span className="text-xs text-slate-300 font-semibold">{payload.carDesc}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{payload.zoneName}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block">
                SALDO PARQU
              </span>
              <span className="text-base font-mono font-black text-emerald-400">
                ${Number(card?.balance ?? 0).toFixed(2)} MXN
              </span>
            </div>
          </div>

          {/* Tarjeta En Vivo (Reloj + Cobro en Tiempo Real + Barra Gráfica con Auto) */}
          <div className="p-4 rounded-2xl bg-[#151821] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                  {isActive ? 'TIEMPO EN PARQUÍMETRO' : 'ESTADO DEL PARQUÍMETRO'}
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-white mt-0.5 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" />
                  <span>{isActive ? payload.clockStr : 'LISTO ($6/HR)'}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                  COBRO ACUMULADO
                </span>
                <span className="text-2xl font-mono font-black text-amber-400">
                  ${isActive ? payload.cost : '0.00'}{' '}
                  <span className="text-xs font-normal text-slate-400">MXN</span>
                </span>
              </div>
            </div>

            {/* Pista en vivo moderna (CERO símbolos ASCII) */}
            <div className="pt-2 pb-1">
              <div className="relative h-2.5 w-full rounded-full bg-slate-800 overflow-visible">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0033FF] via-sky-400 to-white transition-all duration-500"
                  style={{ width: `${carProgressPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-5 rounded-full bg-white text-[#0033FF] shadow-lg border border-sky-400 flex items-center justify-center transition-all duration-500"
                  style={{ left: `${carProgressPct}%` }}
                >
                  <Car className="w-3.5 h-3.5 text-[#0033FF]" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2.5">
                <span>
                  {isActive
                    ? `Programado: ${payload.scheduledHours}h ($${(payload.scheduledHours * 6).toFixed(2)})`
                    : 'Tarifa oficial: $6.00 MXN / hora'}
                </span>
                <span className="text-sky-400 font-bold">
                  {isActive ? `Restan ${payload.remainingMinutes} min` : 'Autocobro listo'}
                </span>
              </div>
            </div>
          </div>

          {/* Botones Interactivos de Alta Prioridad (Aceptar +1 Hora / Finalizar / Ver Cobro) */}
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
                    <span>Aceptar +1 Hora ($6)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Iniciar Estancia ($6)</span>
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
              <span>Ver Cobro en Vivo en el Panel Principal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Estado Web Push (VAPID / FCM) y Prueba con Pantalla Bloqueada */}
          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canal Push (FCM / VAPID):</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {pushSubscribed ? 'SUSCRITO • ALTA PRIORIDAD' : 'ACTIVO EN SEGUNDO PLANO'}
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
                  ? 'Enviando Push en 3s (bloquea tu pantalla)...'
                  : 'Probar Push con Pantalla Bloqueada (Retraso 3s)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
