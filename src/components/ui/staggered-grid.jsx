import React, { useRef } from 'react';
import HeroText from './hero-shutter-text';
import CloudSky from './cloud-sky';

export function StaggeredGrid({
  centerText = "BIENVENIDOS A PARQU",
  onSelectFeature,
  className = "",
}) {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden text-white ${className}`}>
      
      {/* ═══ 1. HERO SECTION CON ORIGINKIT CLOUD-SKY (FONDO DE NUBES OFICIAL) Y HERO SHUTTER TEXT ═══ */}
      <section className="relative z-10 min-h-[500px] sm:min-h-[560px] flex flex-col items-center justify-center text-center px-4 pt-12 pb-20 sm:pb-28 overflow-hidden">
        
        {/* Fondo Animado WebGL Cloud-Sky de OriginKit - 100% Fluido e Interactivo */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
          <CloudSky 
            background="#01033E"
            baseColor="#0033FF"
            accentColor="#D4D6E6"
            density={85}
            speed={45}
            size={125}
            clouds={{ softness: 85, shadow: 80, cirrus: 40 }}
            sun={{ x: 78, y: 90, glow: "rgba(128, 125, 254, 0.85)" }}
            pointer={{ parallax: 130, wind: 100, damping: 25 }}
            className="w-full h-full"
          />
          {/* Capas sutiles de sombreado y transición para contraste perfecto */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#01033E]/20 via-transparent to-[#01033E]/95 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#01033E] to-transparent pointer-events-none" />
        </div>

        {/* Badge Superior */}
        <div className="relative z-10 mb-4 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border-0 text-xs font-mono text-[#D4D6E6] shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="tracking-[0.1em] sm:tracking-[0.2em] uppercase font-bold text-[9px] sm:text-[11px]">SISTEMA INTELIGENTE DE PARQUÍMETROS</span>
          <span className="text-[#807DFE] hidden xs:inline">•</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-[#807DFE] hidden xs:inline">2026 OFFICIAL</span>
        </div>

        {/* Hero Text Shutter */}
        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <HeroText
            text={centerText}
            className="bg-transparent"
          />
        </div>

        {/* Subtítulo Hero */}
        <p className="relative z-10 mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-[#D4D6E6] font-sans max-w-2xl mx-auto leading-relaxed px-3 sm:px-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          La plataforma metropolitana que elimina las filas, las monedas y las multas. Autocobro continuo segundo a segundo con tecnología de <strong className="text-white">SSS.Solutions</strong>.
        </p>

        {/* Barra de Estadísticas Clave */}
        <div className="relative z-10 mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-4xl w-full mx-auto px-2 sm:px-4">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border-0 shadow-lg text-center transition">
            <div className="text-base sm:text-xl font-black text-white font-mono">$0.25</div>
            <div className="text-[9px] sm:text-[10px] text-[#D4D6E6] font-mono uppercase tracking-wider">MXN por Minuto</div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border-0 shadow-lg text-center transition">
            <div className="text-base sm:text-xl font-black text-emerald-400 font-mono">0 Multas</div>
            <div className="text-[9px] sm:text-[10px] text-[#D4D6E6] font-mono uppercase tracking-wider">Garantía Activa</div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border-0 shadow-lg text-center transition">
            <div className="text-base sm:text-xl font-black text-[#807DFE] font-mono">AES-256</div>
            <div className="text-[9px] sm:text-[10px] text-[#D4D6E6] font-mono uppercase tracking-wider">Cifrado Bancario</div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border-0 shadow-lg text-center transition">
            <div className="text-base sm:text-xl font-black text-white font-mono">100% Digital</div>
            <div className="text-[9px] sm:text-[10px] text-[#D4D6E6] font-mono uppercase tracking-wider">Cero Monedas</div>
          </div>
        </div>

      </section>

    </div>
  );
}

export default StaggeredGrid;
