import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  BellRing,
  Car,
  X,
  CheckCircle2,
  Play,
  Square,
  Plus,
  Zap,
  ChevronDown,
  ChevronUp,
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
  const [dismissedPromptPill, setDismissedPromptPill] = useState(false);
  const [liveTick, setLiveTick] = useState(0);

  // Referencias para animaciones tipo Dynamic Island con Anime.js v4
  const consoleCardRef = useRef(null);
  const minimizedPillRef = useRef(null);
  const telemetryWaveRef = useRef(null);
  const minimizedWaveRef = useRef(null);
  const clockDigitsRef = useRef(null);
  const costDigitsRef = useRef(null);

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

  // Reloj en vivo segundo a segundo
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

  // Sincronizar apertura externa desde la Isla Dinámica del Header
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
        scaleX: [1, 0.55],
        scaleY: [1, 0.4],
        translateY: [0, -16],
        duration: 240,
        ease: 'inQuad',
      });
      setTimeout(() => {
        setBannerOpen(false);
        if (onCloseExternal) onCloseExternal();
      }, 220);
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

  // 1. Expansión física estilo Dynamic Island de iPhone con Anime.js v4
  useEffect(() => {
    if (!bannerOpen) return;

    if (isMinimizedPill && minimizedPillRef.current) {
      animate(minimizedPillRef.current, {
        opacity: [0, 1],
        scaleX: [1.3, 1],
        scaleY: [1.25, 1],
        duration: 600,
        ease: 'outElastic(1, .62)',
      });
    } else if (!isMinimizedPill && consoleCardRef.current) {
      animate(consoleCardRef.current, {
        opacity: [0, 1],
        scaleX: [0.52, 1],
        scaleY: [0.45, 1],
        translateY: [-14, 0],
        duration: 740,
        ease: 'outElastic(1, .64)',
      });

      const blocks = consoleCardRef.current.querySelectorAll('.anime-island-item');
      if (blocks.length > 0) {
        blocks.forEach((el) => {
          el.style.opacity = '0';
          el.style.transform = 'translateY(8px) scale(0.96)';
        });
        animate(blocks, {
          opacity: [0, 1],
          translateY: [8, 0],
          scale: [0.96, 1],
          delay: stagger(45, { start: 80 }),
          duration: 480,
          ease: 'outExpo',
        });
      }
    }
  }, [bannerOpen, isMinimizedPill]);

  // 2. Ondas de Telemetría estilo Dynamic Island con Anime.js
  useEffect(() => {
    if (!bannerOpen) return undefined;

    let waveAnim;
    const targetContainer = isMinimizedPill ? minimizedWaveRef.current : telemetryWaveRef.current;

    if (targetContainer) {
      const bars = targetContainer.querySelectorAll('.anime-telemetry-bar');
      if (bars.length > 0) {
        waveAnim = animate(bars, {
          scaleY: info.isActive ? [0.25, 1, 0.35, 0.9, 0.3] : [0.25, 0.6, 0.25],
          opacity: info.isActive ? [0.6, 1, 0.7] : [0.4, 0.8, 0.4],
          delay: stagger(55, { from: 'center' }),
          duration: info.isActive ? 720 : 1400,
          loop: true,
          alternate: true,
          ease: 'inOutSine',
        });
      }
    }

    return () => {
      if (waveAnim && typeof waveAnim.pause === 'function') waveAnim.pause();
    };
  }, [bannerOpen, isMinimizedPill, info.isActive]);

  // 3. Pulso segundo a segundo en el reloj digital con Anime.js
  useEffect(() => {
    if (!bannerOpen || isMinimizedPill || !clockDigitsRef.current) return;
    animate(clockDigitsRef.current, {
      scale: info.isActive ? [1.05, 1] : [1.01, 1],
      duration: 340,
      ease: 'outExpo',
    });
  }, [liveTick, bannerOpen, isMinimizedPill, info.isActive]);

  // 4. Rebote elástico en el cobro / saldo con Anime.js
  useEffect(() => {
    if (!bannerOpen || isMinimizedPill || !costDigitsRef.current) return;
    animate(costDigitsRef.current, {
      scale: [1.2, 1],
      duration: 580,
      ease: 'outElastic(1, .52)',
    });
  }, [info.cost, info.balance, info.isActive, bannerOpen, isMinimizedPill]);

  // 5. Sincronizar controles ejecutados desde la notificación en 2º plano
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PARQU_SW_ACTION') return;
      const { action, amount, enabled } = event.data;

      if (action === 'START_PARKING' && !latestContextRef.current.activeSession) {
        startParking('Espacio #1042 • Centro Histórico', 6.0);
        sileo.success({
          title: 'Parquímetro Iniciado',
          description: 'Tarifa activa a $6.00/hr desde la notificación.',
        });
      } else if (action === 'STOP_PARKING' && latestContextRef.current.activeSession) {
        const txn = stopParkingAndAutoCharge();
        if (txn) {
          sileo.success({
            title: 'Estancia Finalizada',
            description: `Folio ${txn.folio} • Cobrado: $${txn.amount.toFixed(2)} MXN`,
          });
        }
      } else if (action === 'ADD_BALANCE') {
        const addAmt = Number(amount) || 50;
        addBalance(addAmt);
        sileo.success({
          title: `Recarga +$${addAmt}.00 Aplicada`,
          description: 'Saldo NFC actualizado desde la notificación.',
        });
      } else if (action === 'TOGGLE_AUTOPAY') {
        const nextEnabled =
          typeof enabled === 'boolean' ? enabled : !latestContextRef.current.autoPay?.enabled;
        updateAutoPay({ enabled: nextEnabled });
        sileo.info({
          title: nextEnabled ? 'Autocobro ON' : 'Autocobro OFF',
          description: 'Actualizado desde la notificación en segundo plano.',
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, [startParking, stopParkingAndAutoCharge, addBalance, updateAutoPay]);

  // 6. Controles de Pantalla de Bloqueo (MediaSession)
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
      // ignore
    }
  }, [startParking, stopParkingAndAutoCharge, addBalance, updateAutoPay]);

  // Registrar Service Worker y solicitar permiso en el primer toque
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

  // Disparo síncrono único al salir de la app
  const triggerExitNotificationSync = useCallback((source = 'exit') => {
    if (!autoNotifyRef.current && source !== 'manual') return null;

    const now = Date.now();
    if (source !== 'manual' && now - lastNotificationSentAtRef.current < 3500) {
      return null;
    }
    lastNotificationSentAtRef.current = now;

    return dispatchBackgroundNotificationImmediate(latestContextRef.current);
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
        scale: [0.9, 1.07, 1],
        duration: 480,
        ease: 'outElastic(1, .55)',
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
        title: 'Notificación Activa en tu Barra',
        description: 'Revisa la barra de tu teléfono: puedes controlar Parqu directamente desde ahí.',
      });
    } else if (currentPerm === 'denied') {
      sileo.info({
        title: 'Permiso bloqueado en navegador',
        description: 'Habilita las notificaciones en el candado de la barra de direcciones.',
      });
    } else {
      sileo.success({
        title: 'Isla Dinámica Lista',
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
        title: 'Parquímetro Iniciado ($6.00/hr)',
        description: 'Control activo en la Isla Dinámica y al salir de la app.',
      });
    }
  };

  const handleQuickAddBalance = (amount, e) => {
    if (e?.currentTarget) pulseInteractiveElement(e.currentTarget);
    triggerHaptic();
    addBalance(amount);
    sileo.success({
      title: `Recarga +$${amount}.00 MXN`,
      description: `Nuevo saldo NFC: $${(Number(card?.balance ?? 0) + amount).toFixed(2)} MXN`,
    });
  };

  const handleToggleAutoPayLive = (e) => {
    if (e?.currentTarget) pulseInteractiveElement(e.currentTarget);
    triggerHaptic();
    const nextState = !autoPay?.enabled;
    updateAutoPay({ enabled: nextState });
    sileo.info({
      title: nextState ? 'Autocobro ON' : 'Autocobro OFF',
      description: nextState ? 'Débito automático activado.' : 'Débito automático en pausa.',
    });
  };

  return (
    <>
      {/* Píldora compacta inferior si el teléfono aún no ha otorgado permiso */}
      {permission === 'default' && !dismissedPromptPill && !bannerOpen && (
        <div className="fixed bottom-4 inset-x-0 z-50 px-3 pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-fit max-w-[92vw] rounded-full bg-[#090a0f]/95 backdrop-blur-2xl border border-white/15 pl-3 pr-2 py-1.5 shadow-[0_14px_35px_rgba(0,0,0,0.4)] flex items-center gap-2.5 text-white">
            <div className="w-6 h-6 rounded-full bg-[#0033FF] flex items-center justify-center shrink-0">
              <BellRing className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            <span className="text-[11px] font-bold truncate">
              Control al salir de la app
            </span>
            <button
              type="button"
              onClick={handleEnableOrTestNotification}
              className="px-3 py-1 rounded-full bg-[#0033FF] hover:bg-[#2250ff] active:scale-95 text-white font-sans font-bold text-[11px] cursor-pointer whitespace-nowrap"
            >
              Activar
            </button>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={() => setDismissedPromptPill(true)}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ISLA DINÁMICA DE IPHONE (COMPACTA O EXPANDIDA EN EL CENTRO SUPERIOR) */}
      {bannerOpen && (
        <div
          role="region"
          aria-label="Isla Dinámica de Control Parqu"
          className="fixed top-3 sm:top-4 inset-x-0 z-50 px-3 pointer-events-none flex justify-center"
        >
          {isMinimizedPill ? (
            /* CÁPSULA DYNAMIC ISLAND MINIMIZADA (w-fit centrada) */
            <div
              ref={minimizedPillRef}
              className="pointer-events-auto w-fit max-w-[94vw] rounded-full bg-[#07080c]/95 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.5)] px-3 py-1.5 flex items-center gap-2.5 text-white origin-top"
            >
              <button
                type="button"
                onClick={() => setIsMinimizedPill(false)}
                className="flex items-center gap-2 text-left cursor-pointer"
              >
                <div ref={minimizedWaveRef} className="flex items-center gap-[2px] h-3 px-0.5">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <span
                      key={idx}
                      className={`anime-telemetry-bar w-[2px] h-3 rounded-full origin-center ${
                        info.isActive ? 'bg-amber-400' : 'bg-[#38bdf8]'
                      }`}
                    />
                  ))}
                </div>

                <span className="font-mono font-black text-xs text-white tracking-tight">
                  {info.clockStr}
                </span>
                <span className="font-mono font-bold text-xs text-[#38bdf8]">
                  ${info.cost}
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleParkingLive}
                className={`px-2.5 py-0.5 rounded-full font-sans font-bold text-[10px] uppercase tracking-wider transition cursor-pointer ${
                  info.isActive
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-[#0033FF] hover:bg-[#1e4bff] text-white'
                }`}
              >
                {info.isActive ? 'Parar' : 'Iniciar'}
              </button>

              <button
                type="button"
                aria-label="Expandir Isla Dinámica"
                onClick={() => setIsMinimizedPill(false)}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label="Cerrar Isla Dinámica"
                onClick={handleCloseBanner}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            /* ISLA DINÁMICA DE IPHONE EXPANDIDA (Compacta max-w-[355px], bordes redondeados [34px], sin barras largas) */
            <div
              ref={consoleCardRef}
              className="w-full max-w-[355px] pointer-events-auto rounded-[34px] bg-[#07080c]/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.55)] p-3.5 text-white origin-top"
            >
              {/* Fila Superior de la Isla Dinámica: Logo + Placas + Ondas + Cerrar */}
              <div className="anime-island-item flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="./parqu-logo-white.png"
                    alt="Parqu"
                    className="h-4 w-auto object-contain shrink-0"
                  />
                  <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-slate-300 truncate">
                    {info.plates}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/10 text-emerald-400 font-bold">
                    ${info.balance}
                  </span>
                </div>

                {/* Ondas de audio/telemetría tipo Dynamic Island iPhone */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    ref={telemetryWaveRef}
                    aria-hidden="true"
                    className="flex items-center gap-[2.5px] h-4 px-1.5"
                  >
                    {Array.from({ length: 7 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`anime-telemetry-bar w-[2.5px] h-3.5 rounded-full origin-center ${
                          info.isActive ? 'bg-amber-400' : 'bg-[#38bdf8]'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMinimizedPill(true)}
                    aria-label="Contraer a píldora"
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseBanner}
                    aria-label="Cerrar Isla Dinámica"
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Fila Central de la Isla Dinámica: Reloj a la izquierda y Cobro a la derecha */}
              <div className="anime-island-item mt-2.5 rounded-[24px] bg-white/[0.06] border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    {info.isActive ? 'EN PARQUIMETRO' : 'EN ESPERA ($6/HR)'}
                  </span>
                  <span
                    ref={clockDigitsRef}
                    className="inline-block font-mono font-black text-2xl text-white tracking-tight origin-left"
                  >
                    {info.clockStr}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                    {info.isActive ? 'COBRO ACTUAL' : 'VEHICULO'}
                  </span>
                  <span
                    ref={costDigitsRef}
                    className="inline-block font-mono font-black text-xl text-[#38bdf8] origin-right"
                  >
                    {info.isActive ? `$${info.cost}` : info.plates}
                  </span>
                </div>
              </div>

              {/* Controles de 1 Toque dentro de la Isla Dinámica */}
              <div className="anime-island-item mt-2.5 grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleParkingLive}
                  className={`py-2 px-2 rounded-full font-sans font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer ${
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
                      <span>Iniciar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleQuickAddBalance(50, e)}
                  className="py-2 px-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#38bdf8]" />
                  <span>+$50 NFC</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleAutoPayLive}
                  className={`py-2 px-2 rounded-full font-sans font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer ${
                    info.autoPayEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  <Zap className="w-3 h-3 shrink-0" />
                  <span>{info.autoPayEnabled ? 'Auto ON' : 'Auto OFF'}</span>
                </button>
              </div>

              {/* Pie compacto de la Isla Dinámica: Enviar / Probar en la Barra del Teléfono */}
              <div className="anime-island-item mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 px-1">
                <button
                  type="button"
                  onClick={(e) => {
                    pulseInteractiveElement(e.currentTarget);
                    setAutoNotifyOnExit((prev) => !prev);
                  }}
                  className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2
                    className={`w-3 h-3 ${
                      autoNotifyOnExit ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{autoNotifyOnExit ? 'Al salir: ON' : 'Al salir: OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnableOrTestNotification}
                  className="px-2.5 py-1 rounded-full bg-white text-slate-950 hover:bg-slate-200 font-sans font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                >
                  <Bell className="w-3 h-3 text-[#0033FF]" />
                  <span>
                    {permission === 'granted' ? 'Enviar a mi Barra' : 'Permitir en Telefono'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
