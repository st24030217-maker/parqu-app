import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Car,
  Clock,
  User,
  X,
  CheckCircle2,
  Play,
  Square,
  Plus,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { animate, stagger } from 'animejs';
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

  // Referencias para animaciones con Anime.js v4
  const consoleCardRef = useRef(null);
  const minimizedPillRef = useRef(null);
  const telemetryWaveRef = useRef(null);
  const minimizedWaveRef = useRef(null);
  const clockDigitsRef = useRef(null);
  const costDigitsRef = useRef(null);
  const timerCardRef = useRef(null);
  const uberProgressNodeRef = useRef(null);

  // Mantener referencia síncrona actualizada para visibilitychange en teléfono
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

  // Reloj en vivo de alta precisión segundo a segundo
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
    if (consoleCardRef.current) {
      animate(consoleCardRef.current, {
        opacity: [1, 0],
        scale: [1, 0.92],
        translateY: [0, -14],
        duration: 220,
        ease: 'inQuad',
      });
      setTimeout(() => {
        setBannerOpen(false);
        if (onCloseExternal) onCloseExternal();
      }, 200);
      return;
    }
    setBannerOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  const info = buildParkingNotificationPayload({
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
  });

  // 1. Animación Anime.js tipo Uber / Dynamic Island al expandir o contraer la Consola en Vivo
  useEffect(() => {
    if (!bannerOpen) return;

    if (isMinimizedPill && minimizedPillRef.current) {
      animate(minimizedPillRef.current, {
        opacity: [0, 1],
        scaleX: [1.35, 1],
        scaleY: [1.2, 1],
        translateY: [8, 0],
        duration: 620,
        ease: 'outElastic(1, .62)',
      });
    } else if (!isMinimizedPill && consoleCardRef.current) {
      animate(consoleCardRef.current, {
        opacity: [0, 1],
        scaleX: [0.68, 1],
        scaleY: [0.76, 1],
        translateY: [-18, 0],
        duration: 720,
        ease: 'outElastic(1, .66)',
      });

      const blocks = consoleCardRef.current.querySelectorAll('.anime-console-item');
      if (blocks.length > 0) {
        blocks.forEach((el) => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(12px) scale(0.97)';
        });
        animate(blocks, {
          opacity: [0, 1],
          translateY: [12, 0],
          scale: [0.97, 1],
          delay: stagger(55, { start: 90 }),
          duration: 540,
          ease: 'outExpo',
        });
      }
    }
  }, [bannerOpen, isMinimizedPill]);

  // 2. Osciloscopio / Ondas de Telemetría y Nodo de Ruta estilo Uber/DiDi con Anime.js
  useEffect(() => {
    if (!bannerOpen) return undefined;

    let waveAnim;
    let nodeAnim;
    const targetContainer = isMinimizedPill ? minimizedWaveRef.current : telemetryWaveRef.current;

    if (targetContainer) {
      const bars = targetContainer.querySelectorAll('.anime-telemetry-bar');
      if (bars.length > 0) {
        waveAnim = animate(bars, {
          scaleY: info.isActive ? [0.25, 1, 0.35, 0.9, 0.3] : [0.22, 0.55, 0.22],
          opacity: info.isActive ? [0.55, 1, 0.65] : [0.35, 0.75, 0.35],
          delay: stagger(55, { from: 'center' }),
          duration: info.isActive ? 760 : 1500,
          loop: true,
          alternate: true,
          ease: 'inOutSine',
        });
      }
    }

    if (!isMinimizedPill && uberProgressNodeRef.current) {
      nodeAnim = animate(uberProgressNodeRef.current, {
        scale: info.isActive ? [1, 1.35, 1] : [1, 1.12, 1],
        duration: info.isActive ? 900 : 1800,
        loop: true,
        ease: 'inOutSine',
      });
    }

    return () => {
      if (waveAnim && typeof waveAnim.pause === 'function') waveAnim.pause();
      if (nodeAnim && typeof nodeAnim.pause === 'function') nodeAnim.pause();
    };
  }, [bannerOpen, isMinimizedPill, info.isActive]);

  // 3. Pulso cinético segundo a segundo en el reloj digital con Anime.js
  useEffect(() => {
    if (!bannerOpen || isMinimizedPill || !clockDigitsRef.current) return;
    animate(clockDigitsRef.current, {
      scale: info.isActive ? [1.05, 1] : [1.015, 1],
      translateY: info.isActive ? [-1.5, 0] : [0, 0],
      duration: 360,
      ease: 'outExpo',
    });
  }, [liveTick, bannerOpen, isMinimizedPill, info.isActive]);

  // 4. Rebote elástico en el monto de cobro / saldo cuando se actualiza con Anime.js
  useEffect(() => {
    if (!bannerOpen || isMinimizedPill || !costDigitsRef.current) return;
    animate(costDigitsRef.current, {
      scale: [1.22, 1],
      translateY: [-3, 0],
      duration: 620,
      ease: 'outElastic(1, .52)',
    });
  }, [info.cost, info.balance, info.isActive, bannerOpen, isMinimizedPill]);

  // 5. Escuchar TODAS las acciones ejecutadas desde la notificación estilo Uber/DiDi en 2º plano
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PARQU_SW_ACTION') return;
      const { action, amount, enabled } = event.data;

      if (action === 'START_PARKING' && !latestContextRef.current.activeSession) {
        startParking('Espacio #1042 • Centro Histórico', 6.0);
        sileo.success({
          title: 'Parquímetro Iniciado desde Notificación',
          description: 'Tarifa activa a $6.00/hr en Espacio #1042.',
        });
      } else if (action === 'STOP_PARKING' && latestContextRef.current.activeSession) {
        const txn = stopParkingAndAutoCharge();
        if (txn) {
          sileo.success({
            title: 'Estancia Finalizada desde Notificación',
            description: `Folio ${txn.folio} • Total cobrado: $${txn.amount.toFixed(2)} MXN`,
          });
        }
      } else if (action === 'ADD_BALANCE') {
        const addAmt = Number(amount) || 50;
        addBalance(addAmt);
        sileo.success({
          title: `Recarga +$${addAmt}.00 desde Notificación`,
          description: 'Tu saldo NFC se actualizó desde el control en segundo plano.',
        });
      } else if (action === 'TOGGLE_AUTOPAY') {
        const nextEnabled =
          typeof enabled === 'boolean' ? enabled : !latestContextRef.current.autoPay?.enabled;
        updateAutoPay({ enabled: nextEnabled });
        sileo.info({
          title: nextEnabled ? 'Autocobro Activado' : 'Autocobro Pausado',
          description: 'Cambio aplicado desde la notificación en segundo plano.',
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, [startParking, stopParkingAndAutoCharge, addBalance, updateAutoPay]);

  // 6. Controles de Hardware / Pantalla de Bloqueo (MediaSession Action Handlers)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (!latestContextRef.current.activeSession) {
          startParking('Espacio #1042 • Centro Histórico', 6.0);
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (latestContextRef.current.activeSession) {
          stopParkingAndAutoCharge();
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        addBalance(50);
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        updateAutoPay({ enabled: !latestContextRef.current.autoPay?.enabled });
      });
    } catch {
      // ignore unsupported handlers
    }
  }, [startParking, stopParkingAndAutoCharge, addBalance, updateAutoPay]);

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

  // Disparo síncrono único cuando el usuario sale de la app en su teléfono
  const triggerExitNotificationSync = useCallback((source = 'exit') => {
    if (!autoNotifyRef.current && source !== 'manual') return null;

    const now = Date.now();
    if (source !== 'manual' && now - lastNotificationSentAtRef.current < 3500) {
      return null;
    }
    lastNotificationSentAtRef.current = now;

    const result = dispatchBackgroundNotificationImmediate(latestContextRef.current);

    setLastExitTime(
      new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );

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

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [triggerExitNotificationSync]);

  const pulseInteractiveElement = (el) => {
    if (el) {
      animate(el, {
        scale: [0.9, 1.06, 1],
        duration: 500,
        ease: 'outElastic(1, .55)',
      });
    }
    if (timerCardRef.current) {
      animate(timerCardRef.current, {
        scale: [0.985, 1.015, 1],
        duration: 460,
        ease: 'outElastic(1, .6)',
      });
    }
  };

  const handleEnableOrTestNotification = async (e) => {
    if (e?.currentTarget) pulseInteractiveElement(e.currentTarget);
    triggerHaptic();
    const currentPerm = await requestParkingNotificationPermission();
    setPermission(currentPerm);

    syncParquStateToServiceWorker(latestContextRef.current);
    const { sent, payload } = await sendParkingExitNotification(latestContextRef.current);
    setBannerOpen(true);

    if (sent) {
      sileo.success({
        title: 'Control Tipo Uber/DiDi Enviado a tu Barra',
        description: 'Desliza la barra de tu teléfono: puedes Iniciar/Finalizar, Recargar +$50 o cambiar Autocobro desde ahí.',
      });
    } else if (currentPerm === 'denied') {
      sileo.info({
        title: 'Permiso bloqueado en navegador',
        description: 'Habilita las notificaciones en el icono de candado de la barra de direcciones.',
      });
    } else {
      sileo.success({
        title: 'Control en Vivo Activo',
        description: `${payload.fullName} • Placas ${payload.plates} • ${payload.clockStr}`,
      });
    }
  };

  const handleToggleParkingLive = (e) => {
    if (e?.currentTarget) pulseInteractiveElement(e.currentTarget);
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
        description: 'Tarifa activa a $6.00/hr • Control en segundo plano habilitado.',
      });
    }
  };

  const handleQuickAddBalance = (amount, e) => {
    if (e?.currentTarget) pulseInteractiveElement(e.currentTarget);
    triggerHaptic();
    addBalance(amount);
    sileo.success({
      title: `Recarga Express +$${amount}.00 MXN`,
      description: `Nuevo saldo NFC disponible: $${(Number(card?.balance ?? 0) + amount).toFixed(2)} MXN`,
    });
  };

  const handleToggleAutoPayLive = (e) => {
    if (e?.currentTarget) pulseInteractiveElement(e.currentTarget);
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

  // Barra de progreso tipo viaje Uber/DiDi (0 a 100%)
  const hourProgressPct = info.isActive
    ? Math.min(96, Math.max(8, Math.round(((info.elapsedSeconds % 3600) / 3600) * 100)))
    : 12;

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
                  Activar Notificación con Control Tipo Uber / DiDi
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Controla tu parquímetro y saldo desde la barra al salir de la app
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

      {/* Consola de Control en Vivo Estilo Uber / DiDi animada con Anime.js v4 */}
      {bannerOpen && (
        <div
          role="region"
          aria-label="Consola de control en vivo tipo Uber y DiDi"
          className="fixed top-[68px] sm:top-[76px] inset-x-0 z-50 px-3 sm:px-6 pointer-events-none flex justify-center"
        >
          {isMinimizedPill ? (
            /* MODO PÍLDORA FLOTANTE COMPACTA TIPO UBER / DYNAMIC ISLAND */
            <div
              ref={minimizedPillRef}
              className="pointer-events-auto max-w-[460px] w-full rounded-full bg-[#090d16]/95 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)] px-3.5 py-2 flex items-center justify-between gap-2 text-white origin-top"
            >
              <button
                type="button"
                onClick={() => setIsMinimizedPill(false)}
                className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
              >
                <div ref={minimizedWaveRef} className="flex items-center gap-0.5 h-3.5 px-1">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <span
                      key={idx}
                      className={`anime-telemetry-bar w-0.5 h-3.5 rounded-full origin-center ${
                        info.isActive ? 'bg-[#38bdf8]' : 'bg-emerald-400'
                      }`}
                    />
                  ))}
                </div>

                <span className="font-mono font-black text-xs text-white tracking-tight">
                  {info.clockStr}
                </span>
                <span className="text-slate-500">•</span>
                <span className="font-mono font-bold text-xs text-[#38bdf8]">
                  ${info.cost} MXN
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-300 truncate">
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
                  {info.isActive ? 'Finalizar' : 'Iniciar'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleQuickAddBalance(50, e)}
                  className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-[10px] cursor-pointer"
                >
                  +$50
                </button>
                <button
                  type="button"
                  aria-label="Expandir control en vivo"
                  onClick={() => setIsMinimizedPill(false)}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={handleCloseBanner}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* TARJETA DE CONTROL EN VIVO ESTILO UBER / DIDI */
            <div
              ref={consoleCardRef}
              className="w-full max-w-[480px] pointer-events-auto rounded-[24px] bg-[#090d16]/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.45)] p-4 text-white origin-top"
            >
              {/* Cabecera estilo Uber Live Activity */}
              <div className="anime-console-item flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                      info.isActive ? 'bg-[#0033FF] text-white' : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-[10px] uppercase tracking-widest text-[#38bdf8]">
                        PARQU LIVE CONTROL
                      </span>
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-md bg-white/10 text-white font-bold">
                        {info.isActive ? 'EN PARQUIMETRO' : 'LISTO PARA SALIR'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {lastExitTime
                        ? `Control activo en barra desde: ${lastExitTime}`
                        : 'Controla Parqu desde tu barra de notificaciones al salir'}
                    </p>
                  </div>
                </div>

                {/* Ondas Anime.js y botones de ventana */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    ref={telemetryWaveRef}
                    aria-hidden="true"
                    className="hidden sm:flex items-center gap-[3px] h-5 px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                  >
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`anime-telemetry-bar w-[2.5px] h-3.5 rounded-full origin-center ${
                          info.isActive ? 'bg-[#38bdf8]' : 'bg-emerald-400'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMinimizedPill(true)}
                    title="Minimizar a píldora flotante"
                    aria-label="Minimizar notificación"
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseBanner}
                    aria-label="Cerrar notificación"
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bloque Central Estilo Viaje Uber / DiDi con Barra de Ruta y Cronómetro */}
              <div className="mt-3 space-y-3">
                <div
                  ref={timerCardRef}
                  className="anime-console-item rounded-2xl p-3.5 bg-white/[0.06] border border-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                        {info.isActive ? 'TIEMPO DE ESTANCIA EN CURSO' : 'ESTACIONAMIENTO EN ESPERA'}
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span
                          ref={clockDigitsRef}
                          className="inline-block font-mono font-black text-2xl sm:text-3xl text-white tracking-tight origin-left"
                        >
                          {info.clockStr}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#38bdf8]">
                          $6.00/hr
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                        {info.isActive ? 'TOTAL ACUMULADO' : 'SALDO NFC'}
                      </span>
                      <span
                        ref={costDigitsRef}
                        className="inline-block font-mono font-black text-xl sm:text-2xl text-emerald-400 origin-right"
                      >
                        {info.isActive ? `$${info.cost} MXN` : `$${info.balance}`}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Ruta / Progreso Estilo Uber/DiDi con Nodo Animado Anime.js */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="relative w-full h-2 rounded-full bg-white/10 flex items-center">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          info.isActive ? 'bg-gradient-to-r from-[#0033FF] to-[#38bdf8]' : 'bg-emerald-500/60'
                        }`}
                        style={{ width: `${hourProgressPct}%` }}
                      />
                      <span
                        ref={uberProgressNodeRef}
                        style={{ left: `calc(${hourProgressPct}% - 7px)` }}
                        className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-[#0033FF] shadow-[0_0_12px_rgba(56,189,248,0.9)] transition-all duration-500"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                      <span className="truncate">{info.zoneName}</span>
                      <span className="text-emerald-400 font-bold shrink-0">
                        Saldo NFC: ${info.balance} MXN
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Vehículo y Conductor estilo Uber Driver Info */}
                <div className="anime-console-item rounded-2xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#38bdf8] shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{info.carDesc}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        Titular: {info.fullName} • {info.rfidTag}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-white text-slate-950 font-mono font-black text-xs tracking-wider shrink-0">
                    {info.plates}
                  </span>
                </div>

                {/* 3 Botones de Control Directo (Idénticos a los de la Notificación en 2º Plano) */}
                <div className="anime-console-item grid grid-cols-3 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleToggleParkingLive}
                    className={`col-span-1 py-2.5 px-2.5 rounded-xl font-sans font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
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
                    onClick={(e) => handleQuickAddBalance(50, e)}
                    className="col-span-1 py-2.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>+$50 Saldo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleAutoPayLive}
                    className={`col-span-1 py-2.5 px-2.5 rounded-xl font-sans font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border ${
                      info.autoPayEnabled
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-white/5 border-white/15 text-slate-300'
                    }`}
                  >
                    <Zap className="w-3 h-3 shrink-0" />
                    <span>{info.autoPayEnabled ? 'Autocobro ON' : 'Autocobro OFF'}</span>
                  </button>
                </div>

                {/* Pie de Consola: Activar / Probar Control desde la Barra del Teléfono */}
                <div className="anime-console-item pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      pulseInteractiveElement(e.currentTarget);
                      setAutoNotifyOnExit((prev) => !prev);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                      autoNotifyOnExit
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : 'bg-white/5 border-white/15 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{autoNotifyOnExit ? 'AL SALIR: ACTIVO' : 'AL SALIR: PAUSADO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEnableOrTestNotification}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-sans font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#0033FF]" />
                    <span>
                      {permission === 'granted'
                        ? 'Probar Noti Uber en mi Barra'
                        : 'Activar Control en mi Barra'}
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
