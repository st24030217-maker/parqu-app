import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

/**
 * AnimeStaggerGroup Component
 * Organizes child cards into an elegant, fluid cascade using Anime.js v4.
 * Whenever the key changes (e.g. on tab change or view transition),
 * the child elements animate with micro-staggers, smooth scale, and outExpo physics.
 */
export const AnimeStaggerGroup = ({
  children,
  triggerKey = null,
  selector = '.anime-stagger-card',
  delay = 60,
  duration = 600,
  translateY = 24,
  className = '',
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll(selector);
    if (!cards || cards.length === 0) return;

    // Reset styles
    cards.forEach((card) => {
      card.style.opacity = '0';
      card.style.transform = `translateY(${translateY}px) scale(0.985)`;
    });

    const anim = animate(cards, {
      opacity: [0, 1],
      translateY: [translateY, 0],
      scale: [0.985, 1],
      delay: stagger(delay, { start: 40 }),
      duration: duration,
      ease: 'outExpo',
    });

    return () => {
      if (anim && typeof anim.pause === 'function') {
        anim.pause();
      }
    };
  }, [triggerKey, delay, duration, translateY, selector]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default AnimeStaggerGroup;
