import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sileo';
import 'sileo/styles.css';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { DigitalCard } from './components/DigitalCard';
import { VehicleOwnerForm } from './components/VehicleOwnerForm';
import { AutoPaymentConfig } from './components/AutoPaymentConfig';
import { ParkingSimulator } from './components/ParkingSimulator';
import { TransactionHistory } from './components/TransactionHistory';
import { 
  CreditCard, 
  Car, 
  Zap, 
  Clock, 
  History, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  ChevronRight
} from 'lucide-react';

const MainContent = ({ onReplayLoading }) => {
  const { activeSession, vehicle } = useParking();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'autopay', 'vehicle', 'history'

  const tabs = [
    { id: 'dashboard', label: 'Tarjeta & Parquímetro', icon: CreditCard, badge: activeSession ? 'EN VIVO' : null },
    { id: 'autopay', label: 'Formato de Autocobro', icon: Zap, badge: 'CONFIG' },
    { id: 'vehicle', label: 'Vehículo & Titular', icon: Car },
    { id: 'history', label: 'Historial de Cobros', icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative selection:bg-white selection:text-black">
      {/* Luces y texturas ambientales en Blanco y Negro idénticas a la pantalla de carga */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/[0.03] rounded-full blur-[160px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onReplayLoading={onReplayLoading} />

        {/* Banner de Sesión Activa si está en otra pestaña */}
        {activeSession && activeTab !== 'dashboard' && (
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="bg-neutral-900/90 border-b border-amber-500/40 px-4 py-2.5 text-center text-xs font-mono font-semibold text-amber-300 flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-900 transition backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Vehículo {vehicle.plates} actualmente en parquímetro. Clic para ver contador o liberar cajón.</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Contenedor Principal */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Encabezado de Bienvenida y Selector de Pestañas */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 text-xs font-mono text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="tracking-widest uppercase">Sistema Inteligente de Parquímetros</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>Parquímetro Digital Metropolitano</span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 hidden sm:inline-block">
                  Cero Filas • Cero Monedas
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-mono">
                Todos los cobros de estacionamiento se cargan automáticamente a tu tarjeta digital vinculada.
              </p>
            </div>

            {/* Navegación por Pestañas */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 backdrop-blur-md overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap relative ${
                      isActive
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
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
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-400 font-mono flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Garantía de Autocobro Activa
                    </h3>
                  </div>

                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-3xl p-6 space-y-4 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">Sin multas por expiración</span>
                        <p className="text-neutral-400 mt-0.5 leading-relaxed">
                          El sistema debita de forma continua el tiempo exacto que tu vehículo pasa en el cajón.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-neutral-800">
                      <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">Credencial Oficial de Tránsito</span>
                        <p className="text-neutral-400 mt-0.5 leading-relaxed">
                          Al presionar el botón de Código QR, los oficiales de parquímetro validan la tarjeta al instante.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab('autopay')}
                        className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-mono font-semibold border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-amber-400" />
                        Configurar Reglas del Autocobro
                      </button>
                    </div>
                  </div>
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

        {/* Footer con Logos 100% Transparentes y Powered by SSS.Solutions */}
        <footer className="border-t border-neutral-800/80 bg-black py-8 text-center text-xs text-neutral-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Identidad Park - Logo Transparente sin cajas de fondo */}
            <div className="flex items-center gap-3">
              <img 
                src="/parqu-logo-white.png" 
                alt="Park" 
                className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              />
              <div className="text-left">
                <span className="font-bold text-white tracking-wide block font-mono">Park Digital</span>
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
    </div>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ParkingProvider>
      <Toaster position="top-right" theme="dark" />
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>
      <MainContent onReplayLoading={() => setIsLoading(true)} />
    </ParkingProvider>
  );
}
