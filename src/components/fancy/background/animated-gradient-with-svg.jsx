"use client"

import React, { useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { useDimensions } from "@/hooks/use-debounced-dimensions"

const AnimatedGradient = ({
  colors = ["#0033FF", "#0055FF", "#807DFE"],
  speed = 8,
  blur = "medium",
  className = "",
}) => {
  const containerRef = useRef(null)
  const dimensions = useDimensions(containerRef)

  const circleSize = useMemo(() => {
    const maxDim = Math.max(dimensions.width || 0, dimensions.height || 0)
    return maxDim > 0 ? maxDim * 1.2 : 360
  }, [dimensions.width, dimensions.height])

  const blurClass =
    blur === "light"
      ? "blur-2xl"
      : blur === "medium"
        ? "blur-3xl"
        : "blur-[90px]"

  return (
    <div ref={containerRef} className={cn("absolute inset-0 overflow-hidden pointer-events-none select-none", className)}>
      <style>{`
        @keyframes fc-background-gradient {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          20% {
            transform: translate3d(calc(45% * var(--tx-1, 1)), calc(40% * var(--ty-1, 1)), 0);
          }
          40% {
            transform: translate3d(calc(45% * var(--tx-2, -1)), calc(40% * var(--ty-2, 1)), 0);
          }
          60% {
            transform: translate3d(calc(45% * var(--tx-3, 1)), calc(40% * var(--ty-3, -1)), 0);
          }
          80% {
            transform: translate3d(calc(45% * var(--tx-4, -1)), calc(40% * var(--ty-4, -1)), 0);
          }
        }
      `}</style>

      <div className={cn("absolute inset-0", blurClass)}>
        {colors.map((color, index) => {
          const animationProps = {
            animation: `fc-background-gradient ${speed}s infinite ease-in-out`,
            animationDuration: `${speed}s`,
            animationDelay: `${index * (speed / colors.length)}s`,
            top: `${15 + (index * 20) % 50}%`,
            left: `${15 + (index * 25) % 55}%`,
            "--tx-1": 0.5 - (index * 0.25),
            "--ty-1": 0.4 + (index * 0.15),
            "--tx-2": -0.45 + (index * 0.2),
            "--ty-2": 0.5 - (index * 0.25),
            "--tx-3": 0.4 - (index * 0.15),
            "--ty-3": -0.45 + (index * 0.2),
            "--tx-4": -0.5 + (index * 0.25),
            "--ty-4": -0.35 - (index * 0.15),
          }

          return (
            <svg
              key={index}
              className="absolute transform-gpu"
              width={circleSize}
              height={circleSize}
              viewBox="0 0 100 100"
              style={animationProps}
            >
              <circle cx="50" cy="50" r="50" fill={color} />
            </svg>
          )
        })}
      </div>
    </div>
  )
}

export { AnimatedGradient }
export default AnimatedGradient
