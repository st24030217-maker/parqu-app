import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellRing, Car, Clock, User, Wifi, X, CheckCircle2, MapPin } from 'lucide-react';
import { sileo } from 'sileo';
import { useParking } from '../context/ParkingContext';
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
  const { owner, vehicle, card, autoPay, activeSession, transactions } = useParking();
  const [bannerOpen, setBannerOpen] = useState(false);
  const [permission, setPermission] = useState(() => getNotificationPermissionState());
  const [autoNotifyOnExit, setAutoNotifyOnExit] = useState(true);
  const [lastExitTime, setLastExitTime] = useState(null);
  const [dismissedPromptPill, setDismissedPromptPill] = useState(false);

  // Mantener referencia síncrona siempre actualizada para el evento visibilitychange / pagehide del teléfono
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
  }, [owner, vehicle, card, autoPay, activeSession, transactions]);

  const autoNotifyRef = useRef(autoNotifyOnExit);
  useEffect(() => {
    autoNotifyRef.current = autoNotifyOnExit;
  }, [autoNotifyOnExit]);

  const lastNotificationSentAtRef = useRef(0);

  // Sincronizar apertura externa desde el botón de campana en el Header
  useEffect(() => {
    if (isOpenExternal) {
      setBannerOpen(true);
    }
  }, [isOpenExternal]);

  const handleCloseBanner = () => {
    setBannerOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  // Registrar Service Worker al montar y solicitar permiso en el primer click/tap válido en móvil
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

  // Disparo SÍNCRONO cuando el usuario se sale de la app en su teléfono (Home, bloqueo o cambio de app)
  const triggerExitNotificationSync = useCallback((source = 'exit') => {
    if (!autoNotifyRef.current && source !== 'manual') return null;

    const now = Date.now();
    if (source !== 'manual' && now - lastNotificationSentAtRef.current < 1800) {
      return null;
    }
    lastNotificationSentAtRef.current = now;

    // 1. Disparo síncrono inmediato al sistema operativo del teléfono vía Service Worker
    const result = dispatchBackgroundNotificationImmediate(latestContextRef.current);

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
    const currentPerm = await requestParkingNotificationPermission();
    setPermission(currentPerm);

    syncParquStateToServiceWorker(latestContextRef.current);
    const { sent, payload } = await sendParkingExitNotification(latestContextRef.current);
    setBannerOpen(true);

    if (sent) {
      sileo.success({
        title: 'Notificación en 2º Plano Activa',
        description: 'Revisa la barra de notificaciones de tu teléfono. Aparecerá cada vez que salgas de Parqu.',
      });
    } else if (currentPerm === 'denied') {
      sileo.info({
        title: 'Permiso bloqueado en el navegador',
        description: 'Habilita las notificaciones en el candado de la barra de direcciones de tu teléfono.',
      });
    } else {
      sileo.success({
        title: 'Monitor en 2º Plano Listo',
        description: `${payload.fullName} • Placas ${payload.plates} • ${payload.timeLabel}`,
      });
    }
  };

  const info = buildParkingNotificationPayload({
    owner,
    vehicle,
    card,
    autoPay,
    activeSession,
    transactions,
  });

  return (
    <>
      {/* Píldora flotante de 1 toque si el teléfono aún no ha otorgado permiso de notificaciones */}
      {permission === 'default' && !dismissedPromptPill && !bannerOpen && (
        <div className="fixed bottom-4 inset-x-0 z-50 px-3 pointer-events-none flex justify-center">
          <div className="pointer-events-auto max-w-md w-full rounded-2xl bg-[#090a0d]/95 backdrop-blur-xl border border-white/15 px-3.5 py-2.5 shadow-[0_14px_35px_rgba(0,0,0,0.4)] flex items-center justify-between gap-2.5 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0033FF] flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-tight truncate">
                  Notificación en 2º plano en tu teléfono
                </p>
                <p className="text-[10px] text-slate-300 truncate">
                  Recibe qué pasa en Parqu y tu tiempo al salir de la app
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
                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta de Notificación / Estado de Parqu en Segundo Plano */}
      {bannerOpen && (
        <div
          role="region"
          aria-label="Notificación en vivo de Parquímetro"
          className="fixed top-[68px] sm:top-[76px] inset-x-0 z-50 px-3 sm:px-6 pointer-events-none flex justify-center"
        >
          <div className="w-full max-w-[460px] pointer-events-auto rounded-[24px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.18)] p-3.5 sm:p-4 text-slate-900">
            {/* Cabecera estilo Notificación Push iOS / Android */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#0033FF] text-white flex items-center justify-center shadow-sm shrink-0">
                  <BellRing className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-black text-[11px] uppercase tracking-wider text-[#0033FF]">
                      PARQU • MONITOR EN 2º PLANO
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {lastExitTime
                      ? `Notificación enviada al salir: ${lastExitTime}`
                      : 'Te avisa en tu teléfono qué pasa en Parqu al salir'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseBanner}
                aria-label="Cerrar notificación"
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cuerpo con lo que está pasando en Parqu */}
            <div className="mt-3 space-y-2.5">
              {/* Bloque Principal: Qué está pasando y Horas/Minutos de Parquímetro */}
              <div
                className={`rounded-2xl p-3 border flex items-center justify-between gap-3 ${
                  info.isActive
                    ? 'bg-amber-50/90 border-amber-200/80'
                    : 'bg-slate-50/90 border-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      info.isActive ? 'bg-amber-500 text-white' : 'bg-[#0033FF]/10 text-[#0033FF]'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500 block">
                      {info.isActive ? 'EN PARQUÍMETRO ACTIVO' : 'ESTADO ACTUAL EN PARQU'}
                    </span>
                    <p className="font-mono font-black text-sm sm:text-base text-slate-900 truncate">
                      {info.isActive
                        ? `${String(info.hours).padStart(2, '0')}h : ${String(info.minutes).padStart(2, '0')}m : ${String(info.seconds).padStart(2, '0')}s`
                        : 'Sin cobro activo (0h 00m)'}
                    </p>
                    <p className="text-[11px] text-slate-600 truncate">
                      {info.isActive
                        ? `${info.hours} hr ${info.minutes} min en curso • ${info.autoPayStatus}`
                        : `${info.autoPayStatus} • ${info.historyText}`}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    {info.isActive ? 'Cobro ($6/hr)' : 'Tarifa Oficial'}
                  </span>
                  <span className="font-mono font-black text-base sm:text-lg text-[#0033FF]">
                    {info.isActive ? `$${info.cost}` : '$6.00/hr'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold block">
                    Saldo: ${info.balance}
                  </span>
                </div>
              </div>

              {/* Info del Conductor y Vehículo */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 flex items-center gap-2 min-w-0">
                  <User className="w-3.5 h-3.5 text-[#0033FF] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono uppercase text-slate-400 block">Titular</span>
                    <span className="font-semibold text-slate-800 truncate block">{info.fullName}</span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 flex items-center gap-2 min-w-0">
                  <Car className="w-3.5 h-3.5 text-[#0033FF] shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono uppercase text-slate-400 block">
                      Vehículo • {info.plates}
                    </span>
                    <span className="font-semibold text-slate-800 truncate block">{info.carDesc}</span>
                  </div>
                </div>
              </div>

              {/* Zona y Credencial NFC */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/60 px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-[#0033FF] shrink-0" />
                  <span className="truncate font-medium">{info.zoneName}</span>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#0033FF] bg-[#0033FF]/10 px-2 py-0.5 rounded-md shrink-0">
                  <Wifi className="w-3 h-3 rotate-90" />
                  {info.rfidTag}
                </span>
              </div>

              {/* Botones de Acción: Probar / Activar Notificación del Teléfono */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setAutoNotifyOnExit((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-sans font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                    autoNotifyOnExit
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{autoNotifyOnExit ? 'Al salir: Activo' : 'Al salir: Pausado'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnableOrTestNotification}
                  className="px-3 py-1.5 rounded-xl bg-[#0033FF] hover:bg-[#1e4bff] active:scale-95 text-white font-sans font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>
                    {permission === 'granted'
                      ? 'Enviar Noti a mi Teléfono'
                      : 'Permitir Noti en mi Teléfono'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
