import React, { forwardRef, useImperativeHandle } from "react";
import { motion, useAnimate } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * CurrencyDollarIcon - Animated interactive dollar icon from itshover.com
 * Features animated S-curve drawing and scaling on hover.
 */
export const CurrencyDollarIcon = forwardRef(
  (
    { size = 20, color = "currentColor", strokeWidth = 2, className = "", ...props },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = async () => {
      try {
        await animate(
          ".usd-main, .usd-line",
          { pathLength: 0, opacity: 0 },
          { duration: 0 },
        );

        await animate(
          ".usd-line",
          { pathLength: 1, opacity: 1 },
          { duration: 0.25, ease: "easeOut" },
        );

        await animate(
          ".usd-main",
          { pathLength: 1, opacity: 1 },
          { duration: 0.4, ease: "easeOut" },
        );

        animate(
          ".usd-symbol",
          { scale: [0.94, 1.04, 1] },
          { duration: 0.3, ease: "easeOut" },
        );
      } catch (err) {
        // Fallback silently if unmounted
      }
    };

    const stop = () => {
      try {
        animate(
          ".usd-main, .usd-line",
          { pathLength: 1, opacity: 1 },
          { duration: 0.2 },
        );
        animate(".usd-symbol", { scale: 1 }, { duration: 0.2 });
      } catch (err) {
        // Fallback silently if unmounted
      }
    };

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.div
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        className={cn("inline-flex cursor-pointer items-center justify-center shrink-0 select-none", className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.g
            className="usd-symbol"
            style={{ transformOrigin: "50% 50%" }}
          >
            <motion.path
              className="usd-main"
              d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2"
              pathLength={1}
            />
            <motion.path
              className="usd-line"
              d="M12 3v3m0 12v3"
              pathLength={1}
            />
          </motion.g>
        </svg>
      </motion.div>
    );
  },
);

CurrencyDollarIcon.displayName = "CurrencyDollarIcon";

export default CurrencyDollarIcon;
