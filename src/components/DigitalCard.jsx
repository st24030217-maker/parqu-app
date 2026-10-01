import React, { useState } from 'react';
import { sileo } from 'sileo';
import { 
  QrCode, 
  Wifi, 
  CreditCard, 
  Car, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { CurrencyDollarIcon } from './icons/currency-dollar-icon';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatPlate } from '../utils/formatters';

import { DirectionAwareHover } from './ui/direction-aware-hover';
import { CardContainer, CardBody, CardItem } from './ui/3d-card';
import { AnimeCounter } from './ui/anime-counter';
import { AnimeCardSheen } from './ui/anime-card-sheen';

export const DigitalCard = () => {
  const { vehicle, owner, card, autoPay, addBalance, activeSession } = useParking();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);

  // Accesibilidad WCAG 2.1: Cerrar modales superpuestos con tecla Escape
  React.useEffect(() => {
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

  // Portada frontal con efecto 3D y el logo oficial de SSS.Solutions en paleta #01033E, #0033FF, #807DFE y #D4D6E6
  const FrontCover = (
    <CardBody className="relative w-full h-full min-h-[270px] md:min-h-[295px] rounded-3xl bg-gradient-to-br from-[#01033E]/90 via-[#01033E]/70 to-[#0033FF]/30 backdrop-blur-2xl backdrop-saturate-150 border border-[#807DFE]/30 p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Resplandor holográfico y textura de grano */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#0033FF]/[0.25] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#807DFE]/[0.2] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#807DFE_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

      {/* Fila Superior: Marca y Contactless en 3D */}
      <CardItem translateZ="40" className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <img 
            src="./parqu-logo-white.png" 
            alt="Parqu" 
            className="h-6 w-auto object-contain opacity-80"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D4D6E6] font-bold">
            PARQU DIGITAL PASS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-[#D4D6E6]/70 rotate-90" />
        </div>
      </CardItem>

      {/* Centro: Logotipo Oficial SSS.Solutions flotando en 3D */}
      <CardItem translateZ="75" className="w-full my-auto z-10 flex flex-col items-center justify-center text-center space-y-2.5 py-4">
        <div className="relative group/logo">
          <div className="absolute -inset-4 bg-[#0033FF]/30 rounded-full blur-2xl pointer-events-none" />
          <img
            src="/sss-solutions-logo.png"
            alt="SSS.Solutions"
            className="h-14 md:h-16 w-auto object-contain drop-shadow-[0_0_35px_rgba(0,51,255,0.5)] hover:scale-105 transition-transform duration-500"
          />
        </div>
        <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-[#D4D6E6] font-semibold">
          TECNOLOGÍA SSS.SOLUTIONS
        </span>
      </CardItem>

      {/* Fila Inferior: Indicador minimalista en 3D para pasar el cursor */}
      <CardItem translateZ="35" className="w-full flex items-center justify-between z-10 pt-3 border-t border-white/10 text-[11px] font-mono text-[#D4D6E6]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isParked ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span className="text-[#D4D6E6] font-medium">
            {isParked ? 'Estacionamiento Activo' : 'Saldo:'}{' '}
            <AnimeCounter value={card.balance} prefix="$" decimals={2} suffix=" MXN" className="text-white font-bold" />
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#D4D6E6] font-medium group-hover:text-white transition-colors">
          <span>Toca o pasa el mouse</span>
          <Sparkles className="w-3.5 h-3.5 text-[#807DFE] animate-pulse" />
        </div>
      </CardItem>
    </CardBody>
  );

  return (
    <div className="w-full">
      {/* Contenedor Holográfico Interactivo con Anime.js */}
      <AnimeCardSheen>
        {/* Contenedor 3D Card Tilt + Direction-Aware Hover */}
        <CardContainer className="w-full">
        <div className="relative w-full group">
          {/* Glow de fondo animado */}
          <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-40 transition duration-1000 group-hover:opacity-85 ${
            isParked 
              ? 'bg-gradient-to-r from-amber-500/60 via-orange-500/60 to-red-500/60' 
              : 'bg-gradient-to-r from-[#01033E]/80 via-[#0033FF]/50 to-[#807DFE]/60'
          }`} />

          {/* Componente Aceternity Direction Aware Hover */}
          <DirectionAwareHover frontContent={FrontCover}>
            {/* Tarjeta Física Virtual Obsidian con efectos 3D de profundidad */}
            <CardBody className="relative card-hologram w-full h-full min-h-[270px] md:min-h-[295px] rounded-3xl border border-white/15 backdrop-blur-2xl p-6 md:p-8 text-[#D4D6E6] shadow-2xl flex flex-col justify-between">
              
              {/* Fila Superior: Marca, Contactless y Estatus */}
              <CardItem translateZ="45" className="w-full flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center">
                    <img 
                      src="./parqu-logo-white.png" 
                      alt="Parqu" 
                      className="h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,51,255,0.4)]"
                    />
                  </div>
                  <div>
                    <span className="font-black text-base tracking-wider uppercase text-white font-mono">
                      Parqu
                    </span>
                    <span className="block text-[9px] text-[#D4D6E6]/80 tracking-widest font-mono">
                      TARJETA DIGITAL DE PARQUÍMETRO
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-[#D4D6E6]/70 rotate-90" />
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                    isParked
                      ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                      : 'bg-white/10 backdrop-blur-sm text-white border border-white/10'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isParked ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
                    {isParked ? 'EN ESTACIONAMIENTO' : 'TARJETA ACTIVA'}
                  </div>
                </div>
              </CardItem>

              {/* Fila Media: Chip EMV y Placas en Alto Relieve 3D */}
              <CardItem translateZ="75" className="w-full my-3 z-10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {/* Chip Plateado / Platino Monocromático */}
                  <div className="w-11 h-8 rounded-md bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-400 border border-neutral-100/50 shadow-inner flex items-center justify-center p-1">
                    <div className="w-full h-full border border-neutral-500/40 rounded-sm grid grid-cols-2 gap-0.5">
                      <div className="border-r border-b border-neutral-600/40"></div>
                      <div className="border-b border-neutral-600/40"></div>
                      <div className="border-r border-neutral-600/40"></div>
                      <div></div>
                    </div>
                  </div>

                  {/* Placas del Coche en Alto Relieve */}
                  <div>
                    <span className="text-[10px] text-[#D4D6E6]/80 uppercase tracking-widest block font-medium font-mono">
                      Placas del Vehículo
                    </span>
                    <div className="bg-white/8 backdrop-blur-sm px-3.5 py-1 rounded-lg border border-white/10 shadow-inner inline-block">
                      <span className="font-mono text-xl sm:text-2xl font-black text-white license-plate-badge tracking-wider">
                        {formatPlate(vehicle.plates)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehículo Modelo */}
                <div className="text-right">
                  <span className="text-[10px] text-[#D4D6E6]/80 uppercase tracking-widest block font-mono">
                    Vehículo Registrado
                  </span>
                  <span className="font-bold text-sm text-white block">
                    {vehicle.brand || 'Marca'} {vehicle.model || 'Modelo'}
                  </span>
                  <span className="text-xs text-[#D4D6E6]/80 font-mono">
                    {vehicle.color || 'Color'} • {vehicle.year || 'Año'}
                  </span>
                </div>
              </CardItem>

              {/* Fila Inferior: Titular, Autocobro y Botón QR Flotante 3D */}
              <CardItem translateZ="60" className="w-full flex items-end justify-between z-10 pt-3 border-t border-white/10 flex-wrap gap-3">
                <div>
                  <span className="text-[10px] text-[#D4D6E6]/80 uppercase tracking-wider block font-semibold font-sans">
                    Titular / Propietario
                  </span>
                  <span className="font-sans font-bold text-base tracking-wide text-white uppercase flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#807DFE] inline" />
                    {owner.fullName || 'NOMBRE DEL TITULAR'}
                  </span>
                  <span className="text-[11px] text-[#D4D6E6]/80 block font-mono">
                    ID: {owner.idNumber || 'INE-0000000'}
                  </span>
                </div>

                {/* Estado de Cobro y QR */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-[#D4D6E6]/80 uppercase tracking-wider block font-semibold font-sans">
                      Modalidad Autocobro
                    </span>
                    {autoPay.enabled ? (
                      <span className="text-xs font-semibold text-white flex items-center gap-1 justify-end font-sans">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                        {autoPay.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Monedero'}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 justify-end font-sans">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Desactivado
                      </span>
                    )}
                    <div className="text-[11px] text-[#D4D6E6]/80 font-mono block">
                      {autoPay.fundingSource === 'WALLET_BALANCE' ? (
                        <span className="flex items-center gap-1 justify-end">
                          <span>Saldo:</span>
                          <AnimeCounter
                            value={card.balance}
                            prefix="$"
                            decimals={2}
                            suffix=" MXN"
                            className="font-bold text-white text-xs drop-shadow-[0_0_10px_rgba(0,51,255,0.5)]"
                          />
                        </span>
                      ) : (
                        autoPay.bank || 'Tarjeta vinculada'
                      )}
                    </div>
                  </div>

                  {/* Botón QR Flotante en 3D */}
                  <CardItem translateZ="90">
                    <button
                      type="button"
                      aria-label="Mostrar Código QR oficial de inspección"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQRModal(true);
                      }}
                      title="Mostrar Código QR para Agente"
                      className="w-11 h-11 rounded-2xl bg-[#0033FF] hover:bg-[#2250ff] text-white flex items-center justify-center shadow-[0_0_25px_rgba(0,51,255,0.5)] transition transform hover:scale-110 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                    >
                      <QrCode className="w-6 h-6 text-white" />
                    </button>
                  </CardItem>
                </div>

              </CardItem>

            </CardBody>
          </DirectionAwareHover>
        </div>
      </CardContainer>
      </AnimeCardSheen>

      {/* Botones de acción rápida debajo de la tarjeta */}
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-400 px-1 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#D4D6E6]/60 text-[11px]">ID TAG: {card.rfidTag}</span>
        </div>

        <div className="flex items-center gap-3">
          {autoPay.fundingSource === 'WALLET_BALANCE' && (
            <button
              type="button"
              aria-label="Abrir modal para recargar saldo"
              onClick={() => setShowRechargeModal(true)}
              className="text-[#D4D6E6] hover:text-white font-medium flex items-center gap-1.5 transition cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <CurrencyDollarIcon size={14} className="text-[#807DFE]" />
              Recargar Saldo
            </button>
          )}
          <button
            type="button"
            aria-label="Abrir credencial QR oficial para agente de tránsito"
            onClick={() => setShowQRModal(true)}
            className="text-[#D4D6E6] hover:text-white font-medium flex items-center gap-1 transition cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <QrCode className="w-3.5 h-3.5 text-[#807DFE]" />
            Código QR Oficial
          </button>
        </div>
      </div>

      {/* Modal QR Oficial de Inspección */}
      {showQRModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-qr-dialog-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div className="bg-[#01033E]/95 backdrop-blur-2xl border border-[#807DFE]/30 rounded-3xl max-w-sm w-full p-6 text-center shadow-[0_0_50px_rgba(0,51,255,0.3)] relative animate-in fade-in zoom-in-95 duration-200">
            <h3 id="card-qr-dialog-title" className="text-lg font-bold text-white mb-1 font-sans">Credencial QR de Inspección</h3>
            <p className="text-xs text-[#D4D6E6]/80 mb-6 font-sans">
              Escaneable por agentes de tránsito y lectores automáticos de parquímetro
            </p>

            {/* Código QR Generado con SVG */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100" role="img" aria-label={`Código QR oficial para el vehículo ${vehicle.plates}`}>
                <rect width="100" height="100" fill="#ffffff" />
                <rect x="5" y="5" width="26" height="26" fill="#01033E" />
                <rect x="9" y="9" width="18" height="18" fill="#ffffff" />
                <rect x="13" y="13" width="10" height="10" fill="#01033E" />

                <rect x="69" y="5" width="26" height="26" fill="#01033E" />
                <rect x="73" y="9" width="18" height="18" fill="#ffffff" />
                <rect x="77" y="13" width="10" height="10" fill="#01033E" />

                <rect x="5" y="69" width="26" height="26" fill="#01033E" />
                <rect x="9" y="73" width="18" height="18" fill="#ffffff" />
                <rect x="13" y="77" width="10" height="10" fill="#01033E" />

                <rect x="36" y="8" width="6" height="6" fill="#01033E" />
                <rect x="46" y="12" width="6" height="6" fill="#01033E" />
                <rect x="56" y="8" width="6" height="6" fill="#01033E" />
                <rect x="36" y="24" width="6" height="6" fill="#01033E" />
                <rect x="52" y="24" width="8" height="6" fill="#01033E" />

                <rect x="10" y="38" width="80" height="4" fill="#01033E" />
                <rect x="15" y="46" width="12" height="8" fill="#01033E" />
                <rect x="32" y="46" width="16" height="8" fill="#01033E" />
                <rect x="54" y="46" width="14" height="8" fill="#01033E" />
                <rect x="74" y="46" width="12" height="8" fill="#01033E" />

                <rect x="36" y="60" width="8" height="8" fill="#01033E" />
                <rect x="48" y="60" width="8" height="8" fill="#01033E" />
                <rect x="60" y="60" width="8" height="8" fill="#01033E" />
                <rect x="72" y="60" width="8" height="8" fill="#01033E" />

                <rect x="36" y="74" width="14" height="6" fill="#01033E" />
                <rect x="54" y="74" width="18" height="6" fill="#01033E" />
                <rect x="76" y="74" width="14" height="6" fill="#01033E" />

                <rect x="36" y="86" width="24" height="6" fill="#01033E" />
                <rect x="66" y="86" width="24" height="6" fill="#01033E" />
              </svg>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 text-left font-sans text-xs space-y-1 mb-6 border border-white/10">
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Placas:</span>
                <span className="font-bold text-white font-mono">{vehicle.plates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Titular:</span>
                <span className="font-bold text-white truncate max-w-[170px]">{owner.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Autocobro:</span>
                <span className="font-bold text-emerald-400 font-mono">{autoPay.enabled ? 'HABILITADO' : 'INACTIVO'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Estatus:</span>
                <span className="font-bold text-amber-300 font-mono">{isParked ? 'ESTACIONADO' : 'DISPONIBLE'}</span>
              </div>
            </div>

            <button
              type="button"
              aria-label="Cerrar credencial QR de inspección"
              onClick={() => setShowQRModal(false)}
              className="w-full py-3 bg-[#0033FF] hover:bg-[#2250ff] text-white font-bold font-sans text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(0,51,255,0.4)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              Cerrar Visualizador
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
          <div className="bg-[#01033E]/95 backdrop-blur-2xl border border-[#807DFE]/30 rounded-3xl max-w-sm w-full p-6 shadow-[0_0_50px_rgba(0,51,255,0.3)] relative">
            <div className="w-12 h-12 rounded-2xl bg-[#0033FF]/20 backdrop-blur-sm border border-[#807DFE]/40 text-[#807DFE] flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(0,51,255,0.3)]">
              <CurrencyDollarIcon size={24} strokeWidth={2} />
            </div>
            <h3 id="card-recharge-dialog-title" className="text-lg font-bold text-white mb-1 font-sans text-center">Recargar Saldo de Parquímetro</h3>
            <p className="text-xs text-[#D4D6E6]/80 mb-5 font-sans text-center">
              Agrega fondos inmediatos a tu Tarjeta Digital para autocobros
            </p>

            <form onSubmit={handleRecharge} className="space-y-4 font-sans">
              <div>
                <label htmlFor="card-recharge-input" className="text-xs text-[#D4D6E6]/80 font-sans block mb-2 font-bold">
                  Selecciona o ingresa monto (MXN)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[50, 100, 200].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      aria-label={`Seleccionar recarga de ${amt} pesos`}
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-xl font-bold font-mono text-sm border transition flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 ${
                        rechargeAmount === amt
                          ? 'bg-[#0033FF] text-white border-[#0033FF] shadow-[0_0_15px_rgba(0,51,255,0.4)]'
                          : 'bg-white/5 border-white/10 text-[#D4D6E6] hover:bg-white/10'
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
                  aria-label="Monto a recargar en pesos mexicanos"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white font-mono focus:outline-none focus:border-[#807DFE]/70 focus-visible:ring-2 focus-visible:ring-[#807DFE]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  aria-label="Cancelar recarga"
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-[#D4D6E6] font-sans text-xs font-semibold rounded-xl border border-white/10 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  aria-label={`Confirmar recarga de ${rechargeAmount} pesos`}
                  className="flex-1 py-2.5 bg-[#0033FF] hover:bg-[#2250ff] text-white font-sans text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(0,51,255,0.4)] flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                >
                  <CurrencyDollarIcon size={14} strokeWidth={2.2} />
                  <span>Confirmar <span className="font-mono">${rechargeAmount}</span></span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
