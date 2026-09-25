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
        "relative group inline-flex items-center justify-center px-8 py-3.5 sm:px-10 sm:py-4 rounded-full font-mono text-sm sm:text-base font-bold text-white transition-all duration-300 transform active:scale-95 overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_45px_rgba(147,51,234,0.6)] cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {/* Fondo con Conic Border Beam y Aurora */}
      <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full animate-pulse opacity-90 group-hover:opacity-100 transition-opacity" />
      
      {/* Resplandor radial interno */}
      <span className="absolute inset-[2px] bg-neutral-950 rounded-full group-hover:bg-neutral-900 transition-colors" />

      {/* Haz de luz animado */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      {/* Contenido del botón */}
      <span className="relative z-10 flex items-center justify-center gap-2.5 text-white drop-shadow-md">
        {children}
      </span>
    </button>
  );
}

export default RadialGlowButton;
