import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Zap, Sparkles, Activity, Compass, HeartHandshake } from 'lucide-react';
import { PlugConnectedIcon } from './icons';
import { useParking } from '../context/ParkingContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const Header = ({ onNavigateToPanel, onNavigateToOrbital }) => {
  const { openAccessibilityModal } = useAccessibility();
  const { activeSession, vehicle } = useParking();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Detección reactiva de scroll para combinar el header con el fondo blanco y alternar el logo
  useEffect(() => {
    const handleScroll = () => {
      const systemEl = document.getElementById('interactive-system');
      if (systemEl) {
        const rect = systemEl.getBoundingClientRect();
        // Cuando la sección blanca toca o se sitúa bajo el header sticky (h-16 a h-20 es ~80px)
        setIsScrolled(rect.top <= 80);
      } else {
        setIsScrolled(window.scrollY > 200);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-2xl backdrop-saturate-150 border-b border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.05)]'
          : 'bg-[#01033E]/60 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        
        {/* Logotipo Oficial PARQU - Transición fluida entre logo blanco y logo negro */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Parqu Digital - Volver al inicio"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2 sm:gap-3.5 cursor-pointer group shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          title="Parqu Digital - Volver al Inicio"
        >
          <div className="relative flex items-center justify-center p-0.5 sm:p-1 group-hover:scale-105 transition-transform duration-300">
            <div 
              className={`absolute -inset-1.5 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                isScrolled ? 'bg-black/10' : 'bg-[#0033FF]/30'
              }`} 
            />
            
            {/* Contenedor relativo de logos para transición cross-fade */}
            <div className="relative h-8 sm:h-10 w-auto flex items-center">
              {/* Logo Blanco (Activo sobre fondo oscuro de nubes) */}
              <img 
                src="./parqu-logo-white.png" 
                alt="Parqu" 
                style={{ maxHeight: '40px' }}
                className={`h-8 sm:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(212,214,230,0.35)] transition-all duration-300 ${
                  isScrolled ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                }`}
              />

              {/* Logo Negro (Activo con transición al combinarse con el blanco) */}
              <img 
                src="./parqu-logo-black.png" 
                alt="Parqu" 
                style={{ maxHeight: '40px' }}
                className={`absolute inset-0 h-8 sm:h-10 w-auto object-contain transition-all duration-300 ${
                  isScrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span 
                className={`font-black text-lg sm:text-xl tracking-tight transition-colors duration-300 ${
                  isScrolled ? 'text-black group-hover:text-slate-700' : 'text-[#D4D6E6] group-hover:text-white'
                }`}
              >
                Parqu
              </span>
              <span 
                className={`hidden sm:inline-flex text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full transition-colors duration-300 font-bold ${
                  isScrolled 
                    ? 'bg-slate-100 text-slate-800 border border-slate-200' 
                    : 'bg-[#0033FF]/20 text-[#D4D6E6] border border-[#807DFE]/40'
                }`}
              >
                Digital Pass
              </span>
            </div>
            <p 
              className={`text-[11px] font-sans hidden md:block transition-colors duration-300 ${
                isScrolled ? 'text-slate-500' : 'text-[#D4D6E6]/80'
              }`}
            >
              Parquímetro Digital • Autocobro Inteligente
            </p>
          </div>
        </div>

        {/* Estatus Central, Hora y Acciones en Header */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div 
            className={`hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono transition-colors duration-300 ${
              isScrolled 
                ? 'bg-slate-100 border border-slate-200 text-slate-800 shadow-sm' 
                : 'bg-white/8 backdrop-blur-sm border border-white/10 text-[#D4D6E6]'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 transition-colors duration-300 ${isScrolled ? 'text-black' : 'text-[#807DFE]'}`} />
            <span>
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Badge de Estado de Estacionamiento */}
          {activeSession ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="font-mono text-[11px] sm:text-xs">
                <span className="hidden sm:inline font-sans">En Parquímetro: </span>
                {vehicle.plates}
              </span>
            </div>
          ) : (
            <div 
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-colors duration-300 ${
                isScrolled 
                  ? 'bg-slate-100 border border-slate-200 text-slate-800 shadow-sm' 
                  : 'bg-white/8 backdrop-blur-sm border border-white/10 text-[#D4D6E6]'
              }`}
            >
              <PlugConnectedIcon size={14} className="text-emerald-500 shrink-0" />
              <span className="font-sans text-[11px] sm:text-xs">
                <span className="hidden md:inline">Autocobro </span>Conectado
              </span>
            </div>
          )}

          {/* Botón Acceso Rápido a Accesibilidad e Inclusión */}
          <button
            type="button"
            aria-label="Abrir asistente de accesibilidad universal"
            onClick={openAccessibilityModal}
            className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-sans font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
              isScrolled
                ? 'bg-slate-100 hover:bg-slate-200 text-black border border-slate-200'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title="Opciones de Accesibilidad e Inclusión"
          >
            <HeartHandshake className={`w-3.5 h-3.5 shrink-0 transition-colors duration-300 ${isScrolled ? 'text-black' : 'text-amber-400'}`} />
            <span className="hidden md:inline">Accesibilidad</span>
          </button>

          {/* Botón Acceso Rápido al Selector Orbital 3D */}
          <button
            type="button"
            aria-label="Ir al Selector Orbital 3D"
            onClick={() => {
              if (onNavigateToOrbital) {
                onNavigateToOrbital();
              } else {
                const el = document.getElementById('selector-orbital-metropolitano');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-sans font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
              isScrolled
                ? 'bg-slate-100 hover:bg-slate-200 text-black border border-slate-200'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title="Ir al Selector Orbital 3D"
          >
            <Compass className={`w-3.5 h-3.5 shrink-0 transition-colors duration-300 ${isScrolled ? 'text-black' : 'text-[#807DFE]'}`} />
            <span className="hidden sm:inline">Selector 3D</span>
            <span className="sm:hidden text-[11px]">3D</span>
          </button>

          {/* Botón Acceso Rápido al Panel de Control Metropolitano */}
          <button
            type="button"
            aria-label="Ir directo al Panel de Control Metropolitano"
            onClick={() => {
              if (onNavigateToPanel) {
                onNavigateToPanel();
              } else {
                const el = document.getElementById('panel-control-metropolitano');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-sans font-bold transition-all duration-300 active:scale-95 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
              isScrolled
                ? 'bg-black hover:bg-slate-800 text-white border border-black'
                : 'bg-[#0033FF]/30 text-white hover:bg-[#0033FF]/50 border border-[#0033FF]/60 shadow-[0_0_20px_rgba(0,51,255,0.4)]'
            }`}
            title="Ir directo al Panel de Control Metropolitano"
          >
            <Activity className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="hidden sm:inline">Panel</span>
            <span className="sm:hidden text-[11px]">Panel</span>
          </button>
        </div>

      </div>
    </header>
  );
};
