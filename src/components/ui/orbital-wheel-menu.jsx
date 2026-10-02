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
  CreditCard,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Check,
  Copy,
  ExternalLink,
  Sliders,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  HeartHandshake,
} from 'lucide-react';
import { PlugConnectedIcon } from '../icons';
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
  {
    id: 'accessibility',
    label: 'Inclusión & Accesibilidad',
    shortLabel: 'Accesibilidad',
    category: 'UNIVERSAL WCAG',
    icon: HeartHandshake,
    actionTarget: 'accessibility',
    badge: 'INCLUSIVO',
    description: 'Alto contraste, lectores de pantalla, subtítulos y navegación adaptada.'
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
    
    // Desplazamiento fluido hacia abajo al sistema interactivo
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
      className={`w-full bg-transparent border-0 shadow-none relative py-3 sm:py-6 font-sans ${className}`}
    >
      {/* ═══ ENCABEZADO MINIMALISTA TOTALMENTE TRANSPARENTE ═══ */}
      <div className="flex items-center justify-between gap-4 mb-2 sm:mb-4">
        {/* Toggle de música y efectos sonoros interactivos */}
        <button
          type="button"
          aria-label={soundActive ? 'Silenciar música de giros' : 'Activar música de giros'}
          onClick={handleToggleSound}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-700 hover:text-black transition-all text-[11px] font-sans font-semibold cursor-pointer shadow-sm active:scale-95"
          title={soundActive ? 'Música interactiva activa al girar' : 'Activar música en movimientos'}
        >
          {soundActive ? (
            <>
              <Volume2 size={13} className="text-black" />
              <span>Música Activa</span>
            </>
          ) : (
            <>
              <VolumeX size={13} className="text-slate-400" />
              <span className="text-slate-500">Silenciado</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <span className="font-bold text-slate-900">0{selectedIndex + 1}</span>
          <span>/</span>
          <span>0{MENU_ITEMS.length}</span>
        </div>
      </div>

      {/* ═══ ESCENARIO PRINCIPAL: CONTENIDO TRANSPARENTE + OPTIONWHEEL 3D ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-center">
        
        {/* ═══ COLUMNA IZQUIERDA: DETALLES DE LA FUNCIÓN (TOTALMENTE TRANSPARENTE, SIN BORDES) ═══ */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-5">
          
          {/* Categoría y Badge de Estado */}
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-700">
              {currentItem.category}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              • {currentItem.badge}
            </span>
          </div>

          {/* Icono y Título */}
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm shrink-0">
                {CurrentIcon && <CurrentIcon className="w-5 h-5 text-white" />}
              </div>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-950 font-sans tracking-tight">
                {currentItem.label}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans max-w-md">
              {currentItem.description}
            </p>
          </div>

          {/* Fila de Datos en Vivo (Limpia, con divisores sutiles) */}
          <div className="py-3 border-y border-slate-100 font-sans text-xs">
            {currentItem.id === 'dashboard' && (
              activeSession ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Tiempo de Estancia</div>
                    <div className="font-mono font-black text-slate-950 text-base">
                      {formatTimeFromSeconds(activeSession.secondsElapsed)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Costo Acumulado</div>
                    <div className="font-mono font-black text-emerald-600 text-base">
                      ${activeSession.currentCost.toFixed(2)} MXN
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Estatus Parquímetro</div>
                    <div className="font-bold text-slate-900">Listo para Estacionar</div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-500">$0.25/min</span>
                </div>
              )
            )}

            {currentItem.id === 'recharge' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Saldo Disponible</div>
                  <div className="font-mono font-black text-slate-950 text-base">
                    ${Number(card?.balance ?? 0).toFixed(2)} MXN
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                  ACTIVO
                </span>
              </div>
            )}

            {currentItem.id === 'autopay' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Estado Autocobro</div>
                  <div className="font-bold text-slate-900">
                    {autoPay?.enabled ? 'Débito Activo' : 'Modalidad Pausada'}
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  autoPay?.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {autoPay?.enabled ? 'VIGENTE' : 'PAUSADO'}
                </span>
              </div>
            )}

            {currentItem.id === 'qr-credential' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Placas Asignadas</div>
                  <div className="font-mono font-bold text-slate-900">{vehicle?.plates || 'JNZ-4821'}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold">
                  AES-256
                </span>
              </div>
            )}

            {currentItem.id === 'parking-map' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Ubicación GPS</div>
                  <div className="font-bold text-slate-900">Centro Histórico • Zona A</div>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  EN VIVO
                </span>
              </div>
            )}

            {currentItem.id === 'vehicle' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Vehículo Registrado</div>
                  <div className="font-bold text-slate-900">
                    {vehicle?.model || 'Nissan Versa'} ({vehicle?.plates || 'JNZ-4821'})
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold">
                  VALIDADO
                </span>
              </div>
            )}

            {currentItem.id === 'history' && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Último Movimiento</div>
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

          {/* Acciones principales y contextuales */}
          <div className="space-y-2.5 pt-1">
            {/* Botón Principal: Abrir en el Sistema con Scroll */}
            <button
              type="button"
              aria-label={`Abrir ${currentItem.label} y descender al sistema`}
              onClick={() => handleNavigateAndScroll(currentItem.actionTarget)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-black hover:bg-slate-800 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <span>Abrir en el Sistema</span>
              <ArrowDown className="w-3.5 h-3.5 text-white animate-bounce" />
            </button>

            {/* Acciones secundarias transparentes / pills sutiles */}
            <div className="flex items-center gap-2 pt-1">
              {currentItem.id === 'dashboard' && (
                activeSession ? (
                  <button
                    type="button"
                    onClick={handleStopParking}
                    className="py-1.5 px-3.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square size={12} />
                    <span>Liberar Lugar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartParking}
                    className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play size={12} />
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
                      className="py-1 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-black font-mono text-xs font-bold transition cursor-pointer"
                    >
                      +${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={onOpenRecharge}
                    className="py-1 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                  >
                    Otro
                  </button>
                </div>
              )}

              {currentItem.id === 'autopay' && (
                <button
                  type="button"
                  onClick={handleToggleAutoPay}
                  className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap size={12} />
                  <span>{autoPay?.enabled ? 'Pausar Autocobro' : 'Activar Autocobro'}</span>
                </button>
              )}

              {currentItem.id === 'qr-credential' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPlates}
                    className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copiado' : 'Copiar Placas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenQR}
                    className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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
                  className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin size={12} />
                  <span>Ver Mapa en Panel</span>
                </button>
              )}

              {currentItem.id === 'vehicle' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('vehicle')}
                  className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Car size={12} />
                  <span>Editar Vehículo</span>
                </button>
              )}

              {currentItem.id === 'history' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('history')}
                  className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <History size={12} />
                  <span>Ver Todos los Recibos</span>
                </button>
              )}

              {currentItem.id === 'accessibility' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('accessibility')}
                  className="py-1.5 px-3.5 rounded-full bg-black text-white hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <HeartHandshake size={12} />
                  <span>Configurar Accesibilidad</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ═══ COLUMNA DERECHA: OPTIONWHEEL 3D TOTALMENTE TRANSPARENTE (SIN CAJAS NI BORDES) ═══ */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          
          {/* Contenedor del OptionWheel 100% transparente sin bordes ni sombras de caja */}
          <div 
            className="w-full h-[300px] sm:h-[360px] md:h-[400px] relative bg-transparent border-0 shadow-none overflow-hidden"
          >
            {/* Componente OptionWheel de React Bits con difuminado infinito sobre blanco */}
            <OptionWheel
              items={MENU_ITEMS}
              selectedIndex={selectedIndex}
              onChange={handleWheelChange}
              onSelect={(idx, item) => handleNavigateAndScroll(item.actionTarget)}
              textColor="#94a3b8"
              activeColor="#020617"
              side={isMobile ? 'left' : 'left'}
              fontSize={isMobile ? 1.35 : 2.0}
              spacing={isMobile ? 1.45 : 1.6}
              curve={isMobile ? 0.75 : 0.88}
              tilt={isMobile ? 4.5 : 5.6}
              blur={2.8}
              fade={0.38}
              minOpacity={0.06}
              smoothing={45}
              inset={isMobile ? 16 : 32}
              loop={true}
              draggable={true}
              renderItem={(item, isSelected) => {
                const ItemIcon = item?.icon || Sparkles;
                return (
                  <span className="inline-flex items-center gap-3 sm:gap-4 transition-all duration-200">
                    <span 
                      className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-200 ${
                        isSelected 
                          ? 'bg-black text-white shadow-sm scale-110' 
                          : 'bg-transparent text-slate-400'
                      }`}
                    >
                      {ItemIcon && <ItemIcon size={isMobile ? 14 : 16} />}
                    </span>
                    <span className={`tracking-tight ${isSelected ? 'font-black text-slate-950' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </span>
                );
              }}
            />
          </div>

          {/* Controles de navegación y acceso al sistema (sin textos invasivos) */}
          <div className="flex items-center justify-between w-full px-2 pt-2 text-[11px] font-sans">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Opción anterior"
                onClick={() => {
                  const newIdx = (selectedIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
                  handleWheelChange(newIdx, MENU_ITEMS[newIdx]);
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
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
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Opción siguiente"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleNavigateAndScroll(currentItem.actionTarget)}
              className="text-slate-600 hover:text-black font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Descender al sistema</span>
              <ChevronDown size={14} />
            </button>
          </div>

        </div>

      </div>

    </section>
  );
};

export default OrbitalWheelMenu;
