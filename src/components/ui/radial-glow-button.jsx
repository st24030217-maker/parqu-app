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
        "relative group inline-flex items-center justify-center px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-sans text-sm sm:text-base font-bold text-white transition-all duration-300 transform active:scale-95 overflow-hidden shadow-[0_0_30px_rgba(0,51,255,0.7)] hover:shadow-[0_0_45px_rgba(128,125,254,0.6)] cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {/* Aura de resplandor suave exterior */}
      <span className="absolute -inset-0.5 rounded-full bg-[#807DFE]/40 blur-sm opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Contorno exterior */}
      <span className="absolute inset-0 bg-gradient-to-r from-[#0033FF] via-[#807DFE] to-[#0033FF] rounded-full transition-colors" />
      
      {/* Fondo interior */}
      <span className="absolute inset-[2px] bg-[#0033FF] rounded-full group-hover:bg-[#2250ff] transition-colors" />

      {/* Haz de luz animado al pasar el cursor */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#D4D6E6]/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      {/* Contenido del botón */}
      <span className="relative z-10 flex items-center justify-center gap-2.5 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]">
        {children}
      </span>
    </button>
  );
}

export default RadialGlowButton;
