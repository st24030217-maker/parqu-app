import React, { useState } from 'react';
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
      setShowRechargeModal(false);
    }
  };

  const isParked = activeSession !== null;

  return (
    <div className="w-full">
      {/* Contenedor de la Tarjeta con Efectos de Sombra Neón */}
      <div className="relative group">
        {/* Glow de fondo animado */}
        <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-60 transition duration-1000 group-hover:opacity-90 ${
          isParked 
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500' 
            : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600'
        }`} />

        {/* Tarjeta Física Virtual */}
        <div className="relative card-hologram rounded-2xl border border-white/20 p-6 md:p-8 text-white shadow-2xl flex flex-col justify-between min-h-[260px] md:min-h-[290px] transition-transform duration-300 group-hover:scale-[1.01]">
          
          {/* Fila Superior: Marca, Contactless y Estatus */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Car className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-wider uppercase text-cyan-200">
                  ParkPass Digital
                </span>
                <span className="block text-[10px] text-slate-300 tracking-wider font-mono">
                  SISTEMA OFICIAL DE PARQUÍMETRO
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-white/70 rotate-90" />
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
                isParked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isParked ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
                {isParked ? 'EN ESTACIONAMIENTO' : 'TARJETA ACTIVA'}
              </div>
            </div>
          </div>

          {/* Fila Media: Chip EMV y Placas en Alto Relieve */}
          <div className="my-4 z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Chip Dorado Simulado */}
              <div className="w-11 h-8 rounded bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-100/40 shadow-inner flex items-center justify-center p-1">
                <div className="w-full h-full border border-amber-700/30 rounded-sm grid grid-cols-2 gap-0.5">
                  <div className="border-r border-b border-amber-800/30"></div>
                  <div className="border-b border-amber-800/30"></div>
                  <div className="border-r border-amber-800/30"></div>
                  <div></div>
                </div>
              </div>

              {/* Placas del Coche */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                  Placas del Vehículo
                </span>
                <div className="bg-slate-900/80 px-3.5 py-1 rounded-lg border border-cyan-400/40 shadow-inner inline-block">
                  <span className="font-mono text-xl sm:text-2xl font-black text-cyan-300 license-plate-badge tracking-wider">
                    {formatPlate(vehicle.plates)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehículo Modelo */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                Vehículo Registrado
              </span>
              <span className="font-bold text-sm text-slate-100 block">
                {vehicle.brand || 'Marca'} {vehicle.model || 'Modelo'}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {vehicle.color || 'Color'} • {vehicle.year || 'Año'}
              </span>
            </div>
          </div>

          {/* Fila Inferior: Titular, Autocobro y QR */}
          <div className="flex items-end justify-between z-10 pt-2 border-t border-white/10 flex-wrap gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Titular / Propietario
              </span>
              <span className="font-mono-card font-bold text-base tracking-wide text-white uppercase flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400 inline" />
                {owner.fullName || 'NOMBRE DEL TITULAR'}
              </span>
              <span className="text-[11px] text-slate-300 block font-mono">
                ID: {owner.idNumber || 'INE-0000000'}
              </span>
            </div>

            {/* Estado de Cobro y QR */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Modalidad Autocobro
                </span>
                {autoPay.enabled ? (
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {autoPay.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Monedero'}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-300 flex items-center gap-1 justify-end">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Desactivado
                  </span>
                )}
                <span className="text-[11px] text-cyan-300 font-mono block">
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
                className="w-11 h-11 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-lg hover:bg-cyan-50 transition transform hover:scale-105 active:scale-95"
              >
                <QrCode className="w-6 h-6 text-slate-900" />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Botones de acción rápida debajo de la tarjeta */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px]">ID TAG: {card.rfidTag}</span>
        </div>

        <div className="flex items-center gap-2">
          {autoPay.fundingSource === 'WALLET_BALANCE' && (
            <button
              onClick={() => setShowRechargeModal(true)}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Recargar Saldo
            </button>
          )}
          <button
            onClick={() => setShowQRModal(true)}
            className="text-slate-300 hover:text-white font-medium flex items-center gap-1 transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            Código QR Oficial
          </button>
        </div>
      </div>

      {/* Modal QR Oficial de Inspección */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-1">Credencial QR de Inspección</h3>
            <p className="text-xs text-slate-400 mb-6">
              Escaneable por agentes de tránsito y lectores automáticos de parquímetro
            </p>

            {/* Código QR Generado con SVG */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
              <svg className="w-48 h-48 mx-auto" viewBox="0 0 100 100">
                {/* Patrones de QR simulados vectorialmente con información auténtica */}
                <rect width="100" height="100" fill="white" />
                {/* Cuadros de esquina */}
                <rect x="5" y="5" width="26" height="26" fill="black" />
                <rect x="9" y="9" width="18" height="18" fill="white" />
                <rect x="13" y="13" width="10" height="10" fill="black" />

                <rect x="69" y="5" width="26" height="26" fill="black" />
                <rect x="73" y="9" width="18" height="18" fill="white" />
                <rect x="77" y="13" width="10" height="10" fill="black" />

                <rect x="5" y="69" width="26" height="26" fill="black" />
                <rect x="9" y="73" width="18" height="18" fill="white" />
                <rect x="13" y="77" width="10" height="10" fill="black" />

                {/* Datos matriciales de simulación */}
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

            <div className="bg-slate-800/80 rounded-xl p-3 text-left font-mono text-xs space-y-1 mb-6 border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Placas:</span>
                <span className="font-bold text-cyan-300">{vehicle.plates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Titular:</span>
                <span className="font-bold text-white truncate max-w-[170px]">{owner.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Autocobro:</span>
                <span className="font-bold text-emerald-400">{autoPay.enabled ? 'HABILITADO' : 'INACTIVO'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estatus:</span>
                <span className="font-bold text-amber-300">{isParked ? 'ESTACIONADO' : 'DISPONIBLE'}</span>
              </div>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25"
            >
              Cerrar Visualizador
            </button>
          </div>
        </div>
      )}

      {/* Modal de Recarga de Saldo */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Recargar Saldo de Parquímetro</h3>
            <p className="text-xs text-slate-400 mb-5">
              Agrega fondos inmediatos a tu Tarjeta Digital para autocobros
            </p>

            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-2">
                  Selecciona o ingresa monto (MXN)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[50, 100, 200].map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setRechargeAmount(amt)}
                      className={`py-2 rounded-lg font-bold text-sm border transition ${
                        rechargeAmount === amt
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-cyan-500/20"
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
