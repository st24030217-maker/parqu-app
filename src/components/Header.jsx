import React, { useState, useEffect, useRef, memo } from 'react';
import { animate } from 'animejs';
import { useParking } from '../context/ParkingContext';

export const Header = memo(() => {
  const { activeSession, vehicle } = useParking();
  const [isScrolled, setIsScrolled] = useState(false);
  const islandRef = useRef(null);

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

  useEffect(() => {
    if (islandRef.current) {
      animate(islandRef.current, {
        opacity: [0, 1],
        translateY: [-18, 0],
        scale: [0.85, 1],
        duration: 750,
        ease: 'outElastic(1, .65)',
      });
    }
  }, []);

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className="fixed top-3 sm:top-4 inset-x-0 z-40 px-3 pointer-events-none flex justify-center"
    >
      <nav
        ref={islandRef}
        aria-label="Parqu"
        className={`w-fit rounded-full backdrop-blur-2xl border px-3.5 h-10 flex items-center gap-2 pointer-events-auto transition-colors duration-300 ${
          isScrolled
            ? 'bg-white/95 border-slate-200/90 shadow-[0_10px_30px_rgba(15,23,42,0.10)]'
            : 'bg-white/15 border-white/25 shadow-[0_10px_28px_rgba(0,20,80,0.18)]'
        }`}
      >
        <button
          type="button"
          aria-label="Parqu - Volver arriba"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer group shrink-0 focus-visible:outline-none"
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
          {activeSession && (
            <span
              title={`En Parquímetro: ${vehicle?.plates || ''}`}
              className="w-2 h-2 rounded-full bg-amber-400 animate-ping"
            />
          )}
        </button>
      </nav>
    </header>
  );
});
