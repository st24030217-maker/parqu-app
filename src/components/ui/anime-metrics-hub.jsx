import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Car, 
  MapPin, 
  Zap, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { CurrencyDollarIcon } from '../icons/currency-dollar-icon';
import { useParking } from '../../context/ParkingContext';
import { AnimeCounter } from './anime-counter';
import { CanvasRevealEffect, AceternityCornerIcon } from './canvas-reveal-effect';
import { formatCurrency, formatPlate, formatTimeFromSeconds } from '../../utils/formatters';

export const AnimeMetricsHub = ({ onNavigateTab, onOpenRecharge, onOpenQR }) => {
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
    <div id="panel-control-metropolitano" className="w-full space-y-3 font-mono scroll-mt-28">
      {/* Subtítulo organizador */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold text-white uppercase tracking-wider text-[10px] sm:text-[11px]">
            PANEL DE CONTROL METROPOLITANO
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-neutral-500 text-[10px] hidden sm:inline">MÉTRICAS & CANVAS REVEAL EFFECT</span>
        </div>

        {/* Telemetría mini-bars */}
        <div ref={barsRef} className="flex items-end gap-1 h-3.5 px-2 py-0.5 rounded-full bg-white/8 backdrop-blur-sm border border-white/10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="telemetry-mini-bar w-1 rounded-full bg-emerald-400 origin-bottom"
              style={{ height: '100%' }}
            />
          ))}
          <span className="text-[9px] text-neutral-400 ml-1">SYNC</span>
        </div>
      </div>

      {/* Grid de 4 Bloques Organizados con Canvas Reveal Effect */}
      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. ESTADO DE PARQUÍMETRO */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('dashboard')}
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          className="metric-hub-card group relative p-5 rounded-2xl bg-[#01033E]/50 backdrop-blur-xl backdrop-saturate-150 border border-white/10 hover:border-[#807DFE]/40 transition-all cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_32px_rgba(0,51,255,0.3)] flex flex-col justify-between overflow-hidden"
        >
          {/* Aceternity Corner Cross Accents */}
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />

          {/* Aceternity Canvas Reveal Effect */}
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
                  containerClassName="bg-black/60"
                  colors={[
                    [0, 51, 255],
                    [128, 125, 254],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-black/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[#D4D6E6] shadow-sm">
                <Clock className="w-4 h-4" />
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                activeSession 
                  ? 'bg-amber-950/70 text-amber-300 border-amber-600/60 animate-pulse' 
                  : 'bg-white/10 backdrop-blur-sm text-[#D4D6E6] border border-white/10'
              }`}>
                {activeSession ? 'OCUPADO' : 'LIBRE'}
              </span>
            </div>

            <div className="text-[11px] text-[#D4D6E6] font-bold uppercase tracking-wider">
              Parquímetro Metropolitano
            </div>

            <div className="mt-1">
              {activeSession ? (
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-black text-amber-300">
                    {formatTimeFromSeconds(activeSession.secondsElapsed)}
                  </div>
                  <div className="text-xs text-[#D4D6E6]">
                    <AnimeCounter 
                      value={activeSession.currentCost} 
                      prefix="$" 
                      decimals={2} 
                      duration={300}
                      className="font-bold text-emerald-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xl font-black text-[#D4D6E6]">
                  Listo para Ocupar
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D4D6E6] group-hover:text-[#D4D6E6] transition">
            <span className="truncate max-w-[140px]">
              {activeSession ? activeSession.zoneName : '4 Zonas Disponibles'}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* 2. SALDO Y PASE DIGITAL */}
        <div 
          onClick={() => onOpenRecharge && onOpenRecharge()}
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          className="metric-hub-card group relative p-5 rounded-2xl bg-[#01033E]/50 backdrop-blur-xl backdrop-saturate-150 border border-white/10 hover:border-[#807DFE]/40 transition-all cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_32px_rgba(0,51,255,0.3)] flex flex-col justify-between overflow-hidden"
        >
          {/* Aceternity Corner Cross Accents */}
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />

          {/* Aceternity Canvas Reveal Effect */}
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
                  containerClassName="bg-black/60"
                  colors={[
                    [0, 51, 255],
                    [128, 125, 254],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-black/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[#D4D6E6] shadow-sm">
                <CurrencyDollarIcon size={16} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[#D4D6E6] border border-white/10">
                + RECARGAR
              </span>
            </div>

            <div className="text-[11px] text-[#D4D6E6] font-bold uppercase tracking-wider">
              Saldo Monedero Parqu
            </div>

            <div className="mt-1 text-xl font-black text-[#D4D6E6] flex items-baseline gap-1">
              <AnimeCounter 
                value={card?.balance ?? 0} 
                prefix="$" 
                decimals={2} 
                duration={500}
                className="text-xl font-black text-emerald-400"
              />
              <span className="text-[10px] text-[#D4D6E6]">MXN</span>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D4D6E6] group-hover:text-[#D4D6E6] transition">
            <span>Pase Contactless Activo</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* 3. PADRÓN VEHICULAR & PLACAS */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('vehicle')}
          onMouseEnter={() => setHoveredCard(3)}
          onMouseLeave={() => setHoveredCard(null)}
          className="metric-hub-card group relative p-5 rounded-2xl bg-[#01033E]/50 backdrop-blur-xl backdrop-saturate-150 border border-white/10 hover:border-[#807DFE]/40 transition-all cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_32px_rgba(0,51,255,0.3)] flex flex-col justify-between overflow-hidden"
        >
          {/* Aceternity Corner Cross Accents */}
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />

          {/* Aceternity Canvas Reveal Effect */}
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
                  containerClassName="bg-black/60"
                  colors={[
                    [0, 51, 255],
                    [128, 125, 254],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-black/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[#D4D6E6] shadow-sm">
                <Car className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[#D4D6E6] border border-white/10">
                VINCULADO
              </span>
            </div>

            <div className="text-[11px] text-[#D4D6E6] font-bold uppercase tracking-wider">
              Vehículo en Padrón
            </div>

            <div className="mt-1 text-xl font-black text-[#D4D6E6] tracking-wide">
              {formatPlate(vehicle.plates)}
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D4D6E6] group-hover:text-[#D4D6E6] transition">
            <span className="truncate max-w-[140px]">{vehicle.brand} {vehicle.model}</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* 4. BITÁCORA GPS & AUTOCOBRO */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('history')}
          onMouseEnter={() => setHoveredCard(4)}
          onMouseLeave={() => setHoveredCard(null)}
          className="metric-hub-card group relative p-5 rounded-2xl bg-[#01033E]/50 backdrop-blur-xl backdrop-saturate-150 border border-white/10 hover:border-[#807DFE]/40 transition-all cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_32px_rgba(0,51,255,0.3)] flex flex-col justify-between overflow-hidden"
        >
          {/* Aceternity Corner Cross Accents */}
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-neutral-600 group-hover:text-[#D4D6E6] transition-colors z-20" />

          {/* Aceternity Canvas Reveal Effect */}
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
                  containerClassName="bg-black/60"
                  colors={[
                    [0, 51, 255],
                    [128, 125, 254],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-black/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[#D4D6E6] shadow-sm">
                <MapPin className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[#D4D6E6] border border-white/10">
                GPS ACTIVO
              </span>
            </div>

            <div className="text-[11px] text-[#D4D6E6] font-bold uppercase tracking-wider">
              Ubicaciones Fijadas
            </div>

            <div className="mt-1 text-xl font-black text-[#D4D6E6] flex items-baseline gap-1.5">
              <span>{pinnedLocations.length}</span>
              <span className="text-xs text-[#D4D6E6] font-normal">en bitácora</span>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#D4D6E6] group-hover:text-[#D4D6E6] transition">
            <span>Autocobro: {autoPay?.enabled ? 'Activo' : 'Pausado'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnimeMetricsHub;
