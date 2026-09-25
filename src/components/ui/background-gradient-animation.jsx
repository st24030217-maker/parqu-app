import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

/**
 * BackgroundGradientAnimation - Aceternity UI component
 * High performance fluid aurora gradient background with zero re-render overhead
 */
export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(5, 5, 10)",
  gradientBackgroundEnd = "rgb(0, 0, 0)",
  firstColor = "45, 85, 255",     // Indigo vibrante
  secondColor = "147, 51, 234",   // Púrpura royal
  thirdColor = "6, 182, 212",     // Cian / Turquesa
  fourthColor = "99, 102, 241",   // Azul ultramar
  fifthColor = "168, 85, 247",    // Violeta
  pointerColor = "59, 130, 246",  // Azul eléctrico para cursor
  size = "70%",
  blendingValue = "screen",
  children,
  className,
  interactive = true,
  containerClassName,
}) => {
  const interactiveRef = useRef(null);
  const curXRef = useRef(0);
  const curYRef = useRef(0);
  const tgXRef = useRef(0);
  const tgYRef = useRef(0);

  useEffect(() => {
    document.body.style.setProperty(
      "--gradient-background-start",
      gradientBackgroundStart
    );
    document.body.style.setProperty(
      "--gradient-background-end",
      gradientBackgroundEnd
    );
    document.body.style.setProperty("--first-color", firstColor);
    document.body.style.setProperty("--second-color", secondColor);
    document.body.style.setProperty("--third-color", thirdColor);
    document.body.style.setProperty("--fourth-color", fourthColor);
    document.body.style.setProperty("--fifth-color", fifthColor);
    document.body.style.setProperty("--pointer-color", pointerColor);
    document.body.style.setProperty("--size", size);
    document.body.style.setProperty("--blending-value", blendingValue);
  }, [
    gradientBackgroundStart,
    gradientBackgroundEnd,
    firstColor,
    secondColor,
    thirdColor,
    fourthColor,
    fifthColor,
    pointerColor,
    size,
    blendingValue,
  ]);

  // Loop de animación fluido y eficiente sin provocar re-renders en React
  useEffect(() => {
    let animFrame;
    const move = () => {
      if (interactiveRef.current) {
        curXRef.current += (tgXRef.current - curXRef.current) / 20;
        curYRef.current += (tgYRef.current - curYRef.current) / 20;
        interactiveRef.current.style.transform = `translate(${Math.round(
          curXRef.current
        )}px, ${Math.round(curYRef.current)}px)`;
      }
      animFrame = requestAnimationFrame(move);
    };
    animFrame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const handleMouseMove = (event) => {
    if (interactiveRef.current && interactiveRef.current.parentElement) {
      const rect = interactiveRef.current.parentElement.getBoundingClientRect();
      tgXRef.current = event.clientX - rect.left;
      tgYRef.current = event.clientY - rect.top;
    }
  };

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "relative min-h-screen w-full overflow-hidden bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
        containerClassName
      )}
    >
      <style>{`
        @keyframes moveInCircle {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes moveVertical {
          0% { transform: translateY(-50%); }
          50% { transform: translateY(50%); }
          100% { transform: translateY(-50%); }
        }
        @keyframes moveHorizontal {
          0% { transform: translateX(-50%) translateY(-10%); }
          50% { transform: translateX(50%) translateY(10%); }
          100% { transform: translateX(-50%) translateY(-10%); }
        }
        .animate-first {
          animation: moveVertical 30s ease infinite;
        }
        .animate-second {
          animation: moveInCircle 20s reverse infinite;
        }
        .animate-third {
          animation: moveInCircle 40s linear infinite;
        }
        .animate-fourth {
          animation: moveHorizontal 40s ease infinite;
        }
        .animate-fifth {
          animation: moveInCircle 25s ease infinite;
        }
      `}</style>

      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className={cn("relative z-10 w-full", className)}>{children}</div>

      {/* Capa de orbes de gradiente animados con mezcla fluida */}
      <div
        className={cn(
          "gradients-container absolute inset-0 pointer-events-none h-full w-full blur-lg",
          isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
        )}
      >
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%)]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:center_center]",
            "animate-first",
            "opacity-60"
          )}
          style={{
            background: `radial-gradient(circle at center, rgba(${firstColor}, 0.28) 0, rgba(${firstColor}, 0) 50%)`,
          }}
        />
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%-400px)]",
            "animate-second",
            "opacity-55"
          )}
          style={{
            background: `radial-gradient(circle at center, rgba(${secondColor}, 0.22) 0, rgba(${secondColor}, 0) 50%)`,
          }}
        />
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%+400px)]",
            "animate-third",
            "opacity-50"
          )}
          style={{
            background: `radial-gradient(circle at center, rgba(${thirdColor}, 0.25) 0, rgba(${thirdColor}, 0) 50%)`,
          }}
        />
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%-200px)]",
            "animate-fourth",
            "opacity-45"
          )}
          style={{
            background: `radial-gradient(circle at center, rgba(${fourthColor}, 0.20) 0, rgba(${fourthColor}, 0) 50%)`,
          }}
        />
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%-800px)_calc(50%+800px)]",
            "animate-fifth",
            "opacity-50"
          )}
          style={{
            background: `radial-gradient(circle at center, rgba(${fifthColor}, 0.25) 0, rgba(${fifthColor}, 0) 50%)`,
          }}
        />

        {interactive && (
          <div
            ref={interactiveRef}
            className={cn(
              "absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)]",
              "[mix-blend-mode:var(--blending-value)] -top-1/2 -left-1/2 w-full h-full",
              "opacity-50"
            )}
            style={{
              background: `radial-gradient(circle at center, rgba(${pointerColor}, 0.35) 0, rgba(${pointerColor}, 0) 45%)`,
            }}
          />
        )}
      </div>

      {/* Textura de grano / dot matrix cereal para acabado obsidian premium */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff0a_1.2px,transparent_1.2px)] [background-size:24px_24px] z-1" />
    </div>
  );
};

export default BackgroundGradientAnimation;
