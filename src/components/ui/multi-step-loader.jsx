"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { X, CheckCircle2 } from "lucide-react";

const CheckIcon = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
};

const CheckFilled = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6", className)}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.74-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export const LoaderCore = ({
  loadingStates = [],
  value = 0,
}) => {
  return (
    <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-40 px-6">
      {loadingStates.map((loadingState, index) => {
        const distance = Math.abs(index - value);
        const opacity = Math.max(1 - distance * 0.25, 0);

        const isCurrent = value === index;
        const isPassed = index < value;

        return (
          <motion.div
            key={index}
            className={cn("text-left flex items-center gap-3.5 mb-5 font-mono")}
            initial={{ opacity: 0, y: -(value * 44) }}
            animate={{ opacity: opacity, y: -(value * 44) }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <div className="flex-shrink-0">
              {!isPassed && !isCurrent && (
                <CheckIcon className="text-neutral-600 w-6 h-6" />
              )}
              {isPassed && (
                <CheckFilled className="text-white w-6 h-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]" />
              )}
              {isCurrent && (
                <div className="relative flex items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-white/20 animate-ping absolute" />
                  <CheckFilled className="text-white w-6 h-6 drop-shadow-[0_0_15px_rgba(255,255,255,1)]" />
                </div>
              )}
            </div>
            <span
              className={cn(
                "text-sm sm:text-base tracking-wide transition-colors duration-300",
                isPassed && "text-neutral-400 line-through opacity-70",
                isCurrent && "text-white font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]",
                !isPassed && !isCurrent && "text-neutral-600"
              )}
            >
              {loadingState.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export const MultiStepLoader = ({
  loadingStates = [],
  loading = false,
  duration = 1800,
  loop = false,
  onComplete,
  onClose,
}) => {
  const [currentState, setCurrentState] = useState(0);

  useEffect(() => {
    if (!loading) {
      setCurrentState(0);
      return;
    }

    if (currentState >= loadingStates.length - 1 && !loop) {
      const finishTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, duration);
      return () => clearTimeout(finishTimer);
    }

    const timeout = setTimeout(() => {
      setCurrentState((prevState) =>
        loop
          ? prevState === loadingStates.length - 1
            ? 0
            : prevState + 1
          : Math.min(prevState + 1, loadingStates.length - 1)
      );
    }, duration);

    return () => clearTimeout(timeout);
  }, [currentState, loading, loop, loadingStates.length, duration, onComplete]);

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl bg-black/90 select-none"
        >
          {/* Botón de cierre en esquina superior derecha */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              title="Cerrar animación"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Insignia superior */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-700/80 text-xs font-mono text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="uppercase tracking-[0.2em] font-bold text-[11px] text-white">
              SISTEMA METROPOLITANO PARQU • TELEMETRÍA
            </span>
          </div>

          <div className="h-96 relative w-full max-w-xl">
            <LoaderCore value={currentState} loadingStates={loadingStates} />
          </div>

          {/* Máscara de gradiente sutil Aceternity */}
          <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-black/85 h-full absolute pointer-events-none [mask-image:radial-gradient(900px_at_center,transparent_35%,white)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MultiStepLoader;
