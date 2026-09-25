import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { 
  Zap, 
  CreditCard, 
  Sliders, 
  Car, 
  History,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

export const AnimeDockNav = ({ activeTab, onSelectTab }) => {
  const { activeSession } = useParking();
  const dockRef = useRef(null);

  const tabs = [
    { id: 'quick-actions', label: 'Acciones', icon: Zap },
    { id: 'dashboard', label: 'Parquímetro', icon: CreditCard, hasLiveBadge: activeSession !== null },
    { id: 'autopay', label: 'Autocobro', icon: Sliders },
    { id: 'vehicle', label: 'Vehículo', icon: Car },
    { id: 'history', label: 'Bitácora', icon: History },
  ];

  // Entrada inicial del dock con Anime.js
  useEffect(() => {
    if (!dockRef.current) return;
    animate(dockRef.current, {
      opacity: [0, 1],
      translateY: [35, 0],
      duration: 700,
      delay: 300,
      ease: 'outExpo',
    });
  }, []);

  return (
    <div 
      ref={dockRef}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-auto font-mono pointer-events-auto"
    >
      <div className="flex items-center justify-center gap-1 sm:gap-2 p-1.5 rounded-full bg-black/90 border border-neutral-800/90 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 select-none ${
                isActive
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.35)] scale-105'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">{tab.label}</span>
              
              {/* Badge si hay sesión activa en Cajón */}
              {tab.hasLiveBadge && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AnimeDockNav;
