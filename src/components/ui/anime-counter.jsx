import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

export const AnimeCounter = ({ 
  value = 0, 
  duration = 850, 
  decimals = 2,
  prefix = '', 
  suffix = '',
  className = '',
  ease = 'outExpo'
}) => {
  const spanRef = useRef(null);
  const currentValRef = useRef(Number(value) || 0);

  useEffect(() => {
    const startVal = currentValRef.current;
    const targetVal = Number(value) || 0;
    const obj = { val: startVal };

    const anim = animate(obj, {
      val: targetVal,
      duration,
      ease,
      onUpdate: () => {
        if (spanRef.current) {
          spanRef.current.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
        }
      },
      onComplete: () => {
        currentValRef.current = targetVal;
        if (spanRef.current) {
          spanRef.current.textContent = `${prefix}${targetVal.toFixed(decimals)}${suffix}`;
        }
      }
    });

    return () => {
      try {
        if (anim && typeof anim.pause === 'function') anim.pause();
      } catch (e) {
        // ignore
      }
    };
  }, [value, duration, decimals, prefix, suffix, ease]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}{(Number(value) || 0).toFixed(decimals)}{suffix}
    </span>
  );
};

export default AnimeCounter;
