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
  Menu,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { animate, stagger } from 'animejs';
import { AnimeCardSheen } from './ui/anime-card-sheen';
import { Button as StatefulButton } from './ui/stateful-button';
import { GtaViPoster } from './ui/gta-vi-poster';
import { useParking } from '../context/ParkingContext';
import { requestParkingNotificationPermission } from '../utils/parkingNotification';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * PHONE MOCKUP BELIEVABLE PRODUCT UI (PARQU DIGITAL)
 * Diseño fiel al lenguaje Cash App:
 * - Chasis de teléfono matte black con bocina / dynamic island
 * - Barra de estado real (9:41, Wi-Fi, 5G, Batería)
 * - Header oscuro con logo Parqu, placa del vehículo y avatar
 * - Tarjeta blanca redondeada con número enmascarado ●●●● y gran saldo numeral
 * - Dos botones en píldora (+ Recargar / Estacionar)
 * - Fila de actividad (Cajón #1042 / Autocobro Inteligente)
 * - Recorte intencional que desborda por el pliegue inferior del hero
 * ══════════════════════════════════════════════════════════════════════════
 */
const ParquPhoneMockup = memo(({ plates, balance, ownerName, onAction }) => {
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
    <div className="relative mx-auto w-[290px] sm:w-[330px] lg:w-[350px] select-none translate-y-12 sm:translate-y-16 lg:translate-y-24">
      {/* Sombra ambiental suave bajo el marco del teléfono (única elevación permitida) */}
      <div className="absolute -inset-4 bg-black/40 blur-3xl rounded-[60px] pointer-events-none" />

      {/* Chasis matte black del dispositivo */}
      <div className="relative rounded-[48px] border-[10px] border-black bg-black shadow-[0_50px_110px_rgba(0,0,0,0.65)] overflow-hidden">
        {/* Dynamic Island / Parlante superior */}
        <div className="pt-2 pb-1 bg-black flex justify-center items-center">
          <div className="w-24 h-4 bg-[#141414] rounded-full flex items-center justify-end px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Barra de estado del sistema (9:41, Wi-Fi, 5G, Batería) */}
        <div className="bg-[#01033E] text-white/90 px-5 pt-1 pb-2 flex items-center justify-between text-[11px] font-mono">
          <span className="font-bold tracking-tight">9:41</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 rotate-90 text-white/90" />
            <span className="text-[10px] font-bold">5G</span>
            <div className="w-5 h-2.5 rounded-[3px] border border-white/80 p-0.5 flex items-center">
              <div className="w-full h-full bg-white rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Cabecera oscura de la App (Parqu Digital + Placa + Avatar) */}
        <div className="bg-[#01033E] text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0033FF] ring-2 ring-blue-400" />
            <span className="font-black text-xs sm:text-sm tracking-tight font-sans">PARQU DIGITAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono font-bold text-sky-200">
              {activePlates}
            </span>
            <div className="w-7 h-7 rounded-full bg-[#0033FF] text-white text-[11px] font-black flex items-center justify-center border border-white/30">
              {initials}
            </div>
          </div>
        </div>

        {/* Cuerpo interno de la aplicación */}
        <div className="bg-[#F6F8FB] p-3.5 sm:p-4 space-y-3.5 text-slate-800">
          {/* Tarjeta blanca con esquinas redondeadas (~16-24px): número enmascarado + gran saldo */}
          <div className="bg-white rounded-[20px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <Wifi className="w-3 h-3 rotate-90 text-[#0033FF]" />
                ●●●● {activePlates.slice(-4)}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                NFC ACTIVO
              </span>
            </div>

            {/* Número de saldo muy grande */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Saldo Disponible
              </div>
              <div className="text-[38px] sm:text-[44px] font-black text-[#01033E] tracking-tight leading-none my-1 font-sans">
                ${formattedBalance}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                MXN • Tarifa $6.00/h ($0.10/min)
              </div>
            </div>

            {/* Dos botones de acción en píldora */}
            <div className="pt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={onAction}
                className="flex-1 py-2 px-3 rounded-full bg-black text-white text-xs font-bold font-sans transition-colors hover:bg-slate-800 text-center cursor-pointer border-0"
              >
                + Recargar
              </button>
              <button
                type="button"
                onClick={onAction}
                className="flex-1 py-2 px-3 rounded-full bg-[#0033FF] text-white text-xs font-bold font-sans transition-colors hover:bg-blue-700 text-center cursor-pointer border-0"
              >
                Estacionar
              </button>
            </div>
          </div>

          {/* Filas de actividad del producto */}
          <div className="space-y-2">
            <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0033FF] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#01033E]">Cajón #1042</div>
                  <div className="text-[10px] text-slate-400">Insurgentes Sur • CDMX</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#01033E]">
                -$6.00/h
              </span>
            </div>

            <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#01033E]">Autocobro Inteligente</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Garantía Cero Multas</div>
                </div>
              </div>
              <span className="text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                ACTIVO
              </span>
            </div>
          </div>
        </div>

        {/* Indicador inferior (Home bar) */}
        <div className="h-5 bg-[#F6F8FB] flex items-center justify-center">
          <div className="w-28 h-1 bg-slate-300 rounded-full" />
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

  // Fase 1: Pantalla de carga inicial sobre el logo oficial de Parqu
  const [isBootLoading, setIsBootLoading] = useState(true);

  // Menú hamburguesa slide-over drawer
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Modal Login / Registro
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

  // Transición limpia al terminar la animación inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBootLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Animaciones Anime.js en el Modal de Login
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
        delay: stagger(60, { start: 100 }),
        duration: 450,
        ease: 'outQuad',
      });
    }

    return () => {};
  }, [showAuthModal]);

  const handleOpenAuthModal = useCallback((mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMenuOpen(false);
  }, []);

  const handleTriggerExit = useCallback(() => {
    if (hasExitedRef.current) return;
    hasExitedRef.current = true;
    setIsExiting(true);

    setTimeout(() => {
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }, 650);
  }, [onComplete]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (authError) setAuthError('');
  };

  const handleAuthSubmit = async (e) => {
    if (e) e.preventDefault();

    requestParkingNotificationPermission().catch(() => {});
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
      if (e.key === 'Escape') {
        if (showAuthModal) setShowAuthModal(false);
        if (isMenuOpen) setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAuthModal, isMenuOpen]);

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
      className={`fixed inset-0 w-screen h-[100dvh] z-50 overflow-y-auto overflow-x-hidden select-none pointer-events-auto ${
        isBootLoading ? 'bg-white' : 'bg-[#0033FF]'
      } font-sans flex flex-col justify-between`}
    >
      {/* 
        ══════════════════════════════════════════════════════════════
        FASE 1: PANTALLA DE CARGA INICIAL SOBRE EL LOGO DE PARQU
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
          FASE 2: HERO CASH APP DESIGN LANGUAGE SOBRE CAMPO AZUL ELÉCTRICO
          - Top bar: Squircle logo a la izquierda, cluster de 3 controles a la derecha
          - Grid asimétrico 3 columnas: Titular 76px | Teléfono recortado | Copia + CTA
          ══════════════════════════════════════════════════════════════
        */
        <div className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-between">
          {/* 1. TOP BAR ON THE COLOUR FIELD */}
          <header className="relative z-20 w-full flex items-center justify-between px-6 sm:px-12 lg:px-16 pt-6 sm:pt-8 animate-in fade-in duration-500">
            {/* Logo mark alone inside black squircle container (~25-30% radius) */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] bg-black p-2 sm:p-2.5 flex items-center justify-center shadow-sm select-none">
              <img
                src="./parqu-logo-white.png"
                alt="Parqu"
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>

            {/* Tight cluster of three controls: White pill, Black pill, Circular hamburger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* White pill button with small arrow (primary signup) */}
              <button
                type="button"
                onClick={() => handleOpenAuthModal('register')}
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-black font-sans font-bold text-xs sm:text-sm transition-all duration-200 hover:bg-black hover:text-white cursor-pointer select-none border-0"
              >
                <span>Registrarse</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              {/* Black pill button (login) */}
              <button
                type="button"
                onClick={() => handleOpenAuthModal('login')}
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-black text-white font-sans font-bold text-xs sm:text-sm transition-all duration-200 hover:bg-white hover:text-black cursor-pointer select-none border-0"
              >
                <span>Iniciar Sesión</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              {/* Black circular hamburger button */}
              <button
                type="button"
                aria-label="Abrir Menú de Opciones"
                onClick={() => setIsMenuOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black text-white flex items-center justify-center transition-all duration-200 hover:bg-white hover:text-black cursor-pointer border-0"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 2. HERO VIEWPORT (~100vh): ASYMMETRIC THREE-COLUMN GRID */}
          <main className="relative z-10 w-full flex-1 max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center overflow-hidden animate-in fade-in duration-700">
            {/* Left third: Oversized two-line headline, left-aligned, optically centered */}
            <div className="lg:col-span-4 flex flex-col justify-center text-left pt-6 lg:pt-0">
              <h1 className="text-[44px] sm:text-[62px] lg:text-[76px] font-black text-white tracking-[-0.035em] leading-[1.03] font-sans">
                Parquímetro<br />
                sin monedas.
              </h1>
            </div>

            {/* Centre: Phone mockup showing believable product UI, cropped by hero's bottom edge */}
            <div className="lg:col-span-5 flex justify-center items-end self-end overflow-hidden pt-4 sm:pt-6">
              <ParquPhoneMockup
                plates={vehicle?.plates}
                balance={card?.balance}
                ownerName={owner?.fullName}
                onAction={() => handleOpenAuthModal('login')}
              />
            </div>

            {/* Right third: Narrow copy column (~30 chars per line) + White pill CTA with arrow */}
            <div className="lg:col-span-3 flex flex-col justify-center items-start space-y-6 text-left pb-8 lg:pb-0">
              <p className="text-white/95 text-sm sm:text-base font-medium leading-relaxed max-w-[280px] font-sans">
                Estaciona tu auto y olvídate de las monedas. Cobro por segundo, alertas en tiempo real y pase NFC sin contacto.
              </p>

              <button
                type="button"
                onClick={() => handleOpenAuthModal('register')}
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-black font-sans font-bold text-sm transition-all duration-200 hover:bg-black hover:text-white cursor-pointer select-none border-0"
              >
                <span>Empezar ahora</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </main>
        </div>
      )}

      {/* 
        ══════════════════════════════════════════════════════════════
        MENU DRAWER (AL PULSAR EL BOTÓN HAMBURGUESA CIRCULAR)
        ══════════════════════════════════════════════════════════════
      */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm h-full bg-[#01033E] text-white p-6 sm:p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black p-2 flex items-center justify-center">
                    <img
                      src="./parqu-logo-white.png"
                      alt="Parqu"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-black text-sm tracking-tight">PARQU</div>
                    <div className="text-[11px] text-slate-400 font-mono">Menú de Accesos</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Cerrar Menú"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleTriggerExit();
                  }}
                  className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-left transition-colors flex items-center justify-between group cursor-pointer border-0"
                >
                  <div>
                    <div className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                      Entrar al Sistema Directo
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Acceso express al panel de control
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAuthModal('login')}
                  className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-left transition-colors flex items-center justify-between group cursor-pointer border-0"
                >
                  <div>
                    <div className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                      Iniciar Sesión
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Restaura tus placas y saldo digital
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAuthModal('register')}
                  className="w-full p-4 rounded-2xl bg-[#0033FF] hover:bg-blue-600 text-left transition-colors flex items-center justify-between group cursor-pointer border-0"
                >
                  <div>
                    <div className="font-bold text-sm text-white">
                      Crear Cuenta Nueva
                    </div>
                    <div className="text-xs text-blue-100 mt-0.5">
                      Registro con placas y monedero
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <div className="mt-8 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Tarifa Metropolitana Oficial
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  $6.00 <span className="text-xs font-normal text-slate-300">MXN / hora</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Cobro exacto por segundo fraccionado ($0.10/min). Sin monedas ni multas.
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 text-center">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                PARQU • SISTEMA INTELIGENTE DE MOVILIDAD
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 
        ══════════════════════════════════════════════════════════════
        FASE 3: MODAL DE ACCESO (LOGIN / REGISTRO)
        ══════════════════════════════════════════════════════════════
      */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="parqu-auth-title"
          className="fixed inset-0 z-50 bg-[#01033E]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <AnimeCardSheen className="w-full max-w-[360px] sm:max-w-[380px] my-auto">
            <div
              ref={authCardRef}
              className="relative w-full max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-3xl bg-[#01033E]/95 border border-[#0033FF]/30 p-4 sm:p-6 text-white shadow-[0_28px_80px_rgba(1,3,62,0.85)] backdrop-blur-2xl"
            >
              {/* Botón cerrar */}
              <button
                type="button"
                aria-label="Cerrar ventana de acceso"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#D4D6E6] hover:text-white flex items-center justify-center transition-colors cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Logo Parqu Blanco en Cabecera del Login */}
              <div className="login-stagger-item flex flex-col items-center justify-center mb-3 text-center">
                <img
                  src="./parqu-logo-white.png"
                  alt="Parqu Logo"
                  className="h-9 sm:h-10 w-auto object-contain bg-transparent border-0 mb-1"
                />
                <h2
                  id="parqu-auth-title"
                  className="text-lg sm:text-xl font-black tracking-tight text-white font-sans"
                >
                  {authMode === 'login' ? 'Bienvenido a Parqu' : 'Registro de Conductor'}
                </h2>
                <p className="text-[11px] sm:text-xs text-[#D4D6E6]/80 font-normal">
                  {authMode === 'login'
                    ? 'Ingresa tus credenciales para sincronizar tu saldo'
                    : 'Vincula tus placas y activa tu monedero contactless'}
                </p>
              </div>

              {/* Selector Login / Registro */}
              <div className="login-stagger-item flex p-1 rounded-full bg-black/40 border border-white/10 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-[#0033FF] text-white shadow-sm'
                      : 'text-[#D4D6E6]/70 hover:text-white'
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
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                    authMode === 'register'
                      ? 'bg-[#0033FF] text-white shadow-sm'
                      : 'text-[#D4D6E6]/70 hover:text-white'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {authMode === 'register' && (
                  <div className="login-stagger-item space-y-1">
                    <label className="text-[11px] font-semibold text-[#D4D6E6] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0033FF]" />
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Sebastián Salinas"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#0033FF] focus:bg-white/10 focus:outline-none text-xs text-white placeholder:text-white/35 transition-all"
                    />
                  </div>
                )}

                <div className="login-stagger-item space-y-1">
                  <label className="text-[11px] font-semibold text-[#D4D6E6] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#0033FF]" />
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="conductor@parqu.mx"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#0033FF] focus:bg-white/10 focus:outline-none text-xs text-white placeholder:text-white/35 transition-all"
                  />
                </div>

                {authMode === 'register' && (
                  <div className="login-stagger-item space-y-1">
                    <label className="text-[11px] font-semibold text-[#D4D6E6] flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-[#0033FF]" />
                      Placas de tu Vehículo
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="Ej. XYZ-7842"
                      value={formData.plates}
                      onChange={(e) => handleInputChange('plates', e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#0033FF] focus:bg-white/10 focus:outline-none text-xs font-mono font-bold text-white placeholder:text-white/35 transition-all tracking-wider uppercase"
                    />
                  </div>
                )}

                <div className="login-stagger-item space-y-1">
                  <label className="text-[11px] font-semibold text-[#D4D6E6] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#0033FF]" />
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#0033FF] focus:bg-white/10 focus:outline-none text-xs text-white placeholder:text-white/35 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
