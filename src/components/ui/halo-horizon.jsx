import React from "react";
import { cn } from "../../lib/utils";

/**
 * HaloHorizon - Fondo de horizonte luminoso blanco y azul.
 * Arcos elípticos concéntricos con núcleo blanco resplandeciente,
 * halo celeste eléctrico y velo azul cobalto sobre fondo azul profundo (#01033E).
 * 
 * Totalmente autónomo y optimizado para actuar como fondo ("pointer-events-none")
 * sin interrumpir ninguna interacción o función del sistema.
 */

const haloCss = `
.hh-stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(130% 90% at 50% 0%, #030d45 0%, #01062c 40%, #01033E 75%, #000216 100%);
  font-family: 'Satoshi', system-ui, sans-serif;
  isolation: isolate;
}

/* Contenedor animado para los 4 arcos de luz */
.hh-glow {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  isolation: isolate;
  pointer-events: none;
  z-index: 0;
  will-change: transform, opacity, filter;
  animation: hh-rise 5.6s infinite both;
}

/* Direcciones por variante */
.hh-glow[data-variant="top"] {
  --t-enter: translate(0, -100%) scale(1, 1.5);
  --t-rest: translate(0, -50%) scale(1, 1);
  --a-enter: translate(0, -40%);
}
.hh-glow[data-variant="bottom"] {
  --t-enter: translate(0, 100%) scale(1, 1.5);
  --t-rest: translate(0, 50%) scale(1, 1);
  --a-enter: translate(0, 40%);
}
.hh-glow[data-variant="left"] {
  --t-enter: translate(100%, 0) scale(1.5, 1);
  --t-rest: translate(50%, 0) scale(1, 1);
  --a-enter: translate(40%, 0);
}
.hh-glow[data-variant="right"] {
  --t-enter: translate(-100%, 0) scale(1.5, 1);
  --t-rest: translate(-50%, 0) scale(1, 1);
  --a-enter: translate(-40%, 0);
}

/* Base de arco compartido */
.hh-arc {
  position: absolute;
  inset: 0;
  border-radius: 100%;
  will-change: transform;
}

/* 1. Núcleo blanco resplandeciente */
.hh-core {
  scale: 1.32;
  background: #ffffff;
  box-shadow: 0 -4px 32px 0 rgba(255, 255, 255, 0.95), 0 -8px 50px 0 rgba(128, 125, 254, 0.7);
}

/* 2. Halo azul celeste / azure luminoso */
.hh-azure {
  scale: 1.20;
  background: #60a5fa;
  filter: blur(31px);
  box-shadow: 0 0 60px rgba(96, 165, 250, 0.85);
  animation: hh-arc 5.6s infinite both;
}

/* 3. Arco azul cobalto vibrante (#0033FF) */
.hh-cobalt {
  scale: 1.24;
  background: #0033FF;
  filter: blur(21px);
  box-shadow: 0 0 75px rgba(0, 51, 255, 0.9);
  animation: hh-arc 5.6s infinite both;
}

/* 4. Máscara oscura (#01033E) que recorta el horizonte */
.hh-mask {
  scale: 1.20;
  background: #01033E;
  filter: blur(51px);
  animation: hh-arc 5.6s infinite both;
}

@keyframes hh-rise {
  0% {
    transform: var(--t-enter);
    opacity: 0;
    filter: blur(15px);
    animation-timing-function: cubic-bezier(.16, 1, .3, 1);
  }
  36% {
    transform: var(--t-rest);
    opacity: 1;
    filter: blur(0);
    animation-timing-function: linear;
  }
  70% {
    transform: var(--t-rest);
    opacity: 1;
    filter: blur(0);
    animation-timing-function: cubic-bezier(.7, 0, .84, 0);
  }
  100% {
    transform: var(--t-enter);
    opacity: 0;
    filter: blur(15px);
  }
}

@keyframes hh-arc {
  0% {
    transform: var(--a-enter);
    animation-timing-function: cubic-bezier(.16, 1, .3, 1);
  }
  36% {
    transform: translate(0, 0);
  }
  70% {
    transform: translate(0, 0);
    animation-timing-function: cubic-bezier(.7, 0, .84, 0);
  }
  100% {
    transform: var(--a-enter);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hh-glow {
    animation: none;
    transform: var(--t-rest);
    opacity: 1;
    filter: none;
  }
  .hh-azure,
  .hh-cobalt,
  .hh-mask {
    animation: none;
    transform: translate(0, 0);
  }
}
`;

export function HaloHorizon({
  children,
  className,
  variant = "top",
}) {
  return (
    <div
      className={cn("hh-stage", className)}
      aria-label="Halo glowing horizon background"
    >
      <style>{haloCss}</style>

      {/* Capa de Horizonte Luminoso en Blanco y Azul (pointer-events-none para no obstruir funciones) */}
      <div
        className="hh-glow"
        data-variant={variant}
        aria-hidden="true"
      >
        <div className="hh-arc hh-core" />
        <div className="hh-arc hh-azure" />
        <div className="hh-arc hh-cobalt" />
        <div className="hh-arc hh-mask" />
      </div>

      {/* Trama sutil de puntos para acabado obsidian */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff0a_1.2px,transparent_1.2px)] [background-size:24px_24px] z-0 opacity-40"
        aria-hidden="true"
      />

      {/* Contenido interactivo principal */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

export default HaloHorizon;
