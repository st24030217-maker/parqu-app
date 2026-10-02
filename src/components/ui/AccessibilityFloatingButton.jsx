import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { HeartHandshake } from 'lucide-react';

export const AccessibilityFloatingButton = () => {
  const { openAccessibilityModal, settings } = useAccessibility();

  return (
    <div className="fixed bottom-5 left-5 z-40">
      <button
        type="button"
        aria-label="Abrir Asistente de Accesibilidad e Inclusión Universal"
        onClick={openAccessibilityModal}
        className={`group p-3 sm:px-4 sm:py-2.5 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 border-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black ${
          settings.highContrast
            ? 'bg-black text-amber-300 border-amber-400'
            : 'bg-white/95 hover:bg-slate-50 text-slate-800 border-slate-300 backdrop-blur-md'
        }`}
        title="Opciones de Accesibilidad e Inclusión"
      >
        <div className="p-1 rounded-full bg-black text-white flex items-center justify-center">
          <HeartHandshake size={16} className="text-white" />
        </div>
        <span className="text-xs font-bold font-sans hidden sm:inline">
          Accesibilidad
        </span>
      </button>
    </div>
  );
};

export default AccessibilityFloatingButton;
