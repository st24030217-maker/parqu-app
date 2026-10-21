"use client"

import React from "react"
import { AnimatedGradient } from "@/components/fancy/background/animated-gradient-with-svg"

/**
 * BentoCard interactiva con fondo de AnimatedGradient con SVG
 */
export const BentoCard = ({
  title,
  subtitle,
  description,
  buttonText,
  onButtonClick,
  align = "left",
  gradientColors = ["#0033FF", "#0055FF", "#807DFE"],
  baseBgColor = "bg-[#01033E]",
  speed = 10,
  blur = "medium",
  icon: Icon,
  badge,
  className = "",
}) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl min-h-[140px] sm:min-h-[190px] w-full h-full flex flex-col justify-between p-4 sm:p-6 font-medium border border-white/10 shadow-lg shadow-blue-950/20 transition-all duration-300 hover:scale-[1.01] hover:border-white/20 ${className}`}
    >
      {/* Fondo degradado animado SVG */}
      <span className={`absolute inset-0 z-0 pointer-events-none ${baseBgColor}`}>
        <AnimatedGradient colors={gradientColors} speed={speed} blur={blur} />
      </span>

      {/* Resplandor overlay sutil para legibilidad de texto */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/45 via-transparent to-black/20 pointer-events-none" />

      {/* Contenido interactivo */}
      <div
        className={`relative z-10 flex-1 ${
          align === "center" ? "items-center text-center" : "items-start text-left"
        } flex flex-col justify-between w-full h-full`}
      >
        <div className="w-full">
          <div className="flex items-center justify-between gap-2 mb-1">
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                {badge}
              </span>
            )}
            {Icon && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white ml-auto">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
          </div>

          <div className="text-white text-sm sm:text-base md:text-lg font-black tracking-tight leading-snug">
            {title}
          </div>
          {subtitle && (
            <div className="text-white/85 text-[11px] sm:text-xs font-medium mt-0.5">
              {subtitle}
            </div>
          )}
        </div>

        {description && (
          <div className="text-white/90 text-[11px] sm:text-xs mt-3 mb-2 text-pretty leading-relaxed font-normal">
            {description}
          </div>
        )}

        {buttonText && (
          <button
            type="button"
            onClick={onButtonClick}
            className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/95 hover:bg-white text-[#01033E] text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.98] inline-flex items-center gap-1.5"
          >
            <span>{buttonText}</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default BentoCard
