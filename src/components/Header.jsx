import React, { useState, useEffect, useRef, memo } from 'react';
import { animate } from 'animejs';
import { useParking } from '../context/ParkingContext';

export const Header = memo(({ activeTab, onSelectTab }) => {
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
        translateY: [-10, 0],
        duration: 550,
        ease: 'outCubic',
      });
    }
  }, []);

  const navLinks = [
    { id: 'dashboard', label: 'Parquímetro' },
    { id: 'autopay', label: 'Autocobro' },
    { id: 'vehicle', label: 'Vehículo' },
    { id: 'history', label: 'Historial' },
  ];

  const handleNavClick = (tabId) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    }
  };

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-200 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
          : 'bg-[#01033E]/65 backdrop-blur-md border-b border-[#D4D6E6]/10'
      }`}
    >
      <nav
        ref={islandRef}
        aria-label="Parqu"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4"
      >
        {/* Wordmark Left */}
        <button
          type="button"
          aria-label="Parqu - Volver arriba"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0 bg-transparent border-0 p-0 focus-visible:outline-none"
        >
          <div className="relative h-6 sm:h-7 w-auto flex items-center">
            <img
              src="./parqu-logo-white.png"
              alt="Parqu"
              className={`h-6 sm:h-7 w-auto object-contain transition-opacity duration-200 ${
                isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-95 group-hover:opacity-100'
              }`}
            />
            <img
              src="./parqu-logo-black.png"
              alt="Parqu"
              className={`absolute inset-0 h-6 sm:h-7 w-auto object-contain transition-opacity duration-200 ${
                isScrolled ? 'opacity-95 group-hover:opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          </div>
          {activeSession && (
            <span
              title={`En Parquímetro: ${vehicle?.plates || ''}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0033FF]/15 border border-[#807DFE]/35 text-[10px] font-mono uppercase tracking-wider text-[#807DFE]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0033FF] animate-pulse" />
              {vehicle?.plates || 'EN VIVO'}
            </span>
          )}
        </button>

        {/* Center Text Links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`text-[13px] font-sans transition-colors duration-150 cursor-pointer bg-transparent border-0 p-0 ${
                  isScrolled
                    ? isActive
                      ? 'text-[#0033FF] font-bold'
                      : 'text-slate-600 hover:text-slate-950 font-medium'
                    : isActive
                    ? 'text-white font-bold'
                    : 'text-[#D4D6E6] hover:text-white font-medium'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Ghost Secondary + Filled Primary CTA */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('parqu:open-push-modal'))}
            className={`hidden sm:inline-flex items-center justify-center h-9 px-3.5 rounded-[8px] text-xs font-sans font-medium transition-colors duration-150 cursor-pointer ${
              isScrolled
                ? 'bg-transparent border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300'
                : 'bg-transparent border border-[#D4D6E6]/20 text-[#D4D6E6] hover:text-white hover:border-[#D4D6E6]/40'
            }`}
          >
            Push en Vivo
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="inline-flex items-center justify-center h-9 px-4 rounded-[8px] bg-[#0033FF] hover:bg-[#1a47ff] text-white text-xs font-sans font-semibold transition-colors duration-150 cursor-pointer border-0 shadow-sm"
          >
            {activeSession ? 'Estancia Activa' : 'Abrir Consola'}
          </button>
        </div>
      </nav>
    </header>
  );
});
