import React from 'react';
import { WobbleCard } from './ui/wobble-card';
import { 
  Zap, 
  Car, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

export const WobbleCardSection = ({ onSelectFeature }) => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      {/* Encabezado de la Sección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-neutral-300 mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-[0.2em] uppercase font-bold text-white">ARQUITECTURA DE VANGUARDIA</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Diseñado para Ciudades Inteligentes
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-1.5 max-w-2xl">
            Interactúa con las tarjetas dinámicas de Parqu impulsadas por la tecnología de <span className="text-white font-bold">SSS.Solutions</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Física Interactiva Reactiva 3D</span>
        </div>
      </div>

      {/* Grid Bento Wobble Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        
        {/* TARJETA 1: Autocobro Inteligente (Col Span 2) */}
        <WobbleCard
          containerClassName="col-span-1 lg:col-span-2 h-full bg-gradient-to-br from-indigo-950/80 via-neutral-950 to-black min-h-[420px] lg:min-h-[380px] border-indigo-900/40 hover:border-indigo-500/60 transition-colors"
          className="flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-200">
                TECNOLOGÍA SSS.SOLUTIONS
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Cobro por Segundo</span>
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Autocobro Continuo sin Filas ni Monedas
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-neutral-300 font-mono max-w-xl leading-relaxed">
              El sistema detecta automáticamente la ocupación del cajón y debita segundo a segundo exacto a una tarifa regulada de <span className="text-white font-bold">$0.25 MXN/min</span>. Al liberar el cajón, el cobro finaliza al instante.
            </p>

            {/* Badges de Beneficios */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-6">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="text-[11px] font-mono text-neutral-200 font-semibold">Cero Tiempo Perdido</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] font-mono text-neutral-200 font-semibold">Garantía Cero Multas</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 col-span-2 sm:col-span-1">
                <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="text-[11px] font-mono text-neutral-200 font-semibold">Algoritmo Predictivo</span>
              </div>
            </div>
          </div>

          {/* Botón de acción */}
          <div className="pt-6 mt-4 border-t border-indigo-900/40 flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">Configuración parametrizable</span>
            <button
              onClick={() => onSelectFeature && onSelectFeature('autopay')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-mono font-bold hover:bg-indigo-100 transition shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              <span>Ver Autocobro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </WobbleCard>

        {/* TARJETA 2: Padrón Vehicular (Col Span 1) */}
        <WobbleCard 
          containerClassName="col-span-1 min-h-[380px] bg-gradient-to-br from-purple-950/70 via-neutral-950 to-black border-purple-900/40 hover:border-purple-500/60 transition-colors"
          className="flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-purple-900/60 border border-purple-700/50 text-[10px] font-mono font-bold uppercase tracking-widest text-purple-200">
                PADRÓN VIAL
              </span>
              <Car className="w-5 h-5 text-purple-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Vinculación de Placas
            </h3>
            <p className="mt-2 text-xs text-neutral-300 font-mono leading-relaxed">
              Registra tu vehículo y asocia múltiples matrículas para que los sensores municipales validen tu estancia en tiempo real.
            </p>

            <div className="mt-5 p-3.5 rounded-2xl bg-neutral-900/90 border border-purple-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-700 flex items-center justify-center font-mono font-bold text-xs text-purple-300">
                  MX
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-white block">Validación Oficial</span>
                  <span className="text-[10px] font-mono text-neutral-400">Placas sincronizadas</span>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="pt-4 border-t border-purple-900/40 flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400">Padrón activo</span>
            <button
              onClick={() => onSelectFeature && onSelectFeature('vehicle')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-mono font-bold transition border border-purple-700/50"
            >
              <span>Editar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </WobbleCard>

        {/* TARJETA 3: Credencial Digital & QR de Tránsito (Col Span 3) */}
        <WobbleCard 
          containerClassName="col-span-1 lg:col-span-3 min-h-[340px] bg-gradient-to-br from-cyan-950/70 via-neutral-950 to-black border-cyan-900/40 hover:border-cyan-500/60 transition-colors"
          className="flex flex-col justify-between"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Texto y detalles */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-cyan-900/60 border border-cyan-700/50 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-200">
                  CREDENCIAL METROPOLITANA
                </span>
                <span className="text-[11px] font-mono text-neutral-400">Encriptación AES-256</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Tarjeta Digital NFC & Inspección QR Oficial
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-300 font-mono max-w-2xl leading-relaxed">
                Cada usuario cuenta con una tarjeta virtual interactiva 3D con lectura directa por proximidad NFC o escaneo visual QR para agentes de movilidad urbana y parquímetros inteligentes.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-6 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Sin contacto físico</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Recargas instantáneas</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>Sello criptográfico SSS.Solutions</span>
                </div>
              </div>
            </div>

            {/* Showcase Visual Compacto */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="w-8 h-8 text-cyan-400" />
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-mono font-bold text-white text-center">Credencial Parqu Activa</span>
              <span className="text-[11px] font-mono text-neutral-400 text-center mt-1">Saldo en tiempo real con recarga en 1 toque</span>
              
              <button
                onClick={() => onSelectFeature && onSelectFeature('dashboard')}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-cyan-400 text-black font-mono font-bold text-xs hover:bg-cyan-300 transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,175,205,0.3)]"
              >
                <span>Acceder a la Tarjeta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </WobbleCard>

      </div>
    </section>
  );
};

export default WobbleCardSection;
