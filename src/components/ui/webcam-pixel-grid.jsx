import React, { useEffect, useRef, useState, useCallback } from 'react';

// Conversión rápida HSL a RGB sin instanciar strings repetidos para el parser CSS
function getHslRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return `rgb(${r},${g},${b})`;
}

export function WebcamPixelGrid({
  className = '',
  pixelSize = 18,
  gap = 3,
  inverted = false,
  interactive = true,
  autoStartCamera = false,
  showControls = false,
  monochrome = true,
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

  // Iniciar la cámara web solo si se solicita explícitamente
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
      console.warn('Cámara no activada, operando en modo procedural:', err.message);
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

  // Loop de renderizado del Canvas de Alta Eficiencia (60 FPS sin GC pauses)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    let time = 0;
    let lastTimestamp = 0;
    let isDisposed = false;

    const resize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (timestamp) => {
      if (isDisposed) return;

      // Limitar a máximo 45-60 FPS para no saturar el hilo principal
      if (timestamp - lastTimestamp < 22) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastTimestamp = timestamp;

      time += 0.035;
      const width = canvas.width || 300;
      const height = canvas.height || 300;

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
      const halfW = width / 2;
      const halfH = height / 2;

      // Renderizar la cuadrícula de BLOQUES PIXELADOS
      for (let r = 0; r < rows; r++) {
        const py = r * cellSize;
        const centerY = py + pixelSize / 2;

        for (let c = 0; c < cols; c++) {
          const px = c * cellSize;
          const centerX = px + pixelSize / 2;

          let colorFill = '';

          if (pixelData) {
            const index = (r * cols + c) * 4;
            let red = pixelData[index];
            let green = pixelData[index + 1];
            let blue = pixelData[index + 2];

            if (monochrome) {
              let gray = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
              if (mouse.active) {
                const dx = centerX - mouse.x;
                const dy = centerY - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 140) {
                  const boost = (1 - dist / 140) * 80;
                  gray = Math.min(255, Math.round(gray + boost));
                }
              }
              colorFill = `rgb(${gray},${gray},${gray})`;
            } else {
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
              colorFill = `rgb(${red},${green},${blue})`;
            }
          } else {
            // Ondas monocromáticas procedurales en blanco y negro (Grayscale / B&W)
            const distToCenter = Math.hypot(centerX - halfW, centerY - halfH);
            const wave1 = Math.sin(c * 0.14 + time * 1.6);
            const wave2 = Math.cos(r * 0.14 - time * 1.3);
            const ripple = Math.sin(distToCenter * 0.02 - time * 2.2);

            const rawIntensity = (wave1 * 0.35 + wave2 * 0.35 + ripple * 0.3) * 0.5 + 0.5;

            if (monochrome) {
              // Escala de grises pura / Blanco y negro estilizado
              let grayVal = Math.round(18 + rawIntensity * 135);

              if (mouse.active) {
                const dx = centerX - mouse.x;
                const dy = centerY - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 160) {
                  const mousePower = 1 - dist / 160;
                  grayVal = Math.min(255, Math.round(grayVal + mousePower * 115));
                }
              }

              colorFill = `rgb(${grayVal},${grayVal},${grayVal})`;
            } else {
              let hue = (c * 4 + r * 3 + time * 32) % 360;
              let saturation = 90;
              let lightness = Math.max(10, Math.min(65, rawIntensity * 60 + 10));

              if (mouse.active) {
                const dx = centerX - mouse.x;
                const dy = centerY - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 160) {
                  const mousePower = 1 - dist / 160;
                  lightness = Math.min(85, lightness + mousePower * 45);
                  hue = (hue + mousePower * 60) % 360;
                }
              }

              colorFill = getHslRgb(hue, saturation, lightness);
            }
          }

          ctx.fillStyle = colorFill;
          ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [pixelSize, gap, isCameraActive, interactive, monochrome]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full overflow-hidden bg-black ${className}`}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden pointer-events-none"
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />

      {/* Gradientes de contraste para legibilidad del contenido */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.8)_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black/60" />

      {children && <div className="relative z-20 w-full h-full">{children}</div>}
    </div>
  );
}

export default WebcamPixelGrid;
