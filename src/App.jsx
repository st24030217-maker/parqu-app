import React, { useState } from 'react';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Header } from './components/Header';
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

const MainContent = () => {
  const { activeSession, vehicle } = useParking();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'autopay', 'vehicle', 'history'

  const tabs = [
    { id: 'dashboard', label: 'Tarjeta & Parquímetro', icon: CreditCard, badge: activeSession ? 'EN VIVO' : null },
    { id: 'autopay', label: 'Formato de Autocobro', icon: Zap, badge: 'CONFIG' },
    { id: 'vehicle', label: 'Vehículo & Titular', icon: Car },
    { id: 'history', label: 'Historial de Cobros', icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      {/* Banner de Sesión Activa si está en otra pestaña */}
      {activeSession && activeTab !== 'dashboard' && (
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-500/25 transition"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>Vehículo {vehicle.plates} actualmente en parquímetro. Haz clic aquí para ver el contador en vivo o liberar el cajón.</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Encabezado de Bienvenida y Selector de Pestañas */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Parquímetro Digital Metropolitano</span>
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hidden sm:inline-block">
                Cero Filas • Cero Monedas
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Todos los cobros de estacionamiento se cargan automáticamente a tu tarjeta digital vinculada.
            </p>
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap relative ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white text-slate-950' : 'bg-cyan-500/20 text-cyan-300'
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
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Tu Tarjeta Digital de Parquímetro
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Actualización automática en tiempo real
                  </span>
                </div>

                <DigitalCard />
              </div>

              {/* Panel de Ayuda y Estatus Rápido (Col 8 a 12) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Garantía de Autocobro Activa
                  </h3>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Sin multas por expiración</span>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">
                        El sistema debita de forma continua el tiempo exacto que tu vehículo pasa en el cajón.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Credencial Oficial de Tránsito</span>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">
                        Al presionar el botón de Código QR, los oficiales de parquímetro validan la tarjeta al instante.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('autopay')}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sistema de Parquímetros Digitales & Autocobro Inteligente</span>
          <span className="text-slate-400 font-mono">Plataforma Segura • Encriptación 256-bit</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ParkingProvider>
      <MainContent />
    </ParkingProvider>
  );
}
