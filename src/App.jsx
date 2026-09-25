import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster, sileo } from 'sileo';
import 'sileo/styles.css';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { DigitalCard } from './components/DigitalCard';
import { VehicleOwnerForm } from './components/VehicleOwnerForm';
import { AutoPaymentConfig } from './components/AutoPaymentConfig';
import { ParkingSimulator } from './components/ParkingSimulator';
import { TransactionHistory } from './components/TransactionHistory';
import { StaggeredGrid } from './components/ui/staggered-grid';
import { BackgroundGradientAnimation } from './components/ui/background-gradient-animation';
import { HeroParallax } from './components/ui/hero-parallax';
import { WobbleCard } from './components/ui/wobble-card';
import { InterfaceCraftsCards } from './components/ui/interface-crafts-cards';
import { ErrorBoundary } from './components/ErrorBoundary';
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
  QrCode
} from 'lucide-react';

const MainContent = ({ onReplayLoading }) => {
  const { 
    activeSession, 
    vehicle, 
    card, 
    autoPay, 
    addBalance, 
    startSession, 
    endSession 
  } = useParking();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'autopay', 'vehicle', 'history'
  const [showQRQuickModal, setShowQRQuickModal] = useState(false);
  const [showRechargeQuickModal, setShowRechargeQuickModal] = useState(false);
  const [rechargeAmt, setRechargeAmt] = useState(150);
  const systemRef = useRef(null);

  const tabs = [
    { id: 'dashboard', label: 'Tarjeta & Parquímetro', icon: CreditCard, badge: activeSession ? 'EN VIVO' : null },
    { id: 'autopay', label: 'Formato de Autocobro', icon: Zap, badge: 'CONFIG' },
    { id: 'vehicle', label: 'Vehículo & Titular', icon: Car },
    { id: 'history', label: 'Historial de Cobros', icon: History },
  ];

  const handleSelectFeature = (tabId) => {
    setActiveTab(tabId);
    if (systemRef.current) {
      systemRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickRechargeSubmit = (e) => {
    e.preventDefault();
    if (rechargeAmt > 0) {
      addBalance(Number(rechargeAmt));
      sileo.success({
        title: '¡Recarga Exitosa!',
        description: `Se han añadido $${rechargeAmt}.00 MXN a tu tarjeta Parqu.`,
      });
      setShowRechargeQuickModal(false);
    }
  };

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(5, 5, 10)"
      gradientBackgroundEnd="rgb(0, 0, 0)"
      firstColor="35, 75, 230"
      secondColor="130, 45, 215"
      thirdColor="6, 175, 205"
      fourthColor="75, 85, 215"
      fifthColor="145, 65, 235"
      pointerColor="90, 130, 255"
      size="75%"
      className="min-h-screen flex flex-col text-white selection:bg-white selection:text-black"
    >
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onReplayLoading={onReplayLoading} />

        {/* Banner de Sesión Activa si está en otra pestaña */}
        {activeSession && activeTab !== 'dashboard' && (
          <div 
            onClick={() => handleSelectFeature('dashboard')}
            className="bg-neutral-900/90 border-b border-amber-500/40 px-4 py-2.5 text-center text-xs font-mono font-semibold text-amber-300 flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-900 transition backdrop-blur-md sticky top-20 z-30"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Vehículo {vehicle.plates} actualmente en parquímetro. Clic para ver contador o liberar cajón.</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}

        {/* 1. SECCIÓN DE BIENVENIDA & STAGGERED GRID SHOWCASE DE FUNCIONES */}
        <div className="w-full border-b border-neutral-900">
          <ErrorBoundary fallbackText="Bienvenido a Parqu - Cargando Funciones...">
            <StaggeredGrid 
              centerText="BIENVENIDOS A PARQU"
              onSelectFeature={handleSelectFeature}
            />
          </ErrorBoundary>
        </div>

        {/* 2. SECCIÓN DEL SISTEMA INTERACTIVO (TARJETA, SIMULADOR, CONFIGURACIÓN, HISTORIAL) */}
        <main 
          ref={systemRef} 
          id="interactive-system"
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 scroll-mt-24"
        >
          
          {/* ENCABEZADO PRINCIPAL DEL CENTRO DE OPERACIONES & SELECTOR DE PESTAÑAS */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-950/90 border border-neutral-800/90 backdrop-blur-xl shadow-2xl space-y-6">
            
            {/* Fila Superior: Título, Estatus en Vivo y Pestañas */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-neutral-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="tracking-widest uppercase font-bold text-emerald-300">SISTEMA METROPOLITANO EN VIVO</span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-neutral-400">0 Filas • 0 Monedas</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <span>Centro de Operaciones Parqu</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-mono">
                  Control centralizado de tarjeta virtual, parquímetros municipales y telemetría de autocobro.
                </p>
              </div>

              {/* Selector de Pestañas Moderno */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex-wrap">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.02]'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                          isActive ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BARRA DE ACCESO RÁPIDO (INTERFACE CRAFTS CARDS) */}
            <div className="pt-4 border-t border-neutral-800/80">
              <div className="flex items-center justify-between mb-3 text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-white">Acceso Rápido • Interface Crafts</span>
                </div>
                <span className="text-neutral-500">Ejecución inmediata en 1 toque</span>
              </div>

              <InterfaceCraftsCards
                items={[
                  {
                    id: 'recharge',
                    icon: CreditCard,
                    title: 'Recargar Saldo',
                    subtitle: 'Añadir saldo express',
                    badge: `$${card.balance.toFixed(2)}`,
                    badgeClassName: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
                    iconBg: 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400',
                    borderClassName: 'border-neutral-800/80 hover:border-emerald-500/50',
                    glowGradient: 'from-emerald-500/15 via-transparent to-transparent',
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
                    badgeClassName: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50',
                    iconBg: 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400',
                    borderClassName: 'border-neutral-800/80 hover:border-cyan-500/50',
                    glowGradient: 'from-cyan-500/15 via-transparent to-transparent',
                    footerText: 'Pase Contactless Oficial',
                    activeStatus: true,
                    onClick: () => setShowQRQuickModal(true),
                  },
                  {
                    id: 'simulator',
                    icon: Clock,
                    title: activeSession ? 'Cajón Activo' : 'Simular Estancia',
                    subtitle: activeSession ? activeSession.zoneName : 'Parquímetro en vivo',
                    badge: activeSession ? 'EN VIVO' : '$0.25/MIN',
                    badgeClassName: activeSession ? 'bg-amber-950/60 text-amber-300 border-amber-700/50 animate-pulse' : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50',
                    iconBg: 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-400',
                    borderClassName: 'border-neutral-800/80 hover:border-indigo-500/50',
                    glowGradient: 'from-indigo-500/15 via-transparent to-transparent',
                    footerText: activeSession ? 'Debitando segundo a segundo' : 'Listo para estacionar',
                    activeStatus: activeSession !== null,
                    onClick: () => {
                      setActiveTab('dashboard');
                      sileo.info({
                        title: 'Simulador de Parquímetro',
                        description: 'Selecciona tu cajón metropolitano o inicia estancia.',
                      });
                    },
                  },
                  {
                    id: 'autopay',
                    icon: Zap,
                    title: 'Modo Autocobro',
                    subtitle: 'Débito continuo sin filas',
                    badge: autoPay.enabled ? 'ACTIVO' : 'PAUSADO',
                    badgeClassName: autoPay.enabled ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50' : 'bg-rose-950/60 text-rose-300 border-rose-700/50',
                    iconBg: 'bg-purple-950/80 border border-purple-500/40 text-purple-400',
                    borderClassName: 'border-neutral-800/80 hover:border-purple-500/50',
                    glowGradient: 'from-purple-500/15 via-transparent to-transparent',
                    footerText: autoPay.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Virtual',
                    activeStatus: autoPay.enabled,
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
                    title: vehicle.plates,
                    subtitle: `${vehicle.brand} ${vehicle.model}`,
                    badge: 'PADRÓN',
                    badgeClassName: 'bg-amber-950/60 text-amber-300 border-amber-700/50',
                    iconBg: 'bg-amber-950/80 border border-amber-500/40 text-amber-400',
                    borderClassName: 'border-neutral-800/80 hover:border-amber-500/50',
                    glowGradient: 'from-amber-500/15 via-transparent to-transparent',
                    footerText: owner.fullName,
                    activeStatus: true,
                    onClick: () => {
                      setActiveTab('vehicle');
                      sileo.info({
                        title: 'Padrón Vehicular',
                        description: `Vehículo actual: ${vehicle.plates} • ${vehicle.brand} ${vehicle.model}`,
                      });
                    },
                  },
                ]}
              />
            </div>

          </div>

          {/* Modal Rápido de Recarga de Saldo */}
          {showRechargeQuickModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 font-mono">Recarga Rápida de Saldo</h3>
                <p className="text-xs text-neutral-400 mb-6">
                  Saldo disponible: <span className="text-emerald-400 font-bold font-mono">${card.balance.toFixed(2)} MXN</span>
                </p>

                <form onSubmit={handleQuickRechargeSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="text-xs text-neutral-400 font-mono block mb-2">Selecciona un monto:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 200, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setRechargeAmt(amt)}
                          className={`py-2 rounded-xl text-xs font-mono font-bold border transition ${
                            rechargeAmt === amt
                              ? 'bg-white text-black border-white'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRechargeQuickModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 text-xs font-mono hover:bg-neutral-900 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-mono font-bold hover:bg-neutral-200 transition shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                    >
                      Recargar ${rechargeAmt}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Rápido de Código QR */}
          {showQRQuickModal && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-white mb-1 font-mono">Credencial QR de Inspección</h3>
                <p className="text-xs text-neutral-400 mb-6">
                  Lectura directa para agentes de tránsito vial
                </p>

                <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
                  <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="white" />
                    <rect x="5" y="5" width="26" height="26" fill="black" />
                    <rect x="9" y="9" width="18" height="18" fill="white" />
                    <rect x="13" y="13" width="10" height="10" fill="black" />
                    <rect x="69" y="5" width="26" height="26" fill="black" />
                    <rect x="73" y="9" width="18" height="18" fill="white" />
                    <rect x="77" y="13" width="10" height="10" fill="black" />
                    <rect x="5" y="69" width="26" height="26" fill="black" />
                    <rect x="9" y="73" width="18" height="18" fill="white" />
                    <rect x="13" y="77" width="10" height="10" fill="black" />
                    <rect x="36" y="10" width="8" height="8" fill="black" />
                    <rect x="48" y="10" width="6" height="6" fill="black" />
                    <rect x="36" y="24" width="6" height="6" fill="black" />
                    <rect x="46" y="20" width="10" height="10" fill="black" />
                    <rect x="10" y="38" width="6" height="6" fill="black" />
                    <rect x="20" y="44" width="8" height="8" fill="black" />
                    <rect x="35" y="40" width="30" height="20" fill="black" />
                    <rect x="40" y="45" width="20" height="10" fill="white" />
                    <rect x="70" y="40" width="8" height="8" fill="black" />
                    <rect x="82" y="48" width="6" height="6" fill="black" />
                    <rect x="38" y="70" width="8" height="8" fill="black" />
                    <rect x="50" y="76" width="12" height="12" fill="black" />
                    <rect x="68" y="70" width="6" height="6" fill="black" />
                    <rect x="78" y="80" width="10" height="10" fill="black" />
                  </svg>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 mb-6 text-xs font-mono text-neutral-300 flex items-center justify-between">
                  <span>Placas: <strong className="text-white">{vehicle.plates}</strong></span>
                  <span className="text-emerald-400">● Validado</span>
                </div>

                <button
                  onClick={() => setShowQRQuickModal(false)}
                  className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-mono font-bold hover:bg-neutral-200 transition"
                >
                  Cerrar Credencial
                </button>
              </div>
            </div>
          )}

          {/* Contenido Dinámico según Pestaña */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Grid Superior: Tarjeta Digital & Resumen Rápido */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Tarjeta Digital (Col 1 a 7) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 font-mono flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-white" />
                      Tu Tarjeta Digital de Parquímetro
                    </h3>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      Actualización en tiempo real
                    </span>
                  </div>

                  <DigitalCard />
                </div>

                {/* Panel de Ayuda y Estatus Rápido (Col 8 a 12) */}
                <div className="lg:col-span-5 h-full">
                  <WobbleCard
                    containerClassName="w-full h-full bg-gradient-to-br from-cyan-950/70 via-neutral-950 to-black border-cyan-900/40 hover:border-cyan-500/60 transition-colors shadow-2xl"
                    className="p-6 sm:p-7 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-full bg-cyan-900/60 border border-cyan-700/50 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-200">
                          GARANTÍA CERO MULTAS
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Activo
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                        Protección & Telemetría Satelital
                      </h3>
                      <p className="mt-2 text-xs text-neutral-300 font-mono leading-relaxed">
                        El sistema debita segundo a segundo exacto con tarifa regulada de <strong className="text-white">$0.25 MXN/min</strong> con encriptación oficial de <strong className="text-white">SSS.Solutions</strong>.
                      </p>

                      <div className="space-y-3 mt-4 text-xs font-mono">
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                          <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block">Sin multas por expiración</span>
                            <span className="text-[11px] text-neutral-400">Débito continuo sin necesidad de volver al coche.</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                          <Smartphone className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-white block">Credencial Oficial de Tránsito</span>
                            <span className="text-[11px] text-neutral-400">Escaneo QR oficial y contactless NFC para agentes viales.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-cyan-900/40">
                      <button
                        onClick={() => setActiveTab('autopay')}
                        className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,175,205,0.3)]"
                      >
                        <Zap className="w-4 h-4" />
                        Configurar Reglas del Autocobro
                      </button>
                    </div>
                  </WobbleCard>
                </div>

              </div>

              {/* Simulador de Parquímetro */}
              <div>
                <ParkingSimulator />
              </div>

              {/* Historial Reciente */}
              <div>
                <TransactionHistory />
              </div>
            </div>
          )}

          {activeTab === 'autopay' && (
            <div className="animate-in fade-in duration-300 max-w-4xl mx-auto space-y-6">
              <AutoPaymentConfig />
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="animate-in fade-in duration-300 max-w-4xl mx-auto space-y-6">
              <VehicleOwnerForm />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <TransactionHistory />
            </div>
          )}

        </main>

        {/* 3. SECCIÓN BANNER: La Nueva Era del Parquímetro Digital */}
        <section className="w-full border-t border-neutral-900 overflow-hidden">
          <HeroParallax 
            headerTitle="La Nueva Era del Parquímetro Digital"
            headerSubtitle="SISTEMA METROPOLITANO PARQU"
            headerDescription="Descubre una plataforma diseñada para eliminar las filas, los parquímetros mecánicos y las multas. Autocobro continuo segundo a segundo con tecnología SSS.Solutions."
          />
        </section>

        {/* Footer con Logos 100% Transparentes y Powered by SSS.Solutions */}
        <footer className="border-t border-neutral-800/80 bg-black py-8 text-center text-xs text-neutral-400 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Identidad Parqu - Logo Transparente sin cajas de fondo */}
            <div className="flex items-center gap-3">
              <img 
                src="/parqu-logo-white.png" 
                alt="Parqu" 
                style={{ maxHeight: '32px' }}
                className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              />
              <div className="text-left">
                <span className="font-bold text-white tracking-wide block font-mono">Parqu Digital</span>
                <span className="text-[11px] text-neutral-500 font-mono">Parquímetro inteligente con autocobro</span>
              </div>
            </div>

            {/* Powered by SSS.Solutions - Logo Transparente sin cajas de fondo */}
            <div className="flex flex-col sm:flex-row items-center gap-3 py-2 px-5 rounded-full bg-neutral-950/80 border border-neutral-800">
              <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-neutral-400">
                Powered by
              </span>
              <div className="flex items-center gap-2">
                <img 
                  src="/sss-solutions-logo.png" 
                  alt="SSS Solutions" 
                  style={{ maxHeight: '28px' }}
                  className="h-7 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform"
                />
              </div>
            </div>

            {/* Seguridad y Derechos */}
            <div className="text-center md:text-right font-mono text-[11px] text-neutral-500">
              <span>© {new Date().getFullYear()} Todos los derechos reservados.</span>
              <span className="block text-neutral-600">Tecnología SSS.Solutions • Encriptación 256-bit</span>
            </div>

          </div>
        </footer>
      </div>
    </BackgroundGradientAnimation>
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
        description: 'Credencial digital y red inteligente de autocobro sincronizadas con tecnología SSS.Solutions.',
      });
    }, 300);
  };

  const handleReplay = () => {
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <ParkingProvider>
      <Toaster position="top-right" theme="dark" />
      <AnimatePresence mode="wait">
        {isLoading && (
          <ErrorBoundary fallbackText="Iniciando Parqu...">
            <LoadingScreen onComplete={handleStart} />
          </ErrorBoundary>
        )}
      </AnimatePresence>
      <MainContent onReplayLoading={handleReplay} />
    </ParkingProvider>
  );
}
