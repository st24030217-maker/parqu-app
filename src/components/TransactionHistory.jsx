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
  CreditCard
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatDate, formatPlate } from '../utils/formatters';
import { WobbleCard } from './ui/wobble-card';

export const TransactionHistory = () => {
  const { transactions, vehicle, owner } = useParking();
  const [selectedTicket, setSelectedTicket] = useState(null);

  const totalSpent = transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <WobbleCard
      containerClassName="w-full bg-gradient-to-br from-blue-950/70 via-neutral-950 to-black border-blue-900/40 hover:border-blue-500/60 transition-colors shadow-2xl"
      className="p-6 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-800/80 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-[10px] font-mono font-bold uppercase tracking-widest text-blue-200">
              BITÁCORA OFICIAL CFDI
            </span>
            <span className="text-neutral-500 text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-neutral-400">TECNOLOGÍA SSS.SOLUTIONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-blue-400" />
            Historial de Autocobros & Comprobantes
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 font-mono max-w-2xl leading-relaxed">
            Registro inmutable de todos los cargos de parquímetro liquidados automáticamente.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Total Acumulado</span>
            <span className="text-lg font-black text-emerald-400">{formatCurrency(totalSpent)}</span>
          </div>
          <span className="text-xs font-mono text-white bg-neutral-900/90 border border-neutral-800 px-3.5 py-1.5 rounded-full">
            {transactions.length} Registros
          </span>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-3xl bg-neutral-950/50">
          <Receipt className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-neutral-300 font-mono">No hay cobros registrados aún</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 font-mono">
            Los cargos se generarán de manera automática cada vez que ocupes y liberes un cajón de parquímetro.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase font-mono font-semibold bg-neutral-900/50">
                <th className="py-3.5 px-4">Folio / Fecha</th>
                <th className="py-3.5 px-4">Zona / Ubicación</th>
                <th className="py-3.5 px-4">Duración</th>
                <th className="py-3.5 px-4">Método de Cargo</th>
                <th className="py-3.5 px-4 text-right">Importe</th>
                <th className="py-3.5 px-4 text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
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
                  <td className="py-3.5 px-4 text-right font-bold text-sm text-emerald-400">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedTicket(txn)}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-white hover:text-black text-neutral-200 border border-neutral-800 transition text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 shadow-sm"
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
              <h3 className="text-base font-black text-white mt-1 font-mono">Parqu Digital Metropolitano</h3>
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
                <span className="text-emerald-400 text-lg">{formatCurrency(selectedTicket.amount)}</span>
              </div>
            </div>

            {/* Footer con Código QR */}
            <div className="pt-4 flex flex-col items-center justify-center space-y-3">
              <div className="p-2 bg-white rounded-xl shadow-inner">
                <svg className="w-16 h-16" viewBox="0 0 100 100">
                  <rect x="5" y="5" width="26" height="26" fill="black" />
                  <rect x="9" y="9" width="18" height="18" fill="white" />
                  <rect x="13" y="13" width="10" height="10" fill="black" />
                  <rect x="69" y="5" width="26" height="26" fill="black" />
                  <rect x="73" y="9" width="18" height="18" fill="white" />
                  <rect x="77" y="13" width="10" height="10" fill="black" />
                  <rect x="5" y="69" width="26" height="26" fill="black" />
                  <rect x="9" y="73" width="18" height="18" fill="white" />
                  <rect x="13" y="77" width="10" height="10" fill="black" />
                  <rect x="36" y="10" width="8" height="8" fill="black" />
                  <rect x="48" y="10" width="6" height="6" fill="black" />
                  <rect x="36" y="24" width="6" height="6" fill="black" />
                  <rect x="46" y="20" width="10" height="10" fill="black" />
                  <rect x="10" y="38" width="6" height="6" fill="black" />
                  <rect x="20" y="44" width="8" height="8" fill="black" />
                  <rect x="35" y="40" width="30" height="20" fill="black" />
                  <rect x="40" y="45" width="20" height="10" fill="white" />
                  <rect x="70" y="40" width="8" height="8" fill="black" />
                  <rect x="82" y="48" width="6" height="6" fill="black" />
                  <rect x="38" y="70" width="8" height="8" fill="black" />
                  <rect x="50" y="76" width="12" height="12" fill="black" />
                  <rect x="68" y="70" width="6" height="6" fill="black" />
                  <rect x="78" y="80" width="10" height="10" fill="black" />
                </svg>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono tracking-wider text-center">
                Sello Digital CFDI • Tecnología SSS.Solutions
              </span>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-2.5 rounded-xl bg-white text-black font-bold font-mono text-xs hover:bg-neutral-200 transition"
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
