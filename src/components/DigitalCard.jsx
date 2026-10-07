import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { sileo } from 'sileo';
import {
  Wifi,
  User,
  ChevronLeft,
  ChevronRight,
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
    image: './cards/parqu-card-white.jpg',
    pillBg: 'bg-slate-900/80 text-white backdrop-blur-md',
    dataPanelClass:
      'bg-slate-900/75 text-white border border-white/25 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.35)]',
    glowClass: 'from-slate-300/70 via-white/60 to-slate-400/60',
  },
  {
    id: 'blue',
    name: 'Blue Pop Edition',
    shortName: 'Tarjeta Blue',
    badge: 'BLUE • 02',
    image: './cards/parqu-card-blue.jpg',
    pillBg: 'bg-[#01033E]/80 text-white backdrop-blur-md',
    dataPanelClass:
      'bg-[#01033E]/75 text-white border border-white/25 backdrop-blur-xl shadow-[0_10px_30px_rgba(1,3,62,0.45)]',
    glowClass: 'from-[#0033FF]/70 via-sky-400/60 to-[#807DFE]/70',
  },
  {
    id: 'red',
    name: 'Red Character Edition',
    shortName: 'Tarjeta Red',
    badge: 'RED • 03',
    image: './cards/parqu-card-red.jpg',
    pillBg: 'bg-red-950/75 text-white backdrop-blur-md',
    dataPanelClass:
      'bg-red-950/72 text-white border border-white/25 backdrop-blur-xl shadow-[0_10px_30px_rgba(127,29,29,0.45)]',
    glowClass: 'from-red-500/70 via-orange-500/60 to-rose-500/70',
  },
];

export const DigitalCard = () => {
  const {
    vehicle,
    owner,
    card,
    updateCard,
    autoPay,
    addBalance,
    activeSession,
  } = useParking();

  const [showQRModal, setShowQRModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [slideDirection, setSlideDirection] = useState(1);

  const currentDesignId = card?.designId || 'white';
  const currentIndex = Math.max(
    0,
    CARD_DESIGNS.findIndex((d) => d.id === currentDesignId)
  );
  const activeDesign = CARD_DESIGNS[currentIndex] || CARD_DESIGNS[0];

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

  const handleSelectByIndex = (nextIdx, dir = 1) => {
    const normalizedIdx = (nextIdx + CARD_DESIGNS.length) % CARD_DESIGNS.length;
    const chosen = CARD_DESIGNS[normalizedIdx];
    if (!chosen) return;
    setSlideDirection(dir);
    updateCard({ designId: chosen.id });
  };

  const handlePrevDesign = () => {
    handleSelectByIndex(currentIndex - 1, -1);
  };

  const handleNextDesign = () => {
    handleSelectByIndex(currentIndex + 1, 1);
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
    <div className="w-full space-y-4">
      {/* ══════════════════════════════════════════════════════════════
          BARRA SUPERIOR CON LAS DOS FLECHAS PARA CAMBIAR DE DISEÑO
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3 bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-3.5 py-2.5 shadow-sm">
        <button
          type="button"
          onClick={handlePrevDesign}
          aria-label="Tarjeta anterior"
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#0033FF] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer border-0 shadow-sm active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center flex-1">
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
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#0033FF] text-slate-800 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer border-0 shadow-sm active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TARJETA DIGITAL CON CARRUSEL SCROLL FLUIDO Y ANIMACIÓN SPRING
      ══════════════════════════════════════════════════════════════ */}
      <AnimeCardSheen>
        <CardContainer className="w-full">
          <div className="relative w-full group">
            {/* Resplandor dinámico acorde al color de la tarjeta activa */}
            <div
              className={`absolute -inset-1.5 rounded-[28px] sm:rounded-[32px] blur-xl opacity-55 transition-all duration-700 group-hover:opacity-90 bg-gradient-to-r ${activeDesign.glowClass}`}
            />

            <CardBody className="relative w-full aspect-[860/522] min-h-[225px] sm:min-h-[285px] md:min-h-[320px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.28)] border border-white/40 select-none">
              {/* Pista de Scroll Horizontal Animada con las 3 Tarjetas (Soporta flechas y arrastre táctil/mouse) */}
              <motion.div
                className="absolute inset-0 flex w-full h-full cursor-grab active:cursor-grabbing"
                animate={{
                  x: `-${currentIndex * 100}%`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 170,
                  damping: 24,
                  mass: 0.85,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -45) {
                    handleNextDesign();
                  } else if (info.offset.x > 45) {
                    handlePrevDesign();
                  }
                }}
              >
                {CARD_DESIGNS.map((design, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <motion.div
                      key={design.id}
                      className="relative w-full h-full flex-shrink-0 overflow-hidden"
                      animate={{
                        scale: isCurrent ? 1 : 0.92,
                        rotateY: isCurrent ? 0 : idx < currentIndex ? 12 : -12,
                        filter: isCurrent ? 'brightness(1)' : 'brightness(0.85)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 180,
                        damping: 24,
                      }}
                    >
                      <img
                        src={design.image}
                        alt={design.name}
                        draggable={false}
                        className="w-full h-full object-cover object-center pointer-events-none select-none"
                      />
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Fila Superior Flotante 3D: Logo Parqu transparente y Estado NFC */}
              <CardItem
                translateZ="45"
                className="relative z-10 w-full flex items-center justify-between p-3.5 sm:p-5 pointer-events-none"
              >
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md transition-colors duration-500 ${activeDesign.pillBg}`}
                >
                  <img
                    src="./parqu-logo-white.png"
                    alt="Parqu"
                    className="h-4 sm:h-5 w-auto object-contain bg-transparent border-0 shadow-none"
                  />
                  <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white">
                    {card?.customLabel || 'PARQU PASS NFC'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  <div
                    className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 shadow-md transition-colors duration-500 ${activeDesign.pillBg}`}
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

              {/* Bloque Inferior Izquierdo 3D con los Datos del Usuario (deja libre la esquina derecha del diseño) */}
              <CardItem
                translateZ="65"
                className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4 pointer-events-none"
              >
                <motion.div
                  key={activeDesign.id + '-data'}
                  initial={{ opacity: 0.75, x: slideDirection * 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                  className={`w-full sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors duration-500 ${activeDesign.dataPanelClass}`}
                >
                  <div className="flex items-center justify-between gap-2.5 flex-wrap">
                    {/* Placas y Titular */}
                    <div className="flex items-center gap-2.5">
                      <div className="px-2.5 py-1 rounded-xl font-mono text-xs sm:text-sm font-black tracking-wider bg-white/15 text-white border border-white/20 shadow-inner">
                        {formatPlate(vehicle.plates)}
                      </div>
                      <div className="text-left">
                        <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider block text-white/75">
                          {vehicle.brand || 'Vehículo'} {vehicle.model || ''}
                        </span>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1 text-white">
                          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-300" />
                          {owner.fullName || 'NOMBRE DEL TITULAR'}
                        </span>
                      </div>
                    </div>

                    {/* Saldo en vivo y Número de Tarjeta */}
                    <div className="text-right ml-auto">
                      <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider block text-white/75">
                        SALDO DISPONIBLE
                      </span>
                      <div className="text-xs sm:text-sm font-black font-mono text-white">
                        <AnimeCounter
                          value={card.balance}
                          prefix="$"
                          decimals={2}
                          suffix=" MXN"
                          className="text-white"
                        />
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-mono block text-white/70">
                        {card.cardNumber || '4890 •••• •••• 9142'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </CardItem>
            </CardBody>
          </div>
        </CardContainer>
      </AnimeCardSheen>

      {/* Botones de acción rápida debajo de la tarjeta */}
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
