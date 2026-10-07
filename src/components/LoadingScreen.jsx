import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ArrowRight,
  Wifi,
  Battery,
  QrCode,
  ShieldCheck,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Car,
  Zap,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { animate, stagger } from 'animejs';
import CloudSky from './ui/cloud-sky';
import { AnimeCardSheen } from './ui/anime-card-sheen';
import { AnimeCounter } from './ui/anime-counter';
import { FlipFadeText } from './ui/flip-fade-text';
import CurvedLoop from './ui/CurvedLoop';
import { RadialGlowButton } from './ui/radial-glow-button';
import { Button as StatefulButton } from './ui/stateful-button';
import { GtaViPoster } from './ui/gta-vi-poster';
import { useParking } from '../context/ParkingContext';
import { requestParkingNotificationPermission } from '../utils/parkingNotification';

const PRESENTATION_STEPS = [
  {
    id: 0,
    badge: 'PASO 01 / 03 • BILLETERA DIGITAL',
    title: 'Recarga y gestiona tu Tarjeta Parqu',
    subtitle:
      'Registra tus placas en segundos y mantén saldo disponible sin comisiones ni efectivo.',
  },
  {
    id: 1,
    badge: 'PASO 02 / 03 • AUTOCOBRO EN VIVO',
    title: 'Paga solo el tiempo que te estaciones',
    subtitle:
      'Activa el parquímetro desde tu celular a $6.00 MXN por hora. Detén el reloj cuando te retires.',
  },
  {
    id: 2,
    badge: 'PASO 03 / 03 • TECNOLOGÍA NFC CONTACTLESS',
    title: 'Verificación NFC oficial sin contacto',
    subtitle:
      'Tu estancia queda registrada con tecnología NFC contactless y cifrado AES-256 ante supervisores viales.',
  },
];

// Subcomponente aislado solo para el texto del cronómetro cada segundo (60 FPS garantizados)
const LiveTimerDisplay = memo(() => {
  const [seconds, setSeconds] = useState(865); // 14:25 inicial

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTimer = `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const liveCost = ((seconds / 3600) * 6).toFixed(2);

  return (
    <div className="mt-2 text-center py-2.5 px-3 rounded-2xl bg-black/25">
      <div className="text-[9px] font-mono uppercase tracking-widest text-[#D4D6E6]/80">
        Cronómetro Activo al Segundo
      </div>
      <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
        {formattedTimer}
      </div>
      <div className="mt-0.5 text-[11px] font-mono font-bold text-emerald-300">
        Cobro exacto: ${liveCost} MXN
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════
// PRESENTACIÓN INTERACTIVA DE LA APLICACIÓN EN ABANICO DE 3 TELÉFONOS
// Los 3 teléfonos rotan suavemente al frente mostrando paso a paso cómo
// funciona Parqu como una presentación en vivo de la app.
// ══════════════════════════════════════════════════════════════════════════
const AppPresentationMockups = memo(({ plates, balance, onEnter }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  const formattedBalance = Number(balance ?? 250).toFixed(2);
  const activePlates = plates || 'ABC-123-A';

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 640);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Rotación continua y 100% automática cada 2.5 segundos sin detenerse con el mouse
  useEffect(() => {
    const rotation = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(rotation);
  }, []);

  // Calcula la posición dinámica en el abanico (izquierda, centro-frente, derecha) adaptada a celular y escritorio
  const getPhonePositionStyle = (phoneIndex) => {
    const diff = (phoneIndex - activeIndex + 3) % 3;
    const offsetX = isMobileView ? 68 : 122;
    const offsetY = isMobileView ? 12 : 26;
    const activeScale = isMobileView ? 0.65 : 1.02;
    const sideScale = isMobileView ? 0.55 : 0.85;

    // diff === 0 -> Teléfono activo al frente en el centro
    if (diff === 0) {
      return {
        transform: `translate3d(0px, -4px, 0px) rotate(0deg) scale(${activeScale})`,
        zIndex: 30,
        opacity: 1,
        filter: 'brightness(1)',
      };
    }
    // diff === 1 -> Teléfono a la derecha en el abanico
    if (diff === 1) {
      return {
        transform: `translate3d(${offsetX}px, ${offsetY}px, 0px) rotate(10deg) scale(${sideScale})`,
        zIndex: 20,
        opacity: 0.9,
        filter: 'brightness(0.9)',
      };
    }
    // diff === 2 -> Teléfono a la izquierda en el abanico
    return {
      transform: `translate3d(-${offsetX}px, ${offsetY}px, 0px) rotate(-10deg) scale(${sideScale})`,
      zIndex: 20,
      opacity: 0.9,
      filter: 'brightness(0.9)',
    };
  };

  const handleSelectPhone = (index) => {
    if (index === activeIndex) {
      setActiveIndex((prev) => (prev + 1) % 3);
    } else {
      setActiveIndex(index);
    }
  };

  const currentStep = PRESENTATION_STEPS[activeIndex];

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[580px] flex flex-col items-center select-none mx-auto">
      <style>{`
        @keyframes parquFanFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      {/* ── ABANICO INTERACTIVO DE LOS 3 TELÉFONOS CON MOVIMIENTO CONTINUO ── */}
      <div
        style={{ animation: 'parquFanFloat 4s ease-in-out infinite' }}
        className="relative w-full h-[295px] sm:h-[510px] flex items-center justify-center"
      >
        {/* Resplandor atmosférico detrás de la presentación */}
        <div
          className="absolute inset-0 rounded-full blur-3xl pointer-events-none opacity-70"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(0, 51, 255, 0.5) 0%, rgba(128, 125, 254, 0.25) 48%, transparent 72%)',
          }}
        />

        {/* ════════════════════════════════════════════════════════════
            PANTALLA 1 (INDEX 0): BILLETERA DIGITAL & TARJETA PARQU PASS
        ════════════════════════════════════════════════════════════ */}
        <div
          onClick={() => handleSelectPhone(0)}
          style={{
            ...getPhonePositionStyle(0),
            transition: 'all 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform, opacity',
          }}
          className="absolute w-[250px] sm:w-[276px] h-[455px] sm:h-[495px] rounded-[42px] bg-[#0b0d14] p-[7px] shadow-[0_28px_70px_rgba(0,0,0,0.75)] cursor-pointer border-0"
        >
          {/* Botones físicos laterales */}
          <div className="absolute -left-[2.5px] top-24 w-[2.5px] h-7 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
          <div className="absolute -left-[2.5px] top-36 w-[2.5px] h-11 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
          <div className="absolute -right-[2.5px] top-32 w-[2.5px] h-14 bg-[#807DFE]/60 rounded-r-full pointer-events-none" />

          <div className="w-full h-full rounded-[35px] bg-[#f8fafc] text-slate-900 overflow-hidden flex flex-col justify-between p-3.5">
            {/* Barra de estado iOS */}
            <div className="flex items-center justify-between px-1.5 pt-0.5 text-[10px] font-mono font-bold text-slate-900">
              <span>9:41</span>
              <div className="w-20 h-[18px] rounded-full bg-black flex items-center justify-center">
                <span className="text-[8px] font-mono text-[#807DFE]">PASO 1 / 3</span>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Encabezado de Presentación */}
            <div className="mt-1.5 flex items-center justify-between px-0.5">
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#0033FF] font-bold">
                  01 • Tu Billetera
                </span>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  Tarjeta Digital Parqu
                </h4>
              </div>
              <div className="flex items-center justify-center bg-transparent">
                <img src="./parqu-logo-black.png" alt="Parqu" className="h-5 w-auto object-contain bg-transparent" />
              </div>
            </div>

            {/* Tarjeta Virtual Parqu (3 Diseños: White, Blue, Red) */}
            <div className="relative rounded-2xl overflow-hidden text-white text-left shadow-lg aspect-[860/522]">
              <img
                src="./cards/parqu-card-blue.jpg"
                alt="Tarjeta Parqu"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-[#01033E]/80 backdrop-blur-md flex items-center justify-between">
                <div>
                  <div className="text-[8px] text-[#D4D6E6] font-mono uppercase">
                    PLACA: <strong className="text-white">{activePlates}</strong>
                  </div>
                  <div className="text-xs font-black font-mono text-white">
                    ${formattedBalance} MXN
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#f8f7f2] border border-white/60" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0e8ef2] border border-white ring-1 ring-white" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#f43f2e] border border-white/60" />
                </div>
              </div>
            </div>

            {/* Recarga Express */}
            <div className="bg-white rounded-2xl p-3 shadow-sm text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-800">Recarga Instantánea</span>
                <span className="text-[9px] font-mono text-emerald-600 font-bold">1 TOQUE</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="py-1.5 rounded-lg bg-slate-100 text-center text-[10px] font-mono font-bold text-slate-800">
                  +$100
                </div>
                <div className="py-1.5 rounded-lg bg-[#0033FF] text-center text-[10px] font-mono font-bold text-white shadow-sm">
                  +$200
                </div>
                <div className="py-1.5 rounded-lg bg-slate-100 text-center text-[10px] font-mono font-bold text-slate-800">
                  +$500
                </div>
              </div>
            </div>

            {/* Barra de Navegación App simulada */}
            <div className="pt-1">
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 text-[9px] font-bold">
                <div className="py-1.5 rounded-xl bg-[#01033E] text-white text-center">
                  1. Tarjeta
                </div>
                <div className="py-1.5 rounded-xl text-slate-600 text-center">
                  2. Reloj
                </div>
                <div className="py-1.5 rounded-xl text-slate-600 text-center">
                  3. Pase NFC
                </div>
              </div>
              <div className="w-20 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            PANTALLA 2 (INDEX 1): AUTOCOBRO EN VIVO SEGUNDO A SEGUNDO
        ════════════════════════════════════════════════════════════ */}
        <div
          onClick={() => handleSelectPhone(1)}
          style={{
            ...getPhonePositionStyle(1),
            transition: 'all 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform, opacity',
          }}
          className="absolute w-[250px] sm:w-[276px] h-[455px] sm:h-[495px] rounded-[42px] bg-[#0b0d14] p-[7px] shadow-[0_28px_70px_rgba(0,0,0,0.75)] cursor-pointer border-0"
        >
          {/* Botones físicos laterales */}
          <div className="absolute -left-[2.5px] top-24 w-[2.5px] h-7 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
          <div className="absolute -left-[2.5px] top-36 w-[2.5px] h-11 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
          <div className="absolute -right-[2.5px] top-32 w-[2.5px] h-14 bg-[#807DFE]/60 rounded-r-full pointer-events-none" />

          <div className="w-full h-full rounded-[35px] bg-[#f8fafc] text-slate-900 overflow-hidden flex flex-col justify-between p-3.5">
            {/* Barra de Estado iOS + Dynamic Island */}
            <div className="flex items-center justify-between px-1.5 pt-0.5">
              <span className="text-[10px] font-bold font-mono text-slate-900">
                9:41
              </span>
              <div className="w-24 h-[19px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-mono font-bold text-white">
                  PASO 2 / 3
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-900">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Encabezado de Presentación */}
            <div className="mt-1.5 flex items-center justify-between px-0.5">
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[#0033FF] font-bold">
                  02 • Parquímetro Digital
                </span>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  Autocobro en Vivo
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[9px] font-mono font-bold">
                ● ACTIVO
              </span>
            </div>

            {/* Bloque Principal del Cronómetro por Segundo */}
            <div
              className="rounded-3xl p-3.5 text-white text-left shadow-lg"
              style={{
                background: 'linear-gradient(160deg, #01033E 0%, #0033FF 100%)',
              }}
            >
              <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#D4D6E6]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#807DFE]" />
                  Tarifa Oficial
                </span>
                <span className="font-bold text-white">$6.00 / hr</span>
              </div>

              <LiveTimerDisplay />

              <div className="mt-2 flex items-center justify-between text-[9px] font-mono">
                <span className="text-[#D4D6E6]">
                  PLACA: <strong className="text-white">{activePlates}</strong>
                </span>
                <span className="text-emerald-300 font-bold">NFC ACTIVO</span>
              </div>
            </div>

            {/* Detalle de Ubicación y Ahorro */}
            <div className="bg-white rounded-2xl p-2.5 shadow-sm space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0033FF]" />
                  <span className="text-[10px] font-bold text-slate-800">Polígono Centro A-12</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-600">GPS OK</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-bold text-slate-800">Tarifa $6.00 MXN / hr</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-500">AUTO</span>
              </div>
            </div>

            {/* Barra de Navegación App simulada */}
            <div className="pt-1">
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 text-[9px] font-bold">
                <div className="py-1.5 rounded-xl text-slate-600 text-center">
                  1. Tarjeta
                </div>
                <div className="py-1.5 rounded-xl bg-[#0033FF] text-white text-center shadow-sm">
                  2. Reloj
                </div>
                <div className="py-1.5 rounded-xl text-slate-600 text-center">
                  3. Pase NFC
                </div>
              </div>
              <div className="w-20 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            PANTALLA 3 (INDEX 2): TECNOLOGÍA NFC CONTACTLESS & VERIFICACIÓN VIAL
        ════════════════════════════════════════════════════════════ */}
        <div
          onClick={() => handleSelectPhone(2)}
          style={{
            ...getPhonePositionStyle(2),
            transition: 'all 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform, opacity',
          }}
          className="absolute w-[250px] sm:w-[276px] h-[455px] sm:h-[495px] rounded-[42px] bg-[#0b0d14] p-[7px] shadow-[0_28px_70px_rgba(0,0,0,0.75)] cursor-pointer border-0"
        >
          {/* Botones físicos laterales */}
          <div className="absolute -left-[2.5px] top-24 w-[2.5px] h-7 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
          <div className="absolute -left-[2.5px] top-36 w-[2.5px] h-11 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
          <div className="absolute -right-[2.5px] top-32 w-[2.5px] h-14 bg-[#807DFE]/60 rounded-r-full pointer-events-none" />

          <div className="w-full h-full rounded-[35px] bg-[#f8fafc] text-slate-900 overflow-hidden flex flex-col justify-between p-3.5">
            {/* Barra de estado iOS */}
            <div className="flex items-center justify-between px-1.5 pt-0.5 text-[10px] font-mono font-bold text-slate-900">
              <span>9:41</span>
              <div className="w-20 h-[18px] rounded-full bg-black flex items-center justify-center">
                <span className="text-[8px] font-mono text-emerald-400">PASO 3 / 3</span>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Encabezado NFC */}
            <div className="mt-1.5 flex items-center justify-between px-0.5">
              <div className="text-left">
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
                  03 • Tecnología NFC
                </span>
                <h4 className="text-sm font-black text-slate-900 tracking-tight">
                  Pase NFC Contactless
                </h4>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Tarjeta NFC Contactless con Ondas Activas */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center text-center">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#01033E] to-[#0033FF] flex items-center justify-center shadow-md">
                <span className="absolute inset-0 rounded-full bg-[#0033FF]/30 animate-ping" />
                <span className="absolute -inset-1.5 rounded-full border-2 border-[#807DFE]/40" />
                <div className="relative z-10 flex flex-col items-center justify-center text-white">
                  <Wifi className="w-9 h-9 rotate-90 text-white" />
                  <span className="text-[9px] font-mono font-black tracking-widest mt-0.5">
                    NFC
                  </span>
                </div>
              </div>
              <div className="mt-2.5 text-xs font-black font-mono text-slate-900 tracking-wider">
                {activePlates}
              </div>
              <span className="mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold">
                LECTURA NFC SIN CONTACTO
              </span>
            </div>

            {/* Estado de Verificación NFC */}
            <div className="bg-white rounded-2xl p-2.5 shadow-sm text-left space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Protocolo</span>
                <span className="font-mono font-bold text-slate-900">NFC AES-256</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Tarifa Vigente</span>
                <span className="font-mono font-bold text-emerald-600">$6.00 / hr</span>
              </div>
            </div>

            {/* Barra de Navegación App simulada */}
            <div className="pt-1">
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 text-[9px] font-bold">
                <div className="py-1.5 rounded-xl text-slate-600 text-center">
                  1. Tarjeta
                </div>
                <div className="py-1.5 rounded-xl text-slate-600 text-center">
                  2. Reloj
                </div>
                <div className="py-1.5 rounded-xl bg-emerald-600 text-white text-center shadow-sm">
                  3. Pase NFC
                </div>
              </div>
              <div className="w-20 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* ── TARJETA INFERIOR DE CONTROL DE LA PRESENTACIÓN DE LA APP (100% TRANSPARENTE) ── */}
      <div className="relative z-30 mt-0.5 sm:mt-2 w-full max-w-[330px] sm:max-w-[440px] rounded-2xl sm:rounded-3xl bg-transparent border-0 shadow-none px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-center">
        <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
          <button
            type="button"
            aria-label="Pantalla anterior de la presentación"
            onClick={() => setActiveIndex((prev) => (prev + 2) % 3)}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-200/80 hover:bg-[#0033FF] flex items-center justify-center text-slate-700 hover:text-white transition cursor-pointer border-0"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-[#0033FF] font-bold">
            {currentStep.badge}
          </span>

          <button
            type="button"
            aria-label="Siguiente pantalla de la presentación"
            onClick={() => setActiveIndex((prev) => (prev + 1) % 3)}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-200/80 hover:bg-[#0033FF] flex items-center justify-center text-slate-700 hover:text-white transition cursor-pointer border-0"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <h3 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight">
          {currentStep.title}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-snug sm:leading-relaxed">
          {currentStep.subtitle}
        </p>

        {/* Indicadores de diapositiva de la presentación */}
        <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Ver paso ${idx + 1} de la presentación`}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer border-0 ${
                activeIndex === idx
                  ? 'w-6 sm:w-7 bg-[#0033FF]'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export const LoadingScreen = ({ onComplete }) => {
  const {
    vehicle,
    owner,
    card,
    updateOwner,
    updateVehicle,
    performCloudBackup,
    restoreFromCloudBackup,
  } = useParking();

  // Fase 1: Pantalla de carga principal al abrir la app (animación fluida sobre el logo sin barra de carga)
  const [isBootLoading, setIsBootLoading] = useState(true);

  // Fase 2 y 3: Pantalla inicial con botón "Empecemos" -> Login / Registro compacto animado -> Entrar al sistema
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: owner?.fullName || '',
    email: owner?.email || '',
    plates: vehicle?.plates || 'XYZ-7842',
    password: '',
  });
  const [authError, setAuthError] = useState('');

  const [isExiting, setIsExiting] = useState(false);
  const hasExitedRef = useRef(false);
  const authCardRef = useRef(null);

  // Transición limpia y sin re-renders intermedios al terminar la animación fluida del logo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBootLoading(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Animaciones Anime.js en el Login (Entrada elástica, Stagger de campos y Ondas en vivo)
  useEffect(() => {
    if (!showAuthModal || !authCardRef.current) return undefined;

    animate(authCardRef.current, {
      opacity: [0, 1],
      translateY: [28, 0],
      scale: [0.92, 1],
      duration: 720,
      ease: 'outElastic(1, .65)',
    });

    const items = authCardRef.current.querySelectorAll('.login-stagger-item');
    if (items.length > 0) {
      animate(items, {
        opacity: [0, 1],
        translateY: [16, 0],
        delay: stagger(60, { start: 90 }),
        duration: 520,
        ease: 'outCubic',
      });
    }

    const waveBars = authCardRef.current.querySelectorAll('.login-wave-bar');
    let waveAnim = null;
    if (waveBars.length > 0) {
      waveAnim = animate(waveBars, {
        scaleY: [0.35, 1, 0.4],
        opacity: [0.55, 1, 0.55],
        delay: stagger(90),
        duration: 950,
        loop: true,
        ease: 'inOutSine',
      });
    }

    return () => {
      if (waveAnim && typeof waveAnim.pause === 'function') {
        waveAnim.pause();
      }
    };
  }, [showAuthModal, authMode]);

  // Ejecuta la animación de salida suave hacia el sistema principal después de iniciar sesión o registrarse
  const handleTriggerExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    requestParkingNotificationPermission().catch(() => {});
    document.body.dataset.loadingActive = 'false';
    setIsExiting(true);

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 650);
  }, [onComplete]);

  // Abrir el login pequeño al presionar "Empecemos"
  const handleOpenAuthModal = useCallback(() => {
    setAuthError('');
    setShowAuthModal(true);
  }, []);

  // Procesar inicio de sesión o registro con la animación StatefulButton (Loader -> Checkmark -> Entrar al sistema)
  const handleAuthSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setAuthError('');

    const cleanEmail = (formData.email || '').trim();
    const cleanPassword = (formData.password || '').trim();
    const cleanName = (formData.fullName || '').trim();
    const cleanPlates = (formData.plates || '').trim().toUpperCase();

    if (!cleanEmail || !cleanPassword) {
      setAuthError('Por favor ingresa tu correo y contraseña para continuar.');
      return false;
    }

    if (authMode === 'register' && !cleanName) {
      setAuthError('Por favor ingresa tu nombre completo para registrarte.');
      return false;
    }

    // Pausa breve para mostrar el estado de carga (loader) del StatefulButton
    await new Promise((resolve) => setTimeout(resolve, 650));

    if (authMode === 'login' && typeof restoreFromCloudBackup === 'function') {
      const restored = await restoreFromCloudBackup(cleanEmail);
      if (!restored && typeof updateOwner === 'function') {
        updateOwner({
          fullName: owner?.fullName || cleanEmail.split('@')[0] || 'Usuario Parqu',
          email: cleanEmail,
        });
      }
    } else {
      if (typeof updateOwner === 'function') {
        updateOwner({
          fullName: cleanName || owner?.fullName || 'Usuario Parqu',
          email: cleanEmail,
        });
      }
      if (cleanPlates && typeof updateVehicle === 'function') {
        updateVehicle({ plates: cleanPlates });
      }
      if (typeof performCloudBackup === 'function') {
        performCloudBackup().catch(() => {});
      }
    }

    // Mostrar el check de éxito del StatefulButton antes de entrar al sistema
    setTimeout(() => {
      setShowAuthModal(false);
      handleTriggerExit();
    }, 550);

    return true;
  };

  // Cerrar el modal de login con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showAuthModal) {
        setShowAuthModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAuthModal]);

  // Bloqueo de scroll mientras se visualiza la pantalla de carga / bienvenida
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.dataset.loadingActive = 'true';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.dataset.loadingActive = 'false';
    };
  }, []);

  return (
    <div
      style={{
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.65s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.45s ease',
        willChange: 'transform, opacity',
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-50 overflow-y-auto overflow-x-hidden select-none pointer-events-auto bg-white font-sans flex items-center justify-center px-3 sm:px-10 lg:px-16 py-3 sm:py-0"
    >
      {/* 
        ══════════════════════════════════════════════════════════════
        FASE 1: PANTALLA DE CARGA PRINCIPAL (@aceternity/gta-vi-poster SOBRE EL LOGO DE PARQU)
        Animación fluida a 60fps sobre el logo, sin barra de carga
        ══════════════════════════════════════════════════════════════
      */}
      {isBootLoading ? (
        <GtaViPoster
          duration={2.2}
          cameraScale={1.16}
          fit={0.85}
          depth={1}
          logoBlur={4}
          background="#ffffff"
          logoSrc="./parqu-logo-black.png"
          logoAlt="Parqu Logo"
          showReplay={false}
          className="fixed inset-0 z-30 w-screen h-[100dvh]"
        />
      ) : (
        /* 
          ══════════════════════════════════════════════════════════════
          FASE 2: PANTALLA INICIAL DE BIENVENIDA EN FONDO BLANCO CON BOTÓN "EMPECEMOS"
          ══════════════════════════════════════════════════════════════
        */
        <div className="relative z-10 w-full max-w-[1280px] mx-auto my-auto py-2 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-8 lg:gap-6 items-center animate-in fade-in duration-500">
          
          {/* COLUMNA IZQUIERDA: LOGO DE PARQU 100% TRANSPARENTE, SLOGAN Y ÚNICAMENTE EL BOTÓN "EMPECEMOS" */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-2 sm:space-y-7">
            {/* Logotipo Oficial Parqu 100% Transparente para Fondo Blanco */}
            <div className="relative flex items-center justify-center bg-transparent">
              <img
                src="./parqu-logo-black.png"
                alt="Parqu Logo"
                className="h-12 sm:h-28 md:h-32 w-auto object-contain bg-transparent relative z-10"
              />
            </div>

            {/* Slogan */}
            <p className="font-sans text-xs sm:text-lg md:text-xl text-slate-600 font-normal tracking-normal leading-snug sm:leading-relaxed max-w-[280px] sm:max-w-md">
              Sistema Inteligente de <span className="text-slate-900 font-bold">Parquímetros</span> y Autocobro Digital
            </p>

            {/* Único Botón "Empecemos" con RadialGlowButton */}
            <div className="pt-0.5 sm:pt-1">
              <RadialGlowButton
                type="button"
                onClick={handleOpenAuthModal}
              >
                <span>Empecemos</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white inline transition-transform duration-300 group-hover:translate-x-1.5" />
              </RadialGlowButton>
            </div>
          </div>

          {/* COLUMNA DERECHA: PRESENTACIÓN INTERACTIVA EN 3 TELÉFONOS */}
          <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
            <AppPresentationMockups
              plates={vehicle?.plates}
              balance={card?.balance}
              onEnter={handleOpenAuthModal}
            />
          </div>

        </div>
      )}

      {/* 
        ══════════════════════════════════════════════════════════════
        FASE 3: PEQUEÑO LOGIN / REGISTRO ADAPTADO A CELULAR Y ESCRITORIO
        ══════════════════════════════════════════════════════════════
      */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="parqu-auth-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <AnimeCardSheen className="w-full max-w-[360px] sm:max-w-[380px] my-auto">
            <div
              ref={authCardRef}
              className="relative w-full max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-3xl bg-[#070B2E]/95 border border-white/15 p-4 sm:p-6 text-white shadow-[0_28px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
            >
              {/* Botón cerrar */}
              <button
                type="button"
                aria-label="Cerrar ventana de acceso"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#D4D6E6] hover:text-white transition cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Encabezado de Bienvenida con Logo 100% Transparente (sin recuadro ni bordes) */}
              <div className="relative z-10 text-center mb-1 bg-transparent border-0 shadow-none">
                <div className="flex items-center justify-center mb-1.5 sm:mb-2 bg-transparent border-0 shadow-none">
                  <img
                    src="./parqu-logo-white.png"
                    alt="Parqu"
                    className="h-8 sm:h-11 w-auto object-contain bg-transparent border-0 shadow-none"
                  />
                </div>

                <h2
                  id="parqu-auth-title"
                  className="text-base sm:text-xl font-black tracking-tight text-white bg-transparent"
                >
                  {authMode === 'login' ? 'Bienvenido de vuelta' : 'Bienvenido a Parqu'}
                </h2>
              </div>

              {/* Animación CurvedLoop-JS-CSS 100% transparente y de lado a lado completo en celular y escritorio */}
              <div className="relative z-10 -mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] my-1 sm:my-1.5 bg-transparent border-0 shadow-none overflow-visible">
                <CurvedLoop
                  marqueeText={
                    authMode === 'login'
                      ? 'ACCESO DIGITAL NFC ✦ AUTOCOBRO EN VIVO ✦ SIN FILAS NI MONEDAS ✦'
                      : 'CREA TU CUENTA NFC ✦ REGISTRO EN SEGUNDOS ✦ PARQU METROPOLITANO ✦'
                  }
                  speed={1.2}
                  curveAmount={110}
                  direction="left"
                  interactive={true}
                  className="fill-white font-mono"
                />
              </div>

              {/* Selector Iniciar Sesión / Registrarse */}
              <div className="login-stagger-item relative z-10 grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/10 mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border-0 ${
                    authMode === 'login'
                      ? 'bg-[#0033FF] text-white shadow-md'
                      : 'bg-transparent text-[#D4D6E6] hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border-0 ${
                    authMode === 'register'
                      ? 'bg-[#0033FF] text-white shadow-md'
                      : 'bg-transparent text-[#D4D6E6] hover:text-white'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Formulario compacto de Login / Registro con Stagger Anime.js */}
              <form onSubmit={handleAuthSubmit} className="relative z-10 space-y-2.5 text-left">
                {authMode === 'register' && (
                  <div className="login-stagger-item">
                    <label className="block text-[11px] font-bold text-[#D4D6E6] mb-1">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder="Ej. Sebastián Salinas"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE] transition"
                      />
                    </div>
                  </div>
                )}

                <div className="login-stagger-item">
                  <label className="block text-[11px] font-bold text-[#D4D6E6] mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="usuario@correo.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE] transition"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div className="login-stagger-item">
                    <label className="block text-[11px] font-bold text-[#D4D6E6] mb-1">
                      Placas de tu vehículo
                    </label>
                    <div className="relative">
                      <Car className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.plates}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            plates: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="XYZ-7842"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono uppercase text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE] transition"
                      />
                    </div>
                  </div>
                )}

                <div className="login-stagger-item">
                  <label className="block text-[11px] font-bold text-[#D4D6E6] mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4D6E6] hover:text-white bg-transparent border-0 p-0 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-[11px] text-rose-300 font-medium text-center bg-rose-500/15 py-1.5 px-2.5 rounded-xl">
                    {authError}
                  </p>
                )}

                <div className="login-stagger-item pt-1.5 flex justify-center">
                  <StatefulButton
                    type="button"
                    onClick={handleAuthSubmit}
                    className="w-full py-3 rounded-full text-xs sm:text-sm font-bold"
                  >
                    <span>
                      {authMode === 'login' ? 'Iniciar Sesión y Entrar' : 'Registrarse y Entrar'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </StatefulButton>
                </div>

                {/* Pie del Login con Logo SSS.Solutions 100% Transparente */}
                <div className="login-stagger-item pt-2 flex items-center justify-center gap-2 bg-transparent border-0">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4D6E6]/65">
                    Powered by
                  </span>
                  <img
                    src="/sss-solutions-logo.png"
                    alt="SSS.Solutions"
                    className="h-4 w-auto object-contain bg-transparent border-0 shadow-none opacity-90"
                  />
                </div>
              </form>
            </div>
          </AnimeCardSheen>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
