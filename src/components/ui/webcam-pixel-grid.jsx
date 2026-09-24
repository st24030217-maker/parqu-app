import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Sparkles } from 'lucide-react';

export function WebcamPixelGrid({
  className = '',
  pixelSize = 14,
  gap = 2,
  inverted = false,
  interactive = true,
  autoStartCamera = true,
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
      console.warn('Cámara no disponible, activando modo pixelado ambiental interactivo:', err.message);
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

  // Loop de renderizado del Canvas con Bloques de Píxeles Cuadrados Reales (Pixel Art Shader Grid)
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
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.035;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const cellSize = pixelSize + gap;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      const video = videoRef.current;
      const hasLiveVideo = isCameraActive && video && video.readyState >= 2;

      let pixelData = null;

      if (hasLiveVideo && offCtx) {
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

      // Renderizar la cuadrícula de BLOQUES PIXELADOS
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = c * cellSize;
          const py = r * cellSize;
          const centerX = px + pixelSize / 2;
          const centerY = py + pixelSize / 2;

          let intensity = 0;

          if (pixelData) {
            const index = (r * cols + c) * 4;
            const red = pixelData[index];
            const green = pixelData[index + 1];
            const blue = pixelData[index + 2];
            // Luminancia relativa
            const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
            intensity = inverted ? 1 - luminance : luminance;
          } else {
            // Ondas de flujo digital pixeleado procedural si no hay cámara activa
            const distToCenter = Math.hypot(centerX - width / 2, centerY - height / 2);
            const waveX = Math.sin(c * 0.15 + time * 1.2);
            const waveY = Math.cos(r * 0.15 - time * 0.9);
            const ripple = Math.sin(distToCenter * 0.025 - time * 1.8);
            
            // Umbralización de píxeles para aspecto retro / cyber bloque
            const rawVal = (waveX * 0.35 + waveY * 0.35 + ripple * 0.3) * 0.5 + 0.5;
            // Cuantización de intensidad en escalones de píxel
            intensity = Math.floor(rawVal * 6) / 6;
          }

          // Interacción de proximidad con el cursor del mouse
          if (mouse.active) {
            const dx = centerX - mouse.x;
            const dy = centerY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = 160;

            if (dist < maxRadius) {
              const mouseFactor = 1 - dist / maxRadius;
              intensity = Math.min(1, intensity + mouseFactor * 0.85);
            }
          }

          // Renderizado de bloque de píxel cuadrado sólido
          // Si la intensidad es muy baja, mantener el marco de píxel tenue
          const minAlpha = 0.04;
          const alpha = Math.max(minAlpha, Math.min(0.92, intensity));
          const brightness = Math.floor(255 * alpha);

          ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
          
          // Bloque de píxel rectangular/cuadrado con 1px de separación para efecto de matriz LCD/LED
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

      {/* Canvas del fondo con efecto pixeleado auténtico */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />

      {/* Gradientes de contraste para resaltar el contenido */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.85)_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black/70" />

      {/* Control flotante para activar/desactivar la cámara */}
      <div className="absolute top-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={toggleCamera}
          title={isCameraActive ? 'Desactivar cámara' : 'Activar cámara en vivo'}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all duration-300 border backdrop-blur-md ${
            isCameraActive
              ? 'bg-white/10 text-white border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:bg-white/20'
              : 'bg-neutral-900/80 text-neutral-300 border-neutral-700 hover:text-white hover:border-white/40'
          }`}
        >
          {isCameraActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>Cámara Pixeleada</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
              <span>Pixeleado Dinámico</span>
            </>
          )}
        </button>
      </div>

      {/* Contenido superpuesto */}
      {children && <div className="relative z-20 w-full h-full">{children}</div>}
    </div>
  );
}

export default WebcamPixelGrid;
