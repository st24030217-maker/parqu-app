'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParking } from '../../context/ParkingContext';
import { sileo } from 'sileo';
import { InfiniteMenu } from './InfiniteMenu';
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
  Globe,
  Disc,
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
    description: 'Control de estancia segundo a segundo, saldo y contador inteligente.',
    palette: ['#01033E', '#0033FF', '#38bdf8'],
    tileCode: '01',
    tileSub: '$6.00 / HR',
  },
  {
    id: 'recharge',
    label: 'Recarga Inmediata',
    shortLabel: 'Recarga Saldo',
    category: 'MONEDERO DIGITAL',
    icon: CreditCard,
    actionTarget: 'recharge',
    badge: 'EXPRESS',
    description: 'Añade saldo instantáneo a tu tarjeta virtual sin comisiones.',
    palette: ['#022c22', '#059669', '#34d399'],
    tileCode: '02',
    tileSub: 'SIN COMISIÓN',
  },
  {
    id: 'autopay',
    label: 'Autocobro Inteligente',
    shortLabel: 'Modo Autocobro',
    category: 'DÉBITO CONTINUO',
    icon: Zap,
    actionTarget: 'autopay',
    badge: '0 FILAS',
    description: 'Debitado automático continuo a $6.00/hr sin boletos físicos.',
    palette: ['#090d16', '#312e81', '#f59e0b'],
    tileCode: '03',
    tileSub: 'DÉBITO AUTO',
  },
  {
    id: 'qr-credential',
    label: 'Credencial NFC Oficial',
    shortLabel: 'Pase NFC Contactless',
    category: 'INSPECCIÓN VIAL',
    icon: Wifi,
    actionTarget: 'qr-credential',
    badge: 'NFC AES-256',
    description: 'Presenta tu pase NFC contactless ante oficiales de tránsito.',
    palette: ['#001a66', '#0284c7', '#7dd3fc'],
    tileCode: '04',
    tileSub: 'NFC AES-256',
  },
  {
    id: 'parking-map',
    label: 'Mapa Satelital GPS',
    shortLabel: 'Ubicación & Rutas',
    category: 'GEOLOCALIZACIÓN',
    icon: MapPin,
    actionTarget: 'dashboard',
    badge: 'EN VIVO',
    description: 'Fija el espacio de tu automóvil o navega por los cajones disponibles.',
    palette: ['#0f172a', '#0d9488', '#2dd4bf'],
    tileCode: '05',
    tileSub: 'GPS & RUTAS 3D',
  },
  {
    id: 'vehicle',
    label: 'Padrón Vehicular',
    shortLabel: 'Datos de Vehículo',
    category: 'REGISTRO MUNICIPAL',
    icon: Car,
    actionTarget: 'vehicle',
    badge: 'OFICIAL',
    description: 'Consulta y actualiza placas, modelo y conductor registrado.',
    palette: ['#18181b', '#334155', '#94a3b8'],
    tileCode: '06',
    tileSub: 'PLACAS & DATOS',
  },
  {
    id: 'history',
    label: 'Historial de Cobros',
    shortLabel: 'Bitácora de Pagos',
    category: 'AUDITORÍA',
    icon: History,
    actionTarget: 'history',
    badge: 'AUDITABLE',
    description: 'Registro histórico y recibos foliados con hora y costo exacto.',
    palette: ['#1e1b4b', '#4338ca', '#a5b4fc'],
    tileCode: '07',
    tileSub: 'FOLIOS OFICIALES',
  },
];

function drawTileIcon(ctx, id, cx, cy, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (id === 'dashboard') {
    // Play triangle + meter arc
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 20);
    ctx.lineTo(cx + 22, cy);
    ctx.lineTo(cx - 12, cy + 20);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'recharge') {
    // Credit card
    ctx.beginPath();
    ctx.roundRect(cx - 48, cy - 32, 96, 64, 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy - 10);
    ctx.lineTo(cx + 48, cy - 10);
    ctx.stroke();
    ctx.fillRect(cx - 32, cy + 8, 26, 10);
  } else if (id === 'autopay') {
    // Lightning bolt
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - 46);
    ctx.lineTo(cx - 28, cy + 4);
    ctx.lineTo(cx + 2, cy + 4);
    ctx.lineTo(cx - 6, cy + 46);
    ctx.lineTo(cx + 28, cy - 4);
    ctx.lineTo(cx - 2, cy - 4);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'qr-credential') {
    // Contactless waves
    for (let r = 18; r <= 48; r += 15) {
      ctx.beginPath();
      ctx.arc(cx - 16, cy, r, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx - 22, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'parking-map') {
    // Map pin
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 28, Math.PI, 0, false);
    ctx.bezierCurveTo(cx + 28, cy + 14, cx, cy + 44, cx, cy + 44);
    ctx.bezierCurveTo(cx, cy + 44, cx - 28, cy + 14, cx - 28, cy - 10);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'vehicle') {
    // Car front silhouette
    ctx.beginPath();
    ctx.roundRect(cx - 46, cy - 8, 92, 36, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 34, cy - 8);
    ctx.lineTo(cx - 22, cy - 32);
    ctx.lineTo(cx + 22, cy - 32);
    ctx.lineTo(cx + 34, cy - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 26, cy + 10, 6, 0, Math.PI * 2);
    ctx.arc(cx + 26, cy + 10, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // History clock
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 24);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 18, cy + 12);
    ctx.stroke();
  }
  ctx.restore();
}

function generateParquTileDataUrl(item) {
  if (typeof document === 'undefined') return '/card-designs/card-blue.png';
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '/card-designs/card-blue.png';

  const [c1, c2, accent] = item.palette || ['#01033E', '#0033FF', '#38bdf8'];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Radial glow
  const glow = ctx.createRadialGradient(size * 0.78, size * 0.22, 10, size * 0.78, size * 0.22, size * 0.65);
  glow.addColorStop(0, `${accent}55`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Subtle architectural grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 2;
  for (let p = 64; p < size; p += 64) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // Inner glass frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(28, 28, size - 56, size - 56, 44);
  ctx.stroke();

  // Top Header Pill: PARQU + Number
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.roundRect(56, 56, 150, 44, 22);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 22px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(`PARQU ${item.tileCode}`, 76, 79);

  // Status dot on top right
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(size - 76, 78, 12, 0, Math.PI * 2);
  ctx.fill();

  // Center circular icon emblem
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2 - 22, 86, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `${accent}99`;
  ctx.lineWidth = 3;
  ctx.stroke();

  drawTileIcon(ctx, item.id, size / 2, size / 2 - 22, '#ffffff');

  // Bottom Title & Subtitle
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '900 38px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(item.shortLabel.toUpperCase(), size / 2, size - 118);

  ctx.fillStyle = accent;
  ctx.font = '700 21px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText(item.tileSub || item.badge, size / 2, size - 72);

  return canvas.toDataURL('image/png');
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
  const [menuMode, setMenuMode] = useState('infinite'); // 'infinite' (@react-bits/InfiniteMenu-JS-CSS) | 'wheel'

  // Detección reactiva de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sincronizar índice si el tab activo cambia desde otra parte de la app
  useEffect(() => {
    if (!activeTab) return;
    const foundIdx = MENU_ITEMS.findIndex(
      (item) => item.actionTarget === activeTab && item.id !== 'parking-map'
    );
    if (foundIdx !== -1 && foundIdx !== selectedIndex) {
      setSelectedIndex(foundIdx);
    }
  }, [activeTab]);

  // Items formateados para @react-bits/InfiniteMenu-JS-CSS
  const infiniteMenuItems = useMemo(() => {
    return MENU_ITEMS.map((item) => ({
      ...item,
      image: generateParquTileDataUrl(item),
      title: item.shortLabel,
      description: item.description,
    }));
  }, []);

  const currentItem = MENU_ITEMS[selectedIndex] || MENU_ITEMS[0];
  const CurrentIcon = currentItem?.icon || Sparkles;

  // Acción principal: Abrir función y hacer scroll suave hacia abajo al sistema
  const handleNavigateAndScroll = useCallback((targetTab, itemId) => {
    triggerHaptic();
    if (itemId === 'recharge' && onOpenRecharge) {
      onOpenRecharge();
      return;
    }
    if (itemId === 'qr-credential' && onOpenQR) {
      onOpenQR();
      return;
    }
    onSelectTab?.(targetTab);

    // Desplazamiento fluido hacia abajo al sistema interactivo
    setTimeout(() => {
      const targetEl = document.getElementById('system-tabs-container') || document.getElementById('interactive-system');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, [onSelectTab, onOpenRecharge, onOpenQR]);

  const handleWheelChange = useCallback((idx) => {
    setSelectedIndex((prev) => {
      if (prev !== idx) {
        playMovementNote(idx, 0.85);
      }
      return idx;
    });
  }, []);

  const handleInfiniteActiveChange = useCallback((_item, idx) => {
    setSelectedIndex((prev) => {
      if (prev !== idx) {
        playMovementNote(idx, 0.85);
      }
      return idx;
    });
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
        description: 'Notas melódicas y acústicas en cada giro del menú 3D.'
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
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

          {/* Selector de vista: InfiniteMenu 3D Sphere vs OptionWheel */}
          <div className="inline-flex items-center rounded-full bg-slate-100/90 p-0.5 text-[11px] font-sans font-semibold shadow-sm">
            <button
              type="button"
              onClick={() => setMenuMode('infinite')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                menuMode === 'infinite'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Globe size={12} />
              <span>Infinite Sphere 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setMenuMode('wheel')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                menuMode === 'wheel'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <Disc size={12} />
              <span>Ruleta</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <span className="font-bold text-slate-900">0{selectedIndex + 1}</span>
          <span>/</span>
          <span>0{MENU_ITEMS.length}</span>
        </div>
      </div>

      {/* ═══ ESCENARIO PRINCIPAL: CONTENIDO TRANSPARENTE + INFINITEMENU 3D ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
        
        {/* ═══ COLUMNA IZQUIERDA: DETALLES DE LA FUNCIÓN (TOTALMENTE TRANSPARENTE, SIN BORDES) ═══ */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4 sm:space-y-5">
          
          {/* Categoría y Badge de Estado */}
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-700 border-0 shadow-sm">
              {currentItem.category}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              • {currentItem.badge}
            </span>
          </div>

          {/* Icono y Título */}
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-black text-white flex items-center justify-center border-0 shadow-md shrink-0">
                {CurrentIcon && <CurrentIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
              </div>
              <h4 className="text-xl sm:text-3xl font-black text-slate-950 font-sans tracking-tight">
                {currentItem.label}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-sans max-w-md">
              {currentItem.description}
            </p>
          </div>

          {/* Fila de Datos en Vivo (Limpia, con divisores sutiles) */}
          <div className="py-2 sm:py-3 font-sans text-xs border-0">
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
                  <span className="font-mono text-[11px] font-bold text-slate-500">$6.00/hr</span>
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
                  NFC AES-256
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
              onClick={() => handleNavigateAndScroll(currentItem.actionTarget, currentItem.id)}
              className="w-full sm:w-auto px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-0 shadow-md transition-all transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
                    className="py-1.5 px-3.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                  >
                    <Square size={12} />
                    <span>Liberar Lugar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartParking}
                    className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
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
                      className="py-1 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-black font-mono text-xs font-bold transition cursor-pointer border-0 shadow-sm"
                    >
                      +${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={onOpenRecharge}
                    className="py-1 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer border-0 shadow-sm"
                  >
                    Otro
                  </button>
                </div>
              )}

              {currentItem.id === 'autopay' && (
                <button
                  type="button"
                  onClick={handleToggleAutoPay}
                  className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
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
                    className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copiado' : 'Copiar Placas'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenQR}
                    className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                  >
                    <Wifi size={12} className="rotate-90" />
                    <span>Ver NFC</span>
                  </button>
                </div>
              )}

              {currentItem.id === 'parking-map' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('dashboard', 'parking-map')}
                  className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                >
                  <MapPin size={12} />
                  <span>Ver Mapa en Panel</span>
                </button>
              )}

              {currentItem.id === 'vehicle' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('vehicle', 'vehicle')}
                  className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                >
                  <Car size={12} />
                  <span>Editar Vehículo</span>
                </button>
              )}

              {currentItem.id === 'history' && (
                <button
                  type="button"
                  onClick={() => handleNavigateAndScroll('history', 'history')}
                  className="py-1.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
                >
                  <History size={12} />
                  <span>Ver Todos los Recibos</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ═══ COLUMNA DERECHA: @react-bits/InfiniteMenu-JS-CSS (ESFERA 3D WEBGL2) ═══ */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          {menuMode === 'infinite' ? (
            <div className="w-full h-[360px] sm:h-[440px] md:h-[480px] relative rounded-3xl overflow-hidden bg-transparent">
              <InfiniteMenu
                items={infiniteMenuItems}
                count={84}
                tileSize={0.72}
                roundness={0.26}
                zoom={1.55}
                pullBack={0.9}
                stretch={0.65}
                inertia={0.65}
                autoplay={4.5}
                grayscale={false}
                dim={0.35}
                intro={true}
                showInfo={true}
                theme="light"
                accentColor="#01033E"
                backgroundColor="transparent"
                selectedIndex={selectedIndex}
                onActiveChange={handleInfiniteActiveChange}
                onItemClick={(item) => handleNavigateAndScroll(item.actionTarget, item.id)}
              />
            </div>
          ) : (
            <div className="w-full h-[220px] sm:h-[360px] md:h-[400px] relative bg-transparent border-0 shadow-none overflow-hidden">
              <OptionWheel
                items={MENU_ITEMS}
                selectedIndex={selectedIndex}
                onChange={handleWheelChange}
                onSelect={(_idx, item) => handleNavigateAndScroll(item.actionTarget, item.id)}
                textColor="#94a3b8"
                activeColor="#020617"
                side="left"
                fontSize={isMobile ? 1.05 : 2.0}
                spacing={isMobile ? 1.28 : 1.6}
                curve={isMobile ? 0.72 : 0.88}
                tilt={isMobile ? 4.2 : 5.6}
                blur={2.8}
                fade={0.38}
                minOpacity={0.06}
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
                            ? 'bg-black text-white shadow-sm scale-105 sm:scale-110'
                            : 'bg-transparent text-slate-400'
                        }`}
                      >
                        {ItemIcon && <ItemIcon size={isMobile ? 12 : 16} />}
                      </span>
                      <span className={`tracking-tight ${isSelected ? 'font-black text-slate-950' : 'font-medium'}`}>
                        {item.label}
                      </span>
                    </span>
                  );
                }}
              />
            </div>
          )}

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
              onClick={() => handleNavigateAndScroll(currentItem.actionTarget, currentItem.id)}
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
