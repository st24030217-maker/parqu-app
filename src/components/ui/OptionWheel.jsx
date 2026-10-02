'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import './OptionWheel.css';
import { triggerHaptic } from '../../utils/haptics';

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
  smoothing = 180,
  inset = 40,
  loop = true,
  draggable = true,
  soundUrl = '',
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
  const dragRef = useRef(null);
  const dragMovedRef = useRef(false);
  const audioRef = useRef(null);
  const audioUrlRef = useRef('');
  const lastTickRef = useRef(0);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);

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
    smoothing,
    draggable,
    soundUrl,
    soundVolume
  };

  // rAF loop con amortiguación exponencial y proyección en curva 3D con difuminado
  const runFrame = useCallback(now => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cfg = cfgRef.current;
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    const target = targetRef.current;
    const cur = posRef.current;
    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    posRef.current = next;

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

    rafRef.current = settled ? null : requestAnimationFrame(runFrame);
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const playTick = useCallback(() => {
    triggerHaptic();
    const { soundUrl, soundVolume } = cfgRef.current;
    if (!soundUrl) return;
    const now = performance.now();
    if (now - lastTickRef.current < 70) return;
    lastTickRef.current = now;
    if (!audioRef.current || audioUrlRef.current !== soundUrl) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.preload = 'auto';
      audioUrlRef.current = soundUrl;
    }
    const audio = audioRef.current;
    audio.volume = Math.min(Math.max(soundVolume, 0), 1);
    audio.currentTime = 0;
    audio.play()?.catch(() => {});
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
        playTick();
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

  // Manejo de rueda de mouse y scroll táctil
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = e => {
      e.preventDefault();
      const cfg = cfgRef.current;
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
      applyTarget(targetRef.current + step, false);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true), 140);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [applyTarget]);

  const handlePointerDown = useCallback(e => {
    if (!cfgRef.current.draggable) return;
    dragRef.current = { y: e.clientY, start: targetRef.current, id: e.pointerId };
    dragMovedRef.current = false;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    e => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (!dragMovedRef.current && Math.abs(dy) > 4) {
        dragMovedRef.current = true;
        rootRef.current?.setPointerCapture(drag.id);
      }
      if (dragMovedRef.current) applyTarget(drag.start - dy / cfgRef.current.rowH, false);
    },
    [applyTarget]
  );

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) applyTarget(targetRef.current, true);
  }, [applyTarget]);

  const handleItemClick = useCallback(
    index => {
      if (dragMovedRef.current) return;
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
      audioRef.current?.pause();
    },
    []
  );

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label="Selector 3D de opciones"
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
