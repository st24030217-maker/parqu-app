import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Wifi, Battery, ShieldCheck, Zap, QrCode, Play, Sparkles } from 'lucide-react';
import { Threads } from './ui/Threads';
import { useParking } from '../context/ParkingContext';

export const LoadingScreen = ({ onComplete }) => {
  const { vehicle, card } = useParking();
  const [isExiting, setIsExiting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [demoSeconds, setDemoSeconds] = useState(865); // 14m 25s inicial
  const hasExitedRef = useRef(false);

  // Ejecuta la animación de salida suave en un solo plano continuo
  const handleTriggerExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    setIsExiting(true);

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 700);
  }, [onComplete]);

  // Contador en vivo para la vista previa móvil de Parqu
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Si el usuario activa "Ver en movimiento", alterna automáticamente entre las vistas de la app
  useEffect(() => {
    if (!isMotionActive) return;
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 3600);
    return () => clearInterval(slideTimer);
  }, [isMotionActive]);

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

  // Bloqueo de scroll en el body de fondo mientras se visualiza la pantalla de inicio
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const liveCost = ((demoSeconds / 60) * 0.25).toFixed(2);

  const handleToggleMotion = () => {
    setIsMotionActive((prev) => !prev);
    setActiveSlide((prev) => (prev === 0 ? 1 : 0));
  };

  return (
    <div
      style={{
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.7s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.5s ease',
        willChange: 'transform, opacity',
      }}
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden select-none pointer-events-auto bg-[#01033E] font-sans flex flex-col justify-between"
    >
      {/* 
        ══════════════════════════════════════════════════════════════
        FONDO ANIMADO THREADS (REACT BITS) CON PALETA OFICIAL PARQU
        ══════════════════════════════════════════════════════════════
      */}
      <div className="fixed inset-0 z-0 pointer-events-auto overflow-hidden">
        <Threads
          color={[0.0, 0.35, 1.0]}
          amplitude={isMotionActive ? 1.65 : 1.2}
          distance={isMotionActive ? 0.35 : 0.25}
          enableMouseInteraction={true}
          style={{ width: '100%', height: '100%' }}
        />
        {/* Resplandor ambiental y viñeta profunda para legibilidad máxima */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 72% 52%, rgba(0, 51, 255, 0.28) 0%, rgba(1, 3, 62, 0.55) 55%, rgba(1, 3, 62, 0.90) 100%)',
          }}
        />
      </div>

      {/* 
        ══════════════════════════════════════════════════════════════
        BARRA DE NAVEGACIÓN SUPERIOR FLOTANTE (SIN BORDES)
        ══════════════════════════════════════════════════════════════
      */}
      <header className="relative z-10 w-full max-w-[1340px] mx-auto pt-4 sm:pt-6 px-5 sm:px-12 lg:px-20">
        <nav
          aria-label="Navegación de bienvenida Parqu"
          className="w-full rounded-full bg-white/[0.08] backdrop-blur-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.35)] border-0"
        >
          {/* Marca Parqu */}
          <div
            onClick={handleTriggerExit}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0033FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,51,255,0.65)] group-hover:scale-105 transition-transform border-0">
              <img
                src="./parqu-logo-white.png"
                alt="Parqu"
                className="h-5 w-auto object-contain"
              />
            </div>
            <span className="text-white font-black text-base sm:text-lg tracking-tight">
              Parqu
            </span>
          </div>

          {/* Enlaces de vista previa + CTA */}
          <div className="flex items-center gap-5 sm:gap-7">
            <div className="hidden md:flex items-center gap-6 text-[13px] text-[#D4D6E6]/80 font-medium">
              <button
                type="button"
                onClick={() => setActiveSlide(0)}
                className={`hover:text-white transition cursor-pointer ${
                  activeSlide === 0 ? 'text-white font-bold' : ''
                }`}
              >
                Resumen
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide(1)}
                className={`hover:text-white transition cursor-pointer ${
                  activeSlide === 1 ? 'text-white font-bold' : ''
                }`}
              >
                Autocobro IA
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide(1)}
                className="hover:text-white transition cursor-pointer"
              >
                Seguridad
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide(1)}
                className="hover:text-white transition cursor-pointer"
              >
                Tarifas
              </button>
              <button
                type="button"
                onClick={handleTriggerExit}
                className="hover:text-white transition cursor-pointer"
              >
                Mapa en Vivo
              </button>
            </div>

            <button
              type="button"
              onClick={handleTriggerExit}
              className="px-4 sm:px-5 py-2 rounded-full bg-[#0033FF] hover:bg-[#1f4bff] active:scale-95 text-white font-bold text-xs sm:text-[13px] shadow-[0_4px_20px_rgba(0,51,255,0.55)] transition-all cursor-pointer border-0"
            >
              Entrar a la App
            </button>
          </div>
        </nav>
      </header>

      {/* 
        ══════════════════════════════════════════════════════════════
        HERO DE DOS COLUMNAS: DECLARACIÓN A LA IZQUIERDA + IPHONE A LA DERECHA
        ══════════════════════════════════════════════════════════════
      */}
      <main className="relative z-10 w-full max-w-[1340px] mx-auto flex-1 flex items-center px-6 sm:px-12 lg:px-20 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center w-full">
          
          {/* COLUMNA IZQUIERDA: TITULAR MULTILÍNEA, PÁRRAFO CONCISO Y 2 BOTONES */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left space-y-6 sm:space-y-7">
            
            {/* Titular de alto impacto (44-58px, interlineado estrecho y tracking negativo) */}
            <h1 className="text-[38px] sm:text-[48px] lg:text-[54px] xl:text-[58px] font-black text-white leading-[1.03] tracking-[-0.035em] font-sans">
              Todo tu parquímetro.
              <br />
              Y lo que realmente
              <br />
              pagas al minuto.
            </h1>

            {/* Párrafo explicativo conciso (13-15px, interlineado relajado, gris plata suave) */}
            <p className="text-[14px] sm:text-[15px] text-[#D4D6E6]/80 leading-[1.65] max-w-[430px] font-normal">
              Tu pase digital, saldo y tiempo exacto en un solo lugar, el cobro justo por segundo y un aviso inteligente antes de que tu estancia termine.
            </p>

            {/* Dos botones de acción (999px rounded-full) */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              {/* Botón primario lleno en azul oficial Parqu */}
              <button
                type="button"
                onClick={handleTriggerExit}
                className="px-7 sm:px-8 py-4 rounded-full bg-[#0033FF] hover:bg-[#1f4bff] active:scale-95 text-white font-bold text-[14px] sm:text-[15px] shadow-[0_12px_35px_rgba(0,51,255,0.55)] flex items-center gap-2.5 transition-all duration-300 cursor-pointer border-0 group"
              >
                <img
                  src="./parqu-logo-white.png"
                  alt=""
                  className="h-4 w-auto object-contain"
                />
                <span>Empecemos ahora</span>
                <ArrowRight className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              {/* Botón secundario silencioso de movimiento / demo */}
              <button
                type="button"
                onClick={handleToggleMotion}
                className={`px-7 py-4 rounded-full font-semibold text-[14px] sm:text-[15px] transition-all duration-300 active:scale-95 cursor-pointer border-0 flex items-center gap-2 backdrop-blur-xl ${
                  isMotionActive
                    ? 'bg-white text-[#01033E] shadow-[0_0_25px_rgba(255,255,255,0.4)]'
                    : 'bg-white/10 hover:bg-white/15 text-white shadow-lg'
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${isMotionActive ? 'fill-[#0033FF] text-[#0033FF]' : 'fill-white text-white'}`} />
                <span>{isMotionActive ? 'En movimiento activo' : 'Ver en movimiento'}</span>
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA: MOCKUP VERTICAL DE IPHONE CON VISTA EN VIVO DE PARQU */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center lg:justify-end">
            <div
              className={`relative w-[300px] sm:w-[336px] md:w-[352px] h-[575px] sm:h-[630px] rounded-[54px] p-[9px] bg-gradient-to-b from-[#807DFE] via-[#0033FF] to-[#01033E] shadow-[0_25px_80px_rgba(0,0,0,0.75),0_0_60px_rgba(0,51,255,0.35)] transition-transform duration-500 ${
                isMotionActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
            >
              {/* Botones físicos laterales del teléfono */}
              <div className="absolute -left-[3px] top-28 w-[3px] h-8 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
              <div className="absolute -left-[3px] top-40 w-[3px] h-12 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
              <div className="absolute -left-[3px] top-56 w-[3px] h-12 bg-[#807DFE]/60 rounded-l-full pointer-events-none" />
              <div className="absolute -right-[3px] top-44 w-[3px] h-16 bg-[#807DFE]/60 rounded-r-full pointer-events-none" />

              {/* Marco interno negro del dispositivo */}
              <div className="w-full h-full rounded-[46px] bg-black p-[5px] relative overflow-hidden">
                
                {/* Pantalla interna del teléfono */}
                <div
                  className="w-full h-full rounded-[41px] relative overflow-hidden flex flex-col justify-between p-5 text-white"
                  style={{
                    background:
                      'linear-gradient(180deg, #0033FF 0%, #10289E 36%, #040B42 74%, #010326 100%)',
                  }}
                >
                  {/* Sol / Resplandor atmosférico de fondo dentro de la pantalla del teléfono */}
                  <div
                    className="absolute -top-10 right-2 w-44 h-44 rounded-full pointer-events-none blur-xl opacity-80"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(212,214,230,0.95) 0%, rgba(128,125,254,0.65) 45%, transparent 75%)',
                    }}
                  />
                  <div
                    className="absolute top-36 inset-x-0 h-40 pointer-events-none opacity-35"
                    style={{
                      background:
                        'radial-gradient(ellipse at 55% 50%, rgba(0,51,255,0.8) 0%, transparent 70%)',
                    }}
                  />

                  {/* Barra de Estado iOS + Dynamic Island */}
                  <div className="relative z-10 flex items-center justify-between px-2 pt-0.5">
                    <span className="text-[12px] font-bold tracking-tight text-white font-mono">
                      9:41
                    </span>

                    {/* Dynamic Island con indicador en vivo */}
                    <div className="w-[102px] h-[25px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] font-mono text-[#D4D6E6] font-bold">
                        {formatTimer(demoSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-white">
                      <Wifi className="w-3.5 h-3.5" />
                      <Battery className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Tarjeta Superior en Vivo dentro del Teléfono */}
                  <div
                    onClick={() => setActiveSlide((prev) => (prev === 0 ? 1 : 0))}
                    className="relative z-10 mt-3 rounded-3xl bg-black/35 backdrop-blur-xl p-3.5 shadow-xl cursor-pointer transition-all duration-300 hover:bg-black/45 border-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4D6E6] font-bold">
                          PASE DIGITAL ACTIVO
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#807DFE] bg-white/10 px-2 py-0.5 rounded-full">
                        $0.25/min
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#D4D6E6]/70 font-mono uppercase">
                          Placas Registradas
                        </div>
                        <div className="text-base font-black font-mono tracking-wider text-white">
                          {vehicle?.plates || 'ABC-123-A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#D4D6E6]/70 font-mono uppercase">
                          {activeSlide === 0 ? 'Saldo Disponible' : 'Cobro en Vivo'}
                        </div>
                        <div className="text-base font-black font-mono text-emerald-400">
                          {activeSlide === 0
                            ? `$${Number(card?.balance ?? 250).toFixed(2)}`
                            : `$${liveCost} MXN`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Centro de la Pantalla del Teléfono: Icono Holográfico + Mensaje */}
                  <div className="relative z-10 my-auto flex flex-col items-center text-center px-2 space-y-3.5">
                    {/* Icono central cuadrado redondeado estilo iOS App Icon */}
                    <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-white/25 to-white/5 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.45)] flex items-center justify-center border-0">
                      <img
                        src="./parqu-logo-white.png"
                        alt="Parqu"
                        className="h-11 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,51,255,0.6)]"
                      />
                    </div>

                    {activeSlide === 0 ? (
                      <>
                        <h2 className="text-[22px] sm:text-[24px] font-black text-white tracking-tight leading-tight">
                          Estaciona sin estrés.
                        </h2>
                        <p className="text-[12px] sm:text-[12.5px] text-[#D4D6E6]/85 leading-relaxed max-w-[240px]">
                          Olvídate de buscar monedas o correr al parquímetro. Parqu calcula cada segundo en calma desde un solo lugar.
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-[22px] sm:text-[24px] font-black text-white tracking-tight leading-tight">
                          Cero multas garantizado.
                        </h2>
                        <p className="text-[12px] sm:text-[12.5px] text-[#D4D6E6]/85 leading-relaxed max-w-[240px]">
                          Tiempo activo: <strong className="text-white font-mono">{formatTimer(demoSeconds)}</strong> ({`$${liveCost} MXN`}). Credencial QR validada para agentes viales.
                        </p>
                      </>
                    )}

                    {/* Indicadores de paginación (dots) */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        aria-label="Ver diapositiva 1"
                        onClick={() => setActiveSlide(0)}
                        className={`h-2 rounded-full transition-all cursor-pointer border-0 ${
                          activeSlide === 0 ? 'w-4 bg-white' : 'w-2 bg-white/40'
                        }`}
                      />
                      <button
                        type="button"
                        aria-label="Ver diapositiva 2"
                        onClick={() => setActiveSlide(1)}
                        className={`h-2 rounded-full transition-all cursor-pointer border-0 ${
                          activeSlide === 1 ? 'w-4 bg-white' : 'w-2 bg-white/40'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Botón Inferior "Continuar" dentro del Teléfono */}
                  <div className="relative z-10 pt-2">
                    <button
                      type="button"
                      onClick={handleTriggerExit}
                      className="w-full py-3.5 rounded-full bg-[#0033FF] hover:bg-[#1f4bff] active:scale-95 text-white font-bold text-[14px] shadow-[0_8px_25px_rgba(0,51,255,0.65)] transition-all cursor-pointer border-0"
                    >
                      Continuar
                    </button>
                    {/* Barra Home Indicator de iOS */}
                    <div className="w-28 h-1 bg-white/40 rounded-full mx-auto mt-3" />
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Espaciador inferior sutil */}
      <div className="relative z-10 pb-3 text-center text-[11px] font-mono text-[#D4D6E6]/50">
        Tecnología Metropolitana SSS.Solutions • Presiona Enter o "Empecemos ahora"
      </div>
    </div>
  );
};

export default LoadingScreen;
