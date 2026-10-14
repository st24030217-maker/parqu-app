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
      className="fixed top-3 sm:top-4 inset-x-0 z-40 px-3 pointer-events-none flex justify-center bg-transparent"
    >
      <nav
        ref={islandRef}
        aria-label="Parqu"
        className="w-fit bg-transparent border-0 shadow-none px-2 h-10 flex items-center gap-2 pointer-events-auto"
      >
        <button
          type="button"
          aria-label="Parqu - Volver arriba"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 cursor-pointer group shrink-0 bg-transparent border-0 p-0 focus-visible:outline-none"
        >
          <div className="relative h-7 sm:h-8 w-auto flex items-center bg-transparent">
            <img
              src="./parqu-logo-white.png"
              alt="Parqu"
              className={`h-7 sm:h-8 w-auto object-contain bg-transparent transition-all duration-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] ${
                isScrolled ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
              }`}
            />
            <img
              src="./parqu-logo-black.png"
              alt="Parqu"
              className={`absolute inset-0 h-7 sm:h-8 w-auto object-contain bg-transparent transition-all duration-300 drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)] ${
                isScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            />
          </div>
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
