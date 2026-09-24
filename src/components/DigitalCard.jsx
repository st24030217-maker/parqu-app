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
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatPlate } from '../utils/formatters';

export const DigitalCard = () => {
  const { vehicle, owner, card, autoPay, addBalance, activeSession } = useParking();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);

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
    <div className="w-full">
      {/* Contenedor de la Tarjeta con Efectos de Sombra Neón */}
      <div className="relative group">
        {/* Glow de fondo animado */}
        <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-40 transition duration-1000 group-hover:opacity-75 ${
          isParked 
            ? 'bg-gradient-to-r from-amber-500/60 via-orange-500/60 to-red-500/60' 
            : 'bg-gradient-to-r from-white/30 via-neutral-400/20 to-white/30'
        }`} />

        {/* Tarjeta Física Virtual Obsidian */}
        <div className="relative card-hologram rounded-3xl border border-neutral-700/60 p-6 md:p-8 text-white shadow-2xl flex flex-col justify-between min-h-[260px] md:min-h-[290px] transition-transform duration-300 group-hover:scale-[1.008]">
          
          {/* Fila Superior: Marca, Contactless y Estatus */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {/* Logo Park 100% Transparente sin cajas de fondo */}
              <div className="flex items-center justify-center">
                <img 
                  src="/parqu-logo-white.png" 
                  alt="Park" 
                  className="h-9 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                />
              </div>
              <div>
                <span className="font-black text-base tracking-wider uppercase text-white font-mono">
                  Park
                </span>
                <span className="block text-[9px] text-neutral-400 tracking-widest font-mono">
                  TARJETA DIGITAL DE PARQUÍMETRO
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-white/70 rotate-90" />
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                isParked
                  ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                  : 'bg-neutral-900/90 text-white border-neutral-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isParked ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
                {isParked ? 'EN ESTACIONAMIENTO' : 'TARJETA ACTIVA'}
              </div>
            </div>
          </div>

          {/* Fila Media: Chip EMV y Placas en Alto Relieve */}
          <div className="my-4 z-10 flex items-center justify-between flex-wrap gap-4">
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

              {/* Placas del Coche */}
              <div>
                <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-medium font-mono">
                  Placas del Vehículo
                </span>
                <div className="bg-black/80 px-3.5 py-1 rounded-lg border border-neutral-700 shadow-inner inline-block">
                  <span className="font-mono text-xl sm:text-2xl font-black text-white license-plate-badge tracking-wider">
                    {formatPlate(vehicle.plates)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehículo Modelo */}
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-mono">
                Vehículo Registrado
              </span>
              <span className="font-bold text-sm text-white block">
                {vehicle.brand || 'Marca'} {vehicle.model || 'Modelo'}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {vehicle.color || 'Color'} • {vehicle.year || 'Año'}
              </span>
            </div>
          </div>

          {/* Fila Inferior: Titular, Autocobro y QR */}
          <div className="flex items-end justify-between z-10 pt-3 border-t border-neutral-800 flex-wrap gap-3">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold font-mono">
                Titular / Propietario
              </span>
              <span className="font-mono-card font-bold text-base tracking-wide text-white uppercase flex items-center gap-1.5">
                <User className="w-4 h-4 text-neutral-300 inline" />
                {owner.fullName || 'NOMBRE DEL TITULAR'}
              </span>
              <span className="text-[11px] text-neutral-400 block font-mono">
                ID: {owner.idNumber || 'INE-0000000'}
              </span>
            </div>

            {/* Estado de Cobro y QR */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-semibold font-mono">
                  Modalidad Autocobro
                </span>
                {autoPay.enabled ? (
                  <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1 justify-end font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    {autoPay.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Monedero'}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 justify-end font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Desactivado
                  </span>
                )}
                <span className="text-[11px] text-neutral-400 font-mono block">
                  {autoPay.fundingSource === 'WALLET_BALANCE' 
                    ? `Saldo: ${formatCurrency(card.balance)}`
                    : autoPay.bank || 'Tarjeta vinculada'
                  }
                </span>
              </div>

              {/* Botón QR */}
              <button
                onClick={() => setShowQRModal(true)}
                title="Mostrar Código QR para Agente"
                className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-neutral-200 transition transform hover:scale-105 active:scale-95"
              >
                <QrCode className="w-6 h-6 text-black" />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Botones de acción rápida debajo de la tarjeta */}
      <div className="mt-4 flex items-center justify-between text-xs text-neutral-400 px-1 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 text-[11px]">ID TAG: {card.rfidTag}</span>
        </div>

        <div className="flex items-center gap-3">
          {autoPay.fundingSource === 'WALLET_BALANCE' && (
            <button
              onClick={() => setShowRechargeModal(true)}
              className="text-neutral-300 hover:text-white font-medium flex items-center gap-1 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Recargar Saldo
            </button>
          )}
          <button
            onClick={() => setShowQRModal(true)}
            className="text-neutral-300 hover:text-white font-medium flex items-center gap-1 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            Código QR Oficial
          </button>
        </div>
      </div>

      {/* Modal QR Oficial de Inspección */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-1 font-mono">Credencial QR de Inspección</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Escaneable por agentes de tránsito y lectores automáticos de parquímetro
            </p>

            {/* Código QR Generado con SVG */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white" />
                <rect x="5" y="5" width="26" height="26" fill="black" />
                <rect x="9" y="9" width="18" height="18" fill="white" />
                <rect x="13" y="13" width="10" height="10" fill="black" />

                <rect x="69" y="5" width="26" height="26" fill="black" />
                <rect x="73" y="9" width="18" height="18" fill="white" />
                <rect x="77" y="13" width="10" height="10" fill="black" />

                <rect x="5" y="69" width="26" height="26" fill="black" />
                <rect x="9" y="73" width="18" height="18" fill="white" />
                <rect x="13" y="77" width="10" height="10" fill="black" />

                <rect x="36" y="8" width="6" height="6" fill="black" />
                <rect x="46" y="12" width="6" height="6" fill="black" />
                <rect x="56" y="8" width="6" height="6" fill="black" />
                <rect x="36" y="24" width="6" height="6" fill="black" />
                <rect x="52" y="24" width="8" height="6" fill="black" />

                <rect x="10" y="38" width="80" height="4" fill="black" />
                <rect x="15" y="46" width="12" height="8" fill="black" />
                <rect x="32" y="46" width="16" height="8" fill="black" />
                <rect x="54" y="46" width="14" height="8" fill="black" />
                <rect x="74" y="46" width="12" height="8" fill="black" />

                <rect x="36" y="60" width="8" height="8" fill="black" />
                <rect x="48" y="60" width="8" height="8" fill="black" />
                <rect x="60" y="60" width="8" height="8" fill="black" />
                <rect x="72" y="60" width="8" height="8" fill="black" />

                <rect x="36" y="74" width="14" height="6" fill="black" />
                <rect x="54" y="74" width="18" height="6" fill="black" />
                <rect x="76" y="74" width="14" height="6" fill="black" />

                <rect x="36" y="86" width="24" height="6" fill="black" />
                <rect x="66" y="86" width="24" height="6" fill="black" />
              </svg>
            </div>

            <div className="bg-neutral-900/90 rounded-2xl p-3 text-left font-mono text-xs space-y-1 mb-6 border border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-400">Placas:</span>
                <span className="font-bold text-white">{vehicle.plates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Titular:</span>
                <span className="font-bold text-white truncate max-w-[170px]">{owner.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Autocobro:</span>
                <span className="font-bold text-emerald-400">{autoPay.enabled ? 'HABILITADO' : 'INACTIVO'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Estatus:</span>
                <span className="font-bold text-amber-300">{isParked ? 'ESTACIONADO' : 'DISPONIBLE'}</span>
              </div>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-3 bg-white text-black font-bold font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-200 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Cerrar Visualizador
            </button>
          </div>
        </div>
      )}

      {/* Modal de Recarga de Saldo */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1 font-mono">Recargar Saldo de Parquímetro</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Agrega fondos inmediatos a tu Tarjeta Digital para autocobros
            </p>

            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 font-mono block mb-2">
                  Selecciona o ingresa monto (MXN)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[50, 100, 200].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-xl font-bold font-mono text-sm border transition ${
                        rechargeAmount === amt
                          ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="20"
                  max="1000"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-xs font-semibold rounded-xl border border-neutral-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-white hover:bg-neutral-200 text-black font-mono text-xs font-bold rounded-xl transition shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  Confirmar ${rechargeAmount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
