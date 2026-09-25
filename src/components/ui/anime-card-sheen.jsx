import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';

export const AnimeCardSheen = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const sheenRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current || !sheenRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
    const rotateY = ((x - centerX) / centerX) * 6; // max 6 deg

    animate(containerRef.current, {
      rotateX,
      rotateY,
      duration: 300,
      ease: 'outQuad',
    });

    animate(sheenRef.current, {
      left: `${x}px`,
      top: `${y}px`,
      opacity: 0.35,
      duration: 200,
      ease: 'outQuad',
    });
  };

  const handleMouseLeave = () => {
    if (!containerRef.current || !sheenRef.current) return;
    animate(containerRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 600,
      ease: 'outElastic(1, .6)',
    });

    animate(sheenRef.current, {
      opacity: 0,
      duration: 400,
      ease: 'outQuad',
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
      className={`relative group ${className}`}
    >
      {/* Luz holográfica interactiva Anime.js */}
      <div
        ref={sheenRef}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-radial from-white/20 via-white/5 to-transparent blur-2xl opacity-0 transition-opacity z-20"
      />
      {children}
    </div>
  );
};

export default AnimeCardSheen;
