import React from "react";
import { cn } from "../../lib/utils";

export function RadialGlowButton({
  children = "Empecemos",
  className,
  onClick,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "relative group inline-flex items-center justify-center px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-mono text-sm sm:text-base font-bold text-white transition-all duration-300 transform active:scale-95 overflow-hidden shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.65)] cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {/* Aura de resplandor blanco suave exterior */}
      <span className="absolute -inset-0.5 rounded-full bg-white/20 blur-sm opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Contorno Blanco Puro (Borde exterior nítido) */}
      <span className="absolute inset-0 bg-white rounded-full transition-colors" />
      
      {/* Fondo interior negro */}
      <span className="absolute inset-[2px] bg-black rounded-full group-hover:bg-neutral-950 transition-colors" />

      {/* Haz de luz animado al pasar el cursor */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      {/* Contenido del botón */}
      <span className="relative z-10 flex items-center justify-center gap-2.5 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
        {children}
      </span>
    </button>
  );
}

export default RadialGlowButton;
