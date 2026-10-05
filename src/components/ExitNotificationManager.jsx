import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellRing, Car, Clock, User, Wifi, X, CheckCircle2, MapPin, Sparkles } from 'lucide-react';
import { sileo } from 'sileo';
import { useParking } from '../context/ParkingContext';
import {
  registerParquServiceWorker,
  getNotificationPermissionState,
  requestParkingNotificationPermission,
  buildParkingNotificationPayload,
  sendParkingExitNotification,
} from '../utils/parkingNotification';

export const ExitNotificationManager = ({ isOpenExternal, onCloseExternal }) => {
  const { owner, vehicle, card, activeSession, transactions } = useParking();
  const [bannerOpen, setBannerOpen] = useState(false);
  const [permission, setPermission] = useState(() => getNotificationPermissionState());
  const [autoNotifyOnExit, setAutoNotifyOnExit] = useState(true);
  const [lastExitTime, setLastExitTime] = useState(null);

  // Refs actualizados para que los listeners de visibilitychange/pagehide/blur siempre lean el último estado
  const latestContextRef = useRef({ owner, vehicle, card, activeSession, transactions });
  useEffect(() => {
    latestContextRef.current = { owner, vehicle, card, activeSession, transactions };
  }, [owner, vehicle, card, activeSession, transactions]);

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

  // Registrar Service Worker y solicitar permiso en el primer toque del usuario
  useEffect(() => {
    registerParquServiceWorker();
    setPermission(getNotificationPermissionState());

    const unlockNotificationsOnFirstTap = async () => {
      if (getNotificationPermissionState() === 'default') {
        const res = await requestParkingNotificationPermission();
        setPermission(res);
      }
    };

    window.addEventListener('pointerdown', unlockNotificationsOnFirstTap, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', unlockNotificationsOnFirstTap);
  }, []);

  // Disparar notificación cuando el usuario sale de la app / cambia de pestaña / bloquea pantalla
  const triggerExitNotification = useCallback(async (source = 'exit') => {
    if (!autoNotifyRef.current && source !== 'manual') return;

    const now = Date.now();
    // Evitar duplicados si visibilitychange y pagehide/blur se disparan al mismo milisegundo
    if (source !== 'manual' && now - lastNotificationSentAtRef.current < 2500) {
      return;
    }
    lastNotificationSentAtRef.current = now;

    setLastExitTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setBannerOpen(true);

    const result = await sendParkingExitNotification(latestContextRef.current);
    return result;
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerExitNotification('visibility-hidden');
      } else if (document.visibilityState === 'visible') {
        // Al regresar a la app, mostramos el resumen actualizado si salió hace poco
        if (autoNotifyRef.current) {
          setBannerOpen(true);
        }
      }
    };

    const handlePageHide = () => {
      triggerExitNotification('pagehide');
    };

    const handleWindowBlur = () => {
      // Cuando cambia de ventana o sale de la app en móvil/escritorio
      triggerExitNotification('blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [triggerExitNotification]);

  const handleEnableOrTestNotification = async () => {
    const currentPerm = await requestParkingNotificationPermission();
    setPermission(currentPerm);

    const { sent, payload } = await sendParkingExitNotification(latestContextRef.current);
    setBannerOpen(true);

    if (sent) {
      sileo.success({
        title: 'Notificación Enviada al Dispositivo',
        description: `${payload.title} — Ya aparecerá automáticamente cada vez que salgas de la app.`,
      });
    } else if (currentPerm === 'denied') {
      sileo.info({
        title: 'Notificación en Pantalla Activa',
        description: 'Tu navegador tiene bloqueados los avisos del sistema, pero verás esta tarjeta resumen al salir/volver.',
      });
    } else {
      sileo.success({
        title: 'Resumen de Parquímetro Listo',
        description: `${payload.fullName} • Placas ${payload.plates} • ${payload.timeLabel}`,
      });
    }
  };

  const info = buildParkingNotificationPayload({
    owner,
    vehicle,
    card,
    activeSession,
    transactions,
  });

  if (!bannerOpen) return null;

  return (
    <div
      role="region"
      aria-label="Notificación en vivo de Parquímetro"
      className="fixed top-[72px] sm:top-[78px] inset-x-0 z-50 px-3 sm:px-6 pointer-events-none flex justify-center"
    >
      <div className="w-full max-w-[460px] pointer-events-auto rounded-[24px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.18)] p-3.5 sm:p-4 text-slate-900 animate-in fade-in slide-in-from-top-3 duration-300">
        {/* Cabecera estilo Notificación Push iOS / Android */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#0033FF] text-white flex items-center justify-center shadow-sm shrink-0">
              <BellRing className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-black text-[11px] uppercase tracking-wider text-[#0033FF]">
                  PARQU • NOTIFICACIÓN EN SEGUNDO PLANO
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {lastExitTime ? `Actualizado al salir: ${lastExitTime}` : 'Sincronizado en tiempo real • Tarifa $6.00/hr'}
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

        {/* Cuerpo con la info del usuario y minutos/horas de parquímetro */}
        <div className="mt-3 space-y-2.5">
          {/* Bloque Principal: Horas y Minutos de Parquímetro */}
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
                  {info.isActive ? 'TIEMPO EN PARQUÍMETRO (EN VIVO)' : 'TIEMPO DE PARQUÍMETRO'}
                </span>
                <p className="font-mono font-black text-sm sm:text-base text-slate-900 truncate">
                  {info.isActive
                    ? `${String(info.hours).padStart(2, '0')}h : ${String(info.minutes).padStart(2, '0')}m : ${String(info.seconds).padStart(2, '0')}s`
                    : '00h : 00m : 00s'}
                </p>
                <p className="text-[11px] text-slate-600 truncate">
                  {info.isActive
                    ? `${info.hours} hr ${info.minutes} min activos`
                    : info.historyText}
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

          {/* Botones de Acción: Probar / Activar Notificación del Sistema al Salir */}
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
              <span>{autoNotifyOnExit ? 'Aviso al salir: Activo' : 'Aviso al salir: Pausado'}</span>
            </button>

            <button
              type="button"
              onClick={handleEnableOrTestNotification}
              className="px-3 py-1.5 rounded-xl bg-[#0033FF] hover:bg-[#1e4bff] active:scale-95 text-white font-sans font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {permission === 'granted' ? 'Probar Notificación' : 'Activar en mi Celular'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
