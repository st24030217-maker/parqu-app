import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { Radio, ShieldCheck, Activity, Cpu } from 'lucide-react';

export const AnimeTelemetryHud = ({ className = '', active = true }) => {
  const radarCircleRef = useRef(null);
  const radarSweepRef = useRef(null);
  const barsContainerRef = useRef(null);
  const pulseRingRef = useRef(null);

  useEffect(() => {
    // 1. Radar sweeping rotation
    let sweepAnim;
    if (radarSweepRef.current) {
      sweepAnim = animate(radarSweepRef.current, {
        rotate: 360,
        duration: 4000,
        loop: true,
        ease: 'linear',
      });
    }

    // 2. Pulse radar ring expand and fade
    let pulseAnim;
    if (pulseRingRef.current) {
      pulseAnim = animate(pulseRingRef.current, {
        scale: [1, 1.8],
        opacity: [0.8, 0],
        duration: 2200,
        loop: true,
        ease: 'outQuad',
      });
    }

    // 3. Staggered Equalizer / Signal Strength spectrum bars
    let barsAnim;
    if (barsContainerRef.current) {
      const bars = barsContainerRef.current.querySelectorAll('.hud-bar');
      if (bars.length > 0) {
        barsAnim = animate(bars, {
          scaleY: [0.25, 1],
          duration: 750,
          delay: stagger(120),
          loop: true,
          alternate: true,
          ease: 'easeInOutSine',
        });
      }
    }

    return () => {
      try {
        if (sweepAnim && typeof sweepAnim.pause === 'function') sweepAnim.pause();
        if (pulseAnim && typeof pulseAnim.pause === 'function') pulseAnim.pause();
        if (barsAnim && typeof barsAnim.pause === 'function') barsAnim.pause();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return (
    <div className={`p-4 rounded-3xl bg-black border border-neutral-800 shadow-[0_0_35px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 font-mono ${className}`}>
      
      {/* Radar satelital interactivo Anime.js */}
      <div className="flex items-center gap-3.5">
        <div className="relative w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
          {/* Círculo base con cuadrícula */}
          <div className="absolute inset-1 rounded-full border border-neutral-700/60 pointer-events-none" />
          <div className="absolute inset-3 rounded-full border border-neutral-800 pointer-events-none" />
          <div className="absolute w-full h-[1px] bg-neutral-800 pointer-events-none" />
          <div className="absolute h-full w-[1px] bg-neutral-800 pointer-events-none" />

          {/* Anillo de pulso Anime.js */}
          <div 
            ref={pulseRingRef} 
            className="absolute w-6 h-6 rounded-full border border-emerald-400 pointer-events-none" 
          />

          {/* Aguja / Escáner giratorio Anime.js */}
          <div 
            ref={radarSweepRef}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-[50%] h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-white absolute right-0 origin-left" />
          </div>

          <Radio className="w-4 h-4 text-emerald-400 relative z-10 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-black">
              RED MUNICIPAL SATELITAL
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-[10px] text-emerald-400 font-bold">ANIME.JS V4 HUD</span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
            Telemetría Parqu en Tiempo Real
          </h4>
        </div>
      </div>

      {/* Barras de espectro de señal animadas con animejs stagger */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-[10px] text-neutral-400 mr-1.5 font-bold uppercase">SEÑAL GPS</span>
          <div ref={barsContainerRef} className="flex items-end gap-1 h-5">
            <span className="hud-bar w-1 h-4 bg-emerald-400 rounded-full origin-bottom" />
            <span className="hud-bar w-1 h-4 bg-emerald-400 rounded-full origin-bottom" />
            <span className="hud-bar w-1 h-4 bg-emerald-400 rounded-full origin-bottom" />
            <span className="hud-bar w-1 h-4 bg-emerald-400 rounded-full origin-bottom" />
            <span className="hud-bar w-1 h-4 bg-emerald-400 rounded-full origin-bottom" />
          </div>
        </div>

        {/* Métricas de latencia y encriptación */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white font-bold">14 ms</span>
            <span className="text-[10px] text-neutral-500">Latencia</span>
          </div>
          <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-white font-bold">AES-256</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AnimeTelemetryHud;
