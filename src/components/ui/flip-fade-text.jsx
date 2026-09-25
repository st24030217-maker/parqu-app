import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

// Componente de Letra individual con rotación 3D y desenfoque
const Letter = memo(function Letter({ char, letterDuration }) {
  return (
    <motion.span
      style={{ transformStyle: "preserve-3d" }}
      variants={{
        initial: {
          rotateX: 90,
          y: 15,
          opacity: 0,
          filter: "blur(6px)",
        },
        animate: {
          rotateX: 0,
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          transition: {
            duration: letterDuration,
            ease: [0.2, 0.65, 0.3, 0.9],
          },
        },
        exit: {
          rotateX: -90,
          y: -15,
          opacity: 0,
          filter: "blur(6px)",
          transition: {
            duration: letterDuration * 0.67,
            ease: "easeIn",
          },
        },
      }}
      className="inline-block"
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
});

// Componente de Palabra con efecto Stagger en letras
const Word = memo(function Word({
  text,
  staggerDelay,
  exitStaggerDelay,
  letterDuration,
  textClassName,
}) {
  const letters = useMemo(() => text.split(""), [text]);

  return (
    <motion.div
      className={cn(
        "flex flex-wrap justify-center gap-[0.02em] font-black uppercase tracking-tight",
        textClassName || "text-white"
      )}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 1 },
        animate: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
        exit: {
          opacity: 1,
          transition: {
            staggerChildren: exitStaggerDelay,
          },
        },
      }}
    >
      {letters.map((char, i) => (
        <Letter
          key={`${char}-${i}`}
          char={char}
          letterDuration={letterDuration}
        />
      ))}
    </motion.div>
  );
});

const defaultWords = [
  "PARQU",
  "MÁS FÁCIL",
  "SIN FILAS",
  "SIN MONEDAS",
  "EN UN TOQUE",
  "AUTOCOBRO"
];

export function FlipFadeText({
  words = defaultWords,
  interval = 2600,
  className = "",
  textClassName = "",
  letterDuration = 0.55,
  staggerDelay = 0.07,
  exitStaggerDelay = 0.04,
}) {
  const [index, setIndex] = useState(0);

  const wordList = useMemo(() => (words && words.length > 0 ? words : defaultWords), [words]);

  const updateIndex = useCallback(() => {
    setIndex((prev) => (prev + 1) % wordList.length);
  }, [wordList.length]);

  useEffect(() => {
    const timer = setInterval(updateIndex, interval);
    return () => clearInterval(timer);
  }, [updateIndex, interval]);

  const currentWord = wordList[index] || wordList[0];

  return (
    <div className={cn("flex items-center justify-center min-h-[60px] sm:min-h-[80px]", className)}>
      <div
        className="relative flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        <AnimatePresence mode="wait">
          <Word
            key={currentWord}
            text={currentWord}
            staggerDelay={staggerDelay}
            exitStaggerDelay={exitStaggerDelay}
            letterDuration={letterDuration}
            textClassName={textClassName}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FlipFadeText;
