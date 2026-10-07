"use client";

import { motion } from "motion/react";
import React, { useLayoutEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 2.4;

// Capas fluidas a 60fps inspiradas en @aceternity/gta-vi-poster aplicadas exclusivamente al logo de Parqu
const LOGO_LAYERS = [
  {
    id: "depth-outer",
    name: "Parqu Depth Outer",
    initialScale: 2.35,
    revealDelay: 0.04,
    initialOpacity: 0,
    animateOpacity: [0, 0.16, 0],
  },
  {
    id: "depth-mid",
    name: "Parqu Depth Mid",
    initialScale: 1.72,
    revealDelay: 0.1,
    initialOpacity: 0,
    animateOpacity: [0, 0.24, 0],
  },
  {
    id: "base-silhouette",
    name: "Parqu Silhouette",
    initialScale: 1.32,
    revealDelay: 0.14,
    initialOpacity: 0,
    animateOpacity: 0.22,
  },
  {
    id: "hero-logo",
    name: "Parqu Hero Logo",
    initialScale: 2.65,
    revealDelay: 0.18,
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
  stiffness: 82,
  damping: 16,
  mass: 0.85,
};

export const controls = {
  duration: [2.4, 1, 6, 0.1],
  cameraScale: [1.16, 1, 1.8, 0.01],
  fit: [0.85, 0.5, 1, 0.01],
  depth: [1, 0, 1.6, 0.01],
  logoBlur: [4, 0, 16, 0.5],
  posterRadius: [0, 0, 48, 1],
  background: "#ffffff",
  showReplay: false,
  logoSpring: DEFAULT_LOGO_SPRING,
};

export function GtaViPoster({
  duration = DEFAULT_DURATION,
  cameraScale = 1.16,
  fit = 0.85,
  depth = 1,
  logoBlur = 4,
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
    clipPath: { ...logoSpring, delay: 0.18 * timeScale },
    filter: {
      duration: 0.85 * timeScale,
      delay: 0.18 * timeScale,
      ease: [0.16, 1, 0.3, 1],
    },
  };

  const logoStageWidth =
    size > 0 ? Math.min(Math.max(size * 0.64, 220), 390) : 270;
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
            willChange: "transform, opacity",
          }}
          initial={{ scale: cameraScale, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            scale: {
              type: "spring",
              stiffness: 70,
              damping: 18,
              mass: 0.9,
            },
            opacity: {
              duration: 0.45 * timeScale,
              ease: "easeOut",
            },
          }}
        >
          {LOGO_LAYERS.map((layer, index) => {
            const isHeroLogo = Boolean(layer.isHeroLogo);
            const scale = 1 + (layer.initialScale - 1) * depth;
            const initialFilter = isHeroLogo
              ? `blur(${logoBlur}px)`
              : undefined;
            const animateFilter = isHeroLogo ? "blur(0px)" : undefined;

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
                  willChange: "transform, opacity, clip-path",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
                initial={{
                  opacity: layer.initialOpacity ?? 0,
                  scale,
                  filter: initialFilter,
                  ...layer.initial,
                }}
                animate={{
                  opacity: layer.animateOpacity ?? 1,
                  scale: 1,
                  filter: animateFilter,
                  ...layer.animate,
                }}
                transition={{
                  scale: {
                    type: "spring",
                    stiffness: isHeroLogo ? 78 : 68,
                    damping: isHeroLogo ? 16 : 18,
                    mass: 0.85,
                    delay: layer.revealDelay * timeScale,
                  },
                  opacity: Array.isArray(layer.animateOpacity)
                    ? {
                        duration: 1.45 * timeScale,
                        delay: layer.revealDelay * timeScale,
                        ease: "easeInOut",
                      }
                    : {
                        duration: 0.65 * timeScale,
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
