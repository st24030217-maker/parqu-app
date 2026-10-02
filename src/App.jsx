import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Header } from './components/Header';
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
      badgeClassName: 'bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold',
      iconBg: 'bg-slate-100 border border-slate-200 text-black',
      borderClassName: 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-sm',
      glowGradient: 'from-slate-100/50 via-transparent to-transparent',
      footerText: 'Monedero Parqu Activo',
      activeStatus: true,
      onClick: () => setShowRechargeQuickModal(true),
    },
    {
      id: 'qr-credential',
      icon: QrCode,
      title: 'Credencial QR',
      subtitle: 'Inspección de tránsito',
      badge: 'AES-256',
      badgeClassName: 'bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold',
      iconBg: 'bg-slate-100 border border-slate-200 text-black',
      borderClassName: 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-sm',
      glowGradient: 'from-slate-100/50 via-transparent to-transparent',
      footerText: 'Pase Contactless Oficial',
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
      iconBg: 'bg-slate-100 border border-slate-200 text-black',
      borderClassName: 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-sm',
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
      iconBg: 'bg-slate-100 border border-slate-200 text-black',
      borderClassName: 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-sm',
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
      badgeClassName: 'bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold',
      iconBg: 'bg-slate-100 border border-slate-200 text-black',
      borderClassName: 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-sm',
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
      badgeClassName: 'bg-slate-100 text-slate-800 border border-slate-200 font-mono font-bold',
      iconBg: 'bg-slate-100 border border-slate-200 text-black',
      borderClassName: 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 shadow-sm',
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
          <div className="anime-stagger-card p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
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
                  Ejecuta recargas, abre la credencial QR para tránsitos, fija tu ubicación en el mapa o administra el autocobro en 1 toque.
                </p>
              </div>

              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm font-sans w-fit">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono text-black font-black">6</span> Accesos Configurados
              </span>
            </div>

            <InterfaceCraftsCards items={quickActionsItems} />

            {/* Accesos de 1 clic a montos rápidos de recarga y acciones instantáneas */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
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
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-black font-sans flex items-center gap-1.5">
                    <CurrencyDollarIcon size={14} className="text-black" />
                    Recarga Inmediata
                  </span>
                  <span className="text-[10px] font-mono text-black font-bold px-2 py-0.5 rounded-full bg-slate-200/80 border border-slate-300">
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
                aria-label="Abrir credencial QR oficial para verificación vial"
                onClick={() => setShowQRQuickModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowQRQuickModal(true);
                  }
                }}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-black font-sans flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-black" />
                    Credencial QR Oficial
                  </span>
                  <span className="text-[10px] font-mono text-black font-bold px-2 py-0.5 rounded-full bg-slate-200/80 border border-slate-300">
                    AES-256
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans">
                  Muestra tu pase contactless al oficial vial para verificar estancia.
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
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-black font-sans flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-black" />
                    Mapa & Rutas 3D
                  </span>
                  <span className="text-[10px] font-mono text-black font-bold px-2 py-0.5 rounded-full bg-slate-200/80 border border-slate-300">
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
            <div className="anime-stagger-card lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-700 font-sans flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black" />
                  Tu Tarjeta Digital de Parquímetro
                </h3>
                <span className="text-[11px] text-slate-500 font-sans">
                  Actualización en tiempo real
                </span>
              </div>

              <DigitalCard />
            </div>

            {/* Panel de Ayuda y Estatus Rápido (Col 8 a 12) */}
            <div className="anime-stagger-card lg:col-span-5 h-full">
              <div className="w-full h-full p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-800">
                      GARANTÍA CERO MULTAS
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Activo
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight font-sans">
                    Protección & Monitoreo Satelital
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 font-sans leading-relaxed">
                    El sistema debita segundo a segundo exacto con tarifa regulada de <strong className="text-black font-mono">$0.25 MXN/min</strong> con encriptación oficial de <strong className="text-black">SSS.Solutions</strong>.
                  </p>

                  <div className="space-y-3 mt-4 text-xs font-sans">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-black block">Sin multas por expiración</span>
                        <span className="text-[11px] text-slate-500">Débito continuo sin necesidad de volver al coche.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <Smartphone className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-black block">Credencial Oficial de Tránsito</span>
                        <span className="text-[11px] text-slate-500">Escaneo QR oficial y contactless NFC para agentes viales.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <button
                    type="button"
                    aria-label="Configurar reglas del autocobro"
                    onClick={() => setActiveTab('autopay')}
                    className="w-full py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-sans font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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
          onNavigateToPanel={() => {
            const el = document.getElementById('panel-control-metropolitano');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          onNavigateToOrbital={() => {
            const el = document.getElementById('selector-orbital-metropolitano');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
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
            className="bg-black/95 border-b border-neutral-800 px-4 py-2.5 text-center text-xs font-sans font-semibold text-white flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-950 transition backdrop-blur-md sticky top-20 z-30 shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Vehículo <span className="font-mono">{vehicle.plates}</span> actualmente en parquímetro. Clic para ver contador o liberar estacionamiento.</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          </div>
        )}

        {/* 1. SECCIÓN DE BIENVENIDA & STAGGERED GRID SHOWCASE DE FUNCIONES (FONDO DE NUBES HERO INTACTO) */}
        <div className="w-full bg-[#01033E] relative overflow-hidden">
          <ErrorBoundary fallbackText="Bienvenido a Parqu - Cargando Funciones...">
            <StaggeredGrid 
              centerText="BIENVENIDOS A PARQU"
              onSelectFeature={handleSelectFeature}
            />
          </ErrorBoundary>

          {/* Gradiente de disolución y mezcla perfecta: El cielo de nubes se funde suavemente con el fondo blanco sin cortes ni separación */}
          <div 
            className="absolute inset-x-0 bottom-0 h-64 sm:h-96 pointer-events-none z-20"
            style={{
              background: 'linear-gradient(to bottom, rgba(1, 3, 62, 0) 0%, rgba(1, 3, 62, 0.05) 15%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.85) 70%, #ffffff 85%, #ffffff 100%)',
            }}
          />
        </div>

        {/* 2. SECCIÓN DEL SISTEMA INTERACTIVO CON FONDO BLANCO (Cero cortes, se fusiona directamente desde la zona blanca pura) */}
        <section className="w-full relative bg-white pb-10 sm:pb-16 -mt-px">
          <main 
            ref={systemRef} 
            id="interactive-system"
            className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-24"
          >
          
          {/* 1. PANEL DE CONTROL METROPOLITANO (ACCESO INMEDIATO Y CENTRAL) */}
          <AnimeMetricsHub 
            onNavigateTab={handleSelectFeature}
            onOpenRecharge={() => setShowRechargeQuickModal(true)}
            onOpenQR={() => setShowQRQuickModal(true)}
          />

          {/* 2. ENCABEZADO DEL CENTRO DE OPERACIONES */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tracking-widest uppercase font-bold text-slate-800">SISTEMA METROPOLITANO EN VIVO</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">0 Filas • 0 Monedas</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-3 font-sans">
                <span>Centro de Operaciones Parqu</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-sans">
                Control centralizado de tarjeta virtual, parquímetros municipales y sistema de autocobro.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-sans">
              <button
                type="button"
                aria-label="Ir al Selector Orbital 3D"
                onClick={() => {
                  const el = document.getElementById('selector-orbital-metropolitano');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 rounded-2xl bg-black hover:bg-slate-800 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                title="Ir al Selector Orbital 3D"
              >
                <Compass className="w-4 h-4 text-white" />
                <span>Selector Orbital 3D</span>
              </button>

              <button
                type="button"
                aria-label="Ejecutar diagnóstico de red metropolitana"
                onClick={() => {
                  sileo.success({
                    title: 'Diagnóstico Completado',
                    description: 'Enlace metropolitano y sensores de parquímetro activos al 100%.',
                  });
                }}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-black font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-slate-200 transition-all transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                title="Ejecutar diagnóstico de red"
              >
                <Sparkles className="w-4 h-4 fill-current text-amber-500" />
                <span>Diagnóstico de Red</span>
              </button>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 shrink-0">
                <PlugConnectedIcon size={18} className="text-emerald-500" />
                <div className="text-left font-sans">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Sistema Online</div>
                  <div className="text-xs font-bold text-black">Red Municipal Conectada</div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Rápido de Recarga de Saldo */}
          {showRechargeQuickModal && (
            <div 
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-recharge-dialog-title"
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center mx-auto mb-3 shadow-sm">
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
                          className={`py-2 rounded-xl text-xs font-sans font-bold border transition flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                            rechargeAmt === amt
                              ? 'bg-black text-white border-black shadow-sm'
                              : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
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
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-sans hover:bg-slate-50 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-sans font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      <CurrencyDollarIcon size={14} strokeWidth={2.2} />
                      <span>Recargar <span className="font-mono">${rechargeAmt}</span></span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Rápido de Código QR */}
          {showQRQuickModal && (
            <div 
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-qr-dialog-title"
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <h3 id="quick-qr-dialog-title" className="text-lg font-black text-black mb-1 font-sans">Credencial QR de Inspección</h3>
                <p className="text-xs text-slate-600 mb-6 font-sans">
                  Lectura directa para agentes de tránsito vial
                </p>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl inline-block shadow-inner mb-4">
                  <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100" role="img" aria-label={`Código QR para el vehículo con placas ${vehicle.plates}`}>
                    <rect width="100" height="100" fill="#F8FAFC" />
                    <rect x="5" y="5" width="26" height="26" fill="#000000" />
                    <rect x="9" y="9" width="18" height="18" fill="#F8FAFC" />
                    <rect x="13" y="13" width="10" height="10" fill="#000000" />
                    <rect x="69" y="5" width="26" height="26" fill="#000000" />
                    <rect x="73" y="9" width="18" height="18" fill="#F8FAFC" />
                    <rect x="77" y="13" width="10" height="10" fill="#000000" />
                    <rect x="5" y="69" width="26" height="26" fill="#000000" />
                    <rect x="9" y="73" width="18" height="18" fill="#F8FAFC" />
                    <rect x="13" y="77" width="10" height="10" fill="#000000" />
                    <rect x="36" y="10" width="8" height="8" fill="#000000" />
                    <rect x="48" y="10" width="6" height="6" fill="#000000" />
                    <rect x="36" y="24" width="6" height="6" fill="#000000" />
                    <rect x="46" y="20" width="10" height="10" fill="#000000" />
                    <rect x="10" y="38" width="6" height="6" fill="#000000" />
                    <rect x="20" y="44" width="8" height="8" fill="#000000" />
                    <rect x="35" y="40" width="30" height="20" fill="#000000" />
                    <rect x="40" y="45" width="20" height="10" fill="#F8FAFC" />
                    <rect x="70" y="40" width="8" height="8" fill="#000000" />
                    <rect x="82" y="48" width="6" height="6" fill="#000000" />
                    <rect x="38" y="70" width="8" height="8" fill="#000000" />
                    <rect x="50" y="76" width="12" height="12" fill="#000000" />
                    <rect x="68" y="70" width="6" height="6" fill="#000000" />
                    <rect x="78" y="80" width="10" height="10" fill="#000000" />
                  </svg>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-6 text-xs font-sans text-slate-800 flex items-center justify-between">
                  <span>Placas: <strong className="text-black font-mono">{vehicle.plates}</strong></span>
                  <span className="text-emerald-700 font-bold">● Validado</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQRQuickModal(false)}
                  className="w-full py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-sans font-bold transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Cerrar Credencial
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
          <Tabs 
            tabs={systemTabs} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

            </main>
        </section>

        {/* 3. SECCIÓN BANNER: La Nueva Era del Parquímetro Digital */}
        <section className="w-full border-t border-slate-200 overflow-hidden bg-white">
          <HeroParallax 
            headerTitle="La Nueva Era del Parquímetro Digital"
            headerSubtitle="SISTEMA METROPOLITANO PARQU"
            headerDescription="Descubre una plataforma diseñada para eliminar las filas, los parquímetros mecánicos y las multas. Autocobro continuo segundo a segundo con tecnología SSS.Solutions."
          />
        </section>

        {/* Footer con Logos 100% Transparentes y Powered by SSS.Solutions */}
        <footer className="border-t border-slate-200 bg-slate-50 py-10 text-center text-xs text-slate-600 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Identidad Parqu - Logo Negro para fondo blanco */}
            <div className="flex items-center gap-3">
              <img 
                src="./parqu-logo-black.png" 
                alt="Parqu" 
                style={{ maxHeight: '32px' }}
                className="h-8 w-auto object-contain"
              />
              <div className="text-left font-sans">
                <span className="font-bold text-slate-900 tracking-wide block">Parqu Digital</span>
                <span className="text-[11px] text-slate-500">Parquímetro inteligente con autocobro</span>
              </div>
            </div>

            {/* Powered by SSS.Solutions - Logo Oficial */}
            <div className="flex flex-col sm:flex-row items-center gap-3 py-2 px-5 rounded-full bg-white border border-slate-200 font-sans shadow-sm">
              <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-slate-500">
                Powered by
              </span>
              <div className="flex items-center gap-2">
                <img 
                  src="/sss-solutions-logo.png" 
                  alt="SSS Solutions" 
                  style={{ maxHeight: '28px' }}
                  className="h-7 w-auto object-contain hover:scale-105 transition-transform"
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
