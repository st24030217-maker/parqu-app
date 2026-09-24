import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Sparkles } from 'lucide-react';

export function WebcamPixelGrid({
  className = '',
  pixelSize = 8,
  gap = 4,
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

  // Iniciar la cámara
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Cámara no soportada en este navegador');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
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
      console.warn('Acceso a cámara no disponible, usando modo ambiental interactivo:', err.message);
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

  // Manejo de interactividad del mouse
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

  // Loop de renderizado del Canvas Pixel Grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Crear canvas offscreen para muestrear video
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
      time += 0.03;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const cellSize = pixelSize + gap;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      // Si la cámara está activa y reproduciendo
      const video = videoRef.current;
      const hasLiveVideo = isCameraActive && video && video.readyState >= 2;

      let pixelData = null;

      if (hasLiveVideo && offCtx) {
        offscreen.width = cols;
        offscreen.height = rows;
        // Invertir horizontalmente para efecto espejo natural de webcam
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

      // Dibujar cada celda del Pixel Grid
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize;
          const y = r * cellSize;
          const centerX = x + pixelSize / 2;
          const centerY = y + pixelSize / 2;

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
            // Animación procedimental geométrica de ondas fluidas si no hay cámara
            const distToCenter = Math.hypot(centerX - width / 2, centerY - height / 2);
            const wave1 = Math.sin(c * 0.12 + time) * 0.5 + 0.5;
            const wave2 = Math.cos(r * 0.12 - time * 0.8) * 0.5 + 0.5;
            const ripple = Math.sin(distToCenter * 0.02 - time * 1.5) * 0.5 + 0.5;
            intensity = (wave1 * 0.35 + wave2 * 0.35 + ripple * 0.3) * 0.6;
          }

          // Efecto de interacción del mouse
          if (mouse.active) {
            const dx = centerX - mouse.x;
            const dy = centerY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxRadius = 140;

            if (dist < maxRadius) {
              const mousePower = (1 - dist / maxRadius);
              intensity = Math.min(1, intensity + mousePower * 0.7);
            }
          }

          // Si la intensidad es muy baja, dibujar un punto sutil tenue
          const baseAlpha = 0.06;
          const currentAlpha = Math.max(baseAlpha, Math.min(0.95, intensity));
          const currentSize = Math.max(1.5, pixelSize * (0.3 + intensity * 0.7));

          // Color monocromático obsidian: blanco resplandeciente según intensidad
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
          
          // Dibujar píxel redondeado
          const offset = (pixelSize - currentSize) / 2;
          const px = x + offset;
          const py = y + offset;
          const radius = Math.min(2.5, currentSize / 2);

          ctx.beginPath();
          ctx.roundRect(px, py, currentSize, currentSize, radius);
          ctx.fill();

          // Resplandor en píxeles muy brillantes
          if (intensity > 0.75) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
            ctx.shadowBlur = 6;
          } else {
            ctx.shadowBlur = 0;
          }
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
      {/* Video oculto para el muestreo de la webcam */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden pointer-events-none"
      />

      {/* Canvas interactivo de Pixel Grid */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />

      {/* Gradientes oscuros para mejorar contraste y legibilidad del contenido */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.85)_100%)]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-black/60" />

      {/* Control flotante para activar/desactivar cámara */}
      <div className="absolute top-6 right-6 z-30 pointer-events-auto">
        <button
          onClick={toggleCamera}
          title={isCameraActive ? 'Desactivar cámara' : 'Activar cámara para Pixel Grid'}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all duration-300 border backdrop-blur-md ${
            isCameraActive
              ? 'bg-white/10 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-white/20'
              : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
          }`}
        >
          {isCameraActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>Cámara Activa</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
              <span>Modo Dinámico</span>
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
