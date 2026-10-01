import React, { useRef, useState } from 'react';
import HeroText from './hero-shutter-text';
import CloudSky from './cloud-sky';
import { 
  CreditCard, 
  Zap, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2 
} from 'lucide-react';

export function StaggeredGrid({
  centerText = "BIENVENIDOS A PARQU",
  onSelectFeature,
  className = "",
}) {
  const containerRef = useRef(null);
  const [activeBento, setActiveBento] = useState(0);

  // Bento Items Principales
  const bentoList = [
    {
      id: 'bento-1',
      title: 'Autocobro Continuo',
      subtitle: '01. CERO FILAS • CERO MONEDAS',
      desc: 'El sistema debita de forma ininterrumpida el tiempo de estancia exacto en el parquímetro, protegiéndote automáticamente contra multas de tránsito.',
      icon: <Zap className="w-6 h-6 text-[#0033FF]" />,
      tag: 'CERO FILAS',
      actionTab: 'autopay'
    },
    {
      id: 'bento-2',
      title: 'Tarjeta Digital Oficial',
      subtitle: '02. PASE METROPOLITANO',
      desc: 'Tu credencial oficial con saldo protegido, sincronización instantánea y código QR para verificación directa de inspectores viales.',
      icon: <CreditCard className="w-6 h-6 text-[#807DFE]" />,
      tag: 'PASE DIGITAL',
      actionTab: 'dashboard'
    },
    {
      id: 'bento-3',
      title: 'Parquímetro en Tiempo Real',
      subtitle: '03. CONTROL DE ESTACIONAMIENTO',
      desc: 'Fija tu ubicación en el mapa satelital, ingresa tu número de parquímetro y monitorea el consumo segundo a segundo en vivo.',
      icon: <MapPin className="w-6 h-6 text-emerald-400" />,
      tag: 'PARQUÍMETRO',
      actionTab: 'dashboard'
    }
  ];

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden text-white ${className}`}>
      
      {/* ═══ 1. HERO SECTION CON ORIGINKIT CLOUD-SKY Y HERO SHUTTER TEXT ═══ */}
      <section className="relative z-10 min-h-[500px] sm:min-h-[560px] flex flex-col items-center justify-center text-center px-4 pt-12 pb-14 overflow-hidden">
        
        {/* Fondo Animado WebGL Cloud-Sky de OriginKit */}
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
          {/* Capas sutiles de sombreado y transición glassmorphism para contraste perfecto */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#01033E]/20 via-transparent to-[#01033E]/95 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#01033E] to-transparent pointer-events-none" />
        </div>

        {/* Badge Superior */}
        <div className="relative z-10 mb-4 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-[#01033E]/70 backdrop-blur-md border border-[#807DFE]/40 text-xs font-mono text-[#D4D6E6] shadow-[0_0_20px_rgba(0,51,255,0.25)]">
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
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#01033E]/60 backdrop-blur-md border border-white/10 text-center">
            <div className="text-base sm:text-xl font-black text-white font-mono">$0.25</div>
            <div className="text-[9px] sm:text-[10px] text-[#D4D6E6] font-mono uppercase tracking-wider">MXN por Minuto</div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#01033E]/60 backdrop-blur-md border border-white/10 text-center">
            <div className="text-base sm:text-xl font-black text-emerald-400 font-mono">0 Multas</div>
            <div className="text-[9px] sm:text-[10px] text-[#D4D6E6] font-mono uppercase tracking-wider">Garantía Activa</div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#01033E]/60 backdrop-blur-md border border-white/10 text-center">
            <div className="text-base sm:text-xl font-black text-[#807DFE] font-mono">AES-256</div>
            <div className="text-[9px] sm:text-[10px] text-[#D4D6E6] font-mono uppercase tracking-wider">Cifrado Bancario</div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#01033E]/60 backdrop-blur-md border border-white/10 text-center">
            <div className="text-base sm:text-xl font-black text-[#0033FF] font-mono">100% Digital</div>
            <div className="text-[9px] sm:text-[10px] text-[#D4D6E6] font-mono uppercase tracking-wider">Cero Monedas</div>
          </div>
        </div>

      </section>

      {/* ═══ 2. SECCIÓN BENTO EXPANDIBLE: PILARES DE LA PLATAFORMA ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 sm:pb-36 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#D4D6E6]">
            <Sparkles className="w-4 h-4 text-[#807DFE]" />
            <span className="font-bold text-white font-sans">Pilares de la Plataforma Metropolitana</span>
          </div>
          <span className="text-[11px] font-sans text-[#D4D6E6]/70">
            Pasa el cursor o haz clic en cualquier pilar para expandir
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-4 h-auto md:h-80 w-full">
          {bentoList.map((bento, index) => {
            const isActive = activeBento === index;
            return (
              <div
                key={bento.id}
                role="button"
                tabIndex={0}
                aria-label={`${bento.title} - ${bento.subtitle}`}
                onClick={() => {
                  setActiveBento(index);
                  if (onSelectFeature && bento.actionTab) {
                    onSelectFeature(bento.actionTab);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveBento(index);
                    if (onSelectFeature && bento.actionTab) {
                      onSelectFeature(bento.actionTab);
                    }
                  }
                }}
                onMouseEnter={() => setActiveBento(index)}
                className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer border flex flex-col justify-between backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#01033E] ${
                  isActive
                    ? 'md:w-3/5 bg-gradient-to-br from-[#01033E]/90 via-[#0033FF]/20 to-[#01033E]/90 border-[#807DFE]/50 shadow-[0_0_40px_rgba(0,51,255,0.3)]'
                    : 'md:w-1/5 bg-[#01033E]/40 border-white/10 hover:border-white/20 hover:bg-[#01033E]/60'
                }`}
              >
                {/* Glow ambiental */}
                {isActive && (
                  <div className="absolute -top-12 -right-12 w-60 h-60 bg-[#0033FF]/25 rounded-full blur-3xl pointer-events-none" />
                )}

                {/* Encabezado del Pilar */}
                <div className="flex items-center justify-between w-full relative z-10">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4D6E6] uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    {bento.tag}
                  </span>
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                    {bento.icon}
                  </div>
                </div>

                {/* Contenido del Pilar */}
                <div className="relative z-10 space-y-2 mt-6">
                  <span className="text-[11px] font-mono text-[#807DFE] tracking-wider block font-bold">
                    {bento.subtitle}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {bento.title}
                  </h3>
                  
                  {isActive && (
                    <p className="text-xs sm:text-sm text-[#D4D6E6] font-sans leading-relaxed pt-2 animate-in fade-in duration-300">
                      {bento.desc}
                    </p>
                  )}
                </div>

                {/* Botón de Acción en Activo */}
                {isActive && (
                  <div className="pt-6 relative z-10 flex items-center justify-between border-t border-white/10 text-xs font-sans text-white font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Módulo Disponible
                    </span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Abrir Módulo
                      <ChevronRight className="w-4 h-4 text-white" />
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

export default StaggeredGrid;
