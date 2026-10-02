"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export const WobbleCard = ({
  children,
  containerClassName,
  className,
  noise = true,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (clientX - (rect.left + rect.width / 2)) / 25;
    const y = (clientY - (rect.top + rect.height / 2)) / 25;
    setMousePosition({ x, y });
  };

  return (
    <motion.section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      style={{
        transform: isHovering
          ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale3d(1, 1, 1)`
          : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
        transition: "transform 0.15s ease-out",
      }}
      className={cn(
        "mx-auto w-full relative rounded-3xl overflow-hidden border border-slate-200/40 group",
        containerClassName
      )}
    >
      <div
        className="relative h-full [background-image:radial-gradient(88%_100%_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0))] sm:rounded-3xl overflow-hidden"
      >
        <motion.div
          style={{
            transform: isHovering
              ? `translate3d(${-mousePosition.x * 1.2}px, ${-mousePosition.y * 1.2}px, 0) scale3d(1.01, 1.01, 1)`
              : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
            transition: "transform 0.15s ease-out",
          }}
          className={cn("h-full relative z-10", className ? className : "px-6 py-10 sm:px-10 sm:py-12")}
        >
          {noise && <Noise />}
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
};

const Noise = () => {
  return (
    <div
      className="absolute inset-0 w-full h-full scale-[1.2] transform opacity-15 pointer-events-none [mask-image:radial-gradient(#fff,transparent,80%)]"
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 0)`,
        backgroundSize: "20px 20px",
      }}
    />
  );
};

export default WobbleCard;
