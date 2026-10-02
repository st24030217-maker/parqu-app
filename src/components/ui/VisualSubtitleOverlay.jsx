import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Volume2, Sparkles, Bell } from 'lucide-react';

export const VisualSubtitleOverlay = () => {
  const { subtitle } = useAccessibility();

  if (!subtitle) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-md w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="bg-black/95 text-white border-2 border-amber-400 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 font-sans">
        <div className="w-7 h-7 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0">
          <Volume2 size={16} strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
            Subtítulo de Audio
          </span>
          <span className="text-xs sm:text-sm font-bold text-white leading-tight">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VisualSubtitleOverlay;
