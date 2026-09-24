'use client';
import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

const container = (stagger, delay) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

const item = {
  hidden: { y: '115%', opacity: 0 },
  show: {
    y: '0%',
    opacity: 1,
    transition: { duration: 0.65, ease: EASE },
  },
};

export const TextAnimation = ({
  children,
  delay = 0,
  divideBy = 'word',
  className = '',
  animate = 'show',
}) => {
  if (typeof children !== 'string') {
    if (typeof children === 'number' || typeof children === 'boolean') {
      children = String(children);
    } else {
      console.warn('TextAnimation only supports plain text/string children.');
      return <span className={className}>{children}</span>;
    }
  }

  const text = children;
  const parts = divideBy === 'letter' ? text.split('') : text.split(' ');
  const stagger = divideBy === 'letter' ? 0.04 : 0.08;

  return (
    <motion.span
      variants={container(stagger, delay)}
      initial="hidden"
      animate={animate}
      viewport={{ once: true }}
      className={`inline-block ${className}`}
      style={{ display: 'inline-block' }}
    >
      {parts.map((part, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden relative"
          style={{ verticalAlign: 'top' }}
        >
          <motion.span
            variants={item}
            className="inline-block will-change-transform"
          >
            {divideBy === 'letter'
              ? part === ' '
                ? '\u00A0'
                : part
              : part + '\u00A0'}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
};

export default TextAnimation;
