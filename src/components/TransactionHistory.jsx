import React, { useState } from 'react';
import { 
  History, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Car, 
  ExternalLink, 
  Printer, 
  QrCode,
  Download
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatDate, formatPlate } from '../utils/formatters';

export const TransactionHistory = () => {
  const { transactions, vehicle, owner } = useParking();
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Historial de Autocobros y Tickets Oficiales
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro inmutable de todos los cobros procesados automáticamente a tu tarjeta digital
          </p>
        </div>

        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
          {transactions.length} Registros
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No hay cobros registrados aún</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Los cargos se generarán de manera automática cada vez que ocupes y liberes un cajón de parquímetro.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-3">Folio / Fecha</th>
                <th className="py-3 px-3">Zona / Ubicación</th>
                <th className="py-3 px-3">Duración</th>
                <th className="py-3 px-3">Método de Cargo</th>
                <th className="py-3 px-3 text-right">Importe</th>
                <th className="py-3 px-3 text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-cyan-300 block">{txn.folio}</span>
                    <span className="text-[11px] text-slate-400 font-sans">{formatDate(txn.date)}</span>
                  </td>
                  <td className="py-3.5 px-3 font-sans font-medium text-slate-200">
                    {txn.zone}
                  </td>
                  <td className="py-3.5 px-3 text-slate-300">
                    <div className="flex items-center gap-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{txn.durationMinutes} min</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-sans">
                    <span className="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {txn.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-sm text-emerald-400">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedTicket(txn)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition text-[11px] font-sans font-semibold inline-flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Ticket / Comprobante Digital */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            {/* Header del Ticket */}
            <div className="text-center pb-4 border-b border-dashed border-slate-700">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold block">
                COMPROBANTE OFICIAL DE AUTOCOBRO
              </span>
              <h3 className="text-base font-bold text-white mt-1">Parquímetro Digital Metropolitano</h3>
              <p className="text-xs font-mono text-slate-400">Folio: {selectedTicket.folio}</p>
            </div>

            {/* Datos del Ticket */}
            <div className="py-4 space-y-2 text-xs font-mono border-b border-dashed border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha y Hora:</span>
                <span className="text-white font-sans text-[11px]">{formatDate(selectedTicket.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Titular:</span>
                <span className="text-white uppercase truncate max-w-[170px]">{owner.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Placas Registradas:</span>
                <span className="text-cyan-300 font-bold">{formatPlate(selectedTicket.plate || vehicle.plates)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehículo:</span>
                <span className="text-white">{vehicle.brand} {vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ubicación:</span>
                <span className="text-white text-[11px] truncate max-w-[170px]">{selectedTicket.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tiempo Ocupado:</span>
                <span className="text-white font-bold">{selectedTicket.durationMinutes} minutos</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Método de Cargo:</span>
                <span className="text-slate-200 text-[10px] truncate max-w-[170px]">{selectedTicket.method}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-base font-bold">
                <span className="text-white">Total Cobrado:</span>
                <span className="text-emerald-400 text-lg">{formatCurrency(selectedTicket.amount)}</span>
              </div>
            </div>

            {/* Sello Digital y QR */}
            <div className="pt-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-1.5 bg-white rounded-lg inline-block">
                  <QrCode className="w-12 h-12 text-slate-900" />
                </div>
                <div className="text-left font-mono text-[9px] text-slate-500 leading-tight">
                  <span className="block font-bold text-slate-400">SELLO SAT / DIGITAL</span>
                  <span>CADENA: 09FA8-23B-987-991A</span>
                  <span className="block">VALIDADO POR INSPECCIÓN VIAL</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
