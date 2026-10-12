import React from "react";
import { motion } from "motion/react";
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
        "py-20 sm:py-28 overflow-hidden antialiased relative flex flex-col justify-center items-center bg-[#0a0a0d]",
        className
      )}
    >
      <div className="max-w-7xl relative mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center text-center">
        
        {/* FONDO: Logo Oficial Transparente de SSS.Solutions centrado */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl pointer-events-none select-none flex items-center justify-center opacity-[0.06]">
          <img 
            src="/sss-solutions-logo.png" 
            alt="SSS.Solutions" 
            className="h-44 sm:h-60 md:h-72 w-auto object-contain invert"
          />
        </div>

        {/* Contenido Principal */}
        <div className="relative z-10 flex flex-col items-center max-w-4xl space-y-5">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0d0d11] border border-white/[0.08] text-xs font-mono text-[#a78bfa]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <span className="tracking-[0.2em] uppercase font-semibold text-[11px] text-[#e4e4e7]">
              {headerSubtitle}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-white tracking-[-0.02em] leading-tight"
          >
            {headerTitle}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-2xl text-sm sm:text-base md:text-[17px] text-[#a1a1aa] font-sans leading-relaxed"
          >
            {headerDescription}
          </motion.p>

          {/* Tres Pilares Tecnológicos con bordes hairline 1px */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 w-full max-w-3xl"
          >
            <div className="p-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] transition-colors flex flex-col items-center text-center">
              <Zap className="w-5 h-5 text-[#a78bfa] mb-2" />
              <span className="text-xs font-sans font-semibold text-white uppercase tracking-wider">Cobro por Segundo</span>
              <span className="text-[11px] font-sans text-[#a1a1aa] mt-1">Tarifa regulada sin redondeos</span>
            </div>

            <div className="p-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] transition-colors flex flex-col items-center text-center">
              <ShieldCheck className="w-5 h-5 text-[#a78bfa] mb-2" />
              <span className="text-xs font-sans font-semibold text-white uppercase tracking-wider">Cero Multas</span>
              <span className="text-[11px] font-sans text-[#a1a1aa] mt-1">Protección activa continua</span>
            </div>

            <div className="p-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] transition-colors flex flex-col items-center text-center">
              <Clock className="w-5 h-5 text-[#a78bfa] mb-2" />
              <span className="text-xs font-sans font-semibold text-white uppercase tracking-wider">0 Filas • 0 Monedas</span>
              <span className="text-[11px] font-sans text-[#a1a1aa] mt-1">Tecnología SSS.Solutions</span>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
};

export default HeroParallax;
