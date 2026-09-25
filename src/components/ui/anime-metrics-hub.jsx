import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
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
import { formatCurrency, formatPlate, formatTimeFromSeconds } from '../../utils/formatters';

export const AnimeMetricsHub = ({ onNavigateTab, onOpenRecharge, onOpenQR }) => {
  const { 
    vehicle, 
    card, 
    activeSession, 
    autoPay, 
    pinnedLocations = [] 
  } = useParking();

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
    <div className="w-full space-y-3 font-mono">
      {/* Subtítulo organizador */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            PANEL DE CONTROL METROPOLITANO
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-neutral-500 text-[10px]">MÉTRICAS Y ACCESOS EN VIVO</span>
        </div>

        {/* Telemetría mini-bars */}
        <div ref={barsRef} className="flex items-end gap-1 h-3.5 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800">
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

      {/* Grid de 4 Bloques Organizados */}
      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. ESTADO DE PARQUÍMETRO */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('dashboard')}
          className="metric-hub-card group relative p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 hover:border-indigo-500/60 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-700/50 text-indigo-400">
                <Clock className="w-4 h-4" />
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                activeSession 
                  ? 'bg-amber-950/70 text-amber-300 border-amber-600/60 animate-pulse' 
                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
              }`}>
                {activeSession ? 'OCUPADO' : 'LIBRE'}
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              Parquímetro Metropolitano
            </div>

            <div className="mt-1">
              {activeSession ? (
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-black text-amber-300">
                    {formatTimeFromSeconds(activeSession.secondsElapsed)}
                  </div>
                  <div className="text-xs text-neutral-400">
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
                <div className="text-xl font-black text-white">
                  Listo para Ocupar
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-neutral-800/70 flex items-center justify-between text-[11px] text-neutral-400 group-hover:text-indigo-300 transition">
            <span className="truncate max-w-[140px]">
              {activeSession ? activeSession.zoneName : '4 Zonas Disponibles'}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* 2. SALDO Y PASE DIGITAL */}
        <div 
          onClick={() => onOpenRecharge && onOpenRecharge()}
          className="metric-hub-card group relative p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 hover:border-emerald-500/60 transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
                <CurrencyDollarIcon size={16} strokeWidth={2.2} />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                + RECARGAR
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              Saldo Monedero Parqu
            </div>

            <div className="mt-1 text-xl font-black text-white flex items-baseline gap-1">
              <AnimeCounter 
                value={card?.balance ?? 0} 
                prefix="$" 
                decimals={2} 
                duration={500}
                className="text-xl font-black text-emerald-400"
              />
              <span className="text-[10px] text-neutral-500">MXN</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-neutral-800/70 flex items-center justify-between text-[11px] text-neutral-400 group-hover:text-emerald-300 transition">
            <span>Pase Contactless Activo</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* 3. PADRÓN VEHICULAR & PLACAS */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('vehicle')}
          className="metric-hub-card group relative p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 hover:border-cyan-500/60 transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-700/50 text-cyan-400">
                <Car className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-700/50">
                VINCULADO
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              Vehículo en Padrón
            </div>

            <div className="mt-1 text-xl font-black text-white tracking-wide">
              {formatPlate(vehicle.plates)}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-neutral-800/70 flex items-center justify-between text-[11px] text-neutral-400 group-hover:text-cyan-300 transition">
            <span className="truncate max-w-[140px]">{vehicle.brand} {vehicle.model}</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        {/* 4. BITÁCORA GPS & AUTOCOBRO */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('history')}
          className="metric-hub-card group relative p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 hover:border-amber-500/60 transition-all cursor-pointer shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2 rounded-xl bg-amber-950/60 border border-amber-700/50 text-amber-400">
                <MapPin className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/50">
                GPS ACTIVO
              </span>
            </div>

            <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
              Ubicaciones Fijadas
            </div>

            <div className="mt-1 text-xl font-black text-white flex items-baseline gap-1.5">
              <span>{pinnedLocations.length}</span>
              <span className="text-xs text-neutral-400 font-normal">en bitácora</span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-neutral-800/70 flex items-center justify-between text-[11px] text-neutral-400 group-hover:text-amber-300 transition">
            <span>Autocobro: {autoPay?.enabled ? 'Activo' : 'Pausado'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnimeMetricsHub;
