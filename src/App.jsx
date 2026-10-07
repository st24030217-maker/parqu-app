import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Header } from './components/Header';
import { ExitNotificationManager } from './components/ExitNotificationManager';
import { DigitalCard } from './components/DigitalCard';
import { VehicleOwnerForm } from './components/VehicleOwnerForm';
import { AutoPaymentConfig } from './components/AutoPaymentConfig';
import { ParkingMeter } from './components/ParkingMeter';
import { TransactionHistory } from './components/TransactionHistory';
import { StaggeredGrid } from './components/ui/staggered-grid';
import { HeroParallax } from './components/ui/hero-parallax';
import { WobbleCard } from './components/ui/wobble-card';
import { InterfaceCraftsCards } from './components/ui/interface-crafts-cards';
import { Tabs } from './components/ui/tabs';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CurrencyDollarIcon, PlugConnectedIcon } from './components/icons';
import { AnimeMetricsHub } from './components/ui/anime-metrics-hub';
import { AnimeStaggerGroup } from './components/ui/anime-stagger-group';
import { OrbitalWheelMenu } from './components/ui/orbital-wheel-menu';
import { 
  CreditCard, 
  Car, 
  Zap, 
  Clock, 
  History, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  ChevronRight,
  Sliders,
  QrCode,
  Wifi,
  Activity,
  MapPin,
  Compass
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { triggerHaptic } from './utils/haptics';

const MainContent = () => {
  const { 
    activeSession, 
    vehicle = {}, 
    owner = {},
    card = {}, 
    autoPay = {}, 
    addBalance, 
    startParking, 
    stopParkingAndAutoCharge 
  } = useParking();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'autopay', 'vehicle', 'history'
  const [showQRQuickModal, setShowQRQuickModal] = useState(false);
  const [showRechargeQuickModal, setShowRechargeQuickModal] = useState(false);
  const [rechargeAmt, setRechargeAmt] = useState(150);
  const systemRef = useRef(null);

  // Accesibilidad WCAG 2.1: Cerrar modales superpuestos con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowRechargeQuickModal(false);
        setShowQRQuickModal(false);
      }
    };
    if (showRechargeQuickModal || showQRQuickModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRechargeQuickModal, showQRQuickModal]);

  // Configuración de ciclo de vida nativo para Capacitor (iOS & Android)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        SplashScreen.hide().catch(() => {});
      } catch (err) {
        // Safe fallback
      }
    }
  }, []);

  const handleSelectFeature = (tabId) => {
    triggerHaptic();
    setActiveTab(tabId);
    if (systemRef.current) {
      systemRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickRechargeSubmit = (e) => {
    e.preventDefault();
    if (rechargeAmt > 0) {
      triggerHaptic();
      addBalance(Number(rechargeAmt));
      sileo.success({
        title: '¡Recarga Exitosa!',
        description: `Se han añadido $${rechargeAmt}.00 MXN a tu tarjeta Parqu.`,
      });
      setShowRechargeQuickModal(false);
    }
  };

  // Configuración de accesos directos para el Apartado de Funciones Rápidas (@aceternity/interface-crafts-cards)
  const quickActionsItems = [
    {
      id: 'recharge',
      icon: CurrencyDollarIcon,
      title: 'Recargar Saldo',
      subtitle: 'Añadir saldo express',
      badge: `$${Number(card?.balance ?? 0).toFixed(2)}`,
      badgeClassName: 'bg-white/50 text-slate-800 border border-slate-200/50 font-mono font-bold',
      iconBg: 'bg-white/50 border border-slate-200/50 text-black',
      borderClassName: 'border-slate-200/50 hover:border-slate-300/80 bg-white/40 hover:bg-white/60 backdrop-blur-xl shadow-none',
      glowGradient: 'from-slate-100/50 via-transparent to-transparent',
      footerText: 'Monedero Parqu Activo',
      activeStatus: true,
      onClick: () => setShowRechargeQuickModal(true),
    },
    {
      id: 'qr-credential',
      icon: Wifi,
      title: 'Credencial NFC',
      subtitle: 'Inspección sin contacto',
      badge: 'NFC AES-256',
      badgeClassName: 'bg-white/50 text-slate-800 border border-slate-200/50 font-mono font-bold',
      iconBg: 'bg-white/50 border border-slate-200/50 text-black',
      borderClassName: 'border-slate-200/50 hover:border-slate-300/80 bg-white/40 hover:bg-white/60 backdrop-blur-xl shadow-none',
      glowGradient: 'from-slate-100/50 via-transparent to-transparent',
      footerText: 'Pase NFC Contactless Oficial',
      activeStatus: true,
      onClick: () => setShowQRQuickModal(true),
    },
    {
      id: 'parking-map',
      icon: MapPin,
      title: activeSession ? 'Estacionamiento Activo' : 'Mapa & Ubicación',
      subtitle: activeSession ? activeSession.zoneName : 'Fijar Ubicación & Registro',
      badge: activeSession ? 'EN VIVO' : 'GPS & BITÁCORA',
      badgeClassName: activeSession ? 'bg-amber-100 text-amber-800 border-amber-300 font-mono font-bold' : 'bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold',
      iconBg: 'bg-white/50 border border-slate-200/50 text-black',
      borderClassName: 'border-slate-200/50 hover:border-slate-300/80 bg-white/40 hover:bg-white/60 backdrop-blur-xl shadow-none',
      glowGradient: 'from-slate-100/50 via-transparent to-transparent',
      footerText: activeSession ? 'Debitando segundo a segundo' : 'Mapa Satelital + Rutas 3D',
      activeStatus: activeSession !== null,
      onClick: () => {
        setActiveTab('dashboard');
        sileo.info({
          title: 'Mapa & Rutas 3D',
          description: 'Fija tu ubicación en el mapa, asigna el número de espacio y activa el autocobro.',
        });
      },
    },
    {
      id: 'autopay',
      icon: PlugConnectedIcon,
      title: 'Modo Autocobro',
      subtitle: 'Débito continuo sin filas',
      badge: autoPay?.enabled ? 'ACTIVO' : 'PAUSADO',
      badgeClassName: autoPay?.enabled ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-mono font-bold' : 'bg-rose-100 text-rose-800 border-rose-200 font-mono font-bold',
      iconBg: 'bg-white/50 border border-slate-200/50 text-black',
      borderClassName: 'border-slate-200/50 hover:border-slate-300/80 bg-white/40 hover:bg-white/60 backdrop-blur-xl shadow-none',
      glowGradient: 'from-slate-100/50 via-transparent to-transparent',
      footerText: autoPay?.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Virtual',
      activeStatus: Boolean(autoPay?.enabled),
      onClick: () => {
        setActiveTab('autopay');
        sileo.info({
          title: 'Configuración de Autocobro',
          description: 'Ajusta límites, cuenta bancaria y reglas de débito.',
        });
      },
    },
    {
      id: 'vehicle',
      icon: Car,
      title: vehicle?.plates || 'XYZ-7842',
      subtitle: `${vehicle?.brand || 'Volkswagen'} ${vehicle?.model || 'Jetta'}`,
      badge: 'PADRÓN',
      badgeClassName: 'bg-white/50 text-slate-800 border border-slate-200/50 font-mono font-bold',
      iconBg: 'bg-white/50 border border-slate-200/50 text-black',
      borderClassName: 'border-slate-200/50 hover:border-slate-300/80 bg-white/40 hover:bg-white/60 backdrop-blur-xl shadow-none',
      glowGradient: 'from-slate-100/50 via-transparent to-transparent',
      footerText: owner?.fullName || 'Sebastián Salinas',
      activeStatus: true,
      onClick: () => {
        setActiveTab('vehicle');
        sileo.info({
          title: 'Padrón Vehicular',
          description: `Vehículo actual: ${vehicle.plates} • ${vehicle.brand} ${vehicle.model}`,
        });
      },
    },
    {
      id: 'multi-step-loader',
      icon: Activity,
      title: 'Diagnóstico en Vivo',
      subtitle: 'Multi-Step Loader',
      badge: 'ANIMACIÓN',
      badgeClassName: 'bg-white/50 text-slate-800 border border-slate-200/50 font-mono font-bold',
      iconBg: 'bg-white/50 border border-slate-200/50 text-black',
      borderClassName: 'border-slate-200/50 hover:border-slate-300/80 bg-white/40 hover:bg-white/60 backdrop-blur-xl shadow-none',
      glowGradient: 'from-slate-100/50 via-transparent to-transparent',
      activeStatus: true,
      onClick: () => {
        sileo.success({
          title: 'Diagnóstico de Red Activo',
          description: 'Sensores de enlace y protocolo de parquímetros sincronizados al 100%.',
        });
      },
    },
  ];

  // Definición oficial de pestañas con Aceternity UI Tabs
  const systemTabs = [
    {
      title: 'Funciones Rápidas',
      value: 'quick-actions',
      icon: Zap,
      badge: 'CRAFTS',
      content: (
        <AnimeStaggerGroup triggerKey={activeTab} className="space-y-6">
          <div className="anime-stagger-card p-6 sm:p-8 rounded-3xl bg-white/40 backdrop-blur-2xl border border-slate-200/60 shadow-none space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/60 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1 text-xs font-mono text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="tracking-widest uppercase font-bold text-slate-700 text-[11px]">
                    ACETERNITY INTERFACE CRAFTS
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 text-[11px]">PANEL DE ACCESO INMEDIATO</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight flex items-center gap-2.5 font-sans">
                  <Zap className="w-5 h-5 text-black" />
                  Apartado de Funciones Rápidas
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-sans">
                  Ejecuta recargas, abre la credencial NFC para tránsitos, fija tu ubicación en el mapa o administra el autocobro en 1 toque.
                </p>
              </div>

              <span className="text-[11px] font-bold text-slate-700 bg-white/40 border border-slate-200/50 backdrop-blur-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-none font-sans w-fit">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono text-black font-black">6</span> Accesos Configurados
              </span>
            </div>

            <InterfaceCraftsCards items={quickActionsItems} />

            {/* Accesos de 1 clic a montos rápidos de recarga y acciones instantáneas */}
            <div className="pt-4 border-t border-slate-100/60 grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
              <div 
                role="button"
                tabIndex={0}
                aria-label="Abrir recarga express de saldo: 100, 200 o 500 pesos"
                onClick={() => setShowRechargeQuickModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowRechargeQuickModal(true);
                  }
                }}
                className="p-4 rounded-2xl bg-white/30 hover:bg-white/50 border border-slate-200/40 backdrop-blur-md cursor-pointer transition group shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-black font-sans flex items-center gap-1.5">
                    <CurrencyDollarIcon size={14} className="text-black" />
                    Recarga Inmediata
                  </span>
                  <span className="text-[10px] font-mono text-black font-bold px-2 py-0.5 rounded-full bg-white/50 border border-slate-200/50">
                    EXPRESS
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  Añade <span className="font-mono font-bold text-black">$100</span>, <span className="font-mono font-bold text-black">$200</span> o <span className="font-mono font-bold text-black">$500</span> a tu tarjeta Parqu sin comisiones.
                </p>
              </div>

              <div 
                role="button"
                tabIndex={0}
                aria-label="Abrir credencial NFC oficial para verificación vial"
                onClick={() => setShowQRQuickModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowQRQuickModal(true);
                  }
                }}
                className="p-4 rounded-2xl bg-white/30 hover:bg-white/50 border border-slate-200/40 backdrop-blur-md cursor-pointer transition group shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-black font-sans flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 rotate-90 text-black" />
                    Credencial NFC Oficial
                  </span>
                  <span className="text-[10px] font-mono text-black font-bold px-2 py-0.5 rounded-full bg-white/50 border border-slate-200/50">
                    NFC AES-256
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  Acerca tu pase NFC contactless al lector del oficial vial para verificar tu estancia.
                </p>
              </div>

              <div 
                role="button"
                tabIndex={0}
                aria-label="Navegar al apartado de Mapa y Rutas 3D"
                onClick={() => handleSelectFeature('dashboard')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectFeature('dashboard');
                  }
                }}
                className="p-4 rounded-2xl bg-white/30 hover:bg-white/50 border border-slate-200/40 backdrop-blur-md cursor-pointer transition group shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-black font-sans flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-black" />
                    Mapa & Rutas 3D
                  </span>
                  <span className="text-[10px] font-mono text-black font-bold px-2 py-0.5 rounded-full bg-white/50 border border-slate-200/50">
                    EN VIVO
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  Fija tu ubicación en el mapa, asigna tu número de espacio o simula tu recorrido animado en 3D.
                </p>
              </div>
            </div>
          </div>
        </AnimeStaggerGroup>
      ),
    },
    {
      title: 'Tarjeta & Parquímetro',
      value: 'dashboard',
      icon: CreditCard,
      badge: activeSession ? 'EN VIVO' : null,
      content: (
        <AnimeStaggerGroup triggerKey={activeTab} className="space-y-8">
          {/* Grid Superior: Tarjeta Digital & Resumen Rápido */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Tarjeta Digital (Col 1 a 7) */}
            <div className="anime-stagger-card lg:col-span-7">
              <DigitalCard />
            </div>

            {/* Panel de Ayuda y Estatus Rápido (Col 8 a 12) */}
            <div className="anime-stagger-card lg:col-span-5 h-full">
              <div className="w-full h-full p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-white/40 backdrop-blur-2xl border border-slate-200/60 shadow-none flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-white/40 border border-slate-200/50 backdrop-blur-sm text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-slate-800">
                      TARIFA OFICIAL $6.00 / HR
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-2xl font-black text-black tracking-tight leading-tight font-sans">
                    Verificación NFC & Monitoreo Satelital
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 font-sans leading-relaxed">
                    El sistema debita en tiempo real con tarifa oficial de <strong className="text-black font-mono">$6.00 MXN/hr</strong> con encriptación de <strong className="text-black">SSS.Solutions</strong>.
                  </p>

                  <div className="space-y-2.5 sm:space-y-3 mt-4 text-xs font-sans">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/30 border border-slate-200/40 backdrop-blur-sm">
                      <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-black block">Autocobro continuo a $6.00/hr</span>
                        <span className="text-[11px] text-slate-500">Débito directo sin monedas ni necesidad de volver al coche.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/30 border border-slate-200/40 backdrop-blur-sm">
                      <Wifi className="w-4 h-4 rotate-90 text-black flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-black block">Credencial NFC de Tránsito</span>
                        <span className="text-[11px] text-slate-500">Verificación NFC contactless oficial para agentes viales.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100/60">
                  <button
                    type="button"
                    aria-label="Configurar reglas del autocobro"
                    onClick={() => setActiveTab('autopay')}
                    className="w-full py-2.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md text-white font-sans font-bold text-xs transition flex items-center justify-center gap-2 border border-black/10 shadow-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <Zap className="w-4 h-4 text-white" />
                    Configurar Reglas del Autocobro
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Parquímetro Metropolitano */}
          <div className="anime-stagger-card">
            <ParkingMeter />
          </div>

          {/* Historial Reciente */}
          <div className="anime-stagger-card">
            <TransactionHistory />
          </div>
        </AnimeStaggerGroup>
      ),
    },
    {
      title: 'Formato de Autocobro',
      value: 'autopay',
      icon: Zap,
      badge: 'CONFIG',
      content: (
        <AnimeStaggerGroup triggerKey={activeTab} className="max-w-4xl mx-auto space-y-6">
          <div className="anime-stagger-card">
            <AutoPaymentConfig />
          </div>
        </AnimeStaggerGroup>
      ),
    },
    {
      title: 'Vehículo & Titular',
      value: 'vehicle',
      icon: Car,
      content: (
        <AnimeStaggerGroup triggerKey={activeTab} className="max-w-4xl mx-auto space-y-6">
          <div className="anime-stagger-card">
            <VehicleOwnerForm />
          </div>
        </AnimeStaggerGroup>
      ),
    },
    {
      title: 'Historial de Cobros',
      value: 'history',
      icon: History,
      content: (
        <AnimeStaggerGroup triggerKey={activeTab} className="space-y-6">
          <div className="anime-stagger-card">
            <TransactionHistory />
          </div>
        </AnimeStaggerGroup>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-[#0033FF] selection:text-white">
      {/* Título semántico principal accesible H1 para lectores de pantalla */}
      <h1 className="sr-only">Parqu - Sistema Metropolitano de Parquímetro Digital y Autocobro Inteligente</h1>
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          activeTab={activeTab}
          onSelectTab={handleSelectFeature}
        />

        <ExitNotificationManager
          onOpenNFC={() => setShowQRQuickModal(true)}
        />

        {/* Banner de Sesión Activa si está en otra pestaña con soporte completo de teclado */}
        {activeSession && activeTab !== 'dashboard' && (
          <div 
            role="button"
            tabIndex={0}
            aria-label={`Vehículo ${vehicle.plates} actualmente en parquímetro. Clic para ver contador o liberar estancia`}
            onClick={() => handleSelectFeature('dashboard')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectFeature('dashboard');
              }
            }}
            className="bg-black/60 border-b border-white/10 px-4 py-2.5 text-center text-xs font-sans font-semibold text-white flex items-center justify-center gap-2 cursor-pointer hover:bg-black/80 transition backdrop-blur-xl sticky top-20 z-30 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Vehículo <span className="font-mono">{vehicle.plates}</span> actualmente en parquímetro. Clic para ver contador o liberar estacionamiento.</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          </div>
        )}

        {/* 1. SECCIÓN DE BIENVENIDA & HERO CON FONDO DE NUBES OFICIAL */}
        <div className="w-full bg-[#01033E] relative overflow-hidden">
          <ErrorBoundary fallbackText="Bienvenido a Parqu - Cargando Funciones...">
            <StaggeredGrid 
              centerText="BIENVENIDOS A PARQU"
              onSelectFeature={handleSelectFeature}
            />
          </ErrorBoundary>

          {/* Gradiente de disolución y mezcla perfecta: Se funde suavemente hacia el fondo blanco sin cortes ni separación */}
          <div 
            className="absolute inset-x-0 bottom-0 h-40 sm:h-56 pointer-events-none z-20"
            style={{
              background: 'linear-gradient(to bottom, rgba(1, 3, 62, 0) 0%, rgba(1, 3, 62, 0.25) 20%, rgba(255, 255, 255, 0.4) 60%, rgba(255, 255, 255, 0.85) 85%, #ffffff 100%)',
            }}
          />
        </div>

        {/* 2. SECCIÓN DEL SISTEMA INTERACTIVO CON FONDO TRANSPARENTE Y LUMINOSO */}
        <section className="w-full relative bg-slate-50/30 pb-10 sm:pb-16 -mt-px overflow-hidden">
          {/* Resplandor ambiental para resaltar las tarjetas translúcidas */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-tr from-blue-100/30 via-indigo-50/20 to-purple-100/20 rounded-full blur-3xl pointer-events-none -z-0" />

          <main 
            ref={systemRef} 
            id="interactive-system"
            className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10 scroll-mt-20"
          >
          
          {/* 1. PANEL DE CONTROL METROPOLITANO (ACCESO INMEDIATO Y CENTRAL) */}
          <AnimeMetricsHub 
            onNavigateTab={handleSelectFeature}
            onOpenRecharge={() => setShowRechargeQuickModal(true)}
            onOpenQR={() => setShowQRQuickModal(true)}
          />

          {/* Modal Rápido de Recarga de Saldo */}
          {showRechargeQuickModal && (
            <div 
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-recharge-dialog-title"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative border-0 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-black flex items-center justify-center mx-auto mb-3 shadow-sm border-0">
                  <CurrencyDollarIcon size={24} strokeWidth={2} className="text-black" />
                </div>
                <h3 id="quick-recharge-dialog-title" className="text-lg font-black text-black mb-1 font-sans">Recarga Rápida de Saldo</h3>
                <p className="text-xs text-slate-600 mb-6 font-sans">
                  Saldo disponible: <span className="text-emerald-600 font-bold font-mono">${Number(card?.balance ?? 0).toFixed(2)} MXN</span>
                </p>

                <form onSubmit={handleQuickRechargeSubmit} className="space-y-4 text-left font-sans">
                  <div>
                    <label className="text-xs text-slate-700 font-sans block mb-2 font-bold">Selecciona un monto:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 200, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          aria-label={`Seleccionar recarga de ${amt} pesos`}
                          onClick={() => setRechargeAmt(amt)}
                          className={`py-2 rounded-xl text-xs font-sans font-bold transition flex items-center justify-center gap-1 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                            rechargeAmt === amt
                              ? 'bg-black text-white shadow-md'
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          <CurrencyDollarIcon size={12} strokeWidth={2.2} />
                          <span className="font-mono">{amt}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 font-sans">
                    <button
                      type="button"
                      onClick={() => setShowRechargeQuickModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-sans hover:bg-slate-200 transition cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-sans font-bold transition shadow-md border-0 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      <CurrencyDollarIcon size={14} strokeWidth={2.2} />
                      <span>Recargar <span className="font-mono">${rechargeAmt}</span></span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Rápido de Credencial NFC Contactless */}
          {showQRQuickModal && (
            <div 
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-qr-dialog-title"
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative border-0 animate-in fade-in zoom-in-95 duration-200">
                <h3 id="quick-qr-dialog-title" className="text-lg font-black text-black mb-1 font-sans">Credencial NFC de Inspección</h3>
                <p className="text-xs text-slate-600 mb-6 font-sans">
                  Lectura NFC sin contacto para agentes de tránsito vial
                </p>

                <div className="py-6 flex flex-col items-center justify-center mb-4">
                  <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-[#01033E] to-[#0033FF] flex items-center justify-center shadow-xl">
                    <span className="absolute inset-0 rounded-full bg-[#0033FF]/30 animate-ping" />
                    <span className="absolute -inset-3 rounded-full border-2 border-[#0033FF]/25" />
                    <div className="relative z-10 flex flex-col items-center justify-center text-white">
                      <Wifi className="w-14 h-14 rotate-90 text-white" />
                      <span className="text-xs font-mono font-black tracking-widest mt-1">
                        NFC ACTIVO
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-xl p-2.5 mb-6 text-xs font-sans text-slate-800 flex items-center justify-between border-0 shadow-sm">
                  <span>Placas: <strong className="text-black font-mono">{vehicle.plates}</strong></span>
                  <span className="text-emerald-700 font-bold">● NFC Validado</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQRQuickModal(false)}
                  className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-sans font-bold transition shadow-md border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Cerrar Credencial NFC
                </button>
              </div>
            </div>
          )}



          {/* 4. SELECTOR ORBITAL METROPOLITANO */}
          <div id="selector-orbital-metropolitano" className="scroll-mt-28">

            <OrbitalWheelMenu
              activeTab={activeTab}
              onSelectTab={handleSelectFeature}
              onOpenRecharge={() => setShowRechargeQuickModal(true)}
              onOpenQR={() => setShowQRQuickModal(true)}
            />
          </div>

          {/* COMPONENTE ACETERNITY UI TABS (Control centralizado de funciones con animación spring) */}
          <div id="system-tabs-container" className="scroll-mt-24">
            <Tabs 
              tabs={systemTabs} 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
          </div>

            </main>
        </section>

        {/* 3. SECCIÓN BANNER: La Nueva Era del Parquímetro Digital */}
        <section className="w-full border-t border-slate-200 overflow-hidden bg-white">
          <HeroParallax 
            headerTitle="La Nueva Era del Parquímetro Digital"
            headerSubtitle="SISTEMA METROPOLITANO PARQU"
            headerDescription="Descubre una plataforma diseñada para eliminar las filas y los parquímetros mecánicos. Autocobro continuo a $6.00/hr con tecnología NFC de SSS.Solutions."
          />
        </section>

        {/* Footer con Logos 100% Transparentes y Powered by SSS.Solutions */}
        <footer className="border-t border-slate-200/50 bg-transparent py-10 text-center text-xs text-slate-600 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Identidad Parqu - Logo Negro 100% transparente */}
            <div className="flex items-center gap-3 bg-transparent">
              <img 
                src="./parqu-logo-black.png" 
                alt="Parqu" 
                style={{ maxHeight: '32px' }}
                className="h-8 w-auto object-contain bg-transparent"
              />
              <div className="text-left font-sans">
                <span className="font-bold text-slate-900 tracking-wide block">Parqu Digital</span>
                <span className="text-[11px] text-slate-500">Parquímetro inteligente con autocobro</span>
              </div>
            </div>

            {/* Powered by SSS.Solutions - Logo Oficial 100% Transparente */}
            <div className="flex flex-col sm:flex-row items-center gap-3 py-2 px-4 bg-transparent border-0 font-sans shadow-none">
              <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-slate-500">
                Powered by
              </span>
              <div className="flex items-center gap-2 bg-transparent">
                <img 
                  src="/sss-solutions-logo.png" 
                  alt="SSS Solutions" 
                  style={{ maxHeight: '28px' }}
                  className="h-7 w-auto object-contain bg-transparent hover:scale-105 transition-transform"
                />
              </div>
            </div>

            {/* Seguridad y Derechos */}
            <div className="text-center md:text-right font-sans text-[11px] text-slate-500">
              <span>© {new Date().getFullYear()} Todos los derechos reservados.</span>
              <span className="block text-slate-400">Tecnología SSS.Solutions • Encriptación 256-bit</span>
            </div>

          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleStart = () => {
    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      sileo.success({
        title: '¡Bienvenido a Parqu!',
        description: 'Pase digital y red inteligente de parquímetros sincronizados.',
      });
    }, 250);
  };

  return (
    <ParkingProvider>
      <Toaster position="top-right" theme="light" options={{ fill: '#000000' }} />
      <ErrorBoundary fallbackText="Centro de Operaciones Parqu">
        <MainContent />
      </ErrorBoundary>
      <AnimatePresence>
        {isLoading && (
          <ErrorBoundary key="loading-screen" fallbackText="Iniciando Parqu...">
            <LoadingScreen onComplete={handleStart} />
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </ParkingProvider>
  );
}
