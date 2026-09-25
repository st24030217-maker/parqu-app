import React from 'react';
import { motion } from 'framer-motion';
import { WebcamPixelGrid } from './ui/webcam-pixel-grid';
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
      className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden select-none"
    >
      {/* Fondo interactivo Aceternity Webcam Pixel Grid a Color con Cámara en Vivo */}
      <WebcamPixelGrid
        pixelSize={14}
        gap={2}
        autoStartCamera={true}
        showControls={false}
        className="h-full w-full"
      >
        <div className="flex flex-col justify-between items-center h-full w-full px-4 sm:px-6 py-8 sm:py-12 relative z-10">
          
          {/* Tag Superior de Bienvenida */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700/60 text-xs font-mono text-neutral-300 shadow-lg backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="tracking-[0.25em] uppercase font-bold text-[11px] text-white">
              SISTEMA METROPOLITANO PARQU
            </span>
          </motion.div>

          {/* Hero Central: Logotipo Parqu, Animación Flip-Fade Text y Botón "Empecemos" */}
          <main className="flex flex-col items-center justify-center text-center max-w-xl w-full my-auto space-y-7">
            
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
                style={{ maxHeight: '144px' }}
                className="h-28 sm:h-32 md:h-36 w-auto object-contain relative z-10 drop-shadow-[0_0_40px_rgba(255,255,255,0.45)]"
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
                textClassName="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-[0_0_35px_rgba(255,255,255,0.35)]"
              />
            </div>

            <p className="text-xs sm:text-sm font-mono text-neutral-300 max-w-md drop-shadow-md">
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
                className="text-base sm:text-lg font-bold shadow-2xl"
              >
                <span>Empecemos</span>
                <ArrowRight className="w-5 h-5 text-white inline transition-transform duration-300 group-hover:translate-x-1.5" />
              </RadialGlowButton>
            </motion.div>

          </main>

          {/* Footer: Powered by SSS.Solutions con Logotipo Transparente */}
          <footer className="w-full max-w-md flex flex-col items-center justify-center gap-2 pt-4">
            <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono">
              Powered by
            </span>

            {/* Animación de texto que deletrea SSS.Solutions */}
            <div className="text-base sm:text-lg font-bold tracking-wider text-white font-mono flex items-center justify-center">
              <TextAnimation delay={0.5} divideBy="letter" className="text-white">
                SSS.Solutions
              </TextAnimation>
            </div>

            {/* Logotipo Oficial de SSS.Solutions (Totalmente transparente sin fondos) */}
            <div className="flex items-center justify-center py-1">
              <img
                src="/sss-solutions-logo.png"
                alt="SSS.Solutions Logo"
                style={{ maxHeight: '36px' }}
                className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform duration-300"
              />
            </div>

            <span className="text-[10px] text-neutral-400 font-mono tracking-wider text-center">
              Tecnología de Autocobro & Movilidad Urbana • Encriptación 256-bit
            </span>
          </footer>

        </div>
      </WebcamPixelGrid>
    </motion.div>
  );
};

export default LoadingScreen;
