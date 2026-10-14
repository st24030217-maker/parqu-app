import React, { useRef, memo } from 'react';
import HeroText from './hero-shutter-text';
import CloudSky from './cloud-sky';

export const StaggeredGrid = memo(function StaggeredGrid({
  centerText = "BIENVENIDOS A PARQU",
  onSelectFeature,
  className = "",
}) {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden text-white ${className}`}>
      
      {/* ═══ 1. HERO SECTION CON ORIGINKIT CLOUD-SKY Y ESTRUCTURA KAGE STUDIO ═══ */}
      <section className="relative z-10 min-h-[430px] sm:min-h-[620px] flex flex-col items-center justify-center text-center px-4 pt-24 sm:pt-32 pb-16 sm:pb-28 overflow-hidden">
        
        {/* Fondo Animado WebGL Cloud-Sky de OriginKit con la paleta original (#01033E, #0033FF, #D4D6E6, #807DFE) */}
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
            pauseWhenLoading={true}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#01033E]/20 via-transparent to-[#01033E]/95 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-[#01033E] to-transparent pointer-events-none" />
        </div>

        {/* Eyebrow Pill Monospace */}
        <div className="relative z-10 mb-4 sm:mb-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#01033E]/60 backdrop-blur-sm border border-[#D4D6E6]/15 text-[11px] sm:text-xs font-mono uppercase tracking-[0.14em] text-[#D4D6E6] shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>SISTEMA INTELIGENTE DE PARQUÍMETROS</span>
          <span className="text-[#807DFE] hidden xs:inline">•</span>
          <span className="text-[#807DFE] font-bold hidden xs:inline">V2.6 RELEASE</span>
        </div>

        {/* Display Headline (-2% tracking) */}
        <div className="relative z-10 max-w-5xl mx-auto w-full tracking-[-0.02em]">
          <HeroText
            text={centerText}
            className="bg-transparent"
          />
        </div>

        {/* Subcopy */}
        <p className="relative z-10 mt-3 sm:mt-5 text-[14px] sm:text-[16px] md:text-[17px] text-[#D4D6E6] font-sans max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          La plataforma metropolitana que elimina las filas y las monedas. Autocobro continuo a{' '}
          <span className="text-white font-mono font-bold">$6.00/hr</span> con tecnología NFC y base de datos en tiempo real de{' '}
          <strong className="text-white font-semibold">SSS.Solutions</strong>.
        </p>

        {/* Two CTAs: Primary Filled (#0033FF) + Secondary Ghost Hairline */}
        <div className="relative z-10 mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onSelectFeature && onSelectFeature('dashboard')}
            className="h-10 px-4 rounded-[8px] bg-[#0033FF] hover:bg-[#1a47ff] text-white text-xs sm:text-[13px] font-sans font-semibold transition-colors duration-150 cursor-pointer border-0 shadow-lg"
          >
            Iniciar Parquímetro Digital
          </button>
          <button
            type="button"
            onClick={() => onSelectFeature && onSelectFeature('autopay')}
            className="h-10 px-4 rounded-[8px] bg-[#01033E]/55 backdrop-blur-sm border border-[#D4D6E6]/20 hover:border-[#D4D6E6]/40 text-[#D4D6E6] hover:text-white text-xs sm:text-[13px] font-sans font-medium transition-colors duration-150 cursor-pointer"
          >
            Configurar Autocobro
          </button>
        </div>

        {/* Platform / Compatibility Note */}
        <p className="relative z-10 mt-3 text-[11px] font-mono uppercase tracking-[0.12em] text-[#D4D6E6]/80">
          Compatible con iOS • Android • NFC AES-256 • XAMPP MySQL & Web Push
        </p>

        {/* Barra de Estadísticas Clave */}
        <div className="relative z-10 mt-7 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-4xl w-full mx-auto px-1 sm:px-4">
          <div className="p-3 sm:p-4 rounded-[14px] bg-[#01033E]/60 hover:bg-[#01033E]/75 backdrop-blur-sm border border-[#D4D6E6]/15 shadow-lg text-center transition-colors">
            <div className="text-base sm:text-xl font-black text-white font-mono tracking-tight">$6.00</div>
            <div className="mt-0.5 text-[9px] sm:text-[11px] text-[#D4D6E6] font-mono uppercase tracking-[0.1em]">MXN por Hora</div>
          </div>
          <div className="p-3 sm:p-4 rounded-[14px] bg-[#01033E]/60 hover:bg-[#01033E]/75 backdrop-blur-sm border border-[#D4D6E6]/15 shadow-lg text-center transition-colors">
            <div className="text-base sm:text-xl font-black text-emerald-400 font-mono tracking-tight">NFC Activo</div>
            <div className="mt-0.5 text-[9px] sm:text-[11px] text-[#D4D6E6] font-mono uppercase tracking-[0.1em]">Sin Contacto</div>
          </div>
          <div className="p-3 sm:p-4 rounded-[14px] bg-[#01033E]/60 hover:bg-[#01033E]/75 backdrop-blur-sm border border-[#D4D6E6]/15 shadow-lg text-center transition-colors">
            <div className="text-base sm:text-xl font-black text-[#807DFE] font-mono tracking-tight">AES-256</div>
            <div className="mt-0.5 text-[9px] sm:text-[11px] text-[#D4D6E6] font-mono uppercase tracking-[0.1em]">Cifrado Bancario</div>
          </div>
          <div className="p-3 sm:p-4 rounded-[14px] bg-[#01033E]/60 hover:bg-[#01033E]/75 backdrop-blur-sm border border-[#D4D6E6]/15 shadow-lg text-center transition-colors">
            <div className="text-base sm:text-xl font-black text-white font-mono tracking-tight">MySQL Live</div>
            <div className="mt-0.5 text-[9px] sm:text-[11px] text-[#D4D6E6] font-mono uppercase tracking-[0.1em]">XAMPP + Cloud</div>
          </div>
        </div>

      </section>

    </div>
  );
});

export default StaggeredGrid;
