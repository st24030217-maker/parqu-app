import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import CloudSky from './ui/cloud-sky';

export const LoadingScreen = ({ onComplete }) => {
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
      className="fixed inset-0 w-screen h-screen z-50 overflow-hidden select-none pointer-events-auto bg-[#01033E] font-sans flex flex-col items-center justify-center px-4 sm:px-6"
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
        CONTENIDO CENTRADO: SOLO LOGO DE PARQU, SLOGAN Y BOTÓN EMPECEMOS
        ══════════════════════════════════════════════════════════════
      */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-lg w-full space-y-6 sm:space-y-8">
        
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
        <p className="font-sans text-base sm:text-lg md:text-xl text-[#D4D6E6] font-normal tracking-normal leading-relaxed px-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          Sistema Inteligente de <span className="text-white font-bold">Parquímetros</span> y Autocobro Digital
        </p>

        {/* Botón "Empecemos" Elegante y Sin Bordes */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleTriggerExit}
            className="font-sans text-sm sm:text-base font-bold text-white px-10 py-3.5 sm:py-4 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-300 backdrop-blur-md border-0 shadow-[0_0_35px_rgba(128,125,254,0.45)] flex items-center justify-center gap-2.5 mx-auto cursor-pointer group"
          >
            <span>Empecemos</span>
            <ArrowRight className="w-5 h-5 text-white inline transition-transform duration-300 group-hover:translate-x-1.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoadingScreen;
