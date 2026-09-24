import React, { useState } from 'react';
import { 
  History, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Printer, 
  QrCode
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatDate, formatPlate } from '../utils/formatters';

export const TransactionHistory = () => {
  const { transactions, vehicle, owner } = useParking();
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <div className="bg-neutral-950/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-800 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="tracking-widest uppercase">Registro Digital</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
            <History className="w-5 h-5 text-white" />
            Historial de Autocobros y Tickets Oficiales
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Registro inmutable de todos los cobros procesados automáticamente a tu tarjeta digital
          </p>
        </div>

        <span className="text-xs font-mono text-white bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
          {transactions.length} Registros
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
          <Receipt className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-neutral-300 font-mono">No hay cobros registrados aún</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 font-mono">
            Los cargos se generarán de manera automática cada vez que ocupes y liberes un cajón de parquímetro.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase font-mono font-semibold">
                <th className="py-3 px-3">Folio / Fecha</th>
                <th className="py-3 px-3">Zona / Ubicación</th>
                <th className="py-3 px-3">Duración</th>
                <th className="py-3 px-3">Método de Cargo</th>
                <th className="py-3 px-3 text-right">Importe</th>
                <th className="py-3 px-3 text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 font-mono">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-neutral-900/60 transition">
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-white block">{txn.folio}</span>
                    <span className="text-[11px] text-neutral-400 font-mono">{formatDate(txn.date)}</span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-medium text-neutral-200">
                    {txn.zone}
                  </td>
                  <td className="py-3.5 px-3 text-neutral-300">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{txn.durationMinutes} min</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono">
                    <span className="text-[11px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800">
                      {txn.method}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-sm text-white">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedTicket(txn)}
                      className="px-3 py-1 rounded-xl bg-neutral-900 hover:bg-white hover:text-black text-neutral-300 border border-neutral-800 transition text-[11px] font-mono font-semibold inline-flex items-center gap-1 shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95">
            {/* Header del Ticket */}
            <div className="text-center pb-4 border-b border-dashed border-neutral-800">
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono font-bold block">
                COMPROBANTE OFICIAL DE AUTOCOBRO
              </span>
              <h3 className="text-base font-black text-white mt-1 font-mono">Park Digital Metropolitano</h3>
              <p className="text-xs font-mono text-neutral-400">Folio: {selectedTicket.folio}</p>
            </div>

            {/* Datos del Ticket */}
            <div className="py-4 space-y-2 text-xs font-mono border-b border-dashed border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-400">Fecha y Hora:</span>
                <span className="text-white text-[11px]">{formatDate(selectedTicket.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Titular:</span>
                <span className="text-white uppercase truncate max-w-[170px]">{owner.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Placas Registradas:</span>
                <span className="text-white font-bold">{formatPlate(selectedTicket.plate || vehicle.plates)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Vehículo:</span>
                <span className="text-white">{vehicle.brand} {vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Ubicación:</span>
                <span className="text-white text-[11px] truncate max-w-[170px]">{selectedTicket.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Tiempo Ocupado:</span>
                <span className="text-white font-bold">{selectedTicket.durationMinutes} minutos</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-800">
                <span className="text-neutral-400">Método de Cargo:</span>
                <span className="text-neutral-200 text-[10px] truncate max-w-[170px]">{selectedTicket.method}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-base font-bold">
                <span className="text-white">Total Cobrado:</span>
                <span className="text-white text-lg">{formatCurrency(selectedTicket.amount)}</span>
              </div>
            </div>

            {/* Sello Digital y QR */}
            <div className="pt-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-1.5 bg-white rounded-xl inline-block">
                  <QrCode className="w-12 h-12 text-black" />
                </div>
                <div className="text-left font-mono text-[9px] text-neutral-500 leading-tight">
                  <span className="block font-bold text-neutral-400">SELLO SAT / DIGITAL</span>
                  <span>CADENA: 09FA8-23B-987-991A</span>
                  <span className="block">VALIDADO POR INSPECCIÓN VIAL</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-neutral-800 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-3 bg-white hover:bg-neutral-200 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(255,255,255,0.2)]"
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
