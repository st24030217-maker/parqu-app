import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParking } from '../../context/ParkingContext';
import { sileo } from 'sileo';
import {
  Play,
  Square,
  RefreshCw,
  Zap,
  QrCode,
  MapPin,
  Car,
  History,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { CurrencyDollarIcon } from '../icons/currency-dollar-icon';

function formatPlate(raw = '') {
  const clean = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
}

function formatTimeFromSeconds(totalSecs = 0) {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const ORBIT_ITEMS = [
  {
    id: 'dashboard',
    label: 'Tarjeta & Parquímetro',
    shortLabel: 'Parquímetro',
    category: 'ESTANCIA',
    icon: Play,
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    actionTarget: 'dashboard',
  },
  {
    id: 'recharge',
    label: 'Recarga Inmediata',
    shortLabel: 'Recarga',
    category: 'MONEDERO',
    icon: CurrencyDollarIcon,
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    actionTarget: 'recharge',
  },
  {
    id: 'autopay',
    label: 'Autocobro Inteligente',
    shortLabel: 'Autocobro',
    category: 'DÉBITO VIAL',
    icon: Zap,
    color: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    actionTarget: 'autopay',
  },
  {
    id: 'qr-credential',
    label: 'Credencial QR Oficial',
    shortLabel: 'Pase QR',
    category: 'INSPECCIÓN',
    icon: QrCode,
    color: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    actionTarget: 'qr-credential',
  },
  {
    id: 'parking-map',
    label: 'Mapa Satelital GPS',
    shortLabel: 'Mapa GPS',
    category: 'UBICACIÓN',
    icon: MapPin,
    color: '#FB923C',
    glowColor: 'rgba(251, 146, 60, 0.45)',
    actionTarget: 'dashboard',
  },
  {
    id: 'vehicle',
    label: 'Padrón Vehicular',
    shortLabel: 'Vehículo',
    category: 'PADRÓN',
    icon: Car,
    color: '#F43F5E',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    actionTarget: 'vehicle',
  },
  {
    id: 'history',
    label: 'Historial de Cobros',
    shortLabel: 'Historial',
    category: 'BITÁCORA',
    icon: History,
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    actionTarget: 'history',
  },
];

function shortestAngularDiff(targetIndex, currentOffset, count = 7) {
  let diff = (targetIndex - currentOffset) % count;
  if (diff > count / 2) diff -= count;
  if (diff < -count / 2) diff += count;
  return diff;
}

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
    pinnedLocations = [],
    registerPinnedLocation,
    addBalance,
  } = useParking();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [orbitOffset, setOrbitOffset] = useState(0);
  const targetOffsetRef = useRef(0);
  const animFrameRef = useRef(null);

  // Detección reactiva de móvil para calibrar geometría
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Estados de arrastre y scroll táctil / rueda
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const wheelTimeoutRef = useRef(null);

  const [copied, setCopied] = useState(false);

  // Bucle de animación fluida con lerp y amortiguación
  const startAnimationLoop = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const step = () => {
      setOrbitOffset((current) => {
        const delta = targetOffsetRef.current - current;
        if (Math.abs(delta) < 0.005) {
          const nearest = Math.round(targetOffsetRef.current);
          const normalized = ((nearest % 7) + 7) % 7;
          setSelectedIndex(normalized);
          return targetOffsetRef.current;
        }
        animFrameRef.current = requestAnimationFrame(step);
        return current + delta * 0.22;
      });
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Rotar hacia un índice con la trayectoria angular más corta (módulo 7)
  const rotateToIndex = useCallback(
    (targetIdx) => {
      const currentNorm = ((Math.round(targetOffsetRef.current) % 7) + 7) % 7;
      let diff = targetIdx - currentNorm;
      if (diff > 3.5) diff -= 7;
      if (diff < -3.5) diff += 7;

      targetOffsetRef.current = Math.round(targetOffsetRef.current) + diff;
      setSelectedIndex(targetIdx);
      startAnimationLoop();
    },
    [startAnimationLoop]
  );

  // Sincronizar índice cuando activeTab cambia externamente
  useEffect(() => {
    if (!activeTab) return;
    const foundIndex = ORBIT_ITEMS.findIndex(
      (item) => item.actionTarget === activeTab && item.id !== 'parking-map'
    );
    if (foundIndex !== -1 && foundIndex !== selectedIndex) {
      rotateToIndex(foundIndex);
    }
  }, [activeTab]);

  // Manejo de scroll con rueda del ratón y trackpad
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const stepDelta = e.deltaY > 0 ? 1 : -1;
      targetOffsetRef.current = targetOffsetRef.current + stepDelta;

      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);

      wheelTimeoutRef.current = setTimeout(() => {
        const nearest = Math.round(targetOffsetRef.current);
        targetOffsetRef.current = nearest;
        const normalized = ((nearest % 7) + 7) % 7;
        setSelectedIndex(normalized);
      }, 130);

      startAnimationLoop();
    },
    [startAnimationLoop]
  );

  // Manejo de arrastre táctil (touch swipe) y ratón (drag)
  const handlePointerDown = useCallback((e) => {
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartOffsetRef.current = targetOffsetRef.current;
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const dy = e.clientY - dragStartYRef.current;
      const stepSize = isMobile ? 55 : 70;
      targetOffsetRef.current = dragStartOffsetRef.current - dy / stepSize;
      startAnimationLoop();
    },
    [isDragging, isMobile, startAnimationLoop]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDragging) return;
      setIsDragging(false);
      const nearest = Math.round(targetOffsetRef.current);
      targetOffsetRef.current = nearest;
      const normalized = ((nearest % 7) + 7) % 7;
      setSelectedIndex(normalized);
      startAnimationLoop();
    },
    [isDragging, startAnimationLoop]
  );

  const handlePrev = useCallback(() => {
    targetOffsetRef.current = Math.round(targetOffsetRef.current) - 1;
    startAnimationLoop();
  }, [startAnimationLoop]);

  const handleNext = useCallback(() => {
    targetOffsetRef.current = Math.round(targetOffsetRef.current) + 1;
    startAnimationLoop();
  }, [startAnimationLoop]);

  const currentItem = ORBIT_ITEMS[selectedIndex] || ORBIT_ITEMS[0];
  const CurrentIcon = currentItem.icon;

  // Acciones operativas
  const handleStartParking = useCallback(() => {
    startParking('Centro Histórico • Espacio #1042', 0.25);
    sileo.success({
      title: 'Parquímetro Activado',
      description: 'Estancia iniciada. Tarifa regulada $0.25 MXN/min.',
    });
  }, [startParking]);

  const handleStopParking = useCallback(() => {
    const receipt = stopParkingAndAutoCharge();
    sileo.success({
      title: 'Parquímetro Finalizado',
      description: receipt
        ? `Cobro de $${receipt.totalAmount.toFixed(2)} MXN registrado.`
        : 'Estancia finalizada con éxito.',
    });
  }, [stopParkingAndAutoCharge]);

  const handleInstantRecharge = useCallback(
    (amount) => {
      addBalance(amount);
      sileo.success({
        title: 'Recarga Inmediata Exitosa',
        description: `Se han añadido $${amount}.00 MXN a tu tarjeta Parqu.`,
      });
    },
    [addBalance]
  );

  const handleToggleAutoPay = useCallback(() => {
    const nextState = !autoPay?.enabled;
    updateAutoPay({ enabled: nextState });
    if (nextState) {
      sileo.success({
        title: 'Autocobro Activado',
        description: 'Débito automático regulado por segundo activo.',
      });
    } else {
      sileo.info({
        title: 'Autocobro Pausado',
        description: 'Recuerda finalizar tus estancias manualmente.',
      });
    }
  }, [autoPay, updateAutoPay]);

  const handlePinCurrentLocation = useCallback(() => {
    const loc = registerPinnedLocation({
      latitude: 19.4326,
      longitude: -99.1332,
      label: 'Mi Vehículo Estacionado',
      address: 'Av. Juárez #42, Centro Histórico',
    });
    sileo.success({
      title: 'Ubicación Satelital Fijada',
      description: loc.address,
    });
  }, [registerPinnedLocation]);

  const handleToggleVehicle = useCallback(() => {
    const isJetta = vehicle?.plates === 'XYZ-7842';
    const next = isJetta
      ? { plates: 'ABC-1234', brand: 'Mazda', model: '3 Sedán', color: 'Rojo Carmesí' }
      : { plates: 'XYZ-7842', brand: 'Volkswagen', model: 'Jetta Sport', color: 'Gris Platino' };

    updateVehicle(next);
    sileo.info({
      title: 'Vehículo Alternado',
      description: `Activo: ${next.plates} • ${next.brand} ${next.model}`,
    });
  }, [vehicle, updateVehicle]);

  const handleCopyPlates = useCallback(() => {
    const plates = vehicle?.plates || 'XYZ-7842';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(plates);
      setCopied(true);
      sileo.success({ title: 'Placas Copiadas', description: plates });
      setTimeout(() => setCopied(false), 2000);
    }
  }, [vehicle]);

  // Geometría reactiva para 7 ítems sin desbordes
  const dialHeight = isMobile ? 320 : 400;
  const centerY = dialHeight / 2;
  const orbitRadius = isMobile ? 115 : 160;
  const centerX = isMobile ? 185 : 240;
  const angleStepRad = isMobile ? 0.52 : 0.46;

  return (
    <div className={`w-full bg-transparent border-0 shadow-none font-sans relative select-none ${className}`}>
      
      {/* Resplandor ambiental de fondo (Sin bordes, 100% transparente) */}
      <div
        className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[540px] h-[300px] sm:h-[380px] rounded-full blur-[110px] pointer-events-none transition-colors duration-700 opacity-20"
        style={{ backgroundColor: currentItem.color }}
      />

      {/* ═══ 1. ENCABEZADO MINIMALISTA: SOLO ACCIONES RÁPIDAS ═══ */}
      <div className="flex items-center gap-2 pb-2">
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: currentItem.color }}
        />
        <h3 className="font-sans font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
          Acciones Rápidas
        </h3>
      </div>

      {/* ═══ 2. ESCENARIO VERTICAL: CONTENIDO DENTRO DEL SEMICÍRCULO + RULETA (ADAPTADO A MÓVIL Y ESCRITORIO) ═══ */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 min-h-[340px] lg:min-h-[420px] relative py-2">
        
        {/* ═══ DETALLES DE LA OPCIÓN SELECCIONADA (PROYECTADA DENTRO DEL SEMICÍRCULO) ═══ */}
        <div className="w-full lg:w-3/5 flex flex-col justify-center items-center lg:items-start text-center lg:text-left px-2 sm:px-4 z-20">
          <div
            key={currentItem.id}
            className="flex flex-col items-center lg:items-start max-w-lg w-full animate-in fade-in zoom-in-95 duration-250"
          >
            
            {/* Categoría e índice flotante (7 módulos) */}
            <div
              className="flex items-center gap-2 mb-2 font-mono text-[10px] sm:text-[11px] font-bold tracking-widest uppercase"
              style={{ color: currentItem.color }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: currentItem.color }}
              />
              <span>{currentItem.category}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono">0{selectedIndex + 1} / 07</span>
            </div>

            {/* Icono central de gran tamaño con aura flotante */}
            <div
              className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center mb-2.5 transition-all duration-500 bg-white border border-slate-200 shadow-md text-black"
            >
              <CurrentIcon className="w-7 h-7 sm:w-9 sm:h-9 text-black drop-shadow-sm" />
            </div>

            {/* Título de la opción seleccionada */}
            <h4 className="font-sans font-black text-xl sm:text-3xl text-black tracking-tight drop-shadow-sm mb-2">
              {currentItem.label}
            </h4>

            {/* Datos en vivo específicos del módulo */}
            <div className="min-h-[38px] flex items-center text-xs sm:text-sm font-mono text-slate-700 mb-3.5">
              {/* 1. Parquímetro */}
              {currentItem.id === 'dashboard' && (
                activeSession ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-600 text-sm sm:text-base">
                      {formatTimeFromSeconds(activeSession.secondsElapsed)}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-600 font-bold">
                      ${activeSession.currentCost.toFixed(2)} MXN
                    </span>
                  </div>
                ) : (
                  <span className="text-emerald-700 font-sans font-semibold">
                    Listo para Estacionar • Tarifa $0.25/min
                  </span>
                )
              )}

              {/* 2. Recarga */}
              {currentItem.id === 'recharge' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Saldo en tarjeta:</span>
                  <span className="text-black font-black text-sm sm:text-base">
                    ${Number(card?.balance ?? 0).toFixed(2)} MXN
                  </span>
                </div>
              )}

              {/* 3. Autocobro */}
              {currentItem.id === 'autopay' && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-800">{autoPay?.bank || 'Santander Platinum •••• 8821'}</span>
                  <span className="text-slate-300">•</span>
                  <span className={autoPay?.enabled ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {autoPay?.enabled ? 'Autocobro Activo' : 'Autocobro Pausado'}
                  </span>
                </div>
              )}

              {/* 4. Pase QR */}
              {currentItem.id === 'qr-credential' && (
                <div className="flex items-center gap-2">
                  <span className="text-black font-bold tracking-wider font-mono">{formatPlate(vehicle?.plates)}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sky-700 font-semibold">Validado Oficial AES-256</span>
                </div>
              )}

              {/* 5. Mapa GPS */}
              {currentItem.id === 'parking-map' && (
                <span className="text-slate-700">
                  {pinnedLocations.length} espacio(s) guardado(s) • Centro Histórico
                </span>
              )}

              {/* 6. Vehículo */}
              {currentItem.id === 'vehicle' && (
                <span className="text-slate-800">
                  {vehicle?.brand || 'Volkswagen'} {vehicle?.model || 'Jetta'} ({formatPlate(vehicle?.plates)})
                </span>
              )}

              {/* 7. Historial */}
              {currentItem.id === 'history' && (
                <span className="text-slate-700">
                  {transactions?.length || 0} recibos auditados • Folio: {transactions?.[0]?.folio || 'PQM-88A2'}
                </span>
              )}
            </div>

            {/* ═══ BOTONES DE ACCIÓN (ESTILO ELEGANTE Y LEGIBLE EN BLANCO) ═══ */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              
              {/* Acción Parquímetro */}
              {currentItem.id === 'dashboard' && (
                activeSession ? (
                  <button
                    type="button"
                    aria-label="Finalizar estancia en parquímetro"
                    onClick={handleStopParking}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <Square className="w-3.5 h-3.5 fill-current text-white" />
                    <span>Finalizar Parquímetro</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Iniciar estancia en parquímetro"
                    onClick={handleStartParking}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-white" />
                    <span>Iniciar Parquímetro</span>
                  </button>
                )
              )}

              {/* Acción Recarga */}
              {currentItem.id === 'recharge' && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {[50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      aria-label={`Recargar ${amt} pesos al monedero`}
                      onClick={() => handleInstantRecharge(amt)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-black font-mono text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
                    >
                      +${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Recargar otro monto"
                    onClick={onOpenRecharge}
                    className="px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-sans text-xs font-bold transition cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
                  >
                    Otro Monto
                  </button>
                </div>
              )}

              {/* Acción Autocobro */}
              {currentItem.id === 'autopay' && (
                <button
                  type="button"
                  aria-label={autoPay?.enabled ? 'Pausar modalidad de autocobro' : 'Activar modalidad de autocobro'}
                  onClick={handleToggleAutoPay}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs sm:text-sm font-sans font-bold flex items-center gap-1.5 transition cursor-pointer text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <Zap className="w-3.5 h-3.5 text-black" />
                  <span className={autoPay?.enabled ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                    {autoPay?.enabled ? 'Pausar Autocobro' : 'Activar Autocobro'}
                  </span>
                </button>
              )}

              {/* Acción Pase QR */}
              {currentItem.id === 'qr-credential' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Copiar placas del vehículo al portapapeles"
                    onClick={handleCopyPlates}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-black font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                    <span>{copied ? 'Copiado' : 'Copiar Placas'}</span>
                  </button>

                  <button
                    type="button"
                    aria-label="Abrir credencial QR oficial para inspección"
                    onClick={onOpenQR}
                    className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    <QrCode className="w-3.5 h-3.5 text-white" />
                    <span>Abrir Pase QR</span>
                  </button>
                </div>
              )}

              {/* Acción Mapa GPS */}
              {currentItem.id === 'parking-map' && (
                <button
                  type="button"
                  aria-label="Fijar mi ubicación GPS actual aquí"
                  onClick={handlePinCurrentLocation}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-black font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-black" />
                  <span>Fijar Aquí mi Lugar</span>
                </button>
              )}

              {/* Acción Vehículo */}
              {currentItem.id === 'vehicle' && (
                <button
                  type="button"
                  aria-label="Alternar vehículo activo"
                  onClick={handleToggleVehicle}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-black font-sans text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-black" />
                  <span>Alternar Vehículo</span>
                </button>
              )}

              {/* Acción Historial */}
              {currentItem.id === 'history' && (
                <button
                  type="button"
                  aria-label="Ver historial completo de cobros"
                  onClick={() => onSelectTab('history')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-black font-sans text-xs sm:text-sm font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Ver Historial Completo
                </button>
              )}

              {/* Enlace al módulo completo */}
              <button
                type="button"
                aria-label={`Ir al módulo completo de ${currentItem.label}`}
                onClick={() => onSelectTab(currentItem.actionTarget)}
                className="px-3.5 py-2 rounded-xl text-xs font-sans font-bold text-black bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                title="Abrir módulo completo"
              >
                <span>Ir al Módulo</span>
                <ChevronRight className="w-3.5 h-3.5 text-black" />
              </button>

            </div>

          </div>
        </div>

        {/* ═══ RULETA VERTICAL EN SEMICÍRCULO FLOTANTE (100% LIMPIA, SIN LÍNEAS NI BORDES) ═══ */}
        <div
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ height: `${dialHeight}px` }}
          className="w-full lg:w-2/5 relative flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none overflow-hidden"
          title="Scroll con la rueda o arrastra para rotar el semicírculo vertical"
        >
          
          {/* Botones de navegación vertical sutiles */}
          <div className="absolute right-1 sm:right-3 top-1 sm:top-2 z-40 flex flex-col gap-1">
            <button
              type="button"
              aria-label="Módulo anterior"
              onClick={handlePrev}
              className="w-7 h-7 rounded-full bg-white border border-slate-200 text-black hover:bg-slate-50 flex items-center justify-center transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              title="Anterior"
            >
              <ChevronUp className="w-4 h-4 text-black" />
            </button>
            <button
              type="button"
              aria-label="Módulo siguiente"
              onClick={handleNext}
              className="w-7 h-7 rounded-full bg-white border border-slate-200 text-black hover:bg-slate-50 flex items-center justify-center transition shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              title="Siguiente"
            >
              <ChevronDown className="w-4 h-4 text-black" />
            </button>
          </div>

          {/* Elementos orbitando verticalmente (7 módulos con iconos y letras en negro) */}
          <div className="w-full h-full relative pointer-events-none">
            {ORBIT_ITEMS.map((item, index) => {
              const diff = shortestAngularDiff(index, orbitOffset, 7);
              const absDiff = Math.abs(diff);

              if (absDiff > 2.5) return null;

              const angle = Math.PI - diff * angleStepRad;
              const iconX = centerX + orbitRadius * Math.cos(angle);
              const iconY = centerY + orbitRadius * Math.sin(angle);

              const opacity = Math.max(0, 1 - Math.pow(absDiff / 2.5, 1.5));
              const scale = Math.max(0.72, 1 - absDiff * 0.08);
              const isSelected = absDiff < 0.45;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Seleccionar módulo: ${item.label}`}
                  onClick={() => rotateToIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      rotateToIndex(index);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${iconX}px`,
                    top: `${iconY}px`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    opacity,
                    zIndex: isSelected ? 30 : 20 - Math.round(absDiff * 2),
                  }}
                  className="pointer-events-auto flex items-center gap-2 cursor-pointer transition-transform duration-150 group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {/* Icono del nodo vertical en negro */}
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: isSelected ? '#FFFFFF' : '#F1F5F9',
                      color: '#000000',
                      border: isSelected ? '2px solid #000000' : '1px solid #CBD5E1',
                      boxShadow: isSelected ? '0 4px 16px rgba(0,0,0,0.12)' : '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-black transition-transform group-hover:scale-110" />
                  </div>

                  {/* Etiqueta limpia del nodo activo con letras en negro */}
                  {isSelected && (
                    <div
                      className="px-3 py-1 rounded-full text-xs font-sans font-black whitespace-nowrap shadow-md text-black bg-white border border-slate-200"
                    >
                      {item.shortLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};

export default OrbitalWheelMenu;
