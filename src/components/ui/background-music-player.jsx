import React, { useState, useEffect, useCallback, memo } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import {
  startBackgroundMusic,
  toggleBackgroundMusic,
  isBackgroundMusicEnabled,
  isBackgroundMusicPlaying,
} from '../../utils/ambientMusic';

export const BackgroundMusicPlayer = memo(() => {
  const [enabled, setEnabled] = useState(() => isBackgroundMusicEnabled());
  const [playing, setPlaying] = useState(() => isBackgroundMusicPlaying());

  // Intenta iniciar al montar y en la primera interacción del usuario (política de autoplay del navegador)
  useEffect(() => {
    let mounted = true;

    const tryAutoStart = async () => {
      if (!isBackgroundMusicEnabled()) return;
      const started = await startBackgroundMusic();
      if (mounted && started) {
        setPlaying(true);
        setEnabled(true);
      }
    };

    tryAutoStart();

    const handleFirstInteraction = async () => {
      if (!isBackgroundMusicEnabled()) return;
      if (!isBackgroundMusicPlaying()) {
        const ok = await startBackgroundMusic();
        if (mounted && ok) {
          setPlaying(true);
        }
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    return () => {
      mounted = false;
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const handleToggle = useCallback(async (e) => {
    e.stopPropagation();
    const nextEnabled = await toggleBackgroundMusic();
    setEnabled(nextEnabled);
    setPlaying(isBackgroundMusicPlaying());
  }, []);

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[60] select-none pointer-events-auto">
      <style>{`
        @keyframes parquEqBar1 {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
        @keyframes parquEqBar2 {
          0%, 100% { height: 11px; }
          50% { height: 4px; }
        }
        @keyframes parquEqBar3 {
          0%, 100% { height: 6px; }
          50% { height: 13px; }
        }
      `}</style>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={enabled ? 'Silenciar música ambiental de fondo' : 'Activar música ambiental de fondo'}
        title={enabled ? 'Música de fondo activa (Clic para silenciar)' : 'Activar música ambiental de fondo'}
        className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-full backdrop-blur-md transition-all duration-300 border-0 shadow-lg cursor-pointer active:scale-95 ${
          enabled
            ? 'bg-[#01033E]/75 hover:bg-[#01033E]/90 text-white shadow-[0_0_25px_rgba(0,51,255,0.4)]'
            : 'bg-slate-900/60 hover:bg-slate-900/80 text-[#D4D6E6]/70'
        }`}
      >
        {enabled ? (
          <div className="flex items-end gap-[2.5px] h-3.5 w-4 justify-center shrink-0">
            <span
              style={{
                animation: playing ? 'parquEqBar1 0.9s ease-in-out infinite' : 'none',
                height: playing ? '8px' : '4px',
              }}
              className="w-[2.5px] rounded-full bg-[#807DFE]"
            />
            <span
              style={{
                animation: playing ? 'parquEqBar2 0.75s ease-in-out infinite' : 'none',
                height: playing ? '11px' : '4px',
              }}
              className="w-[2.5px] rounded-full bg-emerald-400"
            />
            <span
              style={{
                animation: playing ? 'parquEqBar3 1.05s ease-in-out infinite' : 'none',
                height: playing ? '7px' : '4px',
              }}
              className="w-[2.5px] rounded-full bg-[#807DFE]"
            />
          </div>
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}

        <span className="text-[11px] font-mono font-bold tracking-wider uppercase">
          {enabled ? 'Ambiente Activo' : 'Música Off'}
        </span>
      </button>
    </div>
  );
});

export default BackgroundMusicPlayer;
