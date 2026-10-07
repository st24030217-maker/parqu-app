import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ArrowRight,
  Wifi,
  QrCode,
  ShieldCheck,
  Car,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { animate, stagger } from 'animejs';
import { AnimeCardSheen } from './ui/anime-card-sheen';
import CurvedLoop from './ui/CurvedLoop';
import { RadialGlowButton } from './ui/radial-glow-button';
import { Button as StatefulButton } from './ui/stateful-button';
import { GtaViPoster } from './ui/gta-vi-poster';
import { useParking } from '../context/ParkingContext';
import { requestParkingNotificationPermission } from '../utils/parkingNotification';

// Cronómetro en vivo ligero para la fila de autocobro del panel trasero
const LiveSecondsRow = memo(() => {
  const [seconds, setSeconds] = useState(865); // 00:14:25 inicial

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div
      style={{ letterSpacing: '-0.03em' }}
      className="text-[16px] sm:text-[22px] lg:text-[24px] font-black font-mono text-[#01033E] leading-none"
    >
      {formatted}
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════
// COMPOSICIÓN HERO DE PARQU (ESTRUCTURA DE PANELES SUPERPUESTOS + DISEÑO OFICIAL PARQU)
// Respeta al 100% la paleta (#01033E, #0033FF, #807DFE), el fondo blanco limpio,
// los logotipos transparentes oficiales y las tarjetas reales de Parqu.
// ══════════════════════════════════════════════════════════════════════════
const ParquHeroComposition = memo(({ plates, balance, ownerName, onEnter }) => {
  const formattedBalance = Number(balance ?? 320).toFixed(2);
  const activePlates = plates || 'XYZ-7842';
  const initials =
    (ownerName || 'Sebastián Salinas')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || 'SS';

  return (
    <div className="relative w-full h-full flex items-center justify-center lg:justify-end select-none">
      {/* Resplandor atmosférico suave de Parqu detrás de los paneles sobre el fondo blanco */}
      <div
        className="absolute inset-0 rounded-full blur-3xl pointer-events-none opacity-65"
        style={{
          background:
            'radial-gradient(circle at 55% 50%, rgba(0, 51, 255, 0.22) 0%, rgba(128, 125, 254, 0.16) 48%, transparent 74%)',
        }}
      />

      {/* Contenedor escalable que preserva la proporción y solapamiento en celular y escritorio */}
      <div className="relative w-[335px] h-[360px] sm:w-[555px] sm:h-[485px] lg:w-[660px] lg:h-[540px]">
        
        {/* ── 1. PANEL TRASERO (BILLETERA DIGITAL PARQU — ~60% IZQUIERDO VISIBLE) ── */}
        <div
          onClick={onEnter}
          style={{
            boxShadow: '0 24px 60px rgba(1, 3, 62, 0.14)',
          }}
          className="absolute left-0 sm:left-2 lg:left-0 top-6 sm:top-10 lg:top-11 z-10 w-[212px] sm:w-[308px] lg:w-[342px] min-h-[300px] sm:min-h-[410px] lg:min-h-[448px] rounded-[24px] sm:rounded-[28px] bg-white border border-slate-200/90 text-[#01033E] p-4 sm:p-6 flex flex-col justify-between overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
        >
          {/* Encabezado y Saldo Principal */}
          <div>
            <div className="flex items-center justify-between pr-6 sm:pr-10">
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#0033FF] font-bold">
                01 • Billetera Digital
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-400">
                MXN
              </span>
            </div>

            <div
              style={{ letterSpacing: '-0.02em' }}
              className="mt-1 text-[14px] sm:text-[18px] font-extrabold text-[#01033E] leading-none"
            >
              Saldo Parqu
            </div>

            <div
              style={{ letterSpacing: '-0.04em' }}
              className="mt-2 sm:mt-2.5 text-[24px] sm:text-[34px] lg:text-[38px] font-black text-[#01033E] leading-none"
            >
              ${formattedBalance}
            </div>

            {/* Metadatos del vehículo y pase NFC */}
            <div className="mt-1.5 sm:mt-2 space-y-0.5 text-[10px] sm:text-[12px] font-medium text-slate-500">
              <div>
                Placa <strong className="font-mono text-[#01033E]">{activePlates}</strong>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Pase NFC Activo • Sin comisión</span>
              </div>
            </div>

            {/* Dos botones tipo píldora con la identidad de Parqu */}
            <div className="mt-3.5 sm:mt-5 flex items-center gap-2 sm:gap-2.5">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#0033FF] text-white text-[10px] sm:text-[12px] font-bold leading-none shadow-sm">
                Recargar
              </span>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-100 text-[#01033E] text-[10px] sm:text-[12px] font-bold leading-none">
                Autocobro
              </span>
            </div>
          </div>

          {/* 3 Filas de métricas del parquímetro */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200/80 space-y-2.5 sm:space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div
                  style={{ letterSpacing: '-0.03em' }}
                  className="text-[16px] sm:text-[22px] lg:text-[24px] font-black text-[#01033E] leading-none"
                >
                  $6.00
                </div>
                <div className="text-[9.5px] sm:text-[11.5px] font-medium text-slate-500 mt-0.5">
                  Tarifa oficial por hora
                </div>
              </div>
              {/* Mini sparkline en azul eléctrico Parqu */}
              <svg
                width="48"
                height="20"
                viewBox="0 0 48 20"
                fill="none"
                className="opacity-85 mr-8 sm:mr-14"
              >
                <path
                  d="M2 15L12 11L21 13L31 6L45 3"
                  stroke="#0033FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <LiveSecondsRow />
              <div className="text-[9.5px] sm:text-[11.5px] font-medium text-slate-500 mt-0.5">
                Cronómetro al segundo
              </div>
            </div>

            <div>
              <div
                style={{ letterSpacing: '-0.03em' }}
                className="text-[16px] sm:text-[22px] lg:text-[24px] font-black text-[#01033E] leading-none"
              >
                $180.00
              </div>
              <div className="text-[9.5px] sm:text-[11.5px] font-medium text-slate-500 mt-0.5">
                Límite automático protegido
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. PANEL FRONTAL (DEGRADADO INSIGNIA PARQU #01033E → #0033FF + "$6" HERO) ── */}
        <div
          onClick={onEnter}
          style={{
            background: 'linear-gradient(155deg, #01033E 0%, #0033FF 58%, #807DFE 100%)',
            boxShadow: '-18px 24px 60px rgba(1, 3, 62, 0.32)',
          }}
          className="absolute left-[114px] sm:left-[192px] lg:left-[220px] top-0 sm:top-1 lg:top-2 z-20 w-[212px] sm:w-[312px] lg:w-[348px] h-[312px] sm:h-[425px] lg:h-[468px] rounded-[24px] sm:rounded-[28px] text-white p-4 sm:p-6 flex flex-col justify-between overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
        >
          {/* Fila superior: icono QR/NFC arriba a la izquierda + logo oficial/iniciales arriba a la derecha */}
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>

            <div className="flex items-center gap-2">
              <img
                src="./parqu-logo-white.png"
                alt="Parqu"
                className="h-5 sm:h-6 w-auto object-contain bg-transparent"
              />
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#01033E]/50 border border-white/30 flex items-center justify-center text-[10px] sm:text-[11px] font-bold tracking-tight text-white">
                {initials}
              </div>
            </div>
          </div>

          {/* Columna vertical de dígitos sobre el borde izquierdo interior */}
          <div className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 sm:gap-5 text-[12px] sm:text-[15px] font-mono font-bold text-white/35 pointer-events-none">
            <span>1</span>
            <span>4</span>
            <span>7</span>
            <span>•</span>
            <span>0</span>
          </div>

          {/* HERO FIGURE: "$6" en el centro óptico con el peso más alto */}
          <div className="my-auto flex flex-col items-center justify-center text-center pl-3 sm:pl-4">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 sm:mb-2">
              ● AUTOCOBRO POR SEGUNDO
            </span>
            <div
              style={{
                letterSpacing: '-0.055em',
                lineHeight: 0.9,
              }}
              className="text-[92px] sm:text-[144px] lg:text-[164px] font-black text-white select-none drop-shadow-sm"
            >
              $6
            </div>
            <span className="mt-2 sm:mt-3 text-[10px] sm:text-[12.5px] font-mono font-bold uppercase tracking-widest text-[#D4D6E6]">
              MXN / HORA OFICIAL
            </span>
          </div>

          {/* Pie minimalista dentro del panel frontal */}
          <div className="flex items-center justify-between text-[10px] sm:text-[12px] font-mono font-semibold text-[#D4D6E6]">
            <span className="inline-flex items-center gap-1.5 text-white">
              <Wifi className="w-3.5 h-3.5 rotate-90 text-emerald-300" />
              NFC AES-256
            </span>
            <span className="text-white font-bold">{activePlates}</span>
          </div>
        </div>

        {/* ── 3. TARJETA OFICIAL DE PARQU EN ESQUINA INFERIOR DERECHA (SOBREPUESTA Y RECORTADA) ── */}
        <div
          onClick={onEnter}
          style={{
            boxShadow: '-14px 18px 48px rgba(1, 3, 62, 0.35)',
          }}
          className="absolute -right-4 -bottom-4 sm:-right-6 sm:-bottom-6 lg:-right-8 lg:-bottom-8 z-30 w-[195px] h-[122px] sm:w-[285px] sm:h-[178px] lg:w-[325px] lg:h-[202px] rounded-[18px] sm:rounded-[22px] overflow-hidden border border-white/50 cursor-pointer transition-transform duration-300 hover:scale-[1.03]"
        >
          {/* Arte oficial de la Tarjeta Azul de Parqu */}
          <img
            src="./cards/parqu-card-blue.jpg"
            alt="Tarjeta Digital Parqu"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(1, 3, 62, 0.12) 0%, rgba(1, 3, 62, 0.32) 100%)',
            }}
          />

          {/* Contenido legible con el mismo diseño de DigitalCard.jsx */}
          <div className="relative z-10 p-3 sm:p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#040926]/80 backdrop-blur-md border border-white/20 text-[9px] sm:text-[11px] font-black tracking-tight text-[#0044FF]">
                <span className="text-white">PARQU</span>
                <Wifi className="w-3 h-3 rotate-90 text-sky-300" />
              </span>

              <span className="px-2 py-0.5 rounded-lg bg-[#040926]/80 backdrop-blur-md border border-white/20 text-[8px] sm:text-[10px] font-mono font-bold text-emerald-300">
                NFC PASS
              </span>
            </div>

            <div className="self-start px-2.5 py-1.5 rounded-xl bg-[#040926]/82 backdrop-blur-md border border-white/20">
              <div className="text-[7.5px] sm:text-[9px] font-mono uppercase tracking-widest text-sky-200 font-bold">
                Tarjeta Digital Parqu
              </div>
              <div className="text-[11px] sm:text-[14px] font-mono font-black text-white tracking-wider leading-tight">
                {activePlates}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

export const LoadingScreen = ({ onComplete }) => {
  const {
    vehicle,
    owner,
    card,
    updateOwner,
    updateVehicle,
    performCloudBackup,
    restoreFromCloudBackup,
  } = useParking();

  // Fase 1: Pantalla de carga inicial con la animación fluida sobre el logo oficial de Parqu (sin barra de carga)
  const [isBootLoading, setIsBootLoading] = useState(true);

  // Fase 2 y 3: Pantalla de bienvenida en fondo blanco con RadialGlowButton "Empecemos" -> Modal Login / Registro
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: owner?.fullName || '',
    email: owner?.email || '',
    plates: vehicle?.plates || 'XYZ-7842',
    password: '',
  });
  const [authError, setAuthError] = useState('');

  const [isExiting, setIsExiting] = useState(false);
  const hasExitedRef = useRef(false);
  const authCardRef = useRef(null);

  // Transición limpia al terminar la animación inicial sobre el logo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBootLoading(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Animaciones Anime.js en el Login
  useEffect(() => {
    if (!showAuthModal || !authCardRef.current) return undefined;

    animate(authCardRef.current, {
      opacity: [0, 1],
      translateY: [28, 0],
      scale: [0.92, 1],
      duration: 720,
      ease: 'outElastic(1, .65)',
    });

    const items = authCardRef.current.querySelectorAll('.login-stagger-item');
    if (items.length > 0) {
      animate(items, {
        opacity: [0, 1],
        translateY: [16, 0],
        delay: stagger(60, { start: 90 }),
        duration: 520,
        ease: 'outCubic',
      });
    }

    return undefined;
  }, [showAuthModal, authMode]);

  // Ejecuta la animación de salida suave hacia el sistema principal después de iniciar sesión o registrarse
  const handleTriggerExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    requestParkingNotificationPermission().catch(() => {});
    document.body.dataset.loadingActive = 'false';
    setIsExiting(true);

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 650);
  }, [onComplete]);

  const handleOpenAuthModal = useCallback(() => {
    setAuthError('');
    setShowAuthModal(true);
  }, []);

  // Procesar inicio de sesión o registro con StatefulButton y respaldo automático
  const handleAuthSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setAuthError('');

    const cleanEmail = (formData.email || '').trim();
    const cleanPassword = (formData.password || '').trim();
    const cleanName = (formData.fullName || '').trim();
    const cleanPlates = (formData.plates || '').trim().toUpperCase();

    if (!cleanEmail || !cleanPassword) {
      setAuthError('Por favor ingresa tu correo y contraseña para continuar.');
      return false;
    }

    if (authMode === 'register' && !cleanName) {
      setAuthError('Por favor ingresa tu nombre completo para registrarte.');
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, 650));

    if (authMode === 'login' && typeof restoreFromCloudBackup === 'function') {
      const restored = await restoreFromCloudBackup(cleanEmail);
      if (!restored && typeof updateOwner === 'function') {
        updateOwner({
          fullName: owner?.fullName || cleanEmail.split('@')[0] || 'Usuario Parqu',
          email: cleanEmail,
        });
      }
    } else {
      if (typeof updateOwner === 'function') {
        updateOwner({
          fullName: cleanName || owner?.fullName || 'Usuario Parqu',
          email: cleanEmail,
        });
      }
      if (cleanPlates && typeof updateVehicle === 'function') {
        updateVehicle({ plates: cleanPlates });
      }
      if (typeof performCloudBackup === 'function') {
        performCloudBackup().catch(() => {});
      }
    }

    setTimeout(() => {
      setShowAuthModal(false);
      handleTriggerExit();
    }, 550);

    return true;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showAuthModal) {
        setShowAuthModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAuthModal]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.dataset.loadingActive = 'true';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.dataset.loadingActive = 'false';
    };
  }, []);

  return (
    <div
      style={{
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.65s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.45s ease',
        willChange: 'transform, opacity',
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-50 overflow-y-auto overflow-x-hidden select-none pointer-events-auto bg-white font-sans flex items-center justify-center px-4 sm:px-10 lg:px-16 py-4 sm:py-0"
    >
      {/* 
        ══════════════════════════════════════════════════════════════
        FASE 1: PANTALLA DE CARGA INICIAL (@aceternity/gta-vi-poster SOBRE EL LOGO DE PARQU)
        Animación fluida a 60fps sobre el logo, sin barra de carga
        ══════════════════════════════════════════════════════════════
      */}
      {isBootLoading ? (
        <GtaViPoster
          duration={2.0}
          cameraScale={1.16}
          fit={0.85}
          depth={1}
          logoBlur={4}
          background="#ffffff"
          logoSrc="./parqu-logo-black.png"
          logoAlt="Parqu Logo"
          showReplay={false}
          className="fixed inset-0 z-30 w-screen h-[100dvh]"
        />
      ) : (
        /* 
          ══════════════════════════════════════════════════════════════
          FASE 2: PANTALLA DE BIENVENIDA EN FONDO BLANCO RESPETANDO EL DISEÑO DE PARQU
          ══════════════════════════════════════════════════════════════
        */
        <div className="relative z-10 w-full max-w-[1280px] mx-auto my-auto py-2 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-6 items-center animate-in fade-in duration-500">
          
          {/* COLUMNA IZQUIERDA: LOGO OFICIAL PARQU TRANSPARENTE, SLOGAN Y BOTÓN RADIALGLOWBUTTON "EMPECEMOS" */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3 sm:space-y-7">
            {/* Logotipo Oficial Parqu 100% Transparente para Fondo Blanco */}
            <div className="relative flex items-center justify-center bg-transparent">
              <img
                src="./parqu-logo-black.png"
                alt="Parqu Logo"
                className="h-14 sm:h-28 md:h-32 w-auto object-contain bg-transparent relative z-10"
              />
            </div>

            {/* Slogan Oficial */}
            <p className="font-sans text-xs sm:text-lg md:text-xl text-slate-600 font-normal tracking-normal leading-snug sm:leading-relaxed max-w-[290px] sm:max-w-md">
              Sistema Inteligente de <span className="text-slate-900 font-bold">Parquímetros</span> y Autocobro Digital
            </p>

            {/* Botón "Empecemos" con RadialGlowButton que veníamos manejando */}
            <div className="pt-0.5 sm:pt-1">
              <RadialGlowButton
                type="button"
                onClick={handleOpenAuthModal}
              >
                <span>Empecemos</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white inline transition-transform duration-300 group-hover:translate-x-1.5" />
              </RadialGlowButton>
            </div>
          </div>

          {/* COLUMNA DERECHA: COMPOSICIÓN DE PANELES SUPERPUESTOS + TARJETA OFICIAL PARQU */}
          <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
            <ParquHeroComposition
              plates={vehicle?.plates}
              balance={card?.balance}
              ownerName={owner?.fullName}
              onEnter={handleOpenAuthModal}
            />
          </div>
        </div>
      )}

      {/* 
        ══════════════════════════════════════════════════════════════
        FASE 3: MODAL DE ACCESO (LOGIN / REGISTRO) AL PRESIONAR "EMPECEMOS"
        ══════════════════════════════════════════════════════════════
      */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="parqu-auth-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <AnimeCardSheen className="w-full max-w-[360px] sm:max-w-[380px] my-auto">
            <div
              ref={authCardRef}
              className="relative w-full max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-3xl bg-[#070B2E]/95 border border-white/15 p-4 sm:p-6 text-white shadow-[0_28px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
            >
              {/* Botón cerrar */}
              <button
                type="button"
                aria-label="Cerrar ventana de acceso"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#D4D6E6] hover:text-white transition cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Encabezado de Bienvenida con Logo 100% Transparente */}
              <div className="relative z-10 text-center mb-1 bg-transparent border-0 shadow-none">
                <div className="flex items-center justify-center mb-1.5 sm:mb-2 bg-transparent border-0 shadow-none">
                  <img
                    src="./parqu-logo-white.png"
                    alt="Parqu"
                    className="h-8 sm:h-11 w-auto object-contain bg-transparent border-0 shadow-none"
                  />
                </div>

                <h2
                  id="parqu-auth-title"
                  className="text-base sm:text-xl font-black tracking-tight text-white bg-transparent"
                >
                  {authMode === 'login' ? 'Bienvenido de vuelta' : 'Bienvenido a Parqu'}
                </h2>
              </div>

              {/* Animación CurvedLoop-JS-CSS 100% transparente de lado a lado */}
              <div className="relative z-10 -mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] my-1 sm:my-1.5 bg-transparent border-0 shadow-none overflow-visible">
                <CurvedLoop
                  marqueeText={
                    authMode === 'login'
                      ? 'ACCESO DIGITAL NFC ✦ AUTOCOBRO EN VIVO ✦ SIN FILAS NI MONEDAS ✦'
                      : 'CREA TU CUENTA NFC ✦ REGISTRO EN SEGUNDOS ✦ PARQU METROPOLITANO ✦'
                  }
                  speed={1.2}
                  curveAmount={110}
                  direction="left"
                  interactive={true}
                  className="fill-white font-mono"
                />
              </div>

              {/* Selector Iniciar Sesión / Registrarse */}
              <div className="login-stagger-item relative z-10 grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/10 mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border-0 ${
                    authMode === 'login'
                      ? 'bg-[#0033FF] text-white shadow-md'
                      : 'bg-transparent text-[#D4D6E6] hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border-0 ${
                    authMode === 'register'
                      ? 'bg-[#0033FF] text-white shadow-md'
                      : 'bg-transparent text-[#D4D6E6] hover:text-white'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Formulario compacto de Login / Registro */}
              <form onSubmit={handleAuthSubmit} className="relative z-10 space-y-2.5 text-left">
                {authMode === 'register' && (
                  <div className="login-stagger-item">
                    <label className="block text-[11px] font-bold text-[#D4D6E6] mb-1">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder="Ej. Sebastián Salinas"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE] transition"
                      />
                    </div>
                  </div>
                )}

                <div className="login-stagger-item">
                  <label className="block text-[11px] font-bold text-[#D4D6E6] mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="usuario@correo.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE] transition"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div className="login-stagger-item">
                    <label className="block text-[11px] font-bold text-[#D4D6E6] mb-1">
                      Placas de tu vehículo
                    </label>
                    <div className="relative">
                      <Car className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.plates}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            plates: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="XYZ-7842"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs font-mono uppercase text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE] transition"
                      />
                    </div>
                  </div>
                )}

                <div className="login-stagger-item">
                  <label className="block text-[11px] font-bold text-[#D4D6E6] mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4D6E6] hover:text-white bg-transparent border-0 p-0 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="text-[11px] text-rose-300 font-medium text-center bg-rose-500/15 py-1.5 px-2.5 rounded-xl">
                    {authError}
                  </p>
                )}

                <div className="login-stagger-item pt-1.5 flex justify-center">
                  <StatefulButton
                    type="button"
                    onClick={handleAuthSubmit}
                    className="w-full py-3 rounded-full text-xs sm:text-sm font-bold"
                  >
                    <span>
                      {authMode === 'login' ? 'Iniciar Sesión y Entrar' : 'Registrarse y Entrar'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </StatefulButton>
                </div>

                {/* Pie del Login con Logo SSS.Solutions 100% Transparente */}
                <div className="login-stagger-item pt-2 flex items-center justify-center gap-2 bg-transparent border-0">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4D6E6]/65">
                    Powered by
                  </span>
                  <img
                    src="/sss-solutions-logo.png"
                    alt="SSS.Solutions"
                    className="h-4 w-auto object-contain bg-transparent border-0 shadow-none opacity-90"
                  />
                </div>
              </form>
            </div>
          </AnimeCardSheen>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
