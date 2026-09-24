import React from 'react';
import { motion } from 'framer-motion';
import { WebcamPixelGrid } from './ui/webcam-pixel-grid';
import { LiquidMetalButton } from './ui/liquid-metal';
import { FlipFadeText } from './ui/flip-fade-text';
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

          {/* Hero Central: Logotipo Parqu, Animación Flip-Fade Text y Botón Liquid Metal "Empecemos" */}
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

            {/* Animación Flip-Fade Text: PARQU -> MÁS FÁCIL -> SIN FILAS -> SIN MONEDAS -> EN UN TOQUE */}
            <div className="w-full flex items-center justify-center">
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
                textClassName="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              />
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

            {/* BOTÓN PRINCIPAL CON ANIMACIÓN LIQUID METAL: Empecemos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="pt-4 flex flex-col items-center justify-center"
            >
              <LiquidMetalButton
                onClick={onComplete}
                borderWidth={4}
                size="lg"
                metalConfig={{
                  colorBack: "#1a1a1f",
                  colorTint: "#ffffff",
                  speed: 0.7,
                  repetition: 4,
                  distortion: 0.25,
                  scale: 1,
                }}
                icon={<ArrowRight className="w-5 h-5 text-white" />}
                className="font-mono text-base tracking-wider"
              >
                Empecemos
              </LiquidMetalButton>
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
