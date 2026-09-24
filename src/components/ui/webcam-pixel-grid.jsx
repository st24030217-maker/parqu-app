import React, { useEffect, useRef, useState, useCallback } from 'react';

export function WebcamPixelGrid({
  className = '',
  pixelSize = 14,
  gap = 2,
  inverted = false,
  interactive = true,
  autoStartCamera = true,
  showControls = false,
  onCameraStatusChange,
  children,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Iniciar la cámara web
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Cámara no soportada en este navegador');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        if (onCameraStatusChange) onCameraStatusChange(true);
      }
    } catch (err) {
      console.warn('Cámara no disponible, activando modo pixelado a color ambiental:', err.message);
      setCameraError(err.message);
      setIsCameraActive(false);
      if (onCameraStatusChange) onCameraStatusChange(false);
    }
  }, [onCameraStatusChange]);

  // Detener la cámara
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (onCameraStatusChange) onCameraStatusChange(false);
  }, [onCameraStatusChange]);

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    if (autoStartCamera) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStartCamera, startCamera, stopCamera]);

  // Manejo de interactividad del cursor
  const handleMouseMove = (e) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: -1000, y: -1000, active: false };
  };

  // Loop de renderizado del Canvas con Bloques de Píxeles a TODO COLOR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    let time = 0;

    const resize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.03;
      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 300;

      if (width === 0 || height === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      const cellSize = pixelSize + gap;
      const cols = Math.max(1, Math.ceil(width / cellSize));
      const rows = Math.max(1, Math.ceil(height / cellSize));

      const video = videoRef.current;
      const hasLiveVideo = isCameraActive && video && video.readyState >= 2;

      let pixelData = null;

      if (hasLiveVideo && offCtx && cols > 0 && rows > 0) {
        offscreen.width = cols;
        offscreen.height = rows;
        // Efecto espejo horizontal para la cámara
        offCtx.save();
        offCtx.scale(-1, 1);
        offCtx.drawImage(video, -cols, 0, cols, rows);
        offCtx.restore();

        try {
          pixelData = offCtx.getImageData(0, 0, cols, rows).data;
        } catch {
          pixelData = null;
        }
      }

      const mouse = mouseRef.current;

      // Renderizar la cuadrícula de BLOQUES PIXELADOS A TODO COLOR
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = c * cellSize;
          const py = r * cellSize;
          const centerX = px + pixelSize / 2;
          const centerY = py + pixelSize / 2;

          let colorFill = '';

          if (pixelData) {
            const index = (r * cols + c) * 4;
            let red = pixelData[index];
            let green = pixelData[index + 1];
            let blue = pixelData[index + 2];

            // Interacción con el cursor sobre la cámara en vivo
            if (mouse.active) {
              const dx = centerX - mouse.x;
              const dy = centerY - mouse.y;
              const dist = Math.hypot(dx, dy);
              if (dist < 140) {
                const boost = (1 - dist / 140) * 80;
                red = Math.min(255, red + boost);
                green = Math.min(255, green + boost);
                blue = Math.min(255, blue + boost);
              }
            }

            colorFill = `rgb(${red}, ${green}, ${blue})`;
          } else {
            // Generador procedural de ondas cromáticas vibrantes (Cyan, Violeta, Púrpura, Azul, Esmeralda)
            const distToCenter = Math.hypot(centerX - width / 2, centerY - height / 2);
            const wave1 = Math.sin(c * 0.12 + time * 1.5);
            const wave2 = Math.cos(r * 0.12 - time * 1.2);
            const ripple = Math.sin(distToCenter * 0.02 - time * 2.0);

            const rawIntensity = (wave1 * 0.35 + wave2 * 0.35 + ripple * 0.3) * 0.5 + 0.5;
            
            // Espectro de color continuo y dinámico
            let hue = (c * 3.5 + r * 2.5 + time * 30) % 360;
            let saturation = 90;
            let lightness = Math.max(10, Math.min(65, rawIntensity * 60 + 10));

            // Respuesta al cursor del ratón con ondas de resplandor
            if (mouse.active) {
              const dx = centerX - mouse.x;
              const dy = centerY - mouse.y;
              const dist = Math.hypot(dx, dy);
              if (dist < 160) {
                const mousePower = (1 - dist / 160);
                lightness = Math.min(85, lightness + mousePower * 45);
                hue = (hue + mousePower * 60) % 360;
              }
            }

            colorFill = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          }

          ctx.fillStyle = colorFill;
          
          // Bloque de píxel rectangular/cuadrado estilo display LCD/LED a color
          ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [pixelSize, gap, inverted, isCameraActive, interactive]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full overflow-hidden bg-black ${className}`}
    >
      {/* Video de captura de webcam */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden pointer-events-none"
      />

      {/* Canvas del fondo con efecto pixeleado a TODO COLOR */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />

      {/* Gradientes de contraste para resaltar el contenido preservando el color de fondo */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.8)_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black/60" />

      {/* Contenido superpuesto */}
      {children && <div className="relative z-20 w-full h-full">{children}</div>}
    </div>
  );
}

export default WebcamPixelGrid;
