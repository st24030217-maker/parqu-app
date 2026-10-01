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
    <div id="panel-control-metropolitano" className="w-full space-y-3 font-sans scroll-mt-28">
      {/* Subtítulo organizador */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] sm:text-[11px] font-sans">
            PANEL DE CONTROL METROPOLITANO
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 text-[10px] hidden sm:inline font-sans">MÉTRICAS & CANVAS REVEAL EFFECT</span>
        </div>

        {/* Telemetría mini-bars */}
        <div ref={barsRef} className="flex items-end gap-1 h-3.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="telemetry-mini-bar w-1 rounded-full bg-emerald-500 origin-bottom"
              style={{ height: '100%' }}
            />
          ))}
          <span className="text-[9px] font-mono text-slate-500 ml-1">SYNC</span>
        </div>
      </div>

      {/* Grid de 4 Bloques Organizados con Canvas Reveal Effect */}
      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
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
          className="metric-hub-card group relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          {/* Aceternity Corner Cross Accents */}
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />

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
                  containerClassName="bg-slate-50/80"
                  colors={[
                    [0, 51, 255],
                    [100, 116, 139],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-white/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 font-sans">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-black shadow-sm">
                <Clock className="w-4 h-4 text-black" />
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                activeSession 
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {activeSession ? 'OCUPADO' : 'LIBRE'}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider font-sans">
              Parquímetro Metropolitano
            </div>

            <div className="mt-1">
              {activeSession ? (
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-black text-amber-600 font-mono">
                    {formatTimeFromSeconds(activeSession.secondsElapsed)}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    <AnimeCounter 
                      value={activeSession.currentCost} 
                      prefix="$" 
                      decimals={2} 
                      duration={300}
                      className="font-bold text-emerald-600 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xl font-black text-black font-sans">
                  Listo para Ocupar
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 group-hover:text-black transition">
            <span className="truncate max-w-[140px]">
              {activeSession ? activeSession.zoneName : '4 Zonas Disponibles'}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
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
          className="metric-hub-card group relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          {/* Aceternity Corner Cross Accents */}
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />

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
                  containerClassName="bg-slate-50/80"
                  colors={[
                    [0, 51, 255],
                    [100, 116, 139],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-white/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 font-sans">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-black shadow-sm">
                <CurrencyDollarIcon size={16} strokeWidth={2.2} className="text-black" />
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-black border border-slate-200">
                + RECARGAR
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider font-sans">
              Saldo Monedero Parqu
            </div>

            <div className="mt-1 text-xl font-black text-black flex items-baseline gap-1 font-mono">
              <AnimeCounter 
                value={card?.balance ?? 0} 
                prefix="$" 
                decimals={2} 
                duration={500}
                className="text-xl font-black text-emerald-600 font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">MXN</span>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 group-hover:text-black transition font-sans">
            <span>Pase Contactless Activo</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
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
          className="metric-hub-card group relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          {/* Aceternity Corner Cross Accents */}
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />

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
                  containerClassName="bg-slate-50/80"
                  colors={[
                    [0, 51, 255],
                    [100, 116, 139],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-white/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 font-sans">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-black shadow-sm">
                <Car className="w-4 h-4 text-black" />
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                VINCULADO
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider font-sans">
              Vehículo en Padrón
            </div>

            <div className="mt-1 text-xl font-black text-black tracking-wide font-mono">
              {formatPlate(vehicle.plates)}
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 group-hover:text-black transition font-sans">
            <span className="truncate max-w-[140px]">{vehicle.brand} {vehicle.model}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
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
          className="metric-hub-card group relative p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          {/* Aceternity Corner Cross Accents */}
          <AceternityCornerIcon className="absolute -top-1.5 -left-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -left-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -top-1.5 -right-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />
          <AceternityCornerIcon className="absolute -bottom-1.5 -right-1.5 text-slate-300 group-hover:text-black transition-colors z-20" />

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
                  containerClassName="bg-slate-50/80"
                  colors={[
                    [0, 51, 255],
                    [100, 116, 139],
                  ]}
                  dotSize={2}
                />
                <div className="absolute inset-0 [mask-image:radial-gradient(160px_at_center,white,transparent)] bg-white/40" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 font-sans">
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-black shadow-sm">
                <MapPin className="w-4 h-4 text-black" />
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                GPS ACTIVO
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider font-sans">
              Ubicaciones Fijadas
            </div>

            <div className="mt-1 text-xl font-black text-black flex items-baseline gap-1.5">
              <span className="font-mono">{pinnedLocations.length}</span>
              <span className="text-xs text-slate-500 font-normal font-sans">en bitácora</span>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 group-hover:text-black transition font-sans">
            <span>Autocobro: {autoPay?.enabled ? 'Activo' : 'Pausado'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnimeMetricsHub;
