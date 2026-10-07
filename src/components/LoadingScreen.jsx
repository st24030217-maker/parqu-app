import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  ArrowRight,
  Wifi,
  QrCode,
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
import { Button as StatefulButton } from './ui/stateful-button';
import { useParking } from '../context/ParkingContext';
import { requestParkingNotificationPermission } from '../utils/parkingNotification';

// ══════════════════════════════════════════════════════════════════════════
// COMPOSICIÓN KAGE DESIGN (1200×630 PROPORTIONS ADAPTED FOR DESKTOP & MOBILE)
// - Ground: Full-bleed solid black (#000000), zero gradient/vignette.
// - Brand Anchor: Bottom-left rounded square (#0033FF) with bold Parqu glyph.
// - UI Stack: Centre-right overlapping phone panels (Back white panel + Front #0033FF panel).
// - Hero Figure: Giant "$6" in heaviest weight at the optical centre of the front panel.
// - Texture Prop: Bottom-right cropped card with warm metallic (#C98A3B–#E0A44E) micro-pattern.
// ══════════════════════════════════════════════════════════════════════════
const KageHeroComposition = memo(({ plates, balance, ownerName }) => {
  const formattedBalance = Number(balance ?? 320).toFixed(2);
  const activePlates = plates || 'XYZ-7842';
  const initials = (ownerName || 'Sebastián Salinas')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'SS';

  return (
    <div className="relative w-full h-full flex items-center justify-center lg:justify-end select-none">
      {/* Contenedor escalable que preserva la relación y solapamiento exacto en celular y escritorio */}
      <div className="relative w-[340px] h-[370px] sm:w-[560px] sm:h-[490px] lg:w-[690px] lg:h-[560px]">
        
        {/* ── 3A. BACK PANEL (LIGHT UI SCREEN — LEFT ~60% VISIBLE) ── */}
        <div
          style={{
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
          }}
          className="absolute left-0 sm:left-2 lg:left-0 top-6 sm:top-10 lg:top-12 z-10 w-[215px] sm:w-[310px] lg:w-[348px] min-h-[305px] sm:min-h-[415px] lg:min-h-[455px] rounded-[22px] sm:rounded-[26px] bg-white text-black p-4 sm:p-6 flex flex-col justify-between overflow-hidden"
        >
          {/* Encabezado y Saldo Principal */}
          <div>
            <div className="flex items-center justify-between">
              <span
                style={{ letterSpacing: '-0.02em' }}
                className="text-[14px] sm:text-[18px] lg:text-[19px] font-bold text-black leading-none"
              >
                Saldo Parqu
              </span>
              <span className="text-[10px] sm:text-[12px] font-medium text-[#8A8F98]">
                MXN
              </span>
            </div>

            <div
              style={{ letterSpacing: '-0.04em' }}
              className="mt-2 sm:mt-3 text-[24px] sm:text-[34px] lg:text-[38px] font-black text-black leading-none"
            >
              ${formattedBalance}
            </div>

            {/* Dos metadatos pequeños en gris #8A8F98 */}
            <div className="mt-1.5 sm:mt-2 space-y-0.5 text-[10px] sm:text-[12px] font-medium text-[#8A8F98]">
              <div>Placa {activePlates}</div>
              <div>Pase NFC Activo • Sin comisión</div>
            </div>

            {/* Dos botones tipo píldora (full-radius pills) */}
            <div className="mt-3.5 sm:mt-5 flex items-center gap-2 sm:gap-2.5">
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#F2F3F5] text-black text-[10px] sm:text-[12.5px] font-bold leading-none">
                Recargar
              </div>
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#F2F3F5] text-black text-[10px] sm:text-[12.5px] font-bold leading-none">
                Autocobro
              </div>
            </div>
          </div>

          {/* 3 Filas de saldos/métricas secundarias con leyendas en #8A8F98 */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[#ECEEF2] space-y-2.5 sm:space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div
                  style={{ letterSpacing: '-0.03em' }}
                  className="text-[16px] sm:text-[22px] lg:text-[25px] font-bold text-black leading-none"
                >
                  $6.00
                </div>
                <div className="text-[9.5px] sm:text-[12px] font-medium text-[#8A8F98] mt-0.5">
                  Tarifa por hora
                </div>
              </div>
              {/* Mini sparkline limpio */}
              <svg
                width="48"
                height="20"
                viewBox="0 0 48 20"
                fill="none"
                className="opacity-70 mr-8 sm:mr-14"
              >
                <path
                  d="M2 15L12 11L21 13L31 6L45 3"
                  stroke="#0033FF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <div
                style={{ letterSpacing: '-0.03em' }}
                className="text-[16px] sm:text-[22px] lg:text-[25px] font-bold text-black leading-none"
              >
                00:14:25
              </div>
              <div className="text-[9.5px] sm:text-[12px] font-medium text-[#8A8F98] mt-0.5">
                Cronómetro al segundo
              </div>
            </div>

            <div>
              <div
                style={{ letterSpacing: '-0.03em' }}
                className="text-[16px] sm:text-[22px] lg:text-[25px] font-bold text-black leading-none"
              >
                $180.00
              </div>
              <div className="text-[9.5px] sm:text-[12px] font-medium text-[#8A8F98] mt-0.5">
                Límite automático
              </div>
            </div>
          </div>
        </div>

        {/* ── 3B & 4. FRONT PANEL (SOLID ACCENT #0033FF + GIANT "$6" HERO FIGURE) ── */}
        <div
          style={{
            backgroundColor: '#0033FF',
            boxShadow: '-18px 24px 64px rgba(0, 0, 0, 0.65)',
          }}
          className="absolute left-[118px] sm:left-[195px] lg:left-[225px] top-0 sm:top-1 lg:top-2 z-20 w-[212px] sm:w-[315px] lg:w-[352px] h-[315px] sm:h-[430px] lg:h-[472px] rounded-[22px] sm:rounded-[26px] text-white p-4 sm:p-6 flex flex-col justify-between overflow-hidden"
        >
          {/* Fila superior: icono utilitario arriba a la izquierda + avatar circular arriba a la derecha */}
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/15 flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>

            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/25 border border-white/30 flex items-center justify-center text-[10px] sm:text-[12px] font-bold tracking-tight text-white">
              {initials}
            </div>
          </div>

          {/* Columna vertical escasa de dígitos tipo teclado sobre el borde izquierdo interior */}
          <div className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 sm:gap-5 text-[12px] sm:text-[16px] font-bold text-white/35 pointer-events-none">
            <span>1</span>
            <span>4</span>
            <span>7</span>
            <span>•</span>
            <span>0</span>
          </div>

          {/* 4. HERO FIGURE: "$6" en el centro óptico con el peso más alto y tracking cerrado */}
          <div className="my-auto flex flex-col items-center justify-center text-center pl-3 sm:pl-4">
            <div
              style={{
                letterSpacing: '-0.055em',
                lineHeight: 0.9,
              }}
              className="text-[96px] sm:text-[148px] lg:text-[168px] font-black text-white select-none"
            >
              $6
            </div>
            <span className="mt-2 sm:mt-3 text-[11px] sm:text-[13px] font-bold uppercase tracking-widest text-white/80">
              MXN / HORA OFICIAL
            </span>
          </div>

          {/* Pie minimalista dentro del panel frontal */}
          <div className="flex items-center justify-between text-[10px] sm:text-[12px] font-semibold text-white/75">
            <span>Parqu Pass</span>
            <span>{activePlates}</span>
          </div>
        </div>
      </div>

      {/* ── 5. TEXTURE PROP (BOTTOM-RIGHT CROPPED WARM METALLIC CARD) ── */}
      <div
        style={{
          backgroundColor: '#16120C',
          boxShadow: '-16px -16px 50px rgba(0, 0, 0, 0.75)',
        }}
        className="fixed -right-14 -bottom-14 sm:-right-16 sm:-bottom-16 lg:-right-12 lg:-bottom-12 z-30 w-[240px] h-[145px] sm:w-[370px] sm:h-[215px] lg:w-[450px] lg:h-[255px] rounded-[20px] sm:rounded-[22px] border border-[#E0A44E]/30 overflow-hidden pointer-events-none"
      >
        {/* Textura metálica cálida tejida (#C98A3B – #E0A44E) hecha a mano en SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-90"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="parqu-metallic-weave"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(28)"
            >
              <rect width="28" height="28" fill="#17120B" />
              <path
                d="M0 14 H28 M14 0 V28"
                stroke="#C98A3B"
                strokeWidth="1.2"
                strokeOpacity="0.28"
              />
              <circle cx="14" cy="14" r="3.5" fill="#E0A44E" fillOpacity="0.22" />
              <circle cx="0" cy="0" r="2" fill="#C98A3B" fillOpacity="0.3" />
              <circle cx="28" cy="28" r="2" fill="#C98A3B" fillOpacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#parqu-metallic-weave)" />
        </svg>

        {/* Wordmark de marca en la esquina superior derecha visible de la tarjeta */}
        <div className="relative z-10 p-4 sm:p-6 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between pr-10 sm:pr-14">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[12px] font-bold tracking-widest uppercase text-[#E0A44E]">
              <Wifi className="w-3.5 h-3.5 rotate-90 text-[#E0A44E]" />
              NFC PASS
            </span>
            <span
              style={{ letterSpacing: '-0.03em' }}
              className="text-[14px] sm:text-[18px] lg:text-[20px] font-black tracking-tight text-[#E0A44E]"
            >
              PARQU
            </span>
          </div>

          <div className="pb-10 sm:pb-12">
            <div className="text-[10px] sm:text-[12px] font-medium text-[#C98A3B]/85">
              Tarjeta Digital Metropolitana
            </div>
            <div className="text-[13px] sm:text-[17px] font-bold text-[#E0A44E] tracking-wider mt-0.5">
              {activePlates}
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

  // Modal de Login / Registro al presionar "Empecemos"
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
        backgroundColor: '#000000',
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.65s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.45s ease',
        willChange: 'transform, opacity',
      }}
      className="fixed inset-0 w-screen h-[100dvh] z-50 overflow-hidden select-none pointer-events-auto font-sans flex flex-col justify-between p-5 sm:p-10 lg:p-[55px]"
    >
      {/* ── COMPOSICIÓN PRINCIPAL (LEFT ~40% NEGATIVE SPACE + RIGHT ~60% UI STACK) ── */}
      <div className="relative z-10 w-full max-w-[1280px] h-full mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-4 lg:gap-6">
        
        {/* LEFT ~40% (5 COLS): NEGATIVE SPACE + BRAND ANCHOR BOTTOM-LEFT + BOTÓN "EMPECEMOS" */}
        <div className="lg:col-span-5 h-full flex flex-col justify-between items-start text-left py-1 sm:py-2">
          {/* Parte superior izquierda: espacio negativo limpio con el logo blanco transparente de Parqu */}
          <div className="space-y-3 sm:space-y-5">
            <img
              src="./parqu-logo-white.png"
              alt="Parqu"
              className="h-9 sm:h-14 lg:h-16 w-auto object-contain bg-transparent border-0 shadow-none"
            />
            <p className="text-xs sm:text-base text-[#8A8F98] font-medium max-w-[270px] sm:max-w-[330px] leading-relaxed">
              Parquímetro digital inteligente y autocobro por segundo a{' '}
              <span className="text-white font-bold">$6.00 MXN/hr</span>.
            </p>

            {/* Botón "Empecemos" estilo píldora de alto contraste integrado en el espacio negativo */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenAuthModal}
                className="group inline-flex items-center gap-3 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#0033FF] hover:bg-[#1a47ff] text-white text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 active:scale-95 cursor-pointer border-0"
              >
                <span>Empecemos</span>
                <ArrowRight className="w-4 h-4 text-white transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* 2. BRAND ANCHOR (BOTTOM-LEFT ROUNDED SQUARE ~110×110px, ~26px RADIUS, #0033FF) */}
          <div className="mt-2 sm:mt-0 flex items-center gap-4">
            <button
              type="button"
              onClick={handleOpenAuthModal}
              aria-label="Abrir acceso Parqu"
              style={{ backgroundColor: '#0033FF' }}
              className="w-[74px] h-[74px] sm:w-[96px] sm:h-[96px] lg:w-[110px] lg:h-[110px] rounded-[20px] sm:rounded-[26px] flex items-center justify-center cursor-pointer border-0 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <span
                style={{ letterSpacing: '-0.06em' }}
                className="text-[44px] sm:text-[58px] lg:text-[66px] font-black text-white leading-none select-none"
              >
                P
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT ~60% (7 COLS): UI STACK (2 OVERLAPPING PANELS + GIANT "$6" HERO FIGURE) */}
        <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
          <KageHeroComposition
            plates={vehicle?.plates}
            balance={card?.balance}
            ownerName={owner?.fullName}
          />
        </div>
      </div>

      {/* 
        ══════════════════════════════════════════════════════════════
        MODAL DE ACCESO (LOGIN / REGISTRO) AL PRESIONAR "EMPECEMOS"
        ══════════════════════════════════════════════════════════════
      */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="parqu-auth-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
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
