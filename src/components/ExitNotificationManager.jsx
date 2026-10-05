import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Car,
  Clock,
  User,
  Wifi,
  X,
  CheckCircle2,
  MapPin,
  Play,
  Square,
  Plus,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { sileo } from 'sileo';
import { useParking } from '../context/ParkingContext';
import { triggerHaptic } from '../utils/haptics';
import {
  registerParquServiceWorker,
  getNotificationPermissionState,
  requestParkingNotificationPermission,
  buildParkingNotificationPayload,
  syncParquStateToServiceWorker,
  notifyAppForegrounded,
  dispatchBackgroundNotificationImmediate,
  sendParkingExitNotification,
} from '../utils/parkingNotification';

export const ExitNotificationManager = ({ isOpenExternal, onCloseExternal }) => {
  const {
    owner,
    vehicle,
    card,
    autoPay,
    updateAutoPay,
    addBalance,
    activeSession,
    startParking,
    stopParkingAndAutoCharge,
    transactions,
  } = useParking();

  const [bannerOpen, setBannerOpen] = useState(false);
  const [isMinimizedPill, setIsMinimizedPill] = useState(false);
  const [permission, setPermission] = useState(() => getNotificationPermissionState());
  const [autoNotifyOnExit, setAutoNotifyOnExit] = useState(true);
  const [lastExitTime, setLastExitTime] = useState(null);
  const [dismissedPromptPill, setDismissedPromptPill] = useState(false);
  const [liveTick, setLiveTick] = useState(0);

  // Mantener referencia síncrona actualizada para visibilitychange / pagehide en teléfono
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
  }, [owner, vehicle, card, autoPay, activeSession, transactions, liveTick]);

  // Reloj en vivo de alta precisión para que la notificación interactiva lata cada segundo
  useEffect(() => {
    if (!bannerOpen && !activeSession) return undefined;
    const interval = setInterval(() => {
      setLiveTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [bannerOpen, activeSession]);

  const autoNotifyRef = useRef(autoNotifyOnExit);
  useEffect(() => {
    autoNotifyRef.current = autoNotifyOnExit;
  }, [autoNotifyOnExit]);

  const lastNotificationSentAtRef = useRef(0);

  // Sincronizar apertura externa desde el botón de campana en el Header
  useEffect(() => {
    if (isOpenExternal) {
      setBannerOpen(true);
      setIsMinimizedPill(false);
    }
  }, [isOpenExternal]);

  const handleCloseBanner = () => {
    setBannerOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  // Escuchar acciones interactivas disparadas desde los botones de la notificación del teléfono (Service Worker)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PARQU_SW_ACTION') return;
      if (event.data.action === 'START_PARKING' && !latestContextRef.current.activeSession) {
        startParking('Espacio #1042 • Centro Histórico', 6.0);
        sileo.success({
          title: 'Parquímetro Iniciado desde Notificación',
          description: 'Tarifa activa a $6.00/hr en Espacio #1042.',
        });
      } else if (event.data.action === 'STOP_PARKING' && latestContextRef.current.activeSession) {
        const txn = stopParkingAndAutoCharge();
        if (txn) {
          sileo.success({
            title: 'Estancia Finalizada desde Notificación',
            description: `Folio ${txn.folio} • Total cobrado: $${txn.amount.toFixed(2)} MXN`,
          });
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, [startParking, stopParkingAndAutoCharge]);

  // Registrar Service Worker y solicitar permiso en el primer click/tap en móvil
  useEffect(() => {
    registerParquServiceWorker();
    setPermission(getNotificationPermissionState());

    const unlockNotificationsOnFirstGesture = async () => {
      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        setPermission(res);
        if (res === 'granted') {
          syncParquStateToServiceWorker(latestContextRef.current);
        }
      }
    };

    window.addEventListener('click', unlockNotificationsOnFirstGesture, { once: true });
    window.addEventListener('touchend', unlockNotificationsOnFirstGesture, { once: true });
    return () => {
      window.removeEventListener('click', unlockNotificationsOnFirstGesture);
      window.removeEventListener('touchend', unlockNotificationsOnFirstGesture);
    };
  }, []);

  // Disparo síncrono cuando el usuario sale de la app en su teléfono
  const triggerExitNotificationSync = useCallback((source = 'exit') => {
    if (!autoNotifyRef.current && source !== 'manual') return null;

    const now = Date.now();
    if (source !== 'manual' && now - lastNotificationSentAtRef.current < 1800) {
      return null;
    }
    lastNotificationSentAtRef.current = now;

    const result = dispatchBackgroundNotificationImmediate(latestContextRef.current, false);

    setLastExitTime(
      new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    setBannerOpen(true);

    return result;
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerExitNotificationSync('visibility-hidden');
      } else if (document.visibilityState === 'visible') {
        notifyAppForegrounded();
        setPermission(getNotificationPermissionState());
      }
    };

    const handlePageHide = () => {
      triggerExitNotificationSync('pagehide');
    };

    const handleWindowBlur = () => {
      if (document.visibilityState === 'hidden') {
        triggerExitNotificationSync('blur');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [triggerExitNotificationSync]);

  const handleEnableOrTestNotification = async () => {
    triggerHaptic();
    const currentPerm = await requestParkingNotificationPermission();
    setPermission(currentPerm);

    syncParquStateToServiceWorker(latestContextRef.current);
    const { sent, payload } = await sendParkingExitNotification(latestContextRef.current);
    setBannerOpen(true);

    if (sent) {
      sileo.success({
        title: 'Notificación en Vivo Enviada',
        description: 'Revisa la barra superior de tu teléfono. Se actualizará automáticamente al salir.',
      });
    } else if (currentPerm === 'denied') {
      sileo.info({
        title: 'Permiso bloqueado en navegador',
        description: 'Habilita las notificaciones en el icono de candado de la barra de direcciones.',
      });
    } else {
      sileo.success({
        title: 'Telemetría en Vivo Activa',
        description: `${payload.fullName} • Placas ${payload.plates} • ${payload.clockStr}`,
      });
    }
  };

  const handleToggleParkingLive = () => {
    triggerHaptic();
    if (activeSession) {
      const txn = stopParkingAndAutoCharge();
      if (txn) {
        sileo.success({
          title: 'Parquímetro Finalizado',
          description: `Folio ${txn.folio} • Cobro: $${txn.amount.toFixed(2)} MXN`,
        });
      }
    } else {
      startParking('Espacio #1042 • Centro Histórico', 6.0);
      sileo.success({
        title: 'Parquímetro Iniciado en Vivo',
        description: 'Tarifa activa a $6.00/hr • Monitoreo en segundo plano habilitado.',
      });
    }
  };

  const handleQuickAddBalance = (amount) => {
    triggerHaptic();
    addBalance(amount);
    sileo.success({
      title: `Recarga Express +$${amount}.00 MXN`,
      description: `Nuevo saldo NFC disponible: $${(Number(card?.balance ?? 0) + amount).toFixed(2)} MXN`,
    });
  };

  const handleToggleAutoPayLive = () => {
    triggerHaptic();
    const nextState = !autoPay?.enabled;
    updateAutoPay({ enabled: nextState });
    sileo.info({
      title: nextState ? 'Autocobro Activado' : 'Autocobro en Pausa',
      description: nextState
        ? 'El cobro automático por segundo está activo.'
        : 'El cobro automático fue pausado temporalmente.',
    });
  };

  const info = buildParkingNotificationPayload({
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
  });

  // Barra de progreso de la hora en curso (0 a 100%)
  const hourProgressPct = info.isActive
    ? Math.min(100, Math.max(3, Math.round(((info.elapsedSeconds % 3600) / 3600) * 100)))
    : 0;

  return (
    <>
      {/* Píldora flotante de 1 toque si el teléfono aún no ha otorgado permiso */}
      {permission === 'default' && !dismissedPromptPill && !bannerOpen && (
        <div className="fixed bottom-4 inset-x-0 z-50 px-3 pointer-events-none flex justify-center">
          <div className="pointer-events-auto max-w-md w-full rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 px-3.5 py-2.5 shadow-[0_14px_35px_rgba(15,23,42,0.16)] flex items-center justify-between gap-2.5 text-slate-900">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0033FF] flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-tight truncate text-slate-900">
                  Activar telemetría en vivo en tu teléfono
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Muestra tiempo y cobro en segundo plano al salir de Parqu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleEnableOrTestNotification}
                className="px-3 py-1.5 rounded-xl bg-[#0033FF] hover:bg-[#2250ff] active:scale-95 text-white font-sans font-bold text-[11px] cursor-pointer whitespace-nowrap"
              >
                Activar
              </button>
              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() => setDismissedPromptPill(true)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consola de Notificación Interactiva en Vivo (Modo Píldora Compacta o Expandida) */}
      {bannerOpen && (
        <div
          role="region"
          aria-label="Notificación interactiva en vivo de Parquímetro"
          className="fixed top-[68px] sm:top-[76px] inset-x-0 z-50 px-3 sm:px-6 pointer-events-none flex justify-center"
        >
          {isMinimizedPill ? (
            /* MODO PÍLDORA EN VIVO (COMPACTO INTERACTIVO) */
            <div className="pointer-events-auto max-w-[440px] w-full rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_14px_36px_rgba(15,23,42,0.16)] px-3.5 py-2 flex items-center justify-between gap-2 text-slate-900">
              <button
                type="button"
                onClick={() => setIsMinimizedPill(false)}
                className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    info.isActive ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span className="font-mono font-black text-xs text-slate-900 tracking-tight">
                  {info.clockStr}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono font-bold text-xs text-[#0033FF]">
                  ${info.cost} MXN
                </span>
                <span className="text-[11px] font-sans font-semibold text-slate-500 truncate">
                  {info.plates}
                </span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleParkingLive}
                  className={`px-2.5 py-1 rounded-full font-sans font-bold text-[10px] uppercase tracking-wider transition cursor-pointer ${
                    info.isActive
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-[#0033FF] hover:bg-[#1e4bff] text-white'
                  }`}
                >
                  {info.isActive ? 'Detener' : 'Iniciar'}
                </button>
                <button
                  type="button"
                  aria-label="Expandir notificación en vivo"
                  onClick={() => setIsMinimizedPill(false)}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Cerrar notificación"
                  onClick={handleCloseBanner}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* MODO CONSOLA EXPANDIDA EN VIVO (SIN EMOJIS, 100% INTERACTIVA) */
            <div className="w-full max-w-[470px] pointer-events-auto rounded-[24px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_22px_55px_rgba(15,23,42,0.20)] p-3.5 sm:p-4 text-slate-900">
              {/* Cabecera con indicador de enlace en vivo y controles de ventana */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-[#0033FF] text-white flex items-center justify-center shadow-sm shrink-0">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-[10px] uppercase tracking-widest text-[#0033FF]">
                        PARQU TELEMETRIA EN VIVO
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          info.isActive ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        {info.isActive ? 'ACTIVO' : 'EN ESPERA'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      {lastExitTime
                        ? `Sincronizado al salir: ${lastExitTime}`
                        : 'Actualización continua en segundo plano • $6.00/hr'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsMinimizedPill(true)}
                    title="Minimizar a píldora en vivo"
                    aria-label="Minimizar notificación"
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseBanner}
                    aria-label="Cerrar notificación"
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cronómetro en Vivo + Barra de Progreso + Botón Directo Iniciar/Finalizar */}
              <div className="mt-3 space-y-2.5">
                <div
                  className={`rounded-2xl p-3 border transition-colors ${
                    info.isActive
                      ? 'bg-amber-50/80 border-amber-200/90'
                      : 'bg-slate-50/90 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          info.isActive
                            ? 'bg-amber-500 text-white'
                            : 'bg-[#0033FF]/10 text-[#0033FF]'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-slate-500 block">
                          {info.isActive ? 'CRONOMETRO DE PARQUIMETRO' : 'SIN SESION EN CURSO'}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                            {info.clockStr}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {info.isActive
                              ? `${info.hours}h ${info.minutes}m ${info.seconds}s`
                              : info.historyText}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">
                        {info.isActive ? 'COBRO EN VIVO' : 'TARIFA OFICIAL'}
                      </span>
                      <span className="font-mono font-black text-lg sm:text-xl text-[#0033FF]">
                        {info.isActive ? `$${info.cost}` : '$6.00/hr'}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progreso en Vivo */}
                  <div className="mt-2.5 space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          info.isActive ? 'bg-[#0033FF]' : 'bg-slate-400'
                        }`}
                        style={{ width: `${info.isActive ? hourProgressPct : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{info.zoneName}</span>
                      <span>Saldo NFC: ${info.balance} MXN</span>
                    </div>
                  </div>
                </div>

                {/* Datos en Vivo del Conductor y Vehículo */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 flex items-center gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-[#0033FF] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-slate-400 block">
                        TITULAR
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {info.fullName}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 flex items-center gap-2 min-w-0">
                    <Car className="w-3.5 h-3.5 text-[#0033FF] shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-slate-400 block">
                        PLACAS • {info.plates}
                      </span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {info.carDesc}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controles Interactivos en Vivo: Iniciar/Detener, Recarga Rápida y Autocobro */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={handleToggleParkingLive}
                    className={`col-span-1 py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm ${
                      info.isActive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-[#0033FF] hover:bg-[#1e4bff] text-white'
                    }`}
                  >
                    {info.isActive ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>Finalizar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Iniciar $6/h</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAddBalance(50)}
                    className="col-span-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-sans font-bold text-[11px] flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0033FF]" />
                    <span>Recargar $50</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleAutoPayLive}
                    className={`col-span-1 py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer border ${
                      info.autoPayEnabled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Zap className="w-3 h-3 shrink-0" />
                    <span>{info.autoPayEnabled ? 'Autocobro ON' : 'Autocobro OFF'}</span>
                  </button>
                </div>

                {/* Pie de Consola: Estado del Aviso al Salir y Envío al Teléfono */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoNotifyOnExit((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      autoNotifyOnExit
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{autoNotifyOnExit ? '2º PLANO: ACTIVO' : '2º PLANO: PAUSADO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEnableOrTestNotification}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-sans font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#0033FF]" />
                    <span>
                      {permission === 'granted'
                        ? 'Actualizar en Barra del Telefono'
                        : 'Permitir en mi Telefono'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
