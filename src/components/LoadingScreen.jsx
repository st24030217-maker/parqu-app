import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TextAnimation } from './ui/staggerText';
import { ChevronRight } from 'lucide-react';

export const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Iniciando sistema...');

  useEffect(() => {
    const messages = [
      { at: 15, msg: 'Conectando con red de parquímetros...' },
      { at: 45, msg: 'Verificando tarjeta digital...' },
      { at: 75, msg: 'Sincronizando cajones en tiempo real...' },
      { at: 95, msg: 'Acceso seguro concedido' },
    ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        const currentMsg = messages.find((m) => next >= m.at && prev < m.at);
        if (currentMsg) {
          setStatusMessage(currentMsg.msg);
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 450);
          return 100;
        }
        return next;
      });
    }, 45); // ~2.5 segundos

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 1.02, 
        filter: 'blur(8px)', 
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
      }}
      className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-black text-white overflow-hidden select-none"
    >
      {/* Luces y texturas ambientales en Blanco y Negro */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] bg-white/[0.02] rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#333333_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />
      </div>

      {/* Barra superior minimalista monocromática */}
      <div className="w-full max-w-5xl px-6 pt-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5 text-xs font-mono text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="tracking-widest">PARK • SISTEMA DIGITAL</span>
        </div>
        <button
          onClick={onComplete}
          className="text-xs text-neutral-400 hover:text-white transition flex items-center gap-1 py-1.5 px-3.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-white/30"
        >
          <span>Saltar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Contenedor Central: Logo Park, Stagger Text y Progreso en Blanco y Negro */}
      <div className="flex flex-col items-center justify-center text-center px-4 z-10 max-w-md w-full">
        {/* Logotipo Oficial de Park */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-6 flex items-center justify-center"
        >
          <div className="absolute -inset-4 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <img
            src="/parqu-logo-white.png"
            alt="Park Logo"
            className="h-20 sm:h-24 w-auto object-contain relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.35)]"
          />
        </motion.div>

        {/* Nombre de la app: PARK con Stagger Text (letra por letra) */}
        <div className="mb-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center">
            <TextAnimation delay={0.2} divideBy="letter" className="font-extrabold text-white">
              Park
            </TextAnimation>
          </h1>
        </div>

        {/* Subtítulo minimalista con Stagger Text */}
        <div className="h-6 mb-8 text-xs sm:text-sm text-neutral-400 uppercase tracking-widest font-mono">
          <TextAnimation delay={0.4} divideBy="word">
            Parquímetro Digital Metropolitano
          </TextAnimation>
        </div>

        {/* Barra de progreso de carga en Blanco y Negro */}
        <div className="w-full space-y-2.5">
          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 p-[1px]">
            <motion.div
              className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-neutral-400 transition-all duration-300">{statusMessage}</span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Deletreo SSS.Solutions con Stagger Text y su Logotipo */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="w-full max-w-sm pb-8 px-4 flex flex-col items-center justify-center gap-3 z-10"
      >
        <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono">
          Powered by
        </span>

        {/* Animación que DELETREA "SSS.Solutions" letra por letra con stagger-text */}
        <div className="text-lg sm:text-xl font-bold tracking-wider text-white font-mono flex items-center justify-center">
          <TextAnimation delay={0.7} divideBy="letter" className="text-white">
            SSS.Solutions
          </TextAnimation>
        </div>

        {/* Logotipo Oficial de SSS.Solutions (Totalmente transparente sin fondos) */}
        <div className="flex items-center justify-center hover:scale-105 transition-transform duration-300 py-1">
          <img
            src="/sss-solutions-logo.png"
            alt="SSS.Solutions Logo"
            className="h-8 sm:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]"
          />
        </div>

        <span className="text-[10px] text-neutral-500 font-mono tracking-wider">
          Tecnología de Autocobro & Movilidad Urbana
        </span>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
