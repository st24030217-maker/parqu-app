import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Car, 
  MapPin, 
  Clock, 
  ArrowUpRight,
} from 'lucide-react';
import { CurrencyDollarIcon } from '../icons/currency-dollar-icon';
import { useParking } from '../../context/ParkingContext';
import { AnimeCounter } from './anime-counter';
import { CanvasRevealEffect, AceternityCornerIcon } from './canvas-reveal-effect';
import { formatPlate, formatTimeFromSeconds } from '../../utils/formatters';

export const AnimeMetricsHub = ({ onNavigateTab, onOpenRecharge }) => {
  const { 
    vehicle, 
    card, 
    activeSession, 
    autoPay, 
    pinnedLocations = [] 
  } = useParking();

  const [hoveredCard, setHoveredCard] = useState(null);
  const containerRef = useRef(null);
  const barsRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('.metric-hub-card');
    
    animate(cards, {
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.98, 1],
      delay: stagger(75, { start: 100 }),
      duration: 600,
      ease: 'outExpo',
    });
  }, []);

  // Micro animation for live telemetry mini-bars
  useEffect(() => {
    if (!barsRef.current) return;
    const bars = barsRef.current.querySelectorAll('.telemetry-mini-bar');
    
    const anim = animate(bars, {
      scaleY: () => [0.2 + Math.random() * 0.3, 0.6 + Math.random() * 0.4],
      duration: 500,
      alternate: true,
      loop: true,
      ease: 'inOutQuad',
      delay: stagger(60),
    });

    return () => {
      if (anim && typeof anim.pause === 'function') anim.pause();
    };
  }, []);

  return (
    <div id="panel-control-metropolitano" className="w-full space-y-3 font-sans scroll-mt-28">
      {/* Subtítulo organizador */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
          <span className="w-2 h-2 rounded-full bg-[#8b5cf6] animate-pulse shrink-0" />
          <span className="font-mono font-semibold text-[#e4e4e7] uppercase tracking-[0.14em] text-[10px] sm:text-[11px]">
            PANEL DE CONTROL METROPOLITANO
          </span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span className="text-[#a1a1aa] text-[10px] hidden sm:inline font-mono uppercase tracking-wider">
            TELEMETRÍA EN VIVO
          </span>
        </div>

        {/* Telemetría mini-bars */}
        <div ref={barsRef} className="flex items-end gap-1 h-4 px-2.5 py-0.5 rounded-full bg-[#0d0d11] border border-white/[0.08]">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="telemetry-mini-bar w-1 rounded-full bg-[#8b5cf6] origin-bottom"
              style={{ height: '100%' }}
            />
          ))}
          <span className="text-[9px] font-mono text-[#a78bfa] ml-1">SYNC</span>
        </div>
      </div>

      {/* Grid de 4 Bloques Organizados con Kage Hairline Borders & Canvas Reveal Effect */}
      <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* 1. ESTADO DE PARQUÍMETRO */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Ver estado de parquímetro metropolitano y tiempo transcurrido"
          onClick={() => onNavigateTab && onNavigateTab('dashboard')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab && onNavigateTab('dashboard');
            }
          }}
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          className="metric-hub-card group relative p-3.5 sm:p-5 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
        >
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />

          <AnimatePresence>
            {(hoveredCard === 1 || activeSession) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 pointer-events-none z-0"
              >
                <CanvasRevealEffect
                  animationSpeed={3.0}
                  containerClassName="bg-[#0d0d11]/90"
                  colors={[
                    [139, 92, 246],
                    [167, 139, 250],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-[#0a0a0d]/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 font-sans">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="p-1.5 sm:p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#a78bfa]">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a78bfa]" />
              </span>
              <span className={`text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                activeSession 
                  ? 'bg-[#8b5cf6]/20 text-[#a78bfa] border-[#8b5cf6]/40 animate-pulse' 
                  : 'bg-white/[0.04] text-[#a1a1aa] border-white/[0.08]'
              }`}>
                {activeSession ? 'OCUPADO' : 'LIBRE'}
              </span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-[#a1a1aa] font-mono uppercase tracking-wider">
              Parquímetro
            </div>

            <div className="mt-0.5 sm:mt-1">
              {activeSession ? (
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <div className="text-base sm:text-xl font-bold text-white font-mono">
                    {formatTimeFromSeconds(activeSession.secondsElapsed)}
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#a78bfa] font-mono">
                    <AnimeCounter 
                      value={activeSession.currentCost} 
                      prefix="$" 
                      decimals={2} 
                      duration={300}
                      className="font-bold text-[#a78bfa] font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm sm:text-xl font-bold text-white font-sans tracking-tight">
                  Listo ($6/hr)
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] sm:text-[11px] text-[#a1a1aa] group-hover:text-white transition">
            <span className="truncate max-w-[110px] sm:max-w-[140px]">
              {activeSession ? activeSession.zoneName : '4 Zonas Activas'}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#a78bfa] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
          </div>
        </div>

        {/* 2. SALDO Y PASE DIGITAL */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Recargar saldo del monedero Parqu"
          onClick={() => onOpenRecharge && onOpenRecharge()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenRecharge && onOpenRecharge();
            }
          }}
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          className="metric-hub-card group relative p-3.5 sm:p-5 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
        >
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />

          <AnimatePresence>
            {hoveredCard === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 pointer-events-none z-0"
              >
                <CanvasRevealEffect
                  animationSpeed={3.5}
                  containerClassName="bg-[#0d0d11]/90"
                  colors={[
                    [139, 92, 246],
                    [167, 139, 250],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-[#0a0a0d]/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 font-sans">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="p-1.5 sm:p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#a78bfa]">
                <CurrencyDollarIcon size={15} strokeWidth={2.2} className="text-[#a78bfa]" />
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#8b5cf6]/15 text-[#a78bfa] border border-[#8b5cf6]/30">
                + RECARGAR
              </span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-[#a1a1aa] font-mono uppercase tracking-wider">
              Saldo Monedero
            </div>

            <div className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold text-white flex items-baseline gap-1 font-mono">
              <AnimeCounter 
                value={card?.balance ?? 0} 
                prefix="$" 
                decimals={2} 
                duration={500}
                className="text-base sm:text-xl font-bold text-white font-mono"
              />
              <span className="text-[9px] sm:text-[10px] text-[#a1a1aa] font-mono">MXN</span>
            </div>
          </div>

          <div className="relative z-10 pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] sm:text-[11px] text-[#a1a1aa] group-hover:text-white transition font-sans">
            <span className="truncate">Pase NFC Activo</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#a78bfa] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
          </div>
        </div>

        {/* 3. PADRÓN VEHICULAR & PLACAS */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Gestionar vehículo en padrón y placas"
          onClick={() => onNavigateTab && onNavigateTab('vehicle')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab && onNavigateTab('vehicle');
            }
          }}
          onMouseEnter={() => setHoveredCard(3)}
          onMouseLeave={() => setHoveredCard(null)}
          className="metric-hub-card group relative p-3.5 sm:p-5 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
        >
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />

          <AnimatePresence>
            {hoveredCard === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 pointer-events-none z-0"
              >
                <CanvasRevealEffect
                  animationSpeed={3.0}
                  containerClassName="bg-[#0d0d11]/90"
                  colors={[
                    [139, 92, 246],
                    [167, 139, 250],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-[#0a0a0d]/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 font-sans">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="p-1.5 sm:p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#a78bfa]">
                <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a78bfa]" />
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.04] text-[#a1a1aa] border border-white/[0.08]">
                VINCULADO
              </span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-[#a1a1aa] font-mono uppercase tracking-wider">
              Vehículo
            </div>

            <div className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold text-white tracking-wide font-mono">
              {formatPlate(vehicle.plates)}
            </div>
          </div>

          <div className="relative z-10 pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] sm:text-[11px] text-[#a1a1aa] group-hover:text-white transition font-sans">
            <span className="truncate max-w-[110px] sm:max-w-[140px]">{vehicle.brand} {vehicle.model}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#a78bfa] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
          </div>
        </div>

        {/* 4. BITÁCORA GPS & AUTOCOBRO */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Ver bitácora GPS y ubicaciones fijadas"
          onClick={() => onNavigateTab && onNavigateTab('history')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab && onNavigateTab('history');
            }
          }}
          onMouseEnter={() => setHoveredCard(4)}
          onMouseLeave={() => setHoveredCard(null)}
          className="metric-hub-card group relative p-3.5 sm:p-5 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
        >
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-white/20 group-hover:text-[#a78bfa] transition-colors z-20" />

          <AnimatePresence>
            {hoveredCard === 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 pointer-events-none z-0"
              >
                <CanvasRevealEffect
                  animationSpeed={3.0}
                  containerClassName="bg-[#0d0d11]/90"
                  colors={[
                    [139, 92, 246],
                    [167, 139, 250],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-[#0a0a0d]/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 font-sans">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="p-1.5 sm:p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#a78bfa]">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a78bfa]" />
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/[0.04] text-[#a1a1aa] border border-white/[0.08]">
                GPS ACTIVO
              </span>
            </div>

            <div className="text-[10px] sm:text-[11px] text-[#a1a1aa] font-mono uppercase tracking-wider">
              Ubicaciones
            </div>

            <div className="mt-0.5 sm:mt-1 text-base sm:text-xl font-bold text-white flex items-baseline gap-1.5">
              <span className="font-mono">{pinnedLocations.length}</span>
              <span className="text-[11px] sm:text-xs text-[#a1a1aa] font-normal font-sans">fijadas</span>
            </div>
          </div>

          <div className="relative z-10 pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] sm:text-[11px] text-[#a1a1aa] group-hover:text-white transition font-sans">
            <span className="truncate">Autocobro: {autoPay?.enabled ? 'Activo' : 'Pausado'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#a78bfa] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnimeMetricsHub;
