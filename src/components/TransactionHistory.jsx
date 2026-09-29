import React, { useState } from 'react';
import { 
  History, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Printer, 
  QrCode, 
  Sparkles, 
  TrendingUp, 
  CreditCard,
  MapPin,
  Bookmark,
  ExternalLink,
  Trash2,
  Navigation
} from 'lucide-react';
import { sileo } from 'sileo';
import { CurrencyDollarIcon } from './icons/currency-dollar-icon';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatDate, formatPlate } from '../utils/formatters';
import { WobbleCard } from './ui/wobble-card';
import { AnimeCounter } from './ui/anime-counter';

export const TransactionHistory = () => {
  const { transactions, pinnedLocations, removePinnedLocation, vehicle, owner } = useParking();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('payments'); // 'payments' | 'locations'

  const totalSpent = transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <WobbleCard
      containerClassName="w-full bg-gradient-to-br from-[#01033E]/70 via-[#01033E]/40 to-transparent border-white/10 hover:border-[#807DFE]/30 backdrop-blur-xl backdrop-saturate-150 transition-colors shadow-2xl"
      className="p-6 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#0033FF]/20 border border-[#807DFE]/40 text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4D6E6]">
              BITÁCORA OFICIAL CFDI & REGISTRO GPS
            </span>
            <span className="text-[#D4D6E6]/60 text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-[#D4D6E6]">TECNOLOGÍA SSS.SOLUTIONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#D4D6E6] tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#D4D6E6]" />
            Historial de Autocobros & Ubicaciones Fijadas
          </h2>
          <p className="text-xs sm:text-sm text-[#D4D6E6] mt-1 font-mono max-w-2xl leading-relaxed">
            Registro inmutable de cargos de parquímetro y bitácora satelital de ubicaciones donde has fijado tu vehículo.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#D4D6E6] block">Total Acumulado</span>
            <span className="text-lg font-black text-emerald-400 flex items-center justify-end gap-1">
              <CurrencyDollarIcon size={16} className="text-emerald-400" />
              <AnimeCounter
                value={totalSpent}
                prefix="$"
                decimals={2}
                duration={700}
                className="text-lg font-black text-emerald-400"
              />
            </span>
          </div>
          <span className="text-xs font-mono text-[#D4D6E6] bg-white/8 backdrop-blur-sm border border-white/10 px-3.5 py-1.5 rounded-full">
            {transactions.length} Cobros • {pinnedLocations.length} Ubicaciones
          </span>
        </div>
      </div>

      {/* Selector de sub-pestañas: Comprobantes de Pago vs Ubicaciones Fijadas */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveSubTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeSubTab === 'payments'
              ? 'bg-[#0033FF] text-white shadow-[0_0_15px_rgba(0,51,255,0.4)]'
              : 'bg-white/5 text-[#D4D6E6]/70 hover:text-white border border-white/10 hover:bg-white/8'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Comprobantes de Pago ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('locations')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeSubTab === 'locations'
              ? 'bg-[#0033FF] text-white shadow-[0_0_15px_rgba(0,51,255,0.4)]'
              : 'bg-white/5 text-[#D4D6E6]/70 hover:text-white border border-white/10 hover:bg-white/8'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>📍 Registro de Ubicaciones GPS ({pinnedLocations.length})</span>
        </button>
      </div>

      {/* CONTENIDO SEGÚN LA SUB-PESTAÑA SELECCIONADA */}
      {activeSubTab === 'payments' ? (
        transactions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm">
            <Receipt className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-neutral-300 font-mono">No hay cobros registrados aún</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 font-mono">
              Los cargos se generarán de manera automática cada vez que utilices un parquímetro y liberes tu estacionamiento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400 uppercase font-mono font-semibold bg-white/5">
                  <th className="py-3.5 px-4">Folio / Fecha</th>
                  <th className="py-3.5 px-4">Zona / Ubicación</th>
                  <th className="py-3.5 px-4">Duración</th>
                  <th className="py-3.5 px-4">Método de Cargo</th>
                  <th className="py-3.5 px-4 text-right">Importe</th>
                  <th className="py-3.5 px-4 text-center">Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 font-mono">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-neutral-900/50 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{txn.folio}</span>
                      <span className="text-[11px] text-neutral-400 font-mono">{formatDate(txn.date)}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-neutral-200">
                      {txn.zone}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>{txn.durationMinutes} min</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-[11px] text-neutral-300 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
                        {txn.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-sm text-emerald-400 font-mono">
                      <span className="inline-flex items-center gap-1 justify-end">
                        <CurrencyDollarIcon size={13} className="text-emerald-400 inline shrink-0" />
                        <span>{formatCurrency(txn.amount)}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedTicket(txn)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/8 backdrop-blur-sm hover:bg-[#0033FF] hover:text-white text-[#D4D6E6] border border-white/10 transition text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Ver Comprobante
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* BITÁCORA DE UBICACIONES GPS FIJADAS */
        pinnedLocations.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm space-y-2 font-mono">
            <MapPin className="w-12 h-12 text-neutral-600 mx-auto" />
            <h4 className="text-sm font-semibold text-neutral-300">No hay ubicaciones registradas en la bitácora</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Fija tu ubicación en el mapa satelital para guardar un registro de dónde dejaste estacionado tu vehículo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            {pinnedLocations.map((item) => {
              const isItemActive = item.status === 'ACTIVA';
              return (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-amber-400/30 transition-all flex flex-col justify-between space-y-4 shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isItemActive
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50 animate-pulse'
                          : 'bg-white/8 text-neutral-400 border border-neutral-800'
                      }`}>
                        {isItemActive ? '● AUTO ESTACIONADO AQUÍ' : 'HISTÓRICO'}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{item.name}</span>
                    </h4>

                    <div className="text-xs text-neutral-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Coordenadas:</span>
                        <span className="text-amber-300 font-bold">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Vehículo:</span>
                        <span className="text-white font-bold">{formatPlate(item.plates || vehicle.plates)}</span>
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-neutral-500 italic pt-1 border-t border-white/8">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/8">
                    <a
                      href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-400" />
                      <span>Cómo Llegar a mi Auto</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        removePinnedLocation(item.id);
                        sileo.info({
                          title: 'Registro Eliminado',
                          description: 'Ubicación removida de tu bitácora.',
                        });
                      }}
                      className="p-2 rounded-xl bg-neutral-900 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition"
                      title="Eliminar de la bitácora"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal de Ticket / Comprobante Digital */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#01033E]/90 backdrop-blur-2xl border border-[#807DFE]/30 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(0,51,255,0.3)] relative animate-in fade-in zoom-in-95">
            {/* Header del Ticket */}
            <div className="text-center pb-4 border-b border-dashed border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-[#0033FF] text-white flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(0,51,255,0.5)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#807DFE] font-mono font-bold block">
                COMPROBANTE OFICIAL DE AUTOCOBRO
              </span>
              <h3 className="text-base font-black text-white mt-1 font-mono">Parqu Digital Metropolitano</h3>
              <p className="text-xs font-mono text-[#D4D6E6]/80">Folio: {selectedTicket.folio}</p>
            </div>

            {/* Datos del Ticket */}
            <div className="py-4 space-y-2 text-xs font-mono border-b border-dashed border-white/10">
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Fecha y Hora:</span>
                <span className="text-white text-[11px]">{formatDate(selectedTicket.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Titular:</span>
                <span className="text-white uppercase truncate max-w-[170px]">{owner.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Placas Registradas:</span>
                <span className="text-white font-bold">{formatPlate(selectedTicket.plate || vehicle.plates)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Vehículo:</span>
                <span className="text-white">{vehicle.brand} {vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Ubicación:</span>
                <span className="text-white text-[11px] truncate max-w-[170px]">{selectedTicket.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#D4D6E6]/70">Tiempo Ocupado:</span>
                <span className="text-white font-bold">{selectedTicket.durationMinutes} minutos</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-[#D4D6E6]/70">Método de Cargo:</span>
                <span className="text-[#D4D6E6] text-[10px] truncate max-w-[170px]">{selectedTicket.method}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-base font-bold">
                <span className="text-white">Total Cobrado:</span>
                <span className="text-emerald-400 text-lg">{formatCurrency(selectedTicket.amount)}</span>
              </div>
            </div>

            {/* Footer con Código QR */}
            <div className="pt-4 flex flex-col items-center justify-center space-y-3">
              <div className="p-2 bg-white rounded-xl shadow-inner">
                <svg className="w-16 h-16" viewBox="0 0 100 100">
                  <rect x="5" y="5" width="26" height="26" fill="#01033E" />
                  <rect x="9" y="9" width="18" height="18" fill="#ffffff" />
                  <rect x="13" y="13" width="10" height="10" fill="#01033E" />
                  <rect x="69" y="5" width="26" height="26" fill="#01033E" />
                  <rect x="73" y="9" width="18" height="18" fill="#ffffff" />
                  <rect x="77" y="13" width="10" height="10" fill="#01033E" />
                  <rect x="5" y="69" width="26" height="26" fill="#01033E" />
                  <rect x="9" y="73" width="18" height="18" fill="#ffffff" />
                  <rect x="13" y="77" width="10" height="10" fill="#01033E" />
                  <rect x="36" y="10" width="8" height="8" fill="#01033E" />
                  <rect x="48" y="10" width="6" height="6" fill="#01033E" />
                  <rect x="36" y="24" width="6" height="6" fill="#01033E" />
                  <rect x="46" y="20" width="10" height="10" fill="#01033E" />
                  <rect x="10" y="38" width="6" height="6" fill="#01033E" />
                  <rect x="20" y="44" width="8" height="8" fill="#01033E" />
                  <rect x="35" y="40" width="30" height="20" fill="#01033E" />
                  <rect x="40" y="45" width="20" height="10" fill="#ffffff" />
                  <rect x="70" y="40" width="8" height="8" fill="#01033E" />
                  <rect x="82" y="48" width="6" height="6" fill="#01033E" />
                  <rect x="38" y="70" width="8" height="8" fill="#01033E" />
                  <rect x="50" y="76" width="12" height="12" fill="#01033E" />
                  <rect x="68" y="70" width="6" height="6" fill="#01033E" />
                  <rect x="78" y="80" width="10" height="10" fill="#01033E" />
                </svg>
              </div>
              <span className="text-[10px] text-[#D4D6E6]/80 font-mono tracking-wider text-center">
                Sello Digital CFDI • Tecnología SSS.Solutions
              </span>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-2.5 rounded-xl bg-[#0033FF] hover:bg-[#2250ff] text-white font-bold font-mono text-xs transition shadow-[0_0_15px_rgba(0,51,255,0.4)]"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </WobbleCard>
  );
};

export default TransactionHistory;
