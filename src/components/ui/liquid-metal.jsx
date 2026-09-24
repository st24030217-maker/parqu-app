import React, { memo, forwardRef } from "react";
import { LiquidMetal as LiquidMetalShader } from "@paper-design/shaders-react";
import { cn } from "../../lib/utils";

// ============================================================================
// LiquidMetal - Base shader wrapper component
// ============================================================================

export const LiquidMetal = memo(function LiquidMetal({
  colorBack = "#888888",
  colorTint = "#ffffff",
  speed = 0.5,
  repetition = 4,
  distortion = 0.15,
  scale = 1,
  className,
  style,
}) {
  return (
    <div
      className={cn("absolute inset-0 z-0 overflow-hidden pointer-events-none", className)}
      style={style}
    >
      <LiquidMetalShader
        colorBack={colorBack}
        colorTint={colorTint}
        speed={speed}
        repetition={repetition}
        distortion={distortion}
        softness={0}
        shiftRed={0.3}
        shiftBlue={-0.3}
        angle={45}
        shape="none"
        scale={scale}
        fit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
});

LiquidMetal.displayName = "LiquidMetal";

// ============================================================================
// LiquidMetalButton - Botón con efecto shader de Metal Líquido cromado
// ============================================================================

export const LiquidMetalButton = forwardRef(
  (
    {
      children,
      icon,
      borderWidth = 3,
      metalConfig,
      size = "md",
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: "py-2.5 px-6 gap-2.5 text-sm",
      md: "py-3.5 px-8 gap-3 text-base",
      lg: "py-4 px-10 gap-4 text-lg",
    };

    const iconSizes = {
      sm: "w-7 h-7",
      md: "w-9 h-9",
      lg: "w-11 h-11",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "relative group cursor-pointer border-none bg-transparent p-0 outline-none transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        <div
          className="relative rounded-full overflow-hidden shadow-[0_0_35px_rgba(255,255,255,0.25)] group-hover:shadow-[0_0_50px_rgba(255,255,255,0.45)] transition-shadow duration-300"
          style={{ padding: borderWidth }}
        >
          {/* Capa de shader de Metal Líquido animado en el borde */}
          <LiquidMetal
            colorBack={metalConfig?.colorBack ?? "#222226"}
            colorTint={metalConfig?.colorTint ?? "#ffffff"}
            speed={metalConfig?.speed ?? 0.6}
            repetition={metalConfig?.repetition ?? 4}
            distortion={metalConfig?.distortion ?? 0.25}
            scale={metalConfig?.scale ?? 1}
            className="absolute inset-0 z-0 rounded-full"
          />

          {/* Cuerpo interior del botón */}
          <div
            className={cn(
              "relative z-10 rounded-full flex items-center justify-center font-mono font-bold tracking-wide",
              "bg-black text-white",
              "border border-white/20 group-hover:border-white/40",
              "transition-all duration-200",
              "group-hover:bg-neutral-950",
              sizeStyles[size]
            )}
          >
            {icon && (
              <div
                className={cn(
                  "rounded-full flex items-center justify-center",
                  "bg-white/10 text-white",
                  "border border-white/20",
                  iconSizes[size]
                )}
              >
                {icon}
              </div>
            )}
            <span className="font-bold tracking-wide text-white drop-shadow-sm">
              {children}
            </span>
          </div>
        </div>
      </button>
    );
  }
);

LiquidMetalButton.displayName = "LiquidMetalButton";

export default LiquidMetalButton;
