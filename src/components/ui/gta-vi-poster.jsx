"use client";

import { motion } from "motion/react";
import React, { useLayoutEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 3.2;

// Capas de profundidad y revelado escalonado de @aceternity/gta-vi-poster aplicadas al logo de Parqu (sin imágenes externas)
const LOGO_LAYERS = [
  {
    id: "echo-1",
    name: "Logo Depth Layer 1",
    initialScale: 1.234,
    revealDelay: 0.12,
    targetOpacity: 0,
    peakOpacity: 0.14,
  },
  {
    id: "echo-2",
    name: "Logo Depth Layer 2",
    initialScale: 1.48,
    revealDelay: 0.24,
    targetOpacity: 0,
    peakOpacity: 0.18,
  },
  {
    id: "echo-3",
    name: "Logo Depth Layer 3",
    initialScale: 1.797,
    revealDelay: 0.36,
    targetOpacity: 0,
    peakOpacity: 0.22,
  },
  {
    id: "echo-4",
    name: "Logo Depth Layer 4",
    initialScale: 2.186,
    revealDelay: 0.48,
    targetOpacity: 0,
    peakOpacity: 0.28,
  },
  {
    id: "base-logo",
    name: "Parqu Base Logo",
    initialScale: 2.446,
    revealDelay: 0.35,
    targetOpacity: 0.25,
  },
  {
    id: "main-logo",
    name: "Parqu Hero Logo",
    initialScale: 3.306,
    revealDelay: 0.55,
    isHeroLogo: true,
    initial: {
      opacity: 1,
      clipPath: "inset(0% 0% 100% 0%)",
    },
    animate: {
      opacity: 1,
      clipPath: "inset(0% 0% 0% 0%)",
    },
  },
];

const DEFAULT_LOGO_SPRING = {
  type: "spring",
  visualDuration: 3.4,
  bounce: 0.45,
};

export const controls = {
  duration: [3.2, 1, 8, 0.1],
  cameraScale: [1.14, 1, 1.8, 0.01],
  fit: [0.85, 0.5, 1, 0.01],
  depth: [1, 0, 1.6, 0.01],
  logoBlur: [6, 0, 16, 0.5],
  posterRadius: [0, 0, 48, 1],
  background: "#ffffff",
  showReplay: false,
  logoSpring: DEFAULT_LOGO_SPRING,
};

export function GtaViPoster({
  duration = DEFAULT_DURATION,
  cameraScale = 1.14,
  fit = 0.85,
  depth = 1,
  logoBlur = 6,
  posterRadius = 0,
  background = "#ffffff",
  logoSrc = "./parqu-logo-black.png",
  logoAlt = "Parqu Logo",
  showReplay = false,
  logoSpring = DEFAULT_LOGO_SPRING,
  className,
  children,
}) {
  const stageRef = useRef(null);
  const [size, setSize] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const timeScale = duration / DEFAULT_DURATION;

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const update = () => {
      const bounds = element.getBoundingClientRect();
      setSize(Math.min(bounds.width, bounds.height) * fit);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit]);

  const logoTransition = {
    clipPath: { ...logoSpring, delay: 0.45 * timeScale },
    filter: { ...logoSpring, delay: 0.45 * timeScale },
  };

  const logoStageWidth = size > 0 ? Math.min(Math.max(size * 0.62, 210), 380) : 260;
  const logoStageHeight = Math.round(logoStageWidth * 0.48);

  return (
    <div
      ref={stageRef}
      className={`relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{ background }}
    >
      {size > 0 ? (
        <motion.div
          key={playKey}
          className="relative flex items-center justify-center bg-transparent"
          style={{
            width: logoStageWidth,
            height: logoStageHeight,
            borderRadius: posterRadius,
            transformOrigin: "center",
          }}
          initial={{ scale: cameraScale, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration, ease: [0.33, 0, 0.2, 1] }}
        >
          {LOGO_LAYERS.map((layer, index) => {
            const isHeroLogo = Boolean(layer.isHeroLogo);
            const scale = 1 + (layer.initialScale - 1) * depth;
            const initialFilter = isHeroLogo
              ? `blur(${logoBlur}px)`
              : "blur(2px)";
            const animateFilter = "blur(0px)";

            return (
              <motion.img
                key={layer.id}
                src={logoSrc}
                alt={logoAlt}
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain bg-transparent border-0 shadow-none"
                style={{
                  zIndex: index,
                  transformOrigin: "center",
                  willChange: "transform, opacity, filter, clip-path",
                }}
                initial={{
                  opacity: 0,
                  scale,
                  filter: initialFilter,
                  ...layer.initial,
                }}
                animate={{
                  opacity:
                    layer.peakOpacity !== undefined
                      ? [0, layer.peakOpacity, layer.targetOpacity ?? 0]
                      : layer.targetOpacity ?? 1,
                  scale: 1,
                  filter: animateFilter,
                  ...layer.animate,
                }}
                transition={{
                  scale: { duration, ease: [0.16, 1, 0.3, 1] },
                  opacity:
                    layer.peakOpacity !== undefined
                      ? {
                          duration: 1.35 * timeScale,
                          delay: layer.revealDelay * timeScale,
                          ease: "easeOut",
                        }
                      : {
                          duration: 0.7 * timeScale,
                          delay: layer.revealDelay * timeScale,
                          ease: "easeOut",
                        },
                  ...(isHeroLogo ? logoTransition : {}),
                }}
              />
            );
          })}
        </motion.div>
      ) : null}

      {children}

      {showReplay ? (
        <button
          type="button"
          onClick={() => setPlayKey((key) => key + 1)}
          aria-label="Replay logo intro"
          className="absolute top-4 left-4 z-20 flex size-10 items-center justify-center rounded-full bg-slate-900/10 text-sm font-medium text-slate-900 backdrop-blur-md transition hover:bg-slate-900/20 active:scale-[0.98]"
        >
          <ReplayIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

const ReplayIcon = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M19.933 13.041a8 8 0 1 1 -9.925 -8.788c3.899 -1 7.935 1.007 9.425 4.747" />
      <path d="M20 4v5h-5" />
    </svg>
  );
};

export default function GtaViPosterDemo(props) {
  return <GtaViPoster {...props} />;
}
