import React from 'react';

/**
 * Slide loading indicator component.
 * Fully compatible with React 18+ with zero external dependencies.
 */
export function Slide({ size = 48, color = 'currentColor', className = '', style = {} }) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`ld-slide-container ${className}`}
      style={{
        position: 'relative',
        width: pixelSize,
        height: pixelSize,
        color,
        ...style,
      }}
    >
      <style>{`
        @keyframes ld-slide-walk {
          0% {
            transform: translate(158.8%, 0);
          }
          8.33%,
          25% {
            transform: translate(158.8%, 158.8%);
          }
          33.33%,
          50% {
            transform: translate(0, 158.8%);
          }
          58.33%,
          75% {
            transform: translate(0, 0);
          }
          83.33%,
          100% {
            transform: translate(158.8%, 0);
          }
        }
        .ld-slide-dot {
          position: absolute;
          top: 6%;
          left: 6%;
          width: 34%;
          height: 34%;
          background: currentColor;
          border-radius: 50%;
          animation: ld-slide-walk 2400ms ease-in-out infinite;
        }
      `}</style>
      <div
        className="ld-slide-dot"
        style={{
          animationDelay: '-2400ms',
        }}
      />
      <div
        className="ld-slide-dot"
        style={{
          animationDelay: '-1600ms',
        }}
      />
      <div
        className="ld-slide-dot"
        style={{
          animationDelay: '-800ms',
        }}
      />
    </div>
  );
}

export function SlideDemo({ size = 48, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Slide size={size} />
    </div>
  );
}

export default SlideDemo;
