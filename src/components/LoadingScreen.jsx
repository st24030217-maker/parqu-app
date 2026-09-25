import React from 'react';
import { motion } from 'framer-motion';
import { RadialGlowButton } from './ui/radial-glow-button';
import { FlipFadeText } from './ui/flip-fade-text';
import { TextAnimation } from './ui/staggerText';
import { ArrowRight, Sparkles } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex flex-col bg-white text-black overflow-hidden select-none"
    >
      <div className="flex flex-col justify-between items-center h-full w-full px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        
        {/* Tag Superior de Bienvenida */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-mono text-neutral-800 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span className="tracking-[0.25em] uppercase font-bold text-[11px] text-black">
            SISTEMA METROPOLITANO PARQU
          </span>
        </motion.div>

        {/* Hero Central: Logotipo Parqu, Animación Flip-Fade Text y Botón "Empecemos" */}
        <main className="flex flex-col items-center justify-center text-center max-w-xl w-full my-auto space-y-7">
          
          {/* Logotipo Parqu Negro Oficial para Fondo Blanco */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center"
          >
            <img
              src="/parqu-logo-black.png"
              alt="Parqu Logo"
              className="h-28 sm:h-32 md:h-36 w-auto object-contain relative z-10 drop-shadow-md"
            />
          </motion.div>

          {/* Animación Flip-Fade Text: PARQU -> MÁS FÁCIL -> SIN FILAS -> SIN MONEDAS -> EN UN TOQUE */}
          <div className="w-full flex items-center justify-center py-2">
            <FlipFadeText
              words={[
                "PARQU",
                "MÁS FÁCIL",
                "SIN FILAS",
                "SIN MONEDAS",
                "EN UN TOQUE",
                "AUTOCOBRO"
              ]}
              interval={2600}
              letterDuration={0.55}
              staggerDelay={0.07}
              textClassName="text-4xl sm:text-6xl md:text-7xl font-black text-black tracking-tight"
            />
          </div>

          <p className="text-xs sm:text-sm font-mono text-neutral-600 max-w-md">
            Control de parquímetros inteligentes, tarjeta virtual y telemetría de autocobro continuo.
          </p>

          {/* BOTÓN PRINCIPAL CON ANIMACIÓN RADIAL GLOW: Empecemos */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pt-2 flex flex-col items-center justify-center"
          >
            <RadialGlowButton
              onClick={onComplete}
              className="text-base sm:text-lg font-bold shadow-xl"
            >
              <span>Empecemos</span>
              <ArrowRight className="w-5 h-5 text-white inline transition-transform duration-300 group-hover:translate-x-1.5" />
            </RadialGlowButton>
          </motion.div>

        </main>

        {/* Footer: Powered by SSS.Solutions con Logotipo */}
        <footer className="w-full max-w-md flex flex-col items-center justify-center gap-2 pt-4">
          <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-500 font-mono">
            Powered by
          </span>

          {/* Animación de texto que deletrea SSS.Solutions */}
          <div className="text-base sm:text-lg font-bold tracking-wider text-black font-mono flex items-center justify-center">
            <TextAnimation delay={0.5} divideBy="letter" className="text-black">
              SSS.Solutions
            </TextAnimation>
          </div>

          {/* Logotipo Oficial de SSS.Solutions adaptado */}
          <div className="flex items-center justify-center py-1">
            <img
              src="/sss-solutions-logo.png"
              alt="SSS.Solutions Logo"
              className="h-8 sm:h-9 w-auto object-contain invert hover:scale-105 transition-transform duration-300"
            />
          </div>

          <span className="text-[10px] text-neutral-500 font-mono tracking-wider text-center">
            Tecnología de Autocobro & Movilidad Urbana • Encriptación 256-bit
          </span>
        </footer>

      </div>
    </motion.div>
  );
};

export default LoadingScreen;
