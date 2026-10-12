'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParking } from '../../context/ParkingContext';
import { sileo } from 'sileo';
import { OptionWheel } from './OptionWheel';
import { triggerHaptic } from '../../utils/haptics';
import {
  Play,
  Square,
  Zap,
  Wifi,
  MapPin,
  Car,
  History,
  CreditCard,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Check,
  Copy,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { isAudioEnabled, setAudioEnabled, playMovementNote } from '../../utils/wheelAudio';

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
    icon: CreditCard,
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
    description: 'Debitado automático continuo a $6.00/hr sin boletos físicos.'
  },
  {
    id: 'qr-credential',
    label: 'Credencial NFC Oficial',
    shortLabel: 'Pase NFC Contactless',
    category: 'INSPECCIÓN VIAL',
    icon: Wifi,
    actionTarget: 'qr-credential',
    badge: 'NFC AES-256',
    description: 'Presenta tu pase NFC contactless ante oficiales de tránsito.'
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
    icon: Car,
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
    card = {},
    autoPay = {},
    updateAutoPay,
    activeSession,
    startParking,
    stopParkingAndAutoCharge,
    transactions = [],
    addBalance,
  } = useParking();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detección reactiva de tamaño de pantalla
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
  const CurrentIcon = currentItem?.icon || Sparkles;

  // Acción principal: Abrir función y hacer scroll suave hacia abajo al sistema
  const handleNavigateAndScroll = useCallback((targetTab) => {
    triggerHaptic();
    onSelectTab?.(targetTab);
    
    setTimeout(() => {
      const targetEl = document.getElementById('system-tabs-container') || document.getElementById('interactive-system');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, [onSelectTab]);

  const handleWheelChange = useCallback((idx) => {
    setSelectedIndex(idx);
  }, []);

  const handleStartParking = useCallback(() => {
    triggerHaptic();
    startParking('Centro Histórico • Espacio #34-B', 6.00);
    sileo.success({
      title: 'Parquímetro Iniciado',
      description: 'Espacio 34-B en Centro Histórico ($6.00/hr). Autocobro activo.',
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

  const [soundActive, setSoundActive] = useState(() => isAudioEnabled());

  const handleToggleSound = useCallback(() => {
    const next = !soundActive;
    setSoundActive(next);
    setAudioEnabled(next);
    if (next) {
      playMovementNote(selectedIndex, 1.0);
      sileo.success({
        title: 'Música interactiva activada',
        description: 'Notas melódicas y acústicas en cada giro de la ruleta.'
      });
    } else {
      sileo.info({
        title: 'Modo silencioso',
        description: 'Sonidos de movimiento desactivados.'
      });
    }
  }, [soundActive, selectedIndex]);

  return (
    <section 
      aria-label="Menú 3D de navegación y acceso al sistema"
      className={`w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.005)_100%)] bg-[#0d0d11] border border-white/[0.08] rounded-2xl relative p-4 sm:p-8 font-sans ${className}`}
    >
      {/* ═══ ENCABEZADO MINIMALISTA KAGE STUDIO ═══ */}
      <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
        <button
          type="button"
          aria-label={soundActive ? 'Silenciar música de giros' : 'Activar música de giros'}
          onClick={handleToggleSound}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] hover:text-white transition-all text-[11px] font-mono cursor-pointer active:scale-95"
          title={soundActive ? 'Música interactiva activa al girar' : 'Activar música en movimientos'}
        >
          {soundActive ? (
            <>
              <Volume2 size={13} className="text-[#a78bfa]" />
              <span>AUDIO ACTIVO</span>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-[#71717a]" />
              <span className="text-[#a1a1aa]">SILENCIADO</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-xs font-mono text-[#71717a]">
          <span className="font-bold text-[#a78bfa]">0{selectedIndex + 1}</span>
          <span>/</span>
          <span>0{MENU_ITEMS.length}</span>
        </div>
      </div>

      {/* ═══ ESCENARIO PRINCIPAL: DETALLES + OPTIONWHEEL 3D ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-center">
        
        {/* ═══ COLUMNA IZQUIERDA: DETALLES DE LA FUNCIÓN ═══ */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-5">
          
          {/* Categoría y Badge de Estado */}
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[10px] font-mono font-semibold tracking-[0.14em] uppercase text-[#a78bfa]">
              {currentItem.category}
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#a1a1aa]">
              • {currentItem.badge}
            </span>
          </div>

          {/* Icono y Título */}
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#8b5cf6] text-white flex items-center justify-center border border-white/[0.12] shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.35)]">
                {CurrentIcon && <CurrentIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              </div>
              <h4 className="text-xl sm:text-3xl font-bold text-white font-sans tracking-[-0.02em]">
                {currentItem.label}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed font-sans max-w-md">
              {currentItem.description}
            </p>
          </div>

          {/* Fila de Datos en Vivo (Superficie #0a0a0d con borde hairline) */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#0a0a0d] border border-white/[0.08] font-sans text-xs">
            {currentItem.id === 'dashboard' && (
              activeSession ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#71717a] font-mono uppercase">Tiempo de Estancia</div>
                    <div className="font-mono font-bold text-white text-base">
                      {formatTimeFromSeconds(activeSession.secondsElapsed)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#71717a] font-mono uppercase">Costo Acumulado</div>
                    <div className="font-mono font-bold text-[#a78bfa] text-base">
                      ${activeSession.currentCost.toFixed(2)} MXN
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#71717a] font-mono uppercase">Estatus Parquímetro</div>
                    <div className="font-semibold text-white">Listo para Estacionar</div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#a78bfa]">$6.00/hr</span>
                </div>
              )
            )}

            {currentItem.id === 'recharge' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#71717a] font-mono uppercase">Saldo Disponible</div>
                  <div className="font-mono font-bold text-white text-base">
                    ${Number(card?.balance ?? 0).toFixed(2)} MXN
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8b5cf6]/15 text-[#a78bfa] border border-[#8b5cf6]/30 font-semibold">
                  ACTIVO
                </span>
              </div>
            )}

            {currentItem.id === 'autopay' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#71717a] font-mono uppercase">Estado Autocobro</div>
                  <div className="font-semibold text-white">
                    {autoPay?.enabled ? 'Débito Activo' : 'Modalidad Pausada'}
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                  autoPay?.enabled
                    ? 'bg-[#8b5cf6]/15 text-[#a78bfa] border-[#8b5cf6]/30'
                    : 'bg-white/[0.04] text-[#a1a1aa] border-white/[0.08]'
                }`}>
                  {autoPay?.enabled ? 'VIGENTE' : 'PAUSADO'}
                </span>
              </div>
            )}

            {currentItem.id === 'qr-credential' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#71717a] font-mono uppercase">Placas Asignadas</div>
                  <div className="font-mono font-bold text-white">{vehicle?.plates || 'JNZ-4821'}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#e4e4e7] font-semibold">
                  NFC AES-256
                </span>
              </div>
            )}

            {currentItem.id === 'parking-map' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#71717a] font-mono uppercase">Ubicación GPS</div>
                  <div className="font-semibold text-white">Centro Histórico • Zona A</div>
                </div>
                <span className="text-[10px] font-mono text-[#a78bfa] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
                  EN VIVO
                </span>
              </div>
            )}

            {currentItem.id === 'vehicle' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#71717a] font-mono uppercase">Vehículo Registrado</div>
                  <div className="font-semibold text-white">
                    {vehicle?.model || 'Nissan Versa'} ({vehicle?.plates || 'JNZ-4821'})
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#e4e4e7] font-semibold">
                  VALIDADO
                </span>
              </div>
            )}

            {currentItem.id === 'history' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#71717a] font-mono uppercase">Último Movimiento</div>
                  <div className="font-semibold text-white">
                    {transactions?.[0]?.description || 'Recarga en Oxxo Pay'}
                  </div>
                </div>
                <span className="font-mono font-bold text-[#a78bfa]">
                  {transactions?.[0] ? `-$${transactions[0].amount.toFixed(2)}` : '$0.00'}
                </span>
              </div>
            )}
          </div>

          {/* Acciones principales y contextuales */}
          <div className="space-y-2.5 pt-1">
            {/* Botón Principal: Violeta Kage #8b5cf6 */}
            <button
              type="button"
              aria-label={`Abrir ${currentItem.label} y descender al sistema`}
              onClick={() => handleNavigateAndScroll(currentItem.actionTarget)}
              className="w-full sm:w-auto h-10 px-5 rounded-lg bg-[#8b5cf6] hover:bg-[#9b6ff7] text-white font-sans font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
            >
              <span>Abrir en el Sistema</span>
              <ArrowDown className="w-3.5 h-3.5 text-white animate-bounce" />
            </button>

            {/* Acciones secundarias con borde hairline */}
            <div className="flex items-center gap-2 pt-1">
              {currentItem.id === 'dashboard' && (
                activeSession ? (
                  <button
                    type="button"
                    onClick={handleStopParking}
                    className="py-1.5 px-3.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square size={12} />
                    <span>Liberar Lugar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartParking}
                    className="py-1.5 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play size={12} className="text-[#a78bfa]" />
                    <span>Iniciar Estancia</span>
                  </button>
                )
              )}

              {currentItem.id === 'recharge' && (
                <div className="flex items-center gap-1.5">
                  {[100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickRechargeAmt(amt)}
                      className="py-1 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-mono text-xs font-semibold transition cursor-pointer"
                    >
                      +${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={onOpenRecharge}
                    className="py-1 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#a78bfa] text-xs font-semibold transition cursor-pointer"
                  >
                    Otro
                  </button>
                </div>
              )}

              {currentItem.id === 'autopay' && (
                <button
                  type="button"
                  onClick={handleToggleAutoPay}
                  className="py-1.5 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap size={12} className="text-[#a78bfa]" />
                  <span>{autoPay?.enabled ? 'Pausar Autocobro' : 'Activar Autocobro'}</span>
                </button>
              )}

              {currentItem.id === 'qr-credential' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPlates}
                    className="py-1.5 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-[#a78bfa]" /> : <Copy size={12} />}
                    <span>{copied ? 'Copiado' : 'Copiar Placas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenQR}
                    className="py-1.5 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wifi size={12} className="rotate-90 text-[#a78bfa]" />
                    <span>Ver NFC</span>
                  </button>
                </div>
              )}

              {currentItem.id === 'parking-map' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('dashboard')}
                  className="py-1.5 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin size={12} className="text-[#a78bfa]" />
                  <span>Ver Mapa en Panel</span>
                </button>
              )}

              {currentItem.id === 'vehicle' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('vehicle')}
                  className="py-1.5 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Car size={12} className="text-[#a78bfa]" />
                  <span>Editar Vehículo</span>
                </button>
              )}

              {currentItem.id === 'history' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('history')}
                  className="py-1.5 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <History size={12} className="text-[#a78bfa]" />
                  <span>Ver Todos los Recibos</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ═══ COLUMNA DERECHA: OPTIONWHEEL 3D SOBRE LIENZO OSCURO KAGE ═══ */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          
          <div 
            className="w-full h-[220px] sm:h-[360px] md:h-[400px] relative bg-transparent border-0 shadow-none overflow-hidden"
          >
            <OptionWheel
              items={MENU_ITEMS}
              selectedIndex={selectedIndex}
              onChange={handleWheelChange}
              onSelect={(idx, item) => handleNavigateAndScroll(item.actionTarget)}
              textColor="#71717a"
              activeColor="#ffffff"
              side={isMobile ? 'left' : 'left'}
              fontSize={isMobile ? 1.05 : 2.0}
              spacing={isMobile ? 1.28 : 1.6}
              curve={isMobile ? 0.72 : 0.88}
              tilt={isMobile ? 4.2 : 5.6}
              blur={2.8}
              fade={0.38}
              minOpacity={0.08}
              smoothing={45}
              inset={isMobile ? 8 : 32}
              loop={true}
              draggable={true}
              renderItem={(item, isSelected) => {
                const ItemIcon = item?.icon || Sparkles;
                return (
                  <span className="inline-flex items-center gap-2 sm:gap-4 transition-all duration-200">
                    <span 
                      className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-all duration-200 ${
                        isSelected 
                          ? 'bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.5)] scale-105 sm:scale-110' 
                          : 'bg-white/[0.04] text-[#71717a]'
                      }`}
                    >
                      {ItemIcon && <ItemIcon size={isMobile ? 12 : 16} />}
                    </span>
                    <span className={`tracking-tight ${isSelected ? 'font-bold text-white' : 'font-medium text-[#71717a]'}`}>
                      {item.label}
                    </span>
                  </span>
                );
              }}
            />
          </div>

          {/* Controles de navegación y acceso al sistema */}
          <div className="flex items-center justify-between w-full px-2 pt-2 text-[11px] font-sans">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Opción anterior"
                onClick={() => {
                  const newIdx = (selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
                  handleWheelChange(newIdx, MENU_ITEMS[newIdx]);
                }}
                className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] flex items-center justify-center transition-colors cursor-pointer"
                title="Opción anterior"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                aria-label="Opción siguiente"
                onClick={() => {
                  const newIdx = (selectedIndex + 1) % MENU_ITEMS.length;
                  handleWheelChange(newIdx, MENU_ITEMS[newIdx]);
                }}
                className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#e4e4e7] flex items-center justify-center transition-colors cursor-pointer"
                title="Opción siguiente"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleNavigateAndScroll(currentItem.actionTarget)}
              className="text-[#a1a1aa] hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Descender al sistema</span>
              <ChevronDown size={14} className="text-[#a78bfa]" />
            </button>
          </div>

        </div>

      </div>

    </section>
  );
};

export default OrbitalWheelMenu;
