import React, { memo, forwardRef, useState, useEffect } from "react";
import { cn } from "../../lib/utils";

// ============================================================================
// LiquidMetal - Shader con fallback ultra robusto
// ============================================================================

export const LiquidMetal = memo(function LiquidMetal({
  colorBack = "#1a1a1f",
  colorTint = "#ffffff",
  speed = 0.6,
  repetition = 4,
  distortion = 0.25,
  scale = 1,
  className,
  style,
}) {
  const [ShaderComponent, setShaderComponent] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      import("@paper-design/shaders-react")
        .then((mod) => {
          if (mod && mod.LiquidMetal) {
            setShaderComponent(() => mod.LiquidMetal);
          }
        })
        .catch(() => {
          setHasError(true);
        });
    } catch {
      setHasError(true);
    }
  }, []);

  if (hasError || !ShaderComponent) {
    // Fallback de Metal Líquido animado con CSS puro de alto rendimiento
    return (
      <div
        className={cn(
          "absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-full animate-pulse",
          className
        )}
        style={{
          background: "linear-gradient(135deg, #222226 0%, #44444a 25%, #ffffff 50%, #222226 75%, #ffffff 100%)",
          backgroundSize: "300% 300%",
          animation: "liquidShimmer 4s ease infinite",
          ...style,
        }}
      />
    );
  }

  const Comp = ShaderComponent;
  return (
    <div
      className={cn("absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-full", className)}
      style={style}
    >
      <Comp
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
// LiquidMetalButton - Botón interactivo con efecto shader cromado
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
      lg: "py-4 px-10 gap-4 text-base sm:text-lg",
    };

    const iconSizes = {
      sm: "w-7 h-7",
      md: "w-8 h-8",
      lg: "w-9 h-9",
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
          className="relative rounded-full overflow-hidden shadow-[0_0_35px_rgba(255,255,255,0.25)] group-hover:shadow-[0_0_55px_rgba(255,255,255,0.5)] transition-shadow duration-300"
          style={{ padding: borderWidth }}
        >
          {/* Capa de shader de Metal Líquido animado en el borde */}
          <LiquidMetal
            colorBack={metalConfig?.colorBack ?? "#1a1a1f"}
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
            <span className="font-bold tracking-wider text-white drop-shadow-sm">
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
