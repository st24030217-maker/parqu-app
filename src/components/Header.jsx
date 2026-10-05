import React, { useState, useEffect, useRef, memo } from 'react';
import { BellRing } from 'lucide-react';
import { animate, stagger } from 'animejs';
import { useParking } from '../context/ParkingContext';

export const Header = memo(({ onOpenNotification }) => {
  const { activeSession, vehicle } = useParking();
  const [isScrolled, setIsScrolled] = useState(false);

  const islandRef = useRef(null);
  const bellIconRef = useRef(null);
  const miniWaveRef = useRef(null);

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

  // Entrada elástica estilo Dynamic Island de iPhone con Anime.js
  useEffect(() => {
    if (islandRef.current) {
      animate(islandRef.current, {
        opacity: [0, 1],
        translateY: [-20, 0],
        scaleX: [0.65, 1],
        scaleY: [0.75, 1],
        duration: 820,
        ease: 'outElastic(1, .64)',
      });
    }
  }, []);

  // Mini ondas de telemetría en vivo dentro de la Isla Dinámica
  useEffect(() => {
    let waveAnim;
    if (miniWaveRef.current) {
      const bars = miniWaveRef.current.querySelectorAll('.island-wave-bar');
      if (bars.length > 0) {
        waveAnim = animate(bars, {
          scaleY: activeSession ? [0.3, 1, 0.35, 0.9] : [0.25, 0.6, 0.25],
          delay: stagger(70, { from: 'center' }),
          duration: activeSession ? 680 : 1400,
          loop: true,
          alternate: true,
          ease: 'inOutSine',
        });
      }
    }

    if (bellIconRef.current) {
      animate(bellIconRef.current, {
        rotate: [0, -18, 18, -10, 10, 0],
        scale: [1, 1.16, 1],
        duration: 680,
        ease: 'outElastic(1, .5)',
      });
    }

    return () => {
      if (waveAnim && typeof waveAnim.pause === 'function') {
        waveAnim.pause();
      }
    };
  }, [activeSession]);

  const formatShortTimer = (sec = 0) => {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleIslandClick = (e) => {
    if (islandRef.current) {
      animate(islandRef.current, {
        scaleX: [0.92, 1.06, 1],
        scaleY: [0.9, 1.05, 1],
        duration: 520,
        ease: 'outElastic(1, .55)',
      });
    }
    if (bellIconRef.current) {
      animate(bellIconRef.current, {
        rotate: [0, -22, 22, -12, 12, 0],
        duration: 600,
        ease: 'outElastic(1, .5)',
      });
    }
    if (onOpenNotification) {
      onOpenNotification(e);
    }
  };

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className="fixed top-3 sm:top-4 inset-x-0 z-40 px-3 pointer-events-none flex justify-center"
    >
      {/* Cápsula Compacta Tipo Dynamic Island de iPhone (w-fit centrada, nunca barra larga) */}
      <nav
        ref={islandRef}
        aria-label="Isla Dinámica Parqu"
        className={`w-fit max-w-[92vw] rounded-full backdrop-blur-2xl border px-3 sm:px-3.5 h-10 sm:h-11 flex items-center gap-2.5 sm:gap-3 pointer-events-auto transition-colors duration-300 ${
          isScrolled
            ? 'bg-white/95 border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.12)]'
            : 'bg-white/15 border-white/25 shadow-[0_10px_28px_rgba(0,20,80,0.18)]'
        }`}
      >
        {/* Izquierda de la Isla: Logo Parqu */}
        <button
          type="button"
          aria-label="Parqu - Volver arriba"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-1.5 cursor-pointer group shrink-0 focus-visible:outline-none pl-0.5"
        >
          <div className="relative h-5 w-auto flex items-center">
            <img
              src="./parqu-logo-white.png"
              alt="Parqu"
              className={`h-5 w-auto object-contain transition-all duration-300 ${
                isScrolled ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
              }`}
            />
            <img
              src="./parqu-logo-black.png"
              alt="Parqu"
              className={`absolute inset-0 h-5 w-auto object-contain transition-all duration-300 ${
                isScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            />
          </div>
          <span
            className={`font-sans font-black text-xs sm:text-[13px] tracking-tight transition-colors duration-300 ${
              isScrolled ? 'text-black' : 'text-white'
            }`}
          >
            Parqu
          </span>
        </button>

        {/* Separador sutil tipo sensor de Dynamic Island */}
        <span
          className={`w-px h-4 rounded-full transition-colors duration-300 ${
            isScrolled ? 'bg-slate-200' : 'bg-white/20'
          }`}
        />

        {/* Derecha de la Isla: Botón de Notificaciones / Telemetría en Vivo */}
        <button
          type="button"
          aria-label="Abrir Isla Dinámica de Notificaciones"
          title="Abrir control en vivo"
          onClick={handleIslandClick}
          className={`px-2.5 py-1 rounded-full flex items-center gap-2 transition cursor-pointer ${
            isScrolled
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
        >
          {/* Mini ondas Anime.js estilo Dynamic Island */}
          <div ref={miniWaveRef} className="flex items-center gap-[2px] h-3">
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`island-wave-bar w-[2px] h-3 rounded-full origin-center ${
                  activeSession
                    ? 'bg-amber-400'
                    : isScrolled
                      ? 'bg-[#0033FF]'
                      : 'bg-emerald-400'
                }`}
              />
            ))}
          </div>

          {activeSession ? (
            <span className="font-mono font-black text-[11px] tracking-tight">
              {formatShortTimer(activeSession.secondsElapsed)} • {vehicle?.plates || ''}
            </span>
          ) : (
            <span className="font-sans font-bold text-[11px] tracking-tight">
              Notis
            </span>
          )}

          <span ref={bellIconRef} className="flex items-center justify-center">
            <BellRing className="w-3.5 h-3.5" />
          </span>
        </button>
      </nav>
    </header>
  );
});
