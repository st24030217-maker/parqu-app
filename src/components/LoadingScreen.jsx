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
} from 'lucide-react';
import CloudSky from './ui/cloud-sky';
import { useParking } from '../context/ParkingContext';

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

  const formattedBalance = Number(balance ?? 250).toFixed(2);
  const activePlates = plates || 'ABC-123-A';

  // Rotación continua y 100% automática cada 2.5 segundos sin detenerse con el mouse
  useEffect(() => {
    const rotation = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(rotation);
  }, []);

  // Calcula la posición dinámica en el abanico (izquierda, centro-frente, derecha) para cada teléfono
  const getPhonePositionStyle = (phoneIndex) => {
    const diff = (phoneIndex - activeIndex + 3) % 3;
    // diff === 0 -> Teléfono activo al frente en el centro
    if (diff === 0) {
      return {
        transform: 'translate3d(0px, -6px, 0px) rotate(0deg) scale(1.02)',
        zIndex: 30,
        opacity: 1,
        filter: 'brightness(1)',
      };
    }
    // diff === 1 -> Teléfono a la derecha en el abanico
    if (diff === 1) {
      return {
        transform: 'translate3d(122px, 26px, 0px) rotate(11deg) scale(0.85)',
        zIndex: 20,
        opacity: 0.9,
        filter: 'brightness(0.9)',
      };
    }
    // diff === 2 -> Teléfono a la izquierda en el abanico
    return {
      transform: 'translate3d(-122px, 26px, 0px) rotate(-11deg) scale(0.85)',
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
    <div className="relative w-full max-w-[580px] flex flex-col items-center select-none">
      <style>{`
        @keyframes parquFanFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      {/* ── ABANICO INTERACTIVO DE LOS 3 TELÉFONOS CON MOVIMIENTO CONTINUO ── */}
      <div
        style={{ animation: 'parquFanFloat 4s ease-in-out infinite' }}
        className="relative w-full h-[465px] sm:h-[510px] flex items-center justify-center"
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
              <div className="w-7 h-7 rounded-xl bg-[#01033E] flex items-center justify-center">
                <img src="./parqu-logo-white.png" alt="Parqu" className="h-3.5 w-auto object-contain" />
              </div>
            </div>

            {/* Tarjeta Virtual Parqu */}
            <div
              className="rounded-2xl p-3.5 text-white text-left shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #01033E 0%, #0033FF 100%)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4D6E6]">
                  PARQU DIGITAL PASS
                </span>
                <CreditCard className="w-3.5 h-3.5 text-[#807DFE]" />
              </div>
              <div className="text-[10px] text-[#D4D6E6]/80 font-mono">Saldo Disponible</div>
              <div className="text-xl font-black font-mono tracking-tight">
                ${formattedBalance} <span className="text-[10px] font-normal">MXN</span>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-[#D4D6E6]">
                <span className="flex items-center gap-1">
                  <Car className="w-3 h-3 text-white" />
                  {activePlates}
                </span>
                <span className="text-emerald-300 font-bold">● SIN COMISIÓN</span>
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

      {/* ── TARJETA INFERIOR DE CONTROL DE LA PRESENTACIÓN DE LA APP ── */}
      <div className="relative z-30 mt-2 w-full max-w-[440px] rounded-3xl bg-[#01033E]/65 backdrop-blur-md px-5 py-3.5 text-center shadow-xl border-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <button
            type="button"
            aria-label="Pantalla anterior de la presentación"
            onClick={() => setActiveIndex((prev) => (prev + 2) % 3)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer border-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-[10px] font-mono uppercase tracking-widest text-[#807DFE] font-bold">
            {currentStep.badge}
          </span>

          <button
            type="button"
            aria-label="Siguiente pantalla de la presentación"
            onClick={() => setActiveIndex((prev) => (prev + 1) % 3)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer border-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
          {currentStep.title}
        </h3>
        <p className="text-xs text-[#D4D6E6]/85 mt-0.5 leading-relaxed">
          {currentStep.subtitle}
        </p>

        {/* Indicadores de diapositiva de la presentación */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Ver paso ${idx + 1} de la presentación`}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer border-0 ${
                activeIndex === idx
                  ? 'w-7 bg-white'
                  : 'w-2 bg-white/35 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export const LoadingScreen = ({ onComplete }) => {
  const { vehicle, card } = useParking();
  const [isExiting, setIsExiting] = useState(false);
  const hasExitedRef = useRef(false);

  // Ejecuta la animación de salida suave y reactiva inmediatamente el fondo principal
  const handleTriggerExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    document.body.dataset.loadingActive = 'false';
    setIsExiting(true);

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 650);
  }, [onComplete]);

  // Atajo de teclado: Enter o Barra espaciadora para entrar al sistema
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTriggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerExit]);

  // Bloqueo de scroll mientras se visualiza la pantalla de carga
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
      className="fixed inset-0 w-screen h-screen z-50 overflow-y-auto overflow-x-hidden select-none pointer-events-auto bg-[#01033E] font-sans flex items-center justify-center px-5 sm:px-10 lg:px-16"
    >
      {/* 
        ══════════════════════════════════════════════════════════════
        FONDO ANIMADO DE NUBES (CLOUD-SKY) EN TODA LA PANTALLA COMPLETA
        ══════════════════════════════════════════════════════════════
      */}
      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-auto overflow-hidden">
        <CloudSky
          background="#01033E"
          baseColor="#0033FF"
          accentColor="#D4D6E6"
          density={85}
          speed={45}
          size={125}
          clouds={{ softness: 85, shadow: 80, cirrus: 40 }}
          sun={{ x: 78, y: 90, glow: 'rgba(128, 125, 254, 0.85)' }}
          pointer={{ parallax: 130, wind: 100, damping: 25 }}
          pauseWhenLoading={false}
          className="w-full h-full"
        />
      </div>

      {/* 
        ══════════════════════════════════════════════════════════════
        CONTENIDO PRINCIPAL SOBRE LAS NUBES:
        IZQUIERDA: SOLO LOGO DE PARQU, SLOGAN Y BOTÓN "EMPECEMOS"
        DERECHA: PRESENTACIÓN INTERACTIVA DE LA APLICACIÓN EN 3 TELÉFONOS
        ══════════════════════════════════════════════════════════════
      */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
        
        {/* COLUMNA IZQUIERDA: LOGO DE PARQU, SLOGAN Y BOTÓN EMPECEMOS */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 sm:space-y-8">
          {/* Logotipo Oficial Parqu */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-8 bg-gradient-to-r from-[#0033FF]/25 via-[#807DFE]/20 to-[#0033FF]/25 rounded-full blur-3xl pointer-events-none" />
            <img
              src="./parqu-logo-white.png"
              alt="Parqu Logo"
              style={{ maxHeight: '120px' }}
              className="h-24 sm:h-28 md:h-32 w-auto object-contain relative z-10 drop-shadow-[0_0_35px_rgba(128,125,254,0.45)]"
            />
          </div>

          {/* Slogan */}
          <p className="font-sans text-base sm:text-lg md:text-xl text-[#D4D6E6] font-normal tracking-normal leading-relaxed max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
            Sistema Inteligente de <span className="text-white font-bold">Parquímetros</span> y Autocobro Digital
          </p>

          {/* Botón "Empecemos" Elegante y Sin Bordes */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTriggerExit}
              className="font-sans text-sm sm:text-base font-bold text-white px-10 py-3.5 sm:py-4 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-300 backdrop-blur-md border-0 shadow-[0_0_35px_rgba(128,125,254,0.45)] flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span>Empecemos</span>
              <ArrowRight className="w-5 h-5 text-white inline transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: PRESENTACIÓN INTERACTIVA EN 3 TELÉFONOS */}
        <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
          <AppPresentationMockups
            plates={vehicle?.plates}
            balance={card?.balance}
            onEnter={handleTriggerExit}
          />
        </div>

      </div>
    </div>
  );
};

export default LoadingScreen;
