'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParking } from '../../context/ParkingContext';
import { sileo } from 'sileo';
import { OptionWheel } from './OptionWheel';
import { triggerHaptic } from '../../utils/haptics';
import {
  Play,
  Square,
  RefreshCw,
  Zap,
  QrCode,
  MapPin,
  Car,
  History,
  ChevronDown,
  ArrowDown,
  Check,
  Copy,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CurrencyDollarIcon, PlugConnectedIcon } from '../icons';

function formatTimeFromSeconds(totalSecs = 0) {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tarjeta & Parquímetro',
    shortLabel: 'Parquímetro',
    category: 'ESTANCIA EN VIVO',
    icon: Play,
    actionTarget: 'dashboard',
    badge: 'ACTIVO',
    description: 'Control de estancia segundo a segundo, saldo y contador inteligente.'
  },
  {
    id: 'recharge',
    label: 'Recarga Inmediata',
    shortLabel: 'Recarga Saldo',
    category: 'MONEDERO DIGITAL',
    icon: CurrencyDollarIcon,
    actionTarget: 'recharge',
    badge: 'EXPRESS',
    description: 'Añade saldo instantáneo a tu tarjeta virtual sin comisiones.'
  },
  {
    id: 'autopay',
    label: 'Autocobro Inteligente',
    shortLabel: 'Modo Autocobro',
    category: 'DÉBITO CONTINUO',
    icon: Zap,
    actionTarget: 'autopay',
    badge: '0 FILAS',
    description: 'Debitado automático continuo. Olvídate de multas y boletos físicos.'
  },
  {
    id: 'qr-credential',
    label: 'Credencial QR Oficial',
    shortLabel: 'Pase Contactless',
    category: 'INSPECCIÓN VIAL',
    icon: QrCode,
    actionTarget: 'qr-credential',
    badge: 'AES-256',
    description: 'Presenta tu pase de verificación oficial ante oficiales de tránsito.'
  },
  {
    id: 'parking-map',
    label: 'Mapa Satelital GPS',
    shortLabel: 'Ubicación & Rutas',
    category: 'GEOLOCALIZACIÓN',
    icon: MapPin,
    actionTarget: 'dashboard',
    badge: 'EN VIVO',
    description: 'Fija el espacio de tu automóvil o navega por los cajones disponibles.'
  },
  {
    id: 'vehicle',
    label: 'Padrón Vehicular',
    shortLabel: 'Datos de Vehículo',
    category: 'REGISTRO MUNICIPAL',
    actionTarget: 'vehicle',
    badge: 'OFICIAL',
    description: 'Consulta y actualiza placas, modelo y conductor registrado.'
  },
  {
    id: 'history',
    label: 'Historial de Cobros',
    shortLabel: 'Bitácora de Pagos',
    category: 'AUDITORÍA',
    icon: History,
    actionTarget: 'history',
    badge: 'AUDITABLE',
    description: 'Registro histórico y recibos foliados con hora y costo exacto.'
  },
];

export const OrbitalWheelMenu = ({
  activeTab,
  onSelectTab,
  onOpenRecharge,
  onOpenQR,
  className = '',
}) => {
  const {
    vehicle = {},
    updateVehicle,
    card = {},
    autoPay = {},
    updateAutoPay,
    activeSession,
    startParking,
    stopParkingAndAutoCharge,
    transactions = [],
    registerPinnedLocation,
    addBalance,
  } = useParking();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detección reactiva de dispositivo para calibrar tamaño y fluidez
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sincronizar índice del OptionWheel si el tab activo cambia desde otra parte de la app
  useEffect(() => {
    if (!activeTab) return;
    const foundIdx = MENU_ITEMS.findIndex(
      (item) => item.actionTarget === activeTab && item.id !== 'parking-map'
    );
    if (foundIdx !== -1 && foundIdx !== selectedIndex) {
      setSelectedIndex(foundIdx);
    }
  }, [activeTab]);

  const currentItem = MENU_ITEMS[selectedIndex] || MENU_ITEMS[0];
  const CurrentIcon = currentItem.icon;

  // Acción principal: Abrir función y hacer scroll suave hacia abajo al sistema
  const handleNavigateAndScroll = useCallback((targetTab) => {
    triggerHaptic();
    onSelectTab?.(targetTab);
    
    // Desplazamiento fluido hacia abajo al sistema interactivo
    setTimeout(() => {
      const targetEl = document.getElementById('system-tabs-container') || document.getElementById('interactive-system');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, [onSelectTab]);

  // Manejo de cambio en la rueda
  const handleWheelChange = useCallback((idx) => {
    setSelectedIndex(idx);
  }, []);

  // Acciones rápidas contextuales
  const handleStartParking = useCallback(() => {
    triggerHaptic();
    startParking('Centro Histórico (Zona A)', '34-B');
    sileo.success({
      title: 'Parquímetro Iniciado',
      description: 'Espacio 34-B en Centro Histórico. Autocobro activo.',
    });
  }, [startParking]);

  const handleStopParking = useCallback(() => {
    triggerHaptic();
    stopParkingAndAutoCharge();
    sileo.info({
      title: 'Estancia Finalizada',
      description: 'El espacio ha sido liberado y el cobro aplicado con éxito.',
    });
  }, [stopParkingAndAutoCharge]);

  const handleToggleAutoPay = useCallback(() => {
    triggerHaptic();
    const nextState = !autoPay?.enabled;
    updateAutoPay({ enabled: nextState });
    if (nextState) {
      sileo.success({ title: 'Autocobro Activado', description: 'Débito continuo sin monedas.' });
    } else {
      sileo.warning({ title: 'Autocobro Pausado', description: 'Deberás iniciar sesión manualmente.' });
    }
  }, [autoPay, updateAutoPay]);

  const handleCopyPlates = useCallback(() => {
    triggerHaptic();
    const plates = vehicle?.plates || 'JNZ-4821';
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(plates);
      setCopied(true);
      sileo.success({ title: 'Placas Copiadas', description: plates });
      setTimeout(() => setCopied(false), 2000);
    }
  }, [vehicle]);

  const handleQuickRechargeAmt = useCallback((amt) => {
    triggerHaptic();
    addBalance(amt);
    sileo.success({
      title: 'Recarga Exitosa',
      description: `+$${amt}.00 MXN añadidos a tu tarjeta Parqu.`,
    });
  }, [addBalance]);

  return (
    <section 
      aria-label="Menú 3D de navegación y acceso al sistema"
      className={`w-full rounded-3xl bg-slate-50/70 border border-slate-200/90 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl p-5 sm:p-7 lg:p-9 relative overflow-hidden font-sans ${className}`}
    >
      {/* Resplandor minimalista ambiental difuminado en azul eléctrico muy sutil */}
      <div 
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"
      />

      {/* ═══ ENCABEZADO SUPERIOR MINIMALISTA ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 font-sans">
            Menú de Navegación 3D
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
            DIFUMINADO • 7 MÓDULOS
          </span>
        </div>

        <p className="text-xs text-slate-500 font-sans hidden sm:block">
          Gira la rueda o arrastra para explorar • Clic para descender al sistema
        </p>
      </div>

      {/* ═══ CUERPO PRINCIPAL: PANEL DE DETALLES + OPTIONWHEEL 3D ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center min-h-[320px] sm:min-h-[360px]">
        
        {/* ═══ COLUMNA IZQUIERDA: TARJETA DE ESTADO CONTEXTUAL MINIMALISTA (5/12) ═══ */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm relative z-10">
          <div>
            {/* Categoría y Badge de Estado */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-500">
                {currentItem.category}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-200">
                {currentItem.badge}
              </span>
            </div>

            {/* Icono y Título */}
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shrink-0">
                <CurrentIcon className="w-5 h-5 text-black" />
              </div>
              <h4 className="text-lg sm:text-xl font-black text-slate-950 font-sans tracking-tight">
                {currentItem.label}
              </h4>
            </div>

            {/* Descripción minimalista */}
            <p className="text-xs text-slate-600 mb-4 leading-relaxed font-sans">
              {currentItem.description}
            </p>

            {/* Módulo de Datos en Vivo Contextual */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 font-sans text-xs">
              {currentItem.id === 'dashboard' && (
                activeSession ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Tiempo de Estancia</div>
                      <div className="font-mono font-black text-slate-950 text-base">
                        {formatTimeFromSeconds(activeSession.secondsElapsed)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Costo Acumulado</div>
                      <div className="font-mono font-black text-emerald-700 text-base">
                        ${activeSession.currentCost.toFixed(2)} MXN
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">Estatus Parquímetro</div>
                      <div className="font-bold text-slate-900">Listo para Estacionar</div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-600">$0.25/min</span>
                  </div>
                )
              )}

              {currentItem.id === 'recharge' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Saldo Disponible</div>
                    <div className="font-mono font-black text-slate-950 text-base">
                      ${Number(card?.balance ?? 0).toFixed(2)} MXN
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                    ACTIVO
                  </span>
                </div>
              )}

              {currentItem.id === 'autopay' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Estado Autocobro</div>
                    <div className="font-bold text-slate-900">
                      {autoPay?.enabled ? 'Débito Activo' : 'Modalidad Pausada'}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    autoPay?.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {autoPay?.enabled ? 'VIGENTE' : 'PAUSADO'}
                  </span>
                </div>
              )}

              {currentItem.id === 'qr-credential' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Placas Asignadas</div>
                    <div className="font-mono font-bold text-slate-900">{vehicle?.plates || 'JNZ-4821'}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">
                    AES-256
                  </span>
                </div>
              )}

              {currentItem.id === 'parking-map' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Ubicación GPS</div>
                    <div className="font-bold text-slate-900">Centro Histórico • Zona A</div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    EN VIVO
                  </span>
                </div>
              )}

              {currentItem.id === 'vehicle' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Vehículo Registrado</div>
                    <div className="font-bold text-slate-900">
                      {vehicle?.model || 'Nissan Versa'} ({vehicle?.plates || 'JNZ-4821'})
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                    VALIDADO
                  </span>
                </div>
              )}

              {currentItem.id === 'history' && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Último Movimiento</div>
                    <div className="font-bold text-slate-900">
                      {transactions?.[0]?.description || 'Recarga en Oxxo Pay'}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-950">
                    {transactions?.[0] ? `-$${transactions[0].amount.toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Acciones de la Tarjeta */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {/* Botón Principal: Ir y Desplazar hacia abajo al sistema */}
            <button
              type="button"
              aria-label={`Desplazar hacia abajo y abrir ${currentItem.label} en el sistema`}
              onClick={() => handleNavigateAndScroll(currentItem.actionTarget)}
              className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-slate-800 text-white font-sans font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <span>Abrir Función & Desplazar</span>
              <ArrowDown className="w-3.5 h-3.5 text-white animate-bounce" />
            </button>

            {/* Acciones secundarias contextuales */}
            <div className="flex items-center gap-2">
              {currentItem.id === 'dashboard' && (
                activeSession ? (
                  <button
                    type="button"
                    onClick={handleStopParking}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Square size={12} />
                    <span>Liberar Lugar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartParking}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play size={12} />
                    <span>Iniciar Estancia</span>
                  </button>
                )
              )}

              {currentItem.id === 'recharge' && (
                <div className="flex gap-1.5 w-full">
                  {[100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickRechargeAmt(amt)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 font-mono text-[11px] font-bold transition cursor-pointer"
                    >
                      +${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={onOpenRecharge}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-[11px] font-bold transition cursor-pointer"
                  >
                    Otro
                  </button>
                </div>
              )}

              {currentItem.id === 'autopay' && (
                <button
                  type="button"
                  onClick={handleToggleAutoPay}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap size={12} />
                  <span>{autoPay?.enabled ? 'Pausar Autocobro' : 'Activar Autocobro'}</span>
                </button>
              )}

              {currentItem.id === 'qr-credential' && (
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={handleCopyPlates}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copiado' : 'Copiar Placas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenQR}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <QrCode size={12} />
                    <span>Ver QR</span>
                  </button>
                </div>
              )}

              {currentItem.id === 'parking-map' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('dashboard')}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin size={12} />
                  <span>Ver Mapa en Panel</span>
                </button>
              )}

              {currentItem.id === 'vehicle' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('vehicle')}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Car size={12} />
                  <span>Editar Datos del Vehículo</span>
                </button>
              )}

              {currentItem.id === 'history' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('history')}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <History size={12} />
                  <span>Ver Todos los Recibos</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ COLUMNA DERECHA: OPTIONWHEEL 3D DIFUMINADO (7/12) ═══ */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          
          {/* Contenedor del OptionWheel con altura calibrada para teléfono y computadora */}
          <div 
            className="w-full h-[280px] sm:h-[340px] md:h-[380px] relative rounded-2xl bg-white/40 border border-slate-200/60 shadow-inner overflow-hidden"
          >
            {/* Guía visual central con borde sutil para enmarcar la opción activa */}
            <div 
              className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-14 sm:h-16 border-y border-slate-300/40 bg-slate-900/[0.02] pointer-events-none z-10 flex items-center justify-between px-3 sm:px-6"
            >
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest hidden sm:inline">
                SELECCIONADO
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                0{selectedIndex + 1} / 0{MENU_ITEMS.length}
              </span>
            </div>

            {/* Componente OptionWheel de React Bits con difuminado y suavizado 3D */}
            <OptionWheel
              items={MENU_ITEMS}
              selectedIndex={selectedIndex}
              onChange={handleWheelChange}
              onSelect={(idx, item) => handleNavigateAndScroll(item.actionTarget)}
              textColor="#64748b"
              activeColor="#000000"
              side={isMobile ? 'left' : 'left'}
              fontSize={isMobile ? 1.45 : 2.1}
              spacing={isMobile ? 1.45 : 1.6}
              curve={isMobile ? 0.75 : 0.9}
              tilt={isMobile ? 4.5 : 5.8}
              blur={2.6}
              fade={0.38}
              minOpacity={0.06}
              smoothing={170}
              inset={isMobile ? 24 : 44}
              loop={true}
              draggable={true}
              renderItem={(item, isSelected) => {
                const ItemIcon = item.icon;
                return (
                  <span className="inline-flex items-center gap-2.5 sm:gap-3.5">
                    <span 
                      className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-black text-white shadow-sm' 
                          : 'bg-slate-200/60 text-slate-700'
                      }`}
                    >
                      <ItemIcon size={isMobile ? 14 : 16} />
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </span>
                );
              }}
            />
          </div>

          {/* Indicador de ayuda y scroll para móviles y desktop */}
          <div className="flex items-center justify-between w-full px-2 pt-2.5 text-[11px] text-slate-500 font-sans">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Arrastra o usa la rueda del ratón
            </span>
            <button
              type="button"
              onClick={() => handleNavigateAndScroll(currentItem.actionTarget)}
              className="text-black font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Ir al sistema</span>
              <ChevronDown size={14} />
            </button>
          </div>

        </div>

      </div>

    </section>
  );
};

export default OrbitalWheelMenu;
