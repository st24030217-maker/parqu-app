import React, { useState, useEffect, useRef, memo } from 'react';
import { animate } from 'animejs';
import { Wifi, Activity } from 'lucide-react';
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
        translateY: [-12, 0],
        duration: 500,
        ease: 'outExpo',
      });
    }
  }, []);

  const navLinks = [
    { id: 'dashboard', label: 'Parquímetro' },
    { id: 'autopay', label: 'Autocobro' },
    { id: 'vehicle', label: 'Vehículo' },
    { id: 'history', label: 'Historial' },
  ];

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className={`sticky top-0 inset-x-0 z-40 transition-colors duration-200 border-b border-white/[0.08] ${
        isScrolled
          ? 'bg-[#0a0a0d]/85 backdrop-blur-xl'
          : 'bg-[#0a0a0d]/70 backdrop-blur-md'
      }`}
    >
      <nav
        ref={islandRef}
        aria-label="Parqu"
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4"
      >
        {/* Wordmark Left */}
        <button
          type="button"
          aria-label="Parqu - Volver arriba"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0 bg-transparent border-0 p-0 focus-visible:outline-none"
        >
          <img
            src="./parqu-logo-white.png"
            alt="Parqu"
            className="h-6 sm:h-7 w-auto object-contain bg-transparent opacity-95 group-hover:opacity-100 transition-opacity"
          />
          <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono text-[10px] tracking-widest uppercase text-[#a78bfa]">
            v2.6
          </span>
          {activeSession && (
            <span
              title={`En Parquímetro: ${vehicle?.plates || ''}`}
              className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-ping"
            />
          )}
        </button>

        {/* Centre Text Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onSelectTab && onSelectTab(link.id)}
                className={`text-[13px] font-medium transition-colors cursor-pointer bg-transparent border-0 px-1 py-1 ${
                  isActive
                    ? 'text-white'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Ghost Secondary + Filled Primary Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('parqu:open-push-modal'))}
            className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg bg-transparent border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.03] text-xs font-medium text-[#e4e4e7] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="hidden sm:inline">Push en Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('dashboard')}
            className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-lg bg-[#8b5cf6] hover:bg-[#9b6ff7] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-[0_0_20px_rgba(139,92,246,0.28)]"
          >
            <Wifi className="w-3.5 h-3.5 rotate-90 text-white" />
            <span>{activeSession ? 'Estancia Activa' : 'Abrir Consola'}</span>
          </button>
        </div>
      </nav>
    </header>
  );
});
