import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Zap } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

export const Header = ({ onReplayLoading }) => {
  const { activeSession, vehicle } = useParking();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logotipo Oficial PARK */}
        <div 
          onClick={onReplayLoading}
          className="flex items-center gap-4 cursor-pointer group"
          title="Ver pantalla de carga"
        >
          <div className="bg-white p-1.5 rounded-2xl shadow-md shadow-cyan-500/10 flex items-center justify-center border border-slate-200/20 group-hover:scale-105 transition-transform">
            <img 
              src="/parqu-logo.png" 
              alt="Park" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                Park
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Digital Pass
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sistema Inteligente de Parquímetros & Autocobro
            </p>
          </div>
        </div>

        {/* Estatus Central, Hora y Powered By en Header */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Badge de Estado de Estacionamiento */}
          {activeSession ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>En Parquímetro: {vehicle.plates}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Autocobro Activo</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
