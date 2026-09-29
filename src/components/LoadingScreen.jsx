import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RadialGlowButton } from './ui/radial-glow-button';
import { ArrowRight } from 'lucide-react';

export const LoadingScreen = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const hasExitedRef = useRef(false);

  // Ejecuta la animación de revelado vertical escalonado al presionar "Empecemos"
  const handleTriggerExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    setIsExiting(true);

    // Duración de la animación: retraso de la última columna (4 * 0.08s = 0.32s) + subida (0.85s) = ~1.17s
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 1150);
  }, [onComplete]);

  // Atajo de teclado: Enter o Barra espaciadora para activar la animación
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

  // Bloqueo de scroll en el body mientras se visualiza la pantalla de carga
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none pointer-events-auto bg-transparent font-azeret">
      {/* 
        ══════════════════════════════════════════════════════════════
        FONDO TOTALMENTE LISO: 5 PERSIANAS UNIFORMES SIN LÍNEAS NI BORDES
        (Al hacer clic en "Empecemos", se deslizan hacia arriba en cascada)
        ══════════════════════════════════════════════════════════════
      */}
      <div className="absolute inset-0 grid grid-cols-5 pointer-events-none z-0">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            style={{
              transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
              transition: isExiting
                ? `transform 0.85s cubic-bezier(0.76, 0, 0.24, 1) ${idx * 0.08}s`
                : 'none',
              willChange: 'transform',
            }}
            className="relative h-full w-full bg-[#01033E]"
          />
        ))}
      </div>

      {/* 
        ══════════════════════════════════════════════════════════════
        CONTENIDO HERO MINIMALISTA: EXCLUSIVAMENTE LOGO, SLOGAN Y BOTÓN
        ══════════════════════════════════════════════════════════════
      */}
      <div
        style={{
          opacity: isExiting ? 0 : 1,
          transform: isExiting ? 'translateY(-30px)' : 'translateY(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
          pointerEvents: isExiting ? 'none' : 'auto',
        }}
        className="absolute inset-0 z-10 h-full w-full flex flex-col items-center justify-center px-4 sm:px-6"
      >
        <div className="flex flex-col items-center justify-center text-center max-w-xl w-full space-y-6 sm:space-y-8">
          
          {/* Logotipo Oficial Parqu con Halo Sutil */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-8 bg-gradient-to-r from-[#0033FF]/30 via-[#807DFE]/20 to-[#0033FF]/30 rounded-full blur-3xl pointer-events-none" />
            <img
              src="/parqu-logo-white.png"
              alt="Parqu Logo"
              style={{ maxHeight: '130px' }}
              className="h-24 sm:h-28 md:h-32 w-auto object-contain relative z-10 drop-shadow-[0_0_35px_rgba(128,125,254,0.45)]"
            />
          </div>

          {/* Slogan en Tipografía Azeret Mono */}
          <p className="font-azeret text-base sm:text-lg md:text-xl text-[#D4D6E6] font-medium tracking-wide leading-relaxed px-2">
            Sistema Inteligente de <span className="text-white font-bold">Parquímetros</span> y Autocobro Digital
          </p>

          {/* Botón "Empecemos" para Iniciar la Animación de Revelado */}
          <div className="pt-2">
            <RadialGlowButton
              onClick={handleTriggerExit}
              className="font-azeret text-sm sm:text-base font-bold shadow-2xl px-10 py-4 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span>Empecemos</span>
              <ArrowRight className="w-5 h-5 text-white inline transition-transform duration-300 group-hover:translate-x-1.5" />
            </RadialGlowButton>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
