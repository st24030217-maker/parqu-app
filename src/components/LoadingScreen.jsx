import React from 'react';
import { motion } from 'framer-motion';
import { WebcamPixelGrid } from './ui/webcam-pixel-grid';
import { TextAnimation } from './ui/staggerText';
import { ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const LoadingScreen = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.03, 
        filter: 'blur(10px)', 
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
      }}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden select-none"
    >
      {/* Fondo interactivo Aceternity Webcam Pixel Grid a Color */}
      <WebcamPixelGrid
        pixelSize={16}
        gap={2}
        autoStartCamera={true}
        showControls={false}
        className="h-full w-full"
      >
        <div className="flex flex-col justify-between items-center h-full w-full px-4 sm:px-6 py-8 sm:py-10 relative z-10">
          
          {/* Espaciador superior limpio */}
          <div className="w-full h-4" />

          {/* Hero Central: Logotipo Parqu, Título Parqu y Botón de Entrada */}
          <main className="flex flex-col items-center justify-center text-center max-w-xl w-full my-auto space-y-6">
            
            {/* Logotipo Parqu 100% Transparente con resplandor */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute -inset-6 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <img
                src="/parqu-logo-white.png"
                alt="Parqu Logo"
                className="h-24 sm:h-28 md:h-32 w-auto object-contain relative z-10 drop-shadow-[0_0_35px_rgba(255,255,255,0.4)]"
              />
            </motion.div>

            {/* Título Principal deletreando "Parqu" */}
            <div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white flex items-center justify-center">
                <TextAnimation delay={0.2} divideBy="letter" className="font-black text-white tracking-tight">
                  Parqu
                </TextAnimation>
              </h1>
            </div>

            {/* Badges de características */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-2 pt-1"
            >
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300 backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-white" />
                Cero Filas
              </span>
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                Cero Monedas
              </span>
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Autocobro Continuo
              </span>
            </motion.div>

            {/* BOTÓN PRINCIPAL: Entrar al Sistema */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="pt-4 w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-3"
            >
              <button
                onClick={onComplete}
                className="group relative w-full py-4 px-8 rounded-2xl bg-white text-black font-mono font-bold text-base tracking-wide flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(255,255,255,0.35)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden"
              >
                {/* Resplandor animado de fondo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-200/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
                
                <span className="relative z-10">Entrar al Sistema</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </motion.div>

          </main>

          {/* Footer: Powered by SSS.Solutions con Logotipo Transparente */}
          <footer className="w-full max-w-md flex flex-col items-center justify-center gap-2 pt-4">
            <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono">
              Powered by
            </span>

            {/* Animación de texto que deletrea SSS.Solutions */}
            <div className="text-base sm:text-lg font-bold tracking-wider text-white font-mono flex items-center justify-center">
              <TextAnimation delay={0.7} divideBy="letter" className="text-white">
                SSS.Solutions
              </TextAnimation>
            </div>

            {/* Logotipo Oficial de SSS.Solutions (Totalmente transparente sin fondos) */}
            <div className="flex items-center justify-center py-1">
              <img
                src="/sss-solutions-logo.png"
                alt="SSS.Solutions Logo"
                className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.25)] hover:scale-105 transition-transform duration-300"
              />
            </div>

            <span className="text-[10px] text-neutral-500 font-mono tracking-wider text-center">
              Tecnología de Autocobro & Movilidad Urbana • Encriptación 256-bit
            </span>
          </footer>

        </div>
      </WebcamPixelGrid>
    </motion.div>
  );
};

export default LoadingScreen;
