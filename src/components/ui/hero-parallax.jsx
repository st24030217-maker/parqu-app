import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Sparkles, ShieldCheck, Zap, Clock } from "lucide-react";

export const HeroParallax = ({
  headerTitle = "La Nueva Era del Parquímetro Digital",
  headerSubtitle = "SISTEMA METROPOLITANO PARQU",
  headerDescription = "Descubre una plataforma diseñada para eliminar las filas, los parquímetros mecánicos y las multas. Autocobro continuo segundo a segundo con tecnología SSS.Solutions.",
  className,
}) => {
  return (
    <div
      className={cn(
        "py-24 sm:py-32 overflow-hidden antialiased relative flex flex-col justify-center items-center",
        className
      )}
    >
      <div className="max-w-7xl relative mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center">
        
        {/* FONDO: Exclusivamente el Logo Oficial Transparente de SSS.Solutions centrado */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl pointer-events-none select-none flex items-center justify-center opacity-20">
          <img 
            src="/sss-solutions-logo.png" 
            alt="SSS.Solutions" 
            className="h-44 sm:h-60 md:h-72 w-auto object-contain drop-shadow-[0_0_60px_rgba(255,255,255,0.35)]"
          />
        </div>

        {/* Contenido Principal */}
        <div className="relative z-10 flex flex-col items-center max-w-4xl space-y-6">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-950/90 border border-neutral-800 text-xs font-mono text-neutral-300 backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.06)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span className="tracking-[0.25em] uppercase font-bold text-[11px] text-white">
              {headerSubtitle}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]"
          >
            {headerTitle}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-2xl text-sm sm:text-base md:text-lg text-neutral-300 font-mono leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]"
          >
            {headerDescription}
          </motion.p>

          {/* Tres Pilares Tecnológicos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 w-full max-w-3xl"
          >
            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 backdrop-blur-md flex flex-col items-center text-center">
              <Zap className="w-6 h-6 text-amber-400 mb-2" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Cobro por Segundo</span>
              <span className="text-[11px] font-mono text-neutral-400 mt-1">Tarifa regulada sin redondeos</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 backdrop-blur-md flex flex-col items-center text-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Cero Multas</span>
              <span className="text-[11px] font-mono text-neutral-400 mt-1">Protección activa continua</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 backdrop-blur-md flex flex-col items-center text-center">
              <Clock className="w-6 h-6 text-cyan-400 mb-2" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">0 Filas • 0 Monedas</span>
              <span className="text-[11px] font-mono text-neutral-400 mt-1">Tecnología SSS.Solutions</span>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
};

export default HeroParallax;
