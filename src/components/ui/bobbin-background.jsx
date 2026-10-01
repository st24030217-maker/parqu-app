import React from 'react';

/**
 * BobbinBackground - Sistema Cinético Horizontal ("Acostados") de Extremo a Extremo
 * Aplicado exactamente desde donde termina el fondo de nubes hasta donde termina el sistema ("hasta donde tope").
 * 
 * Características:
 * - 16 haces/cápsulas luminosas horizontales que cubren el 100% de la altura del sistema (de 2% a 97%).
 * - Desplazamiento fluido en parallax a 60/120 fps acelerado por GPU (izquierda/derecha).
 * - Colores oficiales: Azul Eléctrico (#0033FF), Lavanda Periwinkle (#807DFE), Plata Hielo (#D4D6E6) y Cian (#06B6D4).
 * - Fondo profundo continuo de extremo a extremo que demarca claramente el fin de las nubes y el inicio del sistema.
 * - Resplandor aurora eléctrico inferior que corona la base del sistema interactivo ("hasta donde tope").
 */
export const BobbinBackground = ({
  children,
  className = '',
  showElectricFade = true,
  showYellowFade,
}) => {
  const displayElectricFade = showYellowFade !== undefined ? showYellowFade : showElectricFade;

  // 16 haces / cápsulas cinéticas horizontales distribuidas a lo largo de TODA la altura del sistema
  const horizontalBeams = [
    // Bloque 1: Inicio del sistema (justo donde termina el fondo de nubes)
    {
      id: 1,
      top: '2%',
      left: '-4%',
      width: 540,
      height: 44,
      duration: '8.2s',
      delay: '0s',
      direction: 'right',
      gradient: 'linear-gradient(90deg, rgba(0,51,255,0.2) 0%, rgba(0,51,255,0.85) 30%, rgba(128,125,254,0.95) 70%, rgba(212,214,230,0.9) 100%)',
      glowColor: 'rgba(0, 51, 255, 0.85)',
      secondaryGlow: 'rgba(128, 125, 254, 0.60)',
    },
    {
      id: 2,
      top: '8%',
      right: '1%',
      width: 600,
      height: 48,
      duration: '9.4s',
      delay: '-2.1s',
      direction: 'left',
      gradient: 'linear-gradient(90deg, rgba(212,214,230,0.9) 0%, rgba(128,125,254,0.95) 40%, rgba(0,51,255,0.85) 80%, rgba(0,51,255,0.2) 100%)',
      glowColor: 'rgba(128, 125, 254, 0.85)',
      secondaryGlow: 'rgba(0, 51, 255, 0.65)',
    },
    {
      id: 3,
      top: '14%',
      left: '8%',
      width: 460,
      height: 40,
      duration: '7.8s',
      delay: '-4.3s',
      direction: 'right',
      gradient: 'linear-gradient(90deg, rgba(6,182,212,0.3) 0%, rgba(6,182,212,0.9) 35%, rgba(0,51,255,0.9) 75%, rgba(128,125,254,0.85) 100%)',
      glowColor: 'rgba(6, 182, 212, 0.85)',
      secondaryGlow: 'rgba(0, 51, 255, 0.60)',
    },

    // Bloque 2: Centro de Operaciones
    {
      id: 4,
      top: '21%',
      right: '5%',
      width: 660,
      height: 52,
      duration: '10.2s',
      delay: '-1.2s',
      direction: 'left',
      gradient: 'linear-gradient(90deg, rgba(0,51,255,0.85) 0%, rgba(128,125,254,0.95) 50%, rgba(212,214,230,0.95) 85%, rgba(212,214,230,0.2) 100%)',
      glowColor: 'rgba(0, 51, 255, 0.90)',
      secondaryGlow: 'rgba(128, 125, 254, 0.70)',
    },
    {
      id: 5,
      top: '28%',
      left: '3%',
      width: 510,
      height: 44,
      duration: '8.6s',
      delay: '-5.5s',
      direction: 'right',
      gradient: 'linear-gradient(90deg, rgba(128,125,254,0.3) 0%, rgba(128,125,254,0.9) 30%, rgba(212,214,230,0.95) 70%, rgba(0,51,255,0.8) 100%)',
      glowColor: 'rgba(128, 125, 254, 0.80)',
      secondaryGlow: 'rgba(212, 214, 230, 0.55)',
    },

    // Bloque 3: Selector Orbital 3D
    {
      id: 6,
      top: '35%',
      right: '2%',
      width: 700,
      height: 56,
      duration: '9.8s',
      delay: '-3.1s',
      direction: 'left',
      gradient: 'linear-gradient(90deg, rgba(6,182,212,0.9) 0%, rgba(0,51,255,0.95) 50%, rgba(128,125,254,0.85) 90%, rgba(128,125,254,0.2) 100%)',
      glowColor: 'rgba(0, 51, 255, 0.85)',
      secondaryGlow: 'rgba(6, 182, 212, 0.70)',
    },
    {
      id: 7,
      top: '42%',
      left: '6%',
      width: 550,
      height: 46,
      duration: '8.4s',
      delay: '-6.2s',
      direction: 'right',
      gradient: 'linear-gradient(90deg, rgba(0,51,255,0.2) 0%, rgba(128,125,254,0.85) 30%, rgba(0,51,255,0.95) 75%, rgba(6,182,212,0.85) 100%)',
      glowColor: 'rgba(128, 125, 254, 0.80)',
      secondaryGlow: 'rgba(0, 51, 255, 0.65)',
    },
    {
      id: 8,
      top: '48%',
      right: '7%',
      width: 580,
      height: 48,
      duration: '9.2s',
      delay: '-2.4s',
      direction: 'left',
      gradient: 'linear-gradient(90deg, rgba(212,214,230,0.9) 0%, rgba(0,51,255,0.95) 50%, rgba(128,125,254,0.8) 85%, rgba(0,51,255,0.2) 100%)',
      glowColor: 'rgba(0, 51, 255, 0.90)',
      secondaryGlow: 'rgba(128, 125, 254, 0.65)',
    },

    // Bloque 4: Pestañas y Módulos Centrales
    {
      id: 9,
      top: '55%',
      left: '2%',
      width: 610,
      height: 50,
      duration: '8.8s',
      delay: '-4.7s',
      direction: 'right',
      gradient: 'linear-gradient(90deg, rgba(6,182,212,0.2) 0%, rgba(0,51,255,0.85) 30%, rgba(128,125,254,0.95) 70%, rgba(212,214,230,0.9) 100%)',
      glowColor: 'rgba(6, 182, 212, 0.85)',
      secondaryGlow: 'rgba(0, 51, 255, 0.60)',
    },
    {
      id: 10,
      top: '62%',
      right: '4%',
      width: 530,
      height: 44,
      duration: '9.5s',
      delay: '-1.8s',
      direction: 'left',
      gradient: 'linear-gradient(90deg, rgba(128,125,254,0.85) 0%, rgba(0,51,255,0.95) 45%, rgba(6,182,212,0.9) 80%, rgba(6,182,212,0.2) 100%)',
      glowColor: 'rgba(128, 125, 254, 0.85)',
      secondaryGlow: 'rgba(6, 182, 212, 0.65)',
    },
    {
      id: 11,
      top: '69%',
      left: '5%',
      width: 650,
      height: 52,
      duration: '8.0s',
      delay: '-5.1s',
      direction: 'right',
      gradient: 'linear-gradient(90deg, rgba(0,51,255,0.2) 0%, rgba(212,214,230,0.85) 40%, rgba(128,125,254,0.95) 80%, rgba(0,51,255,0.9) 100%)',
      glowColor: 'rgba(0, 51, 255, 0.85)',
      secondaryGlow: 'rgba(128, 125, 254, 0.65)',
    },
    {
      id: 12,
      top: '76%',
      right: '3%',
      width: 560,
      height: 46,
      duration: '9.6s',
      delay: '-3.5s',
      direction: 'left',
      gradient: 'linear-gradient(90deg, rgba(212,214,230,0.9) 0%, rgba(128,125,254,0.95) 40%, rgba(0,51,255,0.85) 80%, rgba(0,51,255,0.2) 100%)',
      glowColor: 'rgba(128, 125, 254, 0.80)',
      secondaryGlow: 'rgba(0, 51, 255, 0.65)',
    },

    // Bloque 5: Final del sistema (hasta donde tope)
    {
      id: 13,
      top: '82%',
      left: '3%',
      width: 590,
      height: 48,
      duration: '8.5s',
      delay: '-2.0s',
      direction: 'right',
      gradient: 'linear-gradient(90deg, rgba(6,182,212,0.3) 0%, rgba(6,182,212,0.9) 35%, rgba(0,51,255,0.9) 75%, rgba(128,125,254,0.8) 100%)',
      glowColor: 'rgba(6, 182, 212, 0.85)',
      secondaryGlow: 'rgba(0, 51, 255, 0.60)',
    },
    {
      id: 14,
      top: '88%',
      right: '6%',
      width: 670,
      height: 54,
      duration: '10.0s',
      delay: '-4.2s',
      direction: 'left',
      gradient: 'linear-gradient(90deg, rgba(0,51,255,0.85) 0%, rgba(128,125,254,0.95) 50%, rgba(212,214,230,0.95) 85%, rgba(212,214,230,0.2) 100%)',
      glowColor: 'rgba(0, 51, 255, 0.90)',
      secondaryGlow: 'rgba(128, 125, 254, 0.70)',
    },
    {
      id: 15,
      top: '93%',
      left: '8%',
      width: 520,
      height: 42,
      duration: '8.2s',
      delay: '-1.0s',
      direction: 'right',
      gradient: 'linear-gradient(90deg, rgba(128,125,254,0.2) 0%, rgba(128,125,254,0.85) 30%, rgba(0,51,255,0.95) 75%, rgba(6,182,212,0.85) 100%)',
      glowColor: 'rgba(128, 125, 254, 0.80)',
      secondaryGlow: 'rgba(0, 51, 255, 0.65)',
    },
    {
      id: 16,
      top: '97%',
      right: '2%',
      width: 620,
      height: 50,
      duration: '9.0s',
      delay: '-3.8s',
      direction: 'left',
      gradient: 'linear-gradient(90deg, rgba(212,214,230,0.9) 0%, rgba(0,51,255,0.95) 50%, rgba(128,125,254,0.8) 85%, rgba(0,51,255,0.2) 100%)',
      glowColor: 'rgba(0, 51, 255, 0.85)',
      secondaryGlow: 'rgba(128, 125, 254, 0.60)',
    },
  ];

  return (
    <div className={`relative w-full overflow-hidden select-none bg-gradient-to-b from-[#01033E] via-[#010220] to-[#000114] ${className}`}>
      
      {/* ═══ 1. KEYFRAMES HORIZONTALES CINEMÁTICOS ACELERADOS POR GPU (60/120 FPS) ═══ */}
      <style>{`
        @keyframes beamGlideRight {
          0%, 100% {
            transform: translate3d(0, 0, 0) scaleX(1);
            opacity: 0.70;
          }
          50% {
            transform: translate3d(120px, -6px, 0) scaleX(1.35);
            opacity: 1;
          }
        }
        @keyframes beamGlideLeft {
          0%, 100% {
            transform: translate3d(0, 0, 0) scaleX(1);
            opacity: 0.70;
          }
          50% {
            transform: translate3d(-120px, 6px, 0) scaleX(1.35);
            opacity: 1;
          }
        }
        @keyframes electricAuroraPulse {
          0%, 100% {
            opacity: 0.75;
            transform: scaleY(1);
          }
          50% {
            opacity: 1;
            transform: scaleY(1.18);
          }
        }
        .beam-glide-right {
          animation: beamGlideRight ease-in-out infinite;
          will-change: transform, opacity;
        }
        .beam-glide-left {
          animation: beamGlideLeft ease-in-out infinite;
          will-change: transform, opacity;
        }
        .electric-aurora {
          animation: electricAuroraPulse 8s ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>

      {/* ═══ 2. TEXTURA SUTIL DE GRANO / RED METROPOLITANA ═══ */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#ffffff08_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-40"
        aria-hidden="true" 
      />

      {/* ═══ 3. HACES / CÁPSULAS HORIZONTALES ACOSTADAS DESDE EL 2% HASTA EL 97% ═══ */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {horizontalBeams.map((beam) => {
          const animationClass = beam.direction === 'right' ? 'beam-glide-right' : 'beam-glide-left';

          return (
            <div
              key={beam.id}
              className={`${animationClass} absolute rounded-full flex items-center justify-center`}
              style={{
                top: beam.top,
                left: beam.left,
                right: beam.right,
                width: `${beam.width}px`,
                height: `${beam.height}px`,
                animationDuration: beam.duration,
                animationDelay: beam.delay,
                background: beam.gradient,
                boxShadow: `0 0 55px ${beam.glowColor}, 0 0 110px ${beam.secondaryGlow}, inset 0 0 25px rgba(212, 214, 230, 0.7)`,
                border: '1px solid rgba(212, 214, 230, 0.40)',
              }}
            >
              {/* Núcleo de luz láser interna de alta pureza */}
              <div 
                className="w-[84%] h-[3px] rounded-full blur-[0.5px]"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.98) 50%, transparent 100%)',
                  boxShadow: '0 0 14px #FFFFFF, 0 0 28px #807DFE',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ═══ 4. HORIZONTE RADIANTE AZUL ELÉCTRICO & PERIWINKLE HASTA DONDE TOPE EL SISTEMA ═══ */}
      {displayElectricFade && (
        <div
          className="electric-aurora pointer-events-none absolute inset-x-0 bottom-0 h-[600px] max-h-[55%] z-0 select-none"
          style={{
            background: 'radial-gradient(147.57% 102.54% at 50% 100%, rgba(0, 51, 255, 0.85) 15%, rgba(128, 125, 254, 0.60) 45%, rgba(6, 182, 212, 0.30) 75%, transparent 100%)',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />
      )}

      {/* ═══ 5. CONTENIDO DEL SISTEMA INTERACTIVO (Z-INDEX 10) ═══ */}
      <div className="relative z-10 w-full">
        {children}
      </div>

    </div>
  );
};

export default BobbinBackground;
