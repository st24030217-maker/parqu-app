import React from 'react';
import { Slide } from 'loading-dev';

export function SlideDemo({ size = 48, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Slide size={size} />
    </div>
  );
}

export default SlideDemo;
