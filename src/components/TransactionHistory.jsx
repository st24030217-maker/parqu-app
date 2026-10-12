import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Receipt,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Trash2,
  Navigation,
  CreditCard,
  Wifi,
  Calendar,
  FileText,
  X,
  ShieldCheck,
} from 'lucide-react';
import { animate, stagger } from 'animejs';
import { sileo } from 'sileo';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatDate, formatPlate } from '../utils/formatters';
import { AnimeCounter } from './ui/anime-counter';

const formatDurationDetailed = (minutes = 0) => {
  const totalMin = Math.max(1, Math.round(Number(minutes) || 0));
  const hrs = Math.floor(totalMin / 60);
  const remMin = totalMin % 60;
  if (hrs > 0) {
    return `${hrs}h ${String(remMin).padStart(2, '0')}m (${totalMin} min)`;
  }
  return `${totalMin} min`;
};

export const TransactionHistory = () => {
  const { transactions = [], pinnedLocations = [], removePinnedLocation, vehicle = {}, owner = {}, card = {} } = useParking();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('payments'); // 'payments' | 'locations'
  const listContainerRef = useRef(null);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedTicket(null);
      }
    };
    if (selectedTicket) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket]);

  // Animación en cascada Anime.js al cambiar entre Comprobantes y Ubicaciones
  useEffect(() => {
    if (!listContainerRef.current) return;
    const items = listContainerRef.current.querySelectorAll('.anime-history-item');
    if (items.length > 0) {
      items.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(14px)';
      });
      animate(items, {
        opacity: [0, 1],
        translateY: [14, 0],
        delay: stagger(55, { start: 40 }),
        duration: 480,
        ease: 'outExpo',
      });
    }
  }, [activeSubTab, transactions.length, pinnedLocations.length]);

  const totalSpent = transactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalMinutes = transactions.reduce((acc, curr) => acc + (Number(curr.durationMinutes) || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return (
    <section
      aria-label="Historial de Autocobros y Ubicaciones Fijadas"
      className="w-full rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.008)_100%)] bg-[#0d0d11] border border-white/[0.08] p-4 sm:p-7 text-white overflow-hidden font-sans"
    >
      {/* Cabecera Kage Studio */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-white/[0.08]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] text-[10px] font-mono font-semibold uppercase tracking-[0.14em]">
              BITACORA OFICIAL NFC & GPS
            </span>
            <span className="text-[10px] font-mono text-[#a1a1aa] bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-full font-medium">
              Tarifa Oficial $6.00/hr
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-bold text-white tracking-[-0.02em] flex items-center gap-2">
            <History className="w-5 h-5 sm:w-6 sm:h-6 text-[#a78bfa] shrink-0" />
            <span className="leading-tight">
              Historial de Autocobros & Ubicaciones Fijadas
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1 leading-relaxed">
            Detalle completo de tus estancias cobradas a $6.00/hr, comprobantes digitales NFC y puntos GPS donde estacionaste tu vehículo.
          </p>
        </div>

        {/* Resumen de Métricas Compacto */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
          <div className="rounded-xl bg-[#0a0a0d] border border-white/[0.08] px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-center sm:text-right">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#71717a] block truncate">
              Total Cobrado
            </span>
            <div className="text-sm sm:text-lg font-bold text-[#a78bfa] font-mono flex items-center justify-center sm:justify-end gap-0.5 mt-0.5">
              <AnimeCounter
                value={totalSpent}
                prefix="$"
                decimals={2}
                duration={700}
                className="font-bold text-[#a78bfa] font-mono"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#0a0a0d] border border-white/[0.08] px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-center sm:text-right">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#71717a] block truncate">
              Tiempo Total
            </span>
            <span className="text-sm sm:text-lg font-bold text-white font-mono block mt-0.5">
              {totalHours}h {String(remainingMinutes).padStart(2, '0')}m
            </span>
          </div>

          <div className="rounded-xl bg-[#0a0a0d] border border-white/[0.08] px-2.5 py-2 sm:px-3.5 sm:py-2.5 text-center sm:text-right">
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#71717a] block truncate">
              Registros
            </span>
            <span className="text-sm sm:text-lg font-bold text-[#a78bfa] font-mono block mt-0.5">
              {transactions.length} / {pinnedLocations.length} GPS
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Sub-pestañas */}
      <div
        role="tablist"
        aria-label="Sub-pestañas del historial"
        className="grid grid-cols-2 gap-2 my-4 sm:my-5 p-1 rounded-xl bg-[#0a0a0d] border border-white/[0.08]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'payments'}
          aria-controls="subtab-payments-panel"
          onClick={() => setActiveSubTab('payments')}
          className={`py-2 px-3 rounded-lg text-[11px] sm:text-xs font-sans font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'payments'
              ? 'bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.3)]'
              : 'text-[#a1a1aa] hover:text-white'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Autocobros ({transactions.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'locations'}
          aria-controls="subtab-locations-panel"
          onClick={() => setActiveSubTab('locations')}
          className={`py-2 px-3 rounded-lg text-[11px] sm:text-xs font-sans font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'locations'
              ? 'bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.3)]'
              : 'text-[#a1a1aa] hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Ubicaciones GPS ({pinnedLocations.length})</span>
        </button>
      </div>

      {/* CONTENIDO DE LA SUB-PESTAÑA ACTIVA */}
      <div ref={listContainerRef}>
        {activeSubTab === 'payments' ? (
          transactions.length === 0 ? (
            <div
              id="subtab-payments-panel"
              role="tabpanel"
              className="text-center py-10 px-4 rounded-xl bg-[#0a0a0d] border border-white/[0.08]"
            >
              <Receipt className="w-10 h-10 text-[#71717a] mx-auto mb-2.5" />
              <h4 className="text-sm font-semibold text-white">No hay autocobros registrados aún</h4>
              <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto mt-1">
                Cada vez que finalices una estancia en el parquímetro a $6.00/hr, tu recibo digital aparecerá aquí automáticamente.
              </p>
            </div>
          ) : (
            <div id="subtab-payments-panel" role="tabpanel" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {transactions.map((txn) => {
                  const plateStr = formatPlate(txn.plate || vehicle.plates || 'XYZ-7842');
                  return (
                    <div
                      key={txn.id}
                      className="anime-history-item rounded-xl bg-[#0a0a0d] hover:border-white/[0.15] border border-white/[0.08] p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition"
                    >
                      {/* Fila 1: Folio, Estado y Monto Total */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs sm:text-sm text-white bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-white/[0.08]">
                              {txn.folio}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] font-mono font-semibold text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-[#a78bfa] shrink-0" />
                              {txn.status || 'COMPLETADO'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#71717a] font-mono mt-1.5">
                            <Calendar className="w-3 h-3 text-[#71717a] shrink-0" />
                            <span className="truncate">{formatDate(txn.date)}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-[#71717a] block">
                            Importe Cobrado
                          </span>
                          <span className="font-mono font-bold text-base sm:text-lg text-[#a78bfa]">
                            {formatCurrency(txn.amount)}
                          </span>
                        </div>
                      </div>

                      {/* Fila 2: Zona de Estacionamiento */}
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717a] block">
                            Zona / Cajón de Parquímetro
                          </span>
                          <p className="text-xs sm:text-sm font-semibold text-white break-words leading-snug">
                            {txn.zone}
                          </p>
                        </div>
                      </div>

                      {/* Fila 3: Desglose de Tiempo, Placas y Tarifa */}
                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-[#0d0d11] rounded-lg p-2.5 border border-white/[0.06] text-center">
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono uppercase text-[#71717a] block">
                            Tiempo
                          </span>
                          <span className="font-mono font-semibold text-[11px] sm:text-xs text-white truncate block mt-0.5">
                            {formatDurationDetailed(txn.durationMinutes)}
                          </span>
                        </div>

                        <div className="min-w-0 border-x border-white/[0.06] px-1">
                          <span className="text-[9px] font-mono uppercase text-[#71717a] block">
                            Tarifa
                          </span>
                          <span className="font-mono font-semibold text-[11px] sm:text-xs text-[#a78bfa] block mt-0.5">
                            $6.00/hr
                          </span>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[9px] font-mono uppercase text-[#71717a] block">
                            Placas
                          </span>
                          <span className="font-mono font-semibold text-[11px] sm:text-xs text-white truncate block mt-0.5">
                            {plateStr}
                          </span>
                        </div>
                      </div>

                      {/* Fila 4: Método de Pago y Botón de Comprobante Digital */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#a1a1aa] min-w-0">
                          <CreditCard className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
                          <span className="truncate">{txn.method}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedTicket(txn)}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#9b6ff7] active:scale-95 text-white text-xs font-sans font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Comprobante</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : pinnedLocations.length === 0 ? (
          <div
            id="subtab-locations-panel"
            role="tabpanel"
            className="text-center py-10 px-4 rounded-xl bg-[#0a0a0d] border border-white/[0.08] space-y-2"
          >
            <MapPin className="w-10 h-10 text-[#71717a] mx-auto" />
            <h4 className="text-sm font-semibold text-white">
              No hay ubicaciones registradas en la bitácora
            </h4>
            <p className="text-xs text-[#a1a1aa] max-w-sm mx-auto">
              Fija tu ubicación en el mapa satelital para guardar las coordenadas exactas donde dejaste estacionado tu vehículo.
            </p>
          </div>
        ) : (
          <div
            id="subtab-locations-panel"
            role="tabpanel"
            className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
          >
            {pinnedLocations.map((item) => {
              const isItemActive = item.status === 'ACTIVA';
              const latNum = Number(item.lat || 19.4342);
              const lngNum = Number(item.lng || -99.1318);

              return (
                <div
                  key={item.id}
                  className="anime-history-item p-3.5 sm:p-5 rounded-xl bg-[#0a0a0d] border border-white/[0.08] hover:border-white/[0.15] flex flex-col justify-between gap-3.5 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                          isItemActive
                            ? 'bg-[#8b5cf6]/20 text-[#a78bfa] border-[#8b5cf6]/40 animate-pulse'
                            : 'bg-white/[0.04] text-[#a1a1aa] border-white/[0.08]'
                        }`}
                      >
                        {isItemActive ? '● AUTO ESTACIONADO AQUI' : 'ESTANCIA REGISTRADA'}
                      </span>
                      <span className="text-[11px] font-mono text-[#71717a]">
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white break-words leading-snug">
                          {item.name}
                        </h4>
                        {item.address && (
                          <p className="text-[11px] text-[#a1a1aa] mt-0.5 break-words">
                            {item.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 bg-[#0d0d11] rounded-lg p-2.5 border border-white/[0.06] text-center">
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono uppercase text-[#71717a] block">
                          GPS Lat/Lng
                        </span>
                        <span className="font-mono font-semibold text-[10px] sm:text-[11px] text-[#e4e4e7] truncate block mt-0.5">
                          {latNum.toFixed(4)}, {lngNum.toFixed(4)}
                        </span>
                      </div>

                      <div className="min-w-0 border-x border-white/[0.06] px-1">
                        <span className="text-[9px] font-mono uppercase text-[#71717a] block">
                          Placas
                        </span>
                        <span className="font-mono font-semibold text-[11px] text-white truncate block mt-0.5">
                          {formatPlate(item.plates || vehicle.plates)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="text-[9px] font-mono uppercase text-[#71717a] block">
                          Tarifa Zona
                        </span>
                        <span className="font-mono font-semibold text-[11px] text-[#a78bfa] block mt-0.5">
                          ${Number(item.ratePerHour || 6).toFixed(2)}/hr
                        </span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-[#a1a1aa] bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                        Nota: {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                    <a
                      href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-lg bg-[#8b5cf6] hover:bg-[#9b6ff7] text-xs font-sans font-semibold text-white flex items-center justify-center gap-1.5 transition"
                    >
                      <Navigation className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Cómo Llegar a mi Auto</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                    </a>

                    <button
                      type="button"
                      aria-label={`Eliminar ubicación ${item.name}`}
                      onClick={() => {
                        removePinnedLocation(item.id);
                        sileo.info({
                          title: 'Ubicación Eliminada',
                          description: 'El registro GPS fue removido de tu bitácora.',
                        });
                      }}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-[#a1a1aa] hover:text-rose-400 border border-white/[0.08] transition cursor-pointer shrink-0"
                      title="Eliminar de la bitácora"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Comprobante Digital NFC */}
      {selectedTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-[#0d0d11] text-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-white/[0.08] relative">
            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              aria-label="Cerrar comprobante"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#a1a1aa] hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-white/[0.12]">
              <div className="w-11 h-11 rounded-xl bg-[#8b5cf6] text-white flex items-center justify-center mx-auto mb-2.5 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#a78bfa] font-mono font-semibold block">
                COMPROBANTE OFICIAL DE AUTOCOBRO
              </span>
              <h3 id="ticket-modal-title" className="text-base font-bold text-white mt-0.5">
                Parqu • Pase Digital NFC
              </h3>
              <p className="text-xs text-[#a1a1aa] font-mono mt-0.5">
                Folio: <span className="font-bold text-white">{selectedTicket.folio}</span>
              </p>
            </div>

            <div className="py-4 space-y-2.5 text-xs border-b border-dashed border-white/[0.12]">
              <div className="flex justify-between gap-2">
                <span className="text-[#a1a1aa]">Fecha y Hora:</span>
                <span className="text-white font-mono font-semibold text-right">
                  {formatDate(selectedTicket.date)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#a1a1aa]">Titular:</span>
                <span className="text-white font-semibold text-right truncate max-w-[180px]">
                  {owner.fullName}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#a1a1aa]">Vehículo y Placas:</span>
                <span className="text-white font-mono font-semibold text-right">
                  {vehicle.brand} {vehicle.model} • {formatPlate(selectedTicket.plate || vehicle.plates)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#a1a1aa]">Zona / Espacio:</span>
                <span className="text-white font-semibold text-right max-w-[190px]">
                  {selectedTicket.zone}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#a1a1aa]">Tiempo Ocupado:</span>
                <span className="text-white font-mono font-semibold">
                  {formatDurationDetailed(selectedTicket.durationMinutes)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#a1a1aa]">Tarifa Oficial:</span>
                <span className="text-[#a78bfa] font-mono font-semibold">$6.00 MXN / hora</span>
              </div>
              <div className="flex justify-between gap-2 pt-2 border-t border-white/[0.06]">
                <span className="text-[#a1a1aa]">Método de Cargo:</span>
                <span className="text-[#e4e4e7] font-medium text-right max-w-[185px]">
                  {selectedTicket.method}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 text-base font-bold">
                <span className="text-white">Total Cobrado:</span>
                <span className="text-[#a78bfa] text-lg font-mono">
                  {formatCurrency(selectedTicket.amount)}
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="rounded-xl bg-[#0a0a0d] border border-white/[0.08] p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center shrink-0">
                    <Wifi className="w-4 h-4 rotate-90" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717a] block">
                      SELLO DIGITAL CONTACTLESS
                    </span>
                    <span className="font-mono font-semibold text-xs text-white truncate block">
                      {card?.rfidTag || 'NFC-MX-09142-PK'}
                    </span>
                  </div>
                </div>
                <ShieldCheck className="w-5 h-5 text-[#a78bfa] shrink-0" />
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-full h-10 rounded-lg bg-[#8b5cf6] hover:bg-[#9b6ff7] text-white font-semibold text-xs transition cursor-pointer"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TransactionHistory;
