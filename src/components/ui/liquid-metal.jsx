import React, { memo, forwardRef, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

// ============================================================================
// LiquidMetal - Shader de Metal Líquido Fluido (Canvas 2D Ultra-Rápido & CSS)
// ============================================================================

export const LiquidMetal = memo(function LiquidMetal({
  colorBack = "#111116",
  colorTint = "#ffffff",
  speed = 0.8,
  distortion = 0.3,
  className,
  style,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = canvas.clientWidth || 200;
      height = canvas.clientHeight || 60;
      canvas.width = width;
      canvas.height = height;
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      time += 0.025 * speed;
      ctx.clearRect(0, 0, width, height);

      // Fondo metálico obsidian
      const grad = ctx.createLinearGradient(0, 0, width, height);
      
      const p1 = (Math.sin(time) * 0.5 + 0.5);
      const p2 = (Math.cos(time * 0.8) * 0.5 + 0.5);
      const p3 = (Math.sin(time * 1.2 + 2) * 0.5 + 0.5);

      grad.addColorStop(0, colorBack);
      grad.addColorStop(Math.min(0.9, Math.max(0.1, p1 * 0.4 + 0.1)), "#2a2a32");
      grad.addColorStop(Math.min(0.95, Math.max(0.2, p2 * 0.5 + 0.25)), colorTint);
      grad.addColorStop(Math.min(0.99, Math.max(0.4, p3 * 0.4 + 0.5)), "#1a1a20");
      grad.addColorStop(1, colorBack);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Líneas de reflejo mercurio fluido
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      const waveY = height * 0.5 + Math.sin(time * 2) * (height * 0.25 * distortion);
      ctx.ellipse(width * (0.5 + Math.cos(time) * 0.3), waveY, width * 0.45, height * 0.35, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [colorBack, colorTint, speed, distortion]);

  return (
    <div
      className={cn("absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-full", className)}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
});

LiquidMetal.displayName = "LiquidMetal";

// ============================================================================
// LiquidMetalButton - Botón interactivo con efecto metal líquido
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
          className="relative rounded-full overflow-hidden shadow-[0_0_35px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_55px_rgba(255,255,255,0.6)] transition-shadow duration-300"
          style={{ padding: borderWidth }}
        >
          {/* Capa de shader de Metal Líquido animado en el borde */}
          <LiquidMetal
            colorBack={metalConfig?.colorBack ?? "#111116"}
            colorTint={metalConfig?.colorTint ?? "#ffffff"}
            speed={metalConfig?.speed ?? 0.8}
            distortion={metalConfig?.distortion ?? 0.3}
            className="absolute inset-0 z-0 rounded-full"
          />

          {/* Cuerpo interior del botón */}
          <div
            className={cn(
              "relative z-10 rounded-full flex items-center justify-center font-mono font-bold tracking-wide",
              "bg-black text-white",
              "border border-white/20 group-hover:border-white/50",
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
