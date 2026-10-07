import React, { useState, useEffect } from 'react';
import { sileo } from 'sileo';
import {
  Wifi,
  CreditCard,
  Car,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Eye,
  EyeOff,
  Check,
  Palette,
  PenTool,
} from 'lucide-react';
import { CurrencyDollarIcon } from './icons/currency-dollar-icon';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatPlate } from '../utils/formatters';

import { CardContainer, CardBody, CardItem } from './ui/3d-card';
import { AnimeCounter } from './ui/anime-counter';
import { AnimeCardSheen } from './ui/anime-card-sheen';

export const CARD_DESIGNS = [
  {
    id: 'white',
    name: 'White Clay Edition',
    shortName: 'Tarjeta White',
    badge: 'WHITE • 01',
    subtitle: 'Diseño minimalista en relieve 3D blanco marfil',
    image: './cards/parqu-card-white.jpg',
    accentColor: '#0f172a',
    pillBg: 'bg-slate-900/80 text-white backdrop-blur-md',
    bottomBarStyles: {
      glass: 'bg-slate-950/75 text-white border border-white/20 backdrop-blur-xl',
      light: 'bg-white/85 text-slate-900 border border-slate-300/80 backdrop-blur-xl',
      minimal: 'bg-slate-900/90 text-white border border-white/15 backdrop-blur-md',
    },
    glowClass: 'from-slate-300/70 via-white/60 to-slate-400/60',
    ringColor: 'ring-slate-900',
    swatchBg: 'bg-[#f8f7f2] border-slate-300 text-slate-900',
  },
  {
    id: 'blue',
    name: 'Blue Pop Edition',
    shortName: 'Tarjeta Blue',
    badge: 'BLUE • 02',
    subtitle: 'Diseño vibrante en azul eléctrico con personajes 3D',
    image: './cards/parqu-card-blue.jpg',
    accentColor: '#0033FF',
    pillBg: 'bg-[#01033E]/80 text-white backdrop-blur-md',
    bottomBarStyles: {
      glass: 'bg-[#01033E]/78 text-white border border-white/20 backdrop-blur-xl',
      light: 'bg-white/88 text-slate-900 border border-white/60 backdrop-blur-xl',
      minimal: 'bg-black/75 text-white border border-white/15 backdrop-blur-md',
    },
    glowClass: 'from-[#0033FF]/70 via-sky-400/60 to-[#807DFE]/70',
    ringColor: 'ring-[#0033FF]',
    swatchBg: 'bg-[#0e8ef2] border-blue-400 text-white',
  },
  {
    id: 'red',
    name: 'Red Character Edition',
    shortName: 'Tarjeta Red',
    badge: 'RED • 03',
    subtitle: 'Diseño dinámico en rojo coral con personaje 3D',
    image: './cards/parqu-card-red.jpg',
    accentColor: '#e11d48',
    pillBg: 'bg-red-950/80 text-white backdrop-blur-md',
    bottomBarStyles: {
      glass: 'bg-red-950/78 text-white border border-white/20 backdrop-blur-xl',
      light: 'bg-white/88 text-slate-900 border border-white/60 backdrop-blur-xl',
      minimal: 'bg-black/75 text-white border border-white/15 backdrop-blur-md',
    },
    glowClass: 'from-red-500/70 via-orange-500/60 to-rose-500/70',
    ringColor: 'ring-red-500',
    swatchBg: 'bg-[#f43f2e] border-red-400 text-white',
  },
];

export const DigitalCard = ({ defaultOpenEditor = false }) => {
  const {
    vehicle,
    updateVehicle,
    owner,
    updateOwner,
    card,
    updateCard,
    autoPay,
    addBalance,
    activeSession,
  } = useParking();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [showEditor, setShowEditor] = useState(defaultOpenEditor);
  const [hideDataOverlay, setHideDataOverlay] = useState(false);

  // Diseño activo guardado en el estado global de la tarjeta (por defecto 'white' o el elegido por el usuario)
  const currentDesignId = card?.designId || 'white';
  const currentIndex = Math.max(
    0,
    CARD_DESIGNS.findIndex((d) => d.id === currentDesignId)
  );
  const activeDesign = CARD_DESIGNS[currentIndex] || CARD_DESIGNS[0];
  const overlayStyle = card?.overlayStyle || 'glass';
  const customLabel = card?.customLabel ?? 'PARQU PASS NFC';
  const isLightOverlay = overlayStyle === 'light';

  // Accesibilidad WCAG 2.1: Cerrar modales superpuestos con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowQRModal(false);
        setShowRechargeModal(false);
      }
    };
    if (showQRModal || showRechargeModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQRModal, showRechargeModal]);

  const handleSelectDesign = (designId) => {
    const chosen = CARD_DESIGNS.find((d) => d.id === designId);
    updateCard({ designId });
    if (chosen) {
      sileo.success({
        title: `Diseño ${chosen.shortName} Aplicado`,
        description: `Tu tarjeta digital ahora luce el estilo ${chosen.name}.`,
      });
    }
  };

  const handlePrevDesign = () => {
    const prevIdx = (currentIndex + CARD_DESIGNS.length - 1) % CARD_DESIGNS.length;
    handleSelectDesign(CARD_DESIGNS[prevIdx].id);
  };

  const handleNextDesign = () => {
    const nextIdx = (currentIndex + 1) % CARD_DESIGNS.length;
    handleSelectDesign(CARD_DESIGNS[nextIdx].id);
  };

  const handleRecharge = (e) => {
    e.preventDefault();
    if (rechargeAmount > 0) {
      addBalance(Number(rechargeAmount));
      sileo.success({
        title: 'Saldo Recargado con Éxito',
        description: `Se agregaron ${formatCurrency(Number(rechargeAmount))} a tu Tarjeta Digital.`,
      });
      setShowRechargeModal(false);
    }
  };

  const isParked = activeSession !== null;

  return (
    <div className="w-full space-y-5">
      {/* ══════════════════════════════════════════════════════════════
          BARRA SUPERIOR DE SELECCIÓN Y EDICIÓN DE LA TARJETA
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-3.5 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDesign}
            aria-label="Tarjeta anterior"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition cursor-pointer border-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-left px-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#0033FF] font-bold block">
              DISEÑO {currentIndex + 1} DE {CARD_DESIGNS.length} • {activeDesign.badge}
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900">
              {activeDesign.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextDesign}
            aria-label="Siguiente tarjeta"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition cursor-pointer border-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHideDataOverlay((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border-0"
            title="Alternar vista de datos sobre el diseño"
          >
            {hideDataOverlay ? (
              <>
                <Eye className="w-3.5 h-3.5 text-[#0033FF]" />
                <span>Ver Datos</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Solo Arte</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowEditor((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer border-0 ${
              showEditor
                ? 'bg-[#0033FF] text-white shadow-md'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{showEditor ? 'Cerrar Editor' : 'Personalizar Tarjeta'}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          1. TARJETA PRINCIPAL ACTIVA (SE VE PRIMERO UNA EN GRANDE CON 3D)
      ══════════════════════════════════════════════════════════════ */}
      <AnimeCardSheen>
        <CardContainer className="w-full">
          <div className="relative w-full group">
            {/* Resplandor dinámico acorde al color de la tarjeta elegida */}
            <div
              className={`absolute -inset-1.5 rounded-[28px] sm:rounded-[32px] blur-xl opacity-55 transition duration-700 group-hover:opacity-90 bg-gradient-to-r ${activeDesign.glowClass}`}
            />

            <CardBody className="relative w-full aspect-[860/522] min-h-[225px] sm:min-h-[285px] md:min-h-[320px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.28)] border border-white/40 select-none">
              {/* Imagen de fondo oficial de la tarjeta elegida (White / Blue / Red) */}
              <img
                key={activeDesign.id}
                src={activeDesign.image}
                alt={activeDesign.name}
                className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-[1.02]"
              />

              {/* Fila Superior Flotante 3D: Logo Parqu transparente, Etiqueta editable y Estado NFC */}
              {!hideDataOverlay && (
                <CardItem
                  translateZ="45"
                  className="relative z-10 w-full flex items-center justify-between p-3.5 sm:p-5"
                >
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md ${activeDesign.pillBg}`}
                  >
                    <img
                      src="./parqu-logo-white.png"
                      alt="Parqu"
                      className="h-4 sm:h-5 w-auto object-contain bg-transparent border-0 shadow-none"
                    />
                    <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white">
                      {customLabel || 'PARQU PASS NFC'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 shadow-md ${activeDesign.pillBg}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isParked ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                        }`}
                      />
                      <span>{isParked ? 'EN PARQUÍMETRO' : 'NFC ACTIVA'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQRModal(true);
                      }}
                      title="Mostrar Pase NFC Oficial"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0033FF] hover:bg-[#0026cc] text-white flex items-center justify-center shadow-lg transition transform hover:scale-110 cursor-pointer border-0"
                    >
                      <Wifi className="w-4 h-4 rotate-90 text-white" />
                    </button>
                  </div>
                </CardItem>
              )}

              {/* Franja Inferior Flotante 3D con todos los Datos del Usuario (Deja libre el arte central de los personajes) */}
              {!hideDataOverlay && (
                <CardItem
                  translateZ="65"
                  className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4"
                >
                  <div
                    className={`w-full rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3.5 shadow-xl transition-colors duration-300 ${
                      activeDesign.bottomBarStyles[overlayStyle] ||
                      activeDesign.bottomBarStyles.glass
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Placas y Vehículo */}
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div
                          className={`px-2.5 py-1 rounded-xl font-mono text-xs sm:text-base font-black tracking-wider shadow-inner ${
                            isLightOverlay
                              ? 'bg-slate-900 text-white'
                              : 'bg-white/15 text-white border border-white/15'
                          }`}
                        >
                          {formatPlate(vehicle.plates)}
                        </div>
                        <div className="text-left">
                          <span
                            className={`text-[9px] font-mono uppercase tracking-wider block ${
                              isLightOverlay ? 'text-slate-500' : 'text-white/70'
                            }`}
                          >
                            {vehicle.brand || 'Vehículo'} {vehicle.model || ''}
                          </span>
                          <span className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1">
                            <User
                              className={`w-3.5 h-3.5 ${
                                isLightOverlay ? 'text-[#0033FF]' : 'text-sky-300'
                              }`}
                            />
                            {owner.fullName || 'NOMBRE DEL TITULAR'}
                          </span>
                        </div>
                      </div>

                      {/* Saldo en vivo y Número de Tarjeta */}
                      <div className="text-right ml-auto">
                        <span
                          className={`text-[9px] font-mono uppercase tracking-wider block ${
                            isLightOverlay ? 'text-slate-500' : 'text-white/70'
                          }`}
                        >
                          SALDO DISPONIBLE
                        </span>
                        <div className="text-sm sm:text-base font-black font-mono">
                          <AnimeCounter
                            value={card.balance}
                            prefix="$"
                            decimals={2}
                            suffix=" MXN"
                            className={isLightOverlay ? 'text-slate-900' : 'text-white'}
                          />
                        </div>
                        <span
                          className={`text-[9px] font-mono block ${
                            isLightOverlay ? 'text-slate-500' : 'text-white/65'
                          }`}
                        >
                          {card.cardNumber || '4890 •••• •••• 9142'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardItem>
              )}
            </CardBody>
          </div>
        </CardContainer>
      </AnimeCardSheen>

      {/* ══════════════════════════════════════════════════════════════
          2. GALERÍA DE LAS 3 TARJETAS POR SEPARADO PARA ESCOGER LA FAVORITA
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white/75 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#0033FF]" />
              Escoge tu Diseño Favorito (3 Ediciones Disponibles)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Toca cualquiera de las 3 tarjetas por separado para aplicarla al instante con tus datos.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {activeDesign.shortName} Activa
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {CARD_DESIGNS.map((design, idx) => {
            const isSelected = design.id === activeDesign.id;
            return (
              <button
                key={design.id}
                type="button"
                onClick={() => handleSelectDesign(design.id)}
                className={`group relative rounded-2xl p-1.5 sm:p-2 text-left transition-all duration-300 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                    : 'bg-white/90 hover:bg-white text-slate-800 border-slate-200/90 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="relative w-full aspect-[860/522] rounded-xl overflow-hidden mb-2">
                  <img
                    src={design.image}
                    alt={design.name}
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0033FF] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="px-0.5">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${
                      isSelected ? 'text-sky-300' : 'text-slate-400'
                    }`}
                  >
                    0{idx + 1} • {design.id.toUpperCase()}
                  </span>
                  <span
                    className={`text-[11px] sm:text-xs font-black truncate block ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {design.shortName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. ESTUDIO EDITABLE DE DATOS Y ESTILO DE LA TARJETA EN VIVO
      ══════════════════════════════════════════════════════════════ */}
      {showEditor && (
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-lg space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0033FF] font-bold">
                PERSONALIZACIÓN EN VIVO
              </span>
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                Editar Datos y Estilo de tu Tarjeta Digital
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              ● Autoguardado Activo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nombre del Titular en la Tarjeta
              </label>
              <input
                type="text"
                value={owner.fullName || ''}
                onChange={(e) => updateOwner({ fullName: e.target.value })}
                placeholder="Ej. Sebastián Salinas"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0033FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Placas del Vehículo
              </label>
              <input
                type="text"
                value={vehicle.plates || ''}
                onChange={(e) => updateVehicle({ plates: e.target.value.toUpperCase() })}
                placeholder="XYZ-7842"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:border-[#0033FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Marca y Modelo del Vehículo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={vehicle.brand || ''}
                  onChange={(e) => updateVehicle({ brand: e.target.value })}
                  placeholder="Marca (ej. VW)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0033FF]"
                />
                <input
                  type="text"
                  value={vehicle.model || ''}
                  onChange={(e) => updateVehicle({ model: e.target.value })}
                  placeholder="Modelo (ej. Jetta)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0033FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Etiqueta Superior de la Tarjeta
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => updateCard({ customLabel: e.target.value.toUpperCase() })}
                placeholder="PARQU PASS NFC"
                maxLength={24}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:border-[#0033FF]"
              />
            </div>
          </div>

          {/* Selector de acabado del bloque de datos */}
          <div className="pt-1">
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Acabado del Panel de Datos sobre la Tarjeta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'glass', label: 'Cristal Oscuro' },
                { id: 'light', label: 'Cristal Claro' },
                { id: 'minimal', label: 'Alto Contraste' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => updateCard({ overlayStyle: st.id })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    overlayStyle === st.id
                      ? 'bg-[#0033FF] text-white border-[#0033FF] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción rápida debajo de la galería */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-mono flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">ID TAG: {card.rfidTag}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Abrir modal para recargar saldo"
            onClick={() => setShowRechargeModal(true)}
            className="text-slate-700 hover:text-[#0033FF] font-bold flex items-center gap-1.5 transition cursor-pointer rounded-lg bg-transparent border-0"
          >
            <CurrencyDollarIcon size={14} className="text-[#0033FF]" />
            Recargar Saldo
          </button>
          <button
            type="button"
            aria-label="Abrir credencial NFC oficial para agente de tránsito"
            onClick={() => setShowQRModal(true)}
            className="text-slate-700 hover:text-[#0033FF] font-bold flex items-center gap-1 transition cursor-pointer rounded-lg bg-transparent border-0"
          >
            <Wifi className="w-3.5 h-3.5 rotate-90 text-[#0033FF]" />
            Credencial NFC Oficial
          </button>
        </div>
      </div>

      {/* Modal NFC Oficial de Inspección */}
      {showQRModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-qr-dialog-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div className="bg-[#01033E] rounded-3xl border-0 max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3
              id="card-qr-dialog-title"
              className="text-lg font-bold text-white mb-1 font-sans"
            >
              Credencial NFC de Inspección
            </h3>
            <p className="text-xs text-[#D4D6E6]/80 mb-6 font-sans">
              Lectura NFC sin contacto para agentes de tránsito y lectores de parquímetro
            </p>

            {/* Emisor NFC Contactless Animado */}
            <div className="py-6 flex flex-col items-center justify-center mb-4">
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-[#0033FF] to-[#807DFE] flex items-center justify-center shadow-[0_0_40px_rgba(0,51,255,0.6)]">
                <span className="absolute inset-0 rounded-full bg-[#0033FF]/40 animate-ping" />
                <span className="absolute -inset-3 rounded-full border-2 border-[#D4D6E6]/30" />
                <div className="relative z-10 flex flex-col items-center justify-center text-white">
                  <Wifi className="w-14 h-14 rotate-90 text-white" />
                  <span className="text-xs font-mono font-black tracking-widest mt-1">
                    NFC ACTIVO
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 text-left font-sans text-xs space-y-1 mb-6 border-0 shadow-inner">
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Diseño de Tarjeta:</span>
                <span className="font-bold text-white font-mono">{activeDesign.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Placas:</span>
                <span className="font-bold text-white font-mono">{vehicle.plates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Titular:</span>
                <span className="font-bold text-white truncate max-w-[170px]">
                  {owner.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Autocobro NFC:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {autoPay.enabled ? 'HABILITADO' : 'INACTIVO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Estatus:</span>
                <span className="font-bold text-amber-300 font-mono">
                  {isParked ? 'ESTACIONADO' : 'DISPONIBLE'}
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-label="Cerrar credencial NFC de inspección"
              onClick={() => setShowQRModal(false)}
              className="w-full py-3 bg-[#0033FF] hover:bg-[#2250ff] text-white font-bold font-sans text-xs uppercase tracking-wider rounded-xl transition shadow-xl border-0 cursor-pointer"
            >
              Cerrar Visualizador NFC
            </button>
          </div>
        </div>
      )}

      {/* Modal de Recarga de Saldo */}
      {showRechargeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-recharge-dialog-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div className="bg-[#01033E] rounded-3xl border-0 max-w-sm w-full p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-[#0033FF]/20 text-[#807DFE] flex items-center justify-center mx-auto mb-3 shadow-md border-0">
              <CurrencyDollarIcon size={24} strokeWidth={2} />
            </div>
            <h3
              id="card-recharge-dialog-title"
              className="text-lg font-bold text-white mb-1 font-sans text-center"
            >
              Recargar Saldo de Parquímetro
            </h3>
            <p className="text-xs text-[#D4D6E6]/80 mb-5 font-sans text-center">
              Agrega fondos inmediatos a tu Tarjeta Digital para autocobros
            </p>

            <form onSubmit={handleRecharge} className="space-y-4 font-sans">
              <div>
                <label
                  htmlFor="card-recharge-input"
                  className="text-xs text-[#D4D6E6]/80 font-sans block mb-2 font-bold"
                >
                  Selecciona o ingresa monto (MXN)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[50, 100, 200].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-xl font-bold font-mono text-sm border-0 transition flex items-center justify-center gap-1 cursor-pointer ${
                        rechargeAmount === amt
                          ? 'bg-[#0033FF] text-white shadow-lg'
                          : 'bg-white/10 text-[#D4D6E6] hover:bg-white/20'
                      }`}
                    >
                      <CurrencyDollarIcon size={13} strokeWidth={2.2} />
                      <span>{amt}</span>
                    </button>
                  ))}
                </div>
                <input
                  id="card-recharge-input"
                  type="number"
                  min="20"
                  max="1000"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border-0 text-white font-mono focus:outline-none shadow-inner"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-[#D4D6E6] font-sans text-xs font-semibold rounded-xl border-0 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0033FF] hover:bg-[#2250ff] text-white font-sans text-xs font-bold rounded-xl border-0 transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CurrencyDollarIcon size={14} strokeWidth={2.2} />
                  <span>
                    Confirmar <span className="font-mono">${rechargeAmount}</span>
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
