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
  Sparkles,
} from 'lucide-react';
import CloudSky from './ui/cloud-sky';
import { useParking } from '../context/ParkingContext';

// ══════════════════════════════════════════════════════════════════════════
// ABANICO DE 3 TELÉFONOS SUPERPUESTOS CON LA INTERFAZ REAL DE PARQU
// Aislado con React.memo para que el reloj en vivo corra a 60 FPS sin
// re-renderizar el fondo WebGL CloudSky.
// ══════════════════════════════════════════════════════════════════════════
const OverlappingPhonesFan = memo(({ plates, balance, onEnter }) => {
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
  const shortTimer = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const liveCost = ((seconds / 60) * 0.25).toFixed(2);
  const formattedBalance = Number(balance ?? 250).toFixed(2);
  const activePlates = plates || 'ABC-123-A';

  return (
    <div className="relative w-full max-w-[560px] h-[470px] sm:h-[540px] flex items-center justify-center select-none">
      {/* Resplandor suave detrás del abanico de teléfonos */}
      <div
        className="absolute inset-0 rounded-full blur-3xl pointer-events-none opacity-65"
        style={{
          background:
            'radial-gradient(circle at 50% 55%, rgba(0, 51, 255, 0.45) 0%, rgba(128, 125, 254, 0.25) 45%, transparent 72%)',
        }}
      />

      {/* ──────────────────────────────────────────────────────────
          TELÉFONO IZQUIERDO (INCLINADO): BILLETERA Y TARJETA PARQU
      ────────────────────────────────────────────────────────── */}
      <div
        onClick={onEnter}
        style={{
          transform: 'translateX(-105px) translateY(22px) rotate(-10deg) scale(0.88)',
        }}
        className="hidden xs:block absolute z-10 w-[235px] sm:w-[258px] h-[460px] sm:h-[495px] rounded-[40px] bg-[#11131a] p-[7px] shadow-[0_25px_60px_rgba(0,0,0,0.65)] transition-transform duration-500 hover:-translate-y-1 cursor-pointer border-0"
      >
        <div className="w-full h-full rounded-[34px] bg-[#f8fafc] text-slate-900 overflow-hidden flex flex-col justify-between p-3.5">
          {/* Barra de estado */}
          <div className="flex items-center justify-between px-1.5 pt-0.5 text-[10px] font-mono font-bold text-slate-800">
            <span>9:41</span>
            <div className="w-14 h-3.5 rounded-full bg-black" />
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Encabezado App */}
          <div className="mt-2 text-left">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#0033FF] font-bold">
              Billetera Digital
            </span>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Tarjeta Parqu Pass
            </h4>
          </div>

          {/* Tarjeta Virtual Parqu */}
          <div
            className="rounded-2xl p-3.5 text-white text-left shadow-md"
            style={{
              background: 'linear-gradient(135deg, #01033E 0%, #0033FF 100%)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4D6E6]">
                PARQU METROPOLITANO
              </span>
              <CreditCard className="w-3.5 h-3.5 text-[#807DFE]" />
            </div>
            <div className="text-[10px] text-[#D4D6E6]/80 font-mono">Saldo Disponible</div>
            <div className="text-xl font-black font-mono tracking-tight">
              ${formattedBalance} <span className="text-[10px] font-normal">MXN</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-[#D4D6E6]">
              <span>{activePlates}</span>
              <span className="text-emerald-300">● ACTIVA</span>
            </div>
          </div>

          {/* Recarga Rápida */}
          <div className="bg-white rounded-2xl p-3 shadow-sm text-left space-y-2">
            <div className="text-[10px] font-bold text-slate-700">
              Recarga Express sin comisión
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="py-1.5 rounded-lg bg-slate-100 text-center text-[10px] font-mono font-bold text-slate-800">
                +$100
              </div>
              <div className="py-1.5 rounded-lg bg-[#0033FF] text-center text-[10px] font-mono font-bold text-white">
                +$200
              </div>
              <div className="py-1.5 rounded-lg bg-slate-100 text-center text-[10px] font-mono font-bold text-slate-800">
                +$500
              </div>
            </div>
          </div>

          {/* Beneficio inferior */}
          <div className="rounded-xl bg-emerald-50 p-2.5 flex items-center gap-2 text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-emerald-950">Cifrado Bancario AES-256</div>
              <div className="text-[9px] text-emerald-700">Protección total de saldo</div>
            </div>
          </div>

          <div className="w-20 h-1 bg-slate-300 rounded-full mx-auto" />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TELÉFONO DERECHO (INCLINADO): PASE QR Y VERIFICACIÓN VIAL
      ────────────────────────────────────────────────────────── */}
      <div
        onClick={onEnter}
        style={{
          transform: 'translateX(105px) translateY(22px) rotate(10deg) scale(0.88)',
        }}
        className="hidden xs:block absolute z-10 w-[235px] sm:w-[258px] h-[460px] sm:h-[495px] rounded-[40px] bg-[#11131a] p-[7px] shadow-[0_25px_60px_rgba(0,0,0,0.65)] transition-transform duration-500 hover:-translate-y-1 cursor-pointer border-0"
      >
        <div className="w-full h-full rounded-[34px] bg-[#f8fafc] text-slate-900 overflow-hidden flex flex-col justify-between p-3.5">
          {/* Barra de estado */}
          <div className="flex items-center justify-between px-1.5 pt-0.5 text-[10px] font-mono font-bold text-slate-800">
            <span>9:41</span>
            <div className="w-14 h-3.5 rounded-full bg-black" />
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Encabezado QR */}
          <div className="mt-2 text-left">
            <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
              ● Verificación Oficial
            </span>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Pase Digital QR
            </h4>
          </div>

          {/* Tarjeta QR */}
          <div className="bg-white rounded-2xl p-3.5 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl bg-[#01033E] flex items-center justify-center p-3 shadow-inner">
              <QrCode className="w-full h-full text-white" />
            </div>
            <div className="mt-2.5 text-xs font-black font-mono text-slate-900 tracking-wider">
              {activePlates}
            </div>
            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold">
              0 MULTAS GARANTIZADO
            </span>
          </div>

          {/* Estado de Red */}
          <div className="bg-white rounded-2xl p-3 shadow-sm text-left space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Sector</span>
              <span className="font-bold text-slate-900">Centro Histórico</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Tarifa Oficial</span>
              <span className="font-mono font-bold text-[#0033FF]">$0.25 / min</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Estatus Vial</span>
              <span className="font-bold text-emerald-600">Protegido</span>
            </div>
          </div>

          <div className="w-20 h-1 bg-slate-300 rounded-full mx-auto" />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TELÉFONO CENTRAL (AL FRENTE): AUTOCOBRO EN VIVO PARQU
      ────────────────────────────────────────────────────────── */}
      <div
        onClick={onEnter}
        className="relative z-20 w-[262px] sm:w-[288px] h-[500px] sm:h-[535px] rounded-[44px] bg-[#0b0d14] p-[8px] shadow-[0_30px_80px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:scale-[1.02] cursor-pointer border-0"
      >
        {/* Botones laterales del chasis */}
        <div className="absolute -left-[2.5px] top-24 w-[2.5px] h-7 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
        <div className="absolute -left-[2.5px] top-36 w-[2.5px] h-11 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
        <div className="absolute -right-[2.5px] top-32 w-[2.5px] h-14 bg-[#807DFE]/60 rounded-r-full pointer-events-none" />

        {/* Pantalla clara/neutra de alto contraste con la UI real de Parqu */}
        <div className="w-full h-full rounded-[37px] bg-[#f8fafc] text-slate-900 overflow-hidden flex flex-col justify-between p-4 relative">
          {/* Barra de Estado iOS + Dynamic Island */}
          <div className="flex items-center justify-between px-1.5 pt-0.5">
            <span className="text-[11px] font-bold font-mono text-slate-900">
              9:41
            </span>
            <div className="w-[92px] h-[22px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-white">
                {shortTimer}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-900">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Barra de Marca Interna */}
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#01033E] flex items-center justify-center shadow-sm">
                <img
                  src="./parqu-logo-white.png"
                  alt="Parqu"
                  className="h-4 w-auto object-contain"
                />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-slate-900 leading-none">Parqu</div>
                <div className="text-[9px] font-mono text-slate-500">Digital Pass</div>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[9px] font-mono font-bold">
              ● EN VIVO
            </span>
          </div>

          {/* Bloque Principal del Cronómetro por Segundo */}
          <div
            className="rounded-3xl p-4 text-white text-left shadow-lg"
            style={{
              background: 'linear-gradient(160deg, #01033E 0%, #0033FF 100%)',
            }}
          >
            <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[#D4D6E6]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#807DFE]" />
                Autocobro por Segundo
              </span>
              <span>$0.25/min</span>
            </div>

            <div className="mt-2.5 text-center py-2 rounded-2xl bg-black/25">
              <div className="text-[9px] font-mono uppercase text-[#D4D6E6]/75">
                Tiempo Activo
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {formattedTimer}
              </div>
              <div className="mt-0.5 text-xs font-mono font-bold text-emerald-300">
                Cargo actual: ${liveCost} MXN
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#D4D6E6]">PLACA: <strong className="text-white">{activePlates}</strong></span>
              <span className="text-emerald-300 font-bold">QR ACTIVO</span>
            </div>
          </div>

          {/* Lista de Estado del Vehículo */}
          <div className="bg-white rounded-2xl p-3 shadow-sm space-y-2 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#0033FF]" />
                <span className="text-[11px] font-bold text-slate-800">Polígono Centro A-12</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-slate-500">VERIFICADO</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-bold text-slate-800">Saldo: ${formattedBalance} MXN</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-600">SIN MULTAS</span>
            </div>
          </div>

          {/* Botón CTA dentro del teléfono principal */}
          <div>
            <div className="w-full py-2.5 rounded-full bg-[#0033FF] hover:bg-[#1a47ff] text-white font-bold text-xs text-center shadow-md transition-colors">
              Abrir Panel de Control
            </div>
            <div className="w-24 h-1 bg-slate-300 rounded-full mx-auto mt-2.5" />
          </div>
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
        DERECHA: ABANICO DE TELÉFONOS SUPERPUESTOS CON LA APP REAL
        ══════════════════════════════════════════════════════════════
      */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
        
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

        {/* COLUMNA DERECHA: ABANICO DE TELÉFONOS SUPERPUESTOS */}
        <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
          <OverlappingPhonesFan
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
