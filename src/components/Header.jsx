import React, { useState, useEffect, useRef, memo } from 'react';
import { BellRing } from 'lucide-react';
import { animate } from 'animejs';
import { useParking } from '../context/ParkingContext';

export const Header = memo(({ onOpenNotification }) => {
  const { activeSession, vehicle } = useParking();
  const [isScrolled, setIsScrolled] = useState(false);

  const navPillRef = useRef(null);
  const bellIconRef = useRef(null);
  const bellPulseRingRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const updateScroll = () => {
      setIsScrolled(window.scrollY > 24);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Entrada elástica inicial con Anime.js
  useEffect(() => {
    if (navPillRef.current) {
      animate(navPillRef.current, {
        opacity: [0, 1],
        translateY: [-18, 0],
        scale: [0.92, 1],
        duration: 750,
        ease: 'outElastic(1, .68)',
      });
    }
  }, []);

  // Animación continua de ondas en el botón de notificaciones y sacudida armónica de la campana
  useEffect(() => {
    let ringAnim;
    if (bellPulseRingRef.current) {
      ringAnim = animate(bellPulseRingRef.current, {
        scale: [1, 1.85],
        opacity: [0.65, 0],
        duration: activeSession ? 1200 : 2200,
        loop: true,
        ease: 'outSine',
      });
    }

    if (bellIconRef.current) {
      animate(bellIconRef.current, {
        rotate: [0, -18, 18, -12, 12, -6, 6, 0],
        scale: [1, 1.15, 1],
        duration: 700,
        ease: 'outElastic(1, .5)',
      });
    }

    return () => {
      if (ringAnim && typeof ringAnim.pause === 'function') {
        ringAnim.pause();
      }
    };
  }, [activeSession]);

  const triggerMicroBounce = (targetEl) => {
    if (!targetEl) return;
    animate(targetEl, {
      scale: [0.9, 1.06, 1],
      duration: 460,
      ease: 'outElastic(1, .55)',
    });
  };

  const handleBellClick = (e) => {
    triggerMicroBounce(e.currentTarget);
    if (bellIconRef.current) {
      animate(bellIconRef.current, {
        rotate: [0, -22, 22, -14, 14, 0],
        duration: 620,
        ease: 'outElastic(1, .5)',
      });
    }
    if (onOpenNotification) onOpenNotification();
  };

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className="fixed top-3 sm:top-4 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
        <nav
          ref={navPillRef}
          aria-label="Barra superior Parqu"
          className={`w-full rounded-[22px] backdrop-blur-xl border px-4 sm:px-5 h-12 sm:h-[52px] flex items-center justify-between gap-3 pointer-events-auto transition-colors duration-300 ${
            isScrolled
              ? 'bg-white/95 border-slate-200/90 shadow-[0_12px_34px_rgba(15,23,42,0.10)]'
              : 'bg-white/15 border-white/25 shadow-[0_10px_28px_rgba(0,20,80,0.15)]'
          }`}
        >
          {/* Izquierda: Solo el Logo Oficial PARQU */}
          <button
            type="button"
            aria-label="Parqu - Volver arriba"
            onClick={(e) => {
              triggerMicroBounce(e.currentTarget);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 text-left focus-visible:outline-none"
          >
            <div className="relative h-6 sm:h-7 w-auto flex items-center">
              <img
                src="./parqu-logo-white.png"
                alt="Parqu"
                className={`h-6 sm:h-7 w-auto object-contain drop-shadow-[0_0_12px_rgba(212,214,230,0.35)] transition-all duration-300 ${
                  isScrolled ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                }`}
              />
              <img
                src="./parqu-logo-black.png"
                alt="Parqu"
                className={`absolute inset-0 h-6 sm:h-7 w-auto object-contain transition-all duration-300 ${
                  isScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              />
            </div>

            <span
              className={`font-sans font-black text-sm sm:text-base tracking-tight transition-colors duration-300 ${
                isScrolled ? 'text-black group-hover:text-slate-700' : 'text-white'
              }`}
            >
              Parqu
            </span>
          </button>

          {/* Derecha: Solo el botón de Notificaciones */}
          <button
            type="button"
            aria-label="Abrir notificaciones en vivo"
            title="Ver notificaciones y estado de Parqu"
            onClick={handleBellClick}
            className={`relative px-3 py-1.5 rounded-[14px] flex items-center gap-2 transition cursor-pointer overflow-visible ${
              isScrolled
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-black'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <span
              ref={bellPulseRingRef}
              className={`absolute inset-0 rounded-[14px] pointer-events-none border ${
                activeSession
                  ? 'border-amber-400 bg-amber-400/15'
                  : isScrolled
                    ? 'border-[#0033FF]/40 bg-[#0033FF]/5'
                    : 'border-white/40 bg-white/10'
              }`}
            />
            <span ref={bellIconRef} className="relative z-10 flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </span>
            <span className="relative z-10 font-sans font-bold text-[11px] sm:text-xs tracking-tight">
              {activeSession ? `En Vivo • ${vehicle?.plates || ''}` : 'Notificaciones'}
            </span>
            <span
              className={`relative z-20 w-2 h-2 rounded-full ${
                activeSession ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
          </button>
        </nav>
      </div>
    </header>
  );
});
