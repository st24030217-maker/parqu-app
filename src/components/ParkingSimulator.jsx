import React, { useState } from 'react';
import { sileo } from 'sileo';
import { 
  MapPin, 
  Clock, 
  Zap, 
  CheckCircle, 
  Car, 
  Play, 
  Square, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { CurrencyDollarIcon } from './icons/currency-dollar-icon';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatTimeFromSeconds, formatPlate } from '../utils/formatters';
import { WobbleCard } from './ui/wobble-card';
import { ParkingMap } from './ParkingMap';
import { AnimeCounter } from './ui/anime-counter';

const DEFAULT_SPOT = { id: 'SPOT_1042', name: 'Espacio #1042', spotNumber: '1042', ratePerHour: 6.00 };

export const ParkingMeter = () => {
  const { 
    vehicle, 
    owner, 
    activeSession, 
    startParking, 
    stopParkingAndAutoCharge, 
    autoPay,
  } = useParking();

  const [selectedZone, setSelectedZone] = useState(DEFAULT_SPOT);
  const [justChargedNotice, setJustChargedNotice] = useState(null);

  const handleStart = (zoneParam = null) => {
    const targetZone = (zoneParam && zoneParam.name) ? zoneParam : selectedZone;
    const coords = (targetZone.lat && targetZone.lng) ? { lat: targetZone.lat, lng: targetZone.lng } : null;
    startParking(targetZone.name, targetZone.ratePerHour || 6.00, coords);
    setJustChargedNotice(null);
    sileo.info({
      title: 'Parquímetro Activado',
      description: `Estacionamiento registrado en ${targetZone.name}. Autocobro activo para ${vehicle.plates}.`,
    });
  };

  const handleStop = () => {
    const receipt = stopParkingAndAutoCharge();
    if (receipt) {
      setJustChargedNotice(receipt);
      sileo.success({
        title: 'Autocobro Liquidado',
        description: `Cobro de ${formatCurrency(receipt.amount)} (${receipt.durationMinutes} min) procesado con éxito. Folio: ${receipt.folio}`,
      });
    }
  };

  return (
    <WobbleCard
      containerClassName="w-full bg-[#0d0d11] text-white border border-white/[0.08] shadow-none transition-colors"
      className="p-4 sm:p-8 flex flex-col justify-between"
    >
      {/* Encabezado Wobble Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-5 border-b border-white/[0.08] mb-4 sm:mb-6 gap-2.5 sm:gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#a78bfa]">
              TECNOLOGÍA SSS.SOLUTIONS
            </span>
            <span className="text-white/20 text-xs font-mono">•</span>
            <span className="text-[10px] sm:text-[11px] font-mono text-[#a1a1aa]">SESIÓN EN VIVO</span>
          </div>
          <h2 className="text-lg sm:text-3xl font-bold text-white tracking-[-0.02em] flex items-center gap-2 sm:gap-2.5">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#a78bfa]" />
            Parquímetro Metropolitano en Vivo
          </h2>
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1 font-sans max-w-2xl leading-relaxed">
            Control y cobro automático a $6.00/hr en parquímetros metropolitanos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSession ? (
            <span className="flex items-center gap-2 text-xs font-semibold font-mono text-[#a78bfa] bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 px-3.5 py-1.5 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
              Estacionamiento Activo
            </span>
          ) : (
            <span className="text-xs font-medium font-sans text-[#e4e4e7] bg-white/[0.04] px-3.5 py-1.5 rounded-full border border-white/[0.08] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
              Listo para Estacionar
            </span>
          )}
        </div>
      </div>

      {/* Notificación de Autocobro Ejecutado */}
      {justChargedNotice && !activeSession && (
        <div className="mb-6 p-4 sm:p-5 rounded-xl bg-[#0a0a0d] border border-white/[0.08] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-[#a78bfa]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                  ¡Autocobro Liquidado con Éxito!
                  <span className="text-xs font-normal text-[#e4e4e7] bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08] font-mono">
                    Folio: {justChargedNotice.folio}
                  </span>
                </h4>
                <p className="text-xs text-[#a1a1aa] mt-1 font-sans">
                  Se ha cobrado <strong className="text-white font-bold font-mono">{formatCurrency(justChargedNotice.amount)}</strong> a través de{' '}
                  <strong className="text-[#e4e4e7] underline decoration-white/30">{justChargedNotice.method}</strong> por un tiempo de{' '}
                  <strong className="text-white font-bold font-mono">{justChargedNotice.durationMinutes} min</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Cerrar notificación de autocobro"
              onClick={() => setJustChargedNotice(null)}
              className="text-xs text-[#a1a1aa] hover:text-white px-2 py-1 font-sans transition cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cuando está ESTACIONADO */}
      {activeSession ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#0a0a0d] border border-white/[0.08] rounded-xl sm:rounded-2xl p-4 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8b5cf6]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
              {/* Cronómetro en Vivo */}
              <div className="text-center md:text-left">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#a1a1aa] block mb-1 font-mono">
                  Tiempo Transcurrido
                </span>
                <div className="font-mono text-3xl sm:text-5xl font-bold text-white tracking-wider">
                  {formatTimeFromSeconds(activeSession.secondsElapsed)}
                </div>
                <span className="text-xs text-[#71717a] mt-1 block font-mono">
                  Inicio: {new Date(activeSession.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Monto Acumulado en Vivo */}
              <div className="text-center md:text-left py-2 md:py-0 md:px-6">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#a1a1aa] block mb-1 font-mono">
                  Monto a Cobrar (Autocobro)
                </span>
                <div className="font-mono text-3xl sm:text-5xl font-bold text-[#a78bfa]">
                  <AnimeCounter
                    value={activeSession.currentCost}
                    prefix="$"
                    decimals={2}
                    duration={400}
                    className="font-mono text-3xl sm:text-5xl font-bold text-[#a78bfa]"
                  />
                </div>
                <div className="text-xs text-[#a1a1aa] mt-1 flex items-center justify-center md:justify-start gap-1.5 font-mono">
                  <CurrencyDollarIcon size={14} className="text-[#a78bfa] inline shrink-0" />
                  <span>Tarifa: {formatCurrency(activeSession.ratePerHour)}/hr</span>
                </div>
              </div>

              {/* Detalles de la Detección y Vehículo */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-0">
                  <span className="text-[#71717a]">Ubicación / Espacio:</span>
                  <span className="font-semibold text-white truncate max-w-[160px]">{activeSession.zoneName}</span>
                </div>
                <div className="flex justify-between py-1 border-0">
                  <span className="text-[#71717a]">Placas del Coche:</span>
                  <span className="font-bold text-white">{formatPlate(vehicle.plates)}</span>
                </div>
                <div className="flex justify-between py-1 border-0">
                  <span className="text-[#71717a]">Método de Cargo:</span>
                  <span className="font-semibold text-white">
                    {autoPay.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Tarjeta'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#71717a]">Tope de Seguridad:</span>
                  <span className="text-white">{formatCurrency(activeSession.maxLimit)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Salir y Ejecutar Autocobro */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-[#0a0a0d] border border-white/[0.08]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white flex items-center justify-center">
                <Car className="w-5 h-5 text-[#a78bfa]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-sans">¿Listo para salir?</h4>
                <p className="text-xs text-[#a1a1aa] mt-0.5 font-sans">
                  El sistema detectará la salida y liquidará el monto sin filas ni demoras.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Liberar estacionamiento y liquidar autocobro"
              onClick={handleStop}
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-[#8b5cf6] hover:bg-[#9b6ff7] text-white font-semibold font-sans text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition transform active:scale-95 cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
            >
              <Square className="w-4 h-4 fill-current text-white" />
              Liberar Estacionamiento & Liquidar Autocobro
            </button>
          </div>
        </div>
      ) : (
        /* Cuando NO está estacionado */
        <div className="space-y-6">
          <div>
            <ParkingMap
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              onStartSession={handleStart}
              onStopSession={handleStop}
              activeSession={activeSession}
            />
          </div>

          {/* Resumen del Vehículo y Autocobro antes de iniciar */}
          <div className="p-5 rounded-xl bg-[#0a0a0d] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#a78bfa] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#a78bfa]" />
              </div>
              <div className="text-left font-sans">
                <span className="text-xs text-[#a1a1aa] block">Vehículo listo para autocobro:</span>
                <span className="text-sm font-bold text-white">
                  {vehicle.brand} {vehicle.model} (<span className="font-mono">{formatPlate(vehicle.plates)}</span>) • {owner.fullName}
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-label="Registrar estacionamiento y activar parquímetro"
              onClick={() => handleStart(selectedZone)}
              className="w-full sm:w-auto px-5 py-3 rounded-lg bg-[#8b5cf6] hover:bg-[#9b6ff7] text-white font-semibold font-sans text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(139,92,246,0.35)] transition transform active:scale-95 cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              Registrar Estacionamiento
            </button>
          </div>
        </div>
      )}
    </WobbleCard>
  );
};

export const ParkingSimulator = ParkingMeter;
export default ParkingMeter;
