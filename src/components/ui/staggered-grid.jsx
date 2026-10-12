import React, { useRef, memo } from 'react';
import HeroText from './hero-shutter-text';
import CloudSky from './cloud-sky';
import { ArrowRight, Wifi } from 'lucide-react';

export const StaggeredGrid = memo(function StaggeredGrid({
  centerText = "BIENVENIDOS A PARQU",
  onSelectFeature,
  className = "",
}) {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden bg-[#0a0a0d] text-white ${className}`}>
      
      {/* ═══ 1. HERO SECTION CON RADIAL VIOLET GLOW (#8b5cf6) Y ESTÉTICA KAGE STUDIO ═══ */}
      <section className="relative z-10 min-h-[430px] sm:min-h-[620px] flex flex-col items-center justify-center text-center px-3 sm:px-4 pt-14 sm:pt-24 pb-14 sm:pb-24 overflow-hidden">
        
        {/* Fondo WebGL Cloud-Sky adaptado al lienzo #0a0a0d y acento violeta #8b5cf6 */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto opacity-55">
          <CloudSky 
            background="#0a0a0d"
            baseColor="#8b5cf6"
            accentColor="#a78bfa"
            density={72}
            speed={36}
            size={125}
            clouds={{ softness: 88, shadow: 85, cirrus: 35 }}
            sun={{ x: 50, y: 78, glow: "rgba(139, 92, 246, 0.75)" }}
            pointer={{ parallax: 110, wind: 85, damping: 25 }}
            pauseWhenLoading={true}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0d]/50 via-transparent to-[#0a0a0d] pointer-events-none" />
        </div>

        {/* Single Radial Violet Glow reserved for the Hero */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] sm:w-[860px] h-[360px] sm:h-[520px] pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.24) 0%, rgba(139, 92, 246, 0.07) 45%, transparent 72%)',
          }}
        />

        {/* Monospace Eyebrow Pill */}
        <div className="relative z-10 mb-4 sm:mb-5 inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-[#0d0d11]/90 border border-white/[0.08] text-[11px] sm:text-xs font-mono text-[#a1a1aa]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] shrink-0" />
          <span className="tracking-[0.14em] uppercase font-medium text-[#e4e4e7] text-[10px] sm:text-[11px]">
            SISTEMA INTELIGENTE DE PARQUÍMETROS
          </span>
          <span className="text-white/20 hidden xs:inline">•</span>
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#a78bfa] hidden xs:inline tracking-wider">
            2026 STUDIO
          </span>
        </div>

        {/* Display Headline with -2% tracking */}
        <div className="relative z-10 max-w-5xl mx-auto w-full tracking-[-0.02em]">
          <HeroText
            text={centerText}
            className="bg-transparent"
          />
        </div>

        {/* Muted Subcopy (#a1a1aa) */}
        <p className="relative z-10 mt-3 sm:mt-4 text-xs sm:text-base text-[#a1a1aa] font-sans max-w-2xl mx-auto leading-relaxed px-2 sm:px-4">
          La plataforma metropolitana que elimina las filas y las monedas. Autocobro continuo a <span className="text-white font-mono">$6.00/hr</span> con verificación NFC y telemetría en vivo de <strong className="text-white font-semibold">SSS.Solutions</strong>.
        </p>

        {/* Two CTAs: Filled Violet Primary + Ghost Hairline Secondary */}
        <div className="relative z-10 mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onSelectFeature && onSelectFeature('dashboard')}
            className="h-10 px-4 rounded-lg bg-[#8b5cf6] hover:bg-[#9b6ff7] text-white text-xs sm:text-[13px] font-semibold transition-all flex items-center gap-2 cursor-pointer border-0 shadow-[0_0_24px_rgba(139,92,246,0.35)]"
          >
            <span>Iniciar Parquímetro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onSelectFeature && onSelectFeature('autopay')}
            className="h-10 px-4 rounded-lg bg-transparent border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.03] text-[#e4e4e7] hover:text-white text-xs sm:text-[13px] font-medium transition-all flex items-center gap-2 cursor-pointer"
          >
            <Wifi className="w-3.5 h-3.5 rotate-90 text-[#a78bfa]" />
            <span>Configurar Autocobro</span>
          </button>
        </div>

        {/* Small Muted Platform / Compatibility Note */}
        <div className="relative z-10 mt-3 text-[11px] font-mono text-[#71717a] tracking-wide">
          Compatible con iOS, Android, Web Push (VAPID) y terminales NFC municipales
        </div>

        {/* Barra de Estadísticas Clave con bordes hairline 1px white/8% */}
        <div className="relative z-10 mt-7 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-4xl w-full mx-auto px-1 sm:px-4">
          <div className="p-3 sm:p-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] text-center transition-colors">
            <div className="text-sm sm:text-xl font-bold text-white font-mono">$6.00</div>
            <div className="text-[9px] sm:text-[10px] text-[#a1a1aa] font-mono uppercase tracking-wider mt-0.5">MXN por Hora</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] text-center transition-colors">
            <div className="text-sm sm:text-xl font-bold text-[#a78bfa] font-mono">NFC Activo</div>
            <div className="text-[9px] sm:text-[10px] text-[#a1a1aa] font-mono uppercase tracking-wider mt-0.5">Sin Contacto</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] text-center transition-colors">
            <div className="text-sm sm:text-xl font-bold text-white font-mono">AES-256</div>
            <div className="text-[9px] sm:text-[10px] text-[#a1a1aa] font-mono uppercase tracking-wider mt-0.5">Cifrado Bancario</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] hover:border-white/[0.15] text-center transition-colors">
            <div className="text-sm sm:text-xl font-bold text-[#a78bfa] font-mono">100% Digital</div>
            <div className="text-[9px] sm:text-[10px] text-[#a1a1aa] font-mono uppercase tracking-wider mt-0.5">Cero Monedas</div>
          </div>
        </div>

      </section>

    </div>
  );
});

export default StaggeredGrid;
