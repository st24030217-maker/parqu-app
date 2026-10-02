'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import './OptionWheel.css';
import { triggerHaptic } from '../../utils/haptics';
import { playMovementNote, playSettleChime, resumeAudio } from '../../utils/wheelAudio';

const DEFAULT_ITEMS = [
  'Tarjeta & Parquímetro',
  'Recarga Inmediata',
  'Autocobro Inteligente',
  'Credencial QR Oficial',
  'Mapa Satelital GPS',
  'Padrón Vehicular',
  'Historial de Cobros'
];

export const OptionWheel = ({
  items = DEFAULT_ITEMS,
  defaultSelected = 0,
  selectedIndex: controlledSelectedIndex,
  onChange,
  onSelect,
  textColor = '#94a3b8',
  activeColor = '#000000',
  side = 'left',
  fontSize = 2.1,
  spacing = 1.6,
  curve = 0.9,
  tilt = 5.5,
  blur = 2.8,
  fade = 0.35,
  minOpacity = 0.08,
  smoothing = 45,
  inset = 40,
  loop = true,
  draggable = true,
  soundVolume = 0.4,
  className = '',
  renderItem,
}) => {
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const initialIndex = controlledSelectedIndex !== undefined ? controlledSelectedIndex : defaultSelected;
  const posRef = useRef(initialIndex);
  const targetRef = useRef(initialIndex);
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const cfgRef = useRef({});
  const onChangeRef = useRef(onChange);
  const selectedRef = useRef(initialIndex);
  const wheelTimerRef = useRef(null);
  const wheelAccumulatorRef = useRef(0);
  
  // Drag y Touch state para scroll táctil con el dedo
  const isDraggingRef = useRef(false);
  const dragRef = useRef(null);
  const velocityRef = useRef(0);
  const wasSettledRef = useRef(true);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);

  const lastTickRef = useRef(0);

  const selectedIndex = controlledSelectedIndex !== undefined ? controlledSelectedIndex : internalSelectedIndex;

  const remPx = typeof window !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16;

  onChangeRef.current = onChange;
  cfgRef.current = {
    count: items.length,
    items,
    rowH: Math.max(fontSize * spacing * remPx, 1),
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing: Math.max(smoothing, 25),
    draggable,
    soundVolume
  };

  // Loop rAF para renderizar en 3D con aceleración por hardware y música de movimiento
  const runFrame = useCallback(now => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cfg = cfgRef.current;

    const target = targetRef.current;
    let next;

    // Si el usuario está arrastrando con el dedo o mouse, seguimiento 1:1 inmediato sin retraso
    if (isDraggingRef.current) {
      next = target;
      posRef.current = next;
      wasSettledRef.current = false;
    } else {
      const tau = Math.max(cfg.smoothing, 1) / 1000;
      const k = 1 - Math.exp(-dt / tau);
      const cur = posRef.current;
      next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.001;
      if (settled) {
        next = target;
        if (!wasSettledRef.current) {
          wasSettledRef.current = true;
          playSettleChime(selectedRef.current);
        }
      } else {
        wasSettledRef.current = false;
      }
      posRef.current = next;
    }

    const els = itemRefs.current;
    const n = cfg.count;
    if (!n) return;
    const mirror = cfg.side === 'right' ? -1 : 1;
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;

    for (let i = 0; i < n; i++) {
      const el = els[i];
      if (!el) continue;
      let d = i - next;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * cfg.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }

      if (cfg.side === 'center') {
        el.style.transform = `translate(calc(-50% + ${x.toFixed(2)}px), calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      } else {
        el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      }
      
      el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
      el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : 'none';
      el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }

    if (isDraggingRef.current || Math.abs(targetRef.current - posRef.current) > 0.001) {
      rafRef.current = requestAnimationFrame(runFrame);
    } else {
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  // Reproduce una nota musical pentatónica y un micro-click háptico en cada movimiento
  const playTick = useCallback((idx = selectedRef.current, velocity = 1.0) => {
    triggerHaptic();
    resumeAudio();
    const now = performance.now();
    if (now - lastTickRef.current < 40) return;
    lastTickRef.current = now;
    playMovementNote(idx, velocity);
  }, []);

  const applyTarget = useCallback(
    (value, snap) => {
      const cfg = cfgRef.current;
      if (!cfg.count) return;
      let v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      targetRef.current = v;
      const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
      if (idx !== selectedRef.current) {
        selectedRef.current = idx;
        setInternalSelectedIndex(idx);
        onChangeRef.current?.(idx, cfg.items[idx]);
        playTick(idx, 1.0);
      }
      startLoop();
    },
    [startLoop, playTick]
  );

  // Sincronización si selectedIndex es controlado desde el padre
  useEffect(() => {
    if (controlledSelectedIndex !== undefined && controlledSelectedIndex !== selectedRef.current) {
      const cfg = cfgRef.current;
      if (!cfg.count) return;
      const cur = targetRef.current;
      let diff = controlledSelectedIndex - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (diff > cfg.count / 2) diff -= cfg.count;
        else if (diff < -cfg.count / 2) diff += cfg.count;
      }
      targetRef.current = cur + diff;
      selectedRef.current = controlledSelectedIndex;
      startLoop();
    }
  }, [controlledSelectedIndex, startLoop]);

  // Manejo de rueda de mouse ultra fluido con acumulador sensible y notas musicales
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = e => {
      resumeAudio();
      const cfg = cfgRef.current;
      if (!cfg.count) return;

      const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY;
      wheelAccumulatorRef.current += delta;

      const threshold = 28; // Respuesta instantánea a cada tick de rueda

      if (Math.abs(wheelAccumulatorRef.current) >= threshold) {
        e.preventDefault();
        const direction = Math.sign(wheelAccumulatorRef.current);
        wheelAccumulatorRef.current = 0;
        applyTarget(Math.round(targetRef.current) + direction, true);
      } else {
        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = setTimeout(() => {
          if (Math.abs(wheelAccumulatorRef.current) >= 12) {
            const direction = Math.sign(wheelAccumulatorRef.current);
            wheelAccumulatorRef.current = 0;
            applyTarget(Math.round(targetRef.current) + direction, true);
          } else {
            wheelAccumulatorRef.current = 0;
          }
        }, 30);
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [applyTarget]);

  // Soporte Touch nativo con scroll táctil de dedo, notas musicales e inercia (flick)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let touchStartY = 0;
    let touchLastY = 0;
    let touchLastTime = 0;
    let touchStartTarget = 0;
    let isTouchActive = false;
    let touchVelocity = 0;

    const onTouchStart = e => {
      resumeAudio();
      if (!cfgRef.current.draggable) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartY = t.clientY;
      touchLastY = t.clientY;
      touchLastTime = performance.now();
      touchStartTarget = targetRef.current;
      isTouchActive = false;
      touchVelocity = 0;
    };

    const onTouchMove = e => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const dy = t.clientY - touchStartY;
      
      if (!isTouchActive && Math.abs(dy) > 3) {
        isTouchActive = true;
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      if (isTouchActive) {
        e.preventDefault(); // Evita que la pantalla rebote mientras el usuario desliza la ruleta
        const now = performance.now();
        const dt = now - touchLastTime;
        if (dt > 8) {
          touchVelocity = (t.clientY - touchLastY) / dt;
          touchLastY = t.clientY;
          touchLastTime = now;
        }
        applyTarget(touchStartTarget - dy / cfgRef.current.rowH, false);
      }
    };

    const onTouchEnd = () => {
      if (isTouchActive) {
        isDraggingRef.current = false;
        setIsDragging(false);
        isTouchActive = false;
        
        // Inercia física: si deslizó rápido con el dedo, avanza con melodía proporcional
        const rowH = cfgRef.current.rowH;
        // Inversión: swipe hacia arriba (dy negativo) avanza en la lista
        const momentumSteps = -touchVelocity * 170 / rowH;
        const clampedMomentum = Math.max(-6, Math.min(6, Math.round(momentumSteps)));
        applyTarget(Math.round(targetRef.current + clampedMomentum), true);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [applyTarget]);

  // Arrastre con mouse en computadoras de escritorio (Pointer Events)
  const handlePointerDown = useCallback(e => {
    resumeAudio();
    if (e.pointerType === 'touch') return; // En móviles lo maneja el listener nativo touch
    if (!cfgRef.current.draggable) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    dragRef.current = {
      y: e.clientY,
      start: targetRef.current,
      id: e.pointerId,
      lastY: e.clientY,
      lastTime: performance.now()
    };
    velocityRef.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    e => {
      if (e.pointerType === 'touch') return;
      const drag = dragRef.current;
      if (!drag) return;
      const dy = e.clientY - drag.y;
      const now = performance.now();
      const dt = now - drag.lastTime;
      if (dt > 8) {
        velocityRef.current = (e.clientY - drag.lastY) / dt;
        drag.lastY = e.clientY;
        drag.lastTime = now;
      }
      applyTarget(drag.start - dy / cfgRef.current.rowH, false);
    },
    [applyTarget]
  );

  const handlePointerEnd = useCallback(e => {
    if (e.pointerType === 'touch') return;
    const drag = dragRef.current;
    if (!drag) return;
    try {
      if (e?.pointerId) e.currentTarget?.releasePointerCapture(e.pointerId);
    } catch (_) {}
    dragRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);

    // Inercia con mouse
    const rowH = cfgRef.current.rowH;
    const momentumSteps = -velocityRef.current * 160 / rowH;
    const clamped = Math.max(-5, Math.min(5, Math.round(momentumSteps)));
    applyTarget(Math.round(targetRef.current + clamped), true);
  }, [applyTarget]);

  const handleItemClick = useCallback(
    index => {
      resumeAudio();
      if (isDraggingRef.current) return;
      const cfg = cfgRef.current;
      const cur = targetRef.current;
      let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count;
        else if (d < -cfg.count / 2) d += cfg.count;
      }
      applyTarget(cur + d, true);
      onSelect?.(index, cfg.items[index]);
    },
    [applyTarget, onSelect]
  );

  const handleKeyDown = useCallback(
    e => {
      resumeAudio();
      let delta = null;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;
      if (delta != null) {
        e.preventDefault();
        applyTarget(Math.round(targetRef.current) + delta, true);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const cfg = cfgRef.current;
        const curIdx = selectedRef.current;
        onSelect?.(curIdx, cfg.items[curIdx]);
      }
    },
    [applyTarget, onSelect]
  );

  useEffect(() => {
    applyTarget(targetRef.current, false);
  }, [items, fontSize, spacing, curve, tilt, blur, fade, minOpacity, side, loop, smoothing, applyTarget]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    []
  );

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label="Selector 3D de opciones con música interactiva"
      className={`option-wheel${side === 'right' ? ' option-wheel--right' : ''}${side === 'center' ? ' option-wheel--center' : ''}${isDragging ? ' option-wheel--dragging' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--ow-text-color': textColor,
        '--ow-active-color': activeColor,
        '--ow-font-size': `${fontSize}rem`,
        '--ow-inset': `${inset}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => {
        const label = typeof item === 'string' ? item : (item.label || item.title || item.name);
        const isSelected = selectedIndex === index;
        return (
          <div
            key={`${label}-${index}`}
            ref={el => {
              itemRefs.current[index] = el;
            }}
            role="option"
            aria-selected={isSelected}
            className={`option-wheel__item font-sans${isSelected ? ' option-wheel__item--selected' : ''}`}
            onClick={() => handleItemClick(index)}
          >
            {renderItem ? renderItem(item, isSelected, index) : label}
          </div>
        );
      })}
    </div>
  );
};

export default OptionWheel;
