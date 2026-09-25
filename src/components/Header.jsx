import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Zap, Sparkles } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const Header = ({ onReplayLoading }) => {
  const { activeSession, vehicle } = useParking();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-neutral-800/80 bg-black/80 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logotipo Oficial PARK - 100% Transparente sin cajas de fondo */}
        <div 
          onClick={onReplayLoading}
          className="flex items-center gap-3.5 cursor-pointer group"
          title="Ver pantalla de carga inicial"
        >
          <div className="relative flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-300">
            <div className="absolute -inset-2 bg-white/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <img 
              src="/parqu-logo-white.png" 
              alt="Parqu" 
              style={{ maxHeight: '44px' }}
              className="h-10 sm:h-11 w-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-black text-xl tracking-tight text-white group-hover:text-neutral-200 transition-colors">
                Parqu
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
                Digital Pass
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
              Parquímetro Digital • Autocobro Inteligente
            </p>
          </div>
        </div>

        {/* Estatus Central, Hora y Powered By en Header */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Badge de Estado de Estacionamiento */}
          {activeSession ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="font-mono">En Parquímetro: {vehicle.plates}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-mono text-xs text-neutral-300">Autocobro Activo</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white font-bold">PARQU LIVE</span>
          </div>
        </div>

      </div>
    </header>
  );
};
