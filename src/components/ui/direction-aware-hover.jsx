import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * DirectionAwareHover - Aceternity UI component
 * Detects mouse entry direction (top, right, bottom, left) and animates overlay seamlessly
 */
export const DirectionAwareHover = ({
  children,
  frontContent,
  className,
  childrenClassName,
}) => {
  const ref = useRef(null);
  const [direction, setDirection] = useState("top");
  const [isHovered, setIsHovered] = useState(false);

  const getDirection = (ev, obj) => {
    const { width: w, height: h, left: l, top: t } = obj.getBoundingClientRect();
    const x = ev.clientX - l - (w / 2) * (w > h ? h / w : 1);
    const y = ev.clientY - t - (h / 2) * (h > w ? w / h : 1);
    const d = Math.round(Math.atan2(y, x) / 1.57079633 + 5) % 4;
    return d;
  };

  const handleMouseEnter = (event) => {
    if (!ref.current) return;
    const dir = getDirection(event, ref.current);
    switch (dir) {
      case 0:
        setDirection("top");
        break;
      case 1:
        setDirection("right");
        break;
      case 2:
        setDirection("bottom");
        break;
      case 3:
        setDirection("left");
        break;
      default:
        setDirection("top");
        break;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = (event) => {
    if (!ref.current) return;
    const dir = getDirection(event, ref.current);
    switch (dir) {
      case 0:
        setDirection("top");
        break;
      case 1:
        setDirection("right");
        break;
      case 2:
        setDirection("bottom");
        break;
      case 3:
        setDirection("left");
        break;
      default:
        setDirection("top");
        break;
    }
    setIsHovered(false);
  };

  const slideVariants = {
    initial: {
      x: 0,
      y: 0,
      opacity: 0,
      scale: 0.98,
    },
    top: {
      y: -60,
      x: 0,
      opacity: 0,
    },
    bottom: {
      y: 60,
      x: 0,
      opacity: 0,
    },
    left: {
      x: -60,
      y: 0,
      opacity: 0,
    },
    right: {
      x: 60,
      y: 0,
      opacity: 0,
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setIsHovered((prev) => !prev)}
      className={cn(
        "relative overflow-hidden rounded-3xl cursor-pointer select-none group",
        className
      )}
    >
      {/* 1. Capa Frontal: Completamente Lisa con el Logo de SSS.Solutions */}
      <motion.div
        animate={{
          opacity: isHovered ? 0 : 1,
          scale: isHovered ? 0.96 : 1,
          filter: isHovered ? "blur(4px)" : "blur(0px)",
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full h-full pointer-events-auto"
      >
        {frontContent}
      </motion.div>

      {/* 2. Capa Trasera / Revelada: Datos Completos de la Tarjeta */}
      <AnimatePresence mode="wait">
        {isHovered && (
          <motion.div
            key="card-data-overlay"
            initial={direction}
            animate="animate"
            exit={direction}
            variants={slideVariants}
            className={cn(
              "absolute inset-0 z-20 w-full h-full flex flex-col justify-between pointer-events-auto",
              childrenClassName
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DirectionAwareHover;
