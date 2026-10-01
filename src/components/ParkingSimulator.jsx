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

const DEFAULT_SPOT = { id: 'SPOT_1042', name: 'Espacio #1042', spotNumber: '1042', ratePerHour: 18.00 };

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
    startParking(targetZone.name, targetZone.ratePerHour || 18.00, coords);
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
      containerClassName="w-full bg-gradient-to-br from-[#01033E] via-[#01033E] to-[#02052b] border border-slate-200/80 shadow-2xl transition-colors"
      className="p-6 sm:p-8 flex flex-col justify-between"
    >
      {/* Encabezado Wobble Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#0033FF]/20 border border-[#807DFE]/40 text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4D6E6]">
              TECNOLOGÍA SSS.SOLUTIONS
            </span>
            <span className="text-[#D4D6E6]/60 text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-[#D4D6E6]">SESIÓN EN VIVO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#D4D6E6] tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-[#807DFE]" />
            Parquímetro Metropolitano en Vivo
          </h2>
          <p className="text-xs sm:text-sm text-[#D4D6E6] mt-1 font-sans max-w-2xl leading-relaxed">
            Control y cobro automático segundo a segundo en parquímetros metropolitanos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSession ? (
            <span className="flex items-center gap-2 text-xs font-bold font-mono text-amber-300 bg-amber-500/10 border border-amber-500/40 px-4 py-1.5 rounded-full animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Estacionamiento Activo
            </span>
          ) : (
            <span className="text-xs font-medium font-sans text-neutral-300 bg-white/8 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Listo para Estacionar
            </span>
          )}
        </div>
      </div>

      {/* Notificación de Autocobro Ejecutado */}
      {justChargedNotice && !activeSession && (
        <div className="mb-6 p-5 rounded-2xl bg-black border border-neutral-800 shadow-[0_0_35px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                  ¡Autocobro Liquidado con Éxito!
                  <span className="text-xs font-normal text-white bg-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-700 font-mono">
                    Folio: {justChargedNotice.folio}
                  </span>
                </h4>
                <p className="text-xs text-neutral-300 mt-1 font-sans">
                  Se ha cobrado <strong className="text-white font-bold font-mono">{formatCurrency(justChargedNotice.amount)}</strong> a través de{' '}
                  <strong className="text-neutral-100 underline decoration-neutral-500">{justChargedNotice.method}</strong> por un tiempo de{' '}
                  <strong className="text-white font-bold font-mono">{justChargedNotice.durationMinutes} min</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Cerrar notificación de autocobro"
              onClick={() => setJustChargedNotice(null)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 font-sans transition cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cuando está ESTACIONADO */}
      {activeSession ? (
        <div className="space-y-6">
          <div className="bg-[#01033E]/60 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0033FF]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Cronómetro en Vivo */}
              <div className="text-center md:text-left">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#D4D6E6] block mb-1 font-mono">
                  Tiempo Transcurrido
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-black text-[#D4D6E6] tracking-wider drop-shadow-[0_0_20px_rgba(212,214,230,0.2)]">
                  {formatTimeFromSeconds(activeSession.secondsElapsed)}
                </div>
                <span className="text-xs text-[#D4D6E6]/70 mt-1 block font-mono">
                  Inicio: {new Date(activeSession.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Monto Acumulado en Vivo */}
              <div className="text-center md:text-left border-y md:border-y-0 md:border-x border-white/10 py-4 md:py-0 md:px-6">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#D4D6E6] block mb-1 font-mono">
                  Monto a Cobrar (Autocobro)
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-black text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]">
                  <AnimeCounter
                    value={activeSession.currentCost}
                    prefix="$"
                    decimals={2}
                    duration={400}
                    className="font-mono text-4xl sm:text-5xl font-black text-emerald-400"
                  />
                </div>
                <div className="text-xs text-[#D4D6E6] mt-1 flex items-center justify-center md:justify-start gap-1.5 font-mono">
                  <CurrencyDollarIcon size={14} className="text-amber-400 inline shrink-0" />
                  <span>Tarifa: {formatCurrency(activeSession.ratePerHour)}/hr</span>
                </div>
              </div>

              {/* Detalles de la Detección y Vehículo */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#D4D6E6]">Ubicación / Espacio:</span>
                  <span className="font-semibold text-[#D4D6E6] truncate max-w-[160px]">{activeSession.zoneName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#D4D6E6]">Placas del Coche:</span>
                  <span className="font-bold text-[#D4D6E6]">{formatPlate(vehicle.plates)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-[#D4D6E6]">Método de Cargo:</span>
                  <span className="font-semibold text-[#D4D6E6]">
                    {autoPay.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Tarjeta'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#D4D6E6]">Tope de Seguridad:</span>
                  <span className="text-[#D4D6E6]">{formatCurrency(activeSession.maxLimit)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Salir y Ejecutar Autocobro */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center">
                <Car className="w-5 h-5 text-[#D4D6E6]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-sans">¿Listo para salir?</h4>
                <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                  El sistema detectará la salida y liquidará el monto sin filas ni demoras.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Liberar estacionamiento y liquidar autocobro"
              onClick={handleStop}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0033FF] hover:bg-[#2250ff] text-white font-bold font-sans text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,51,255,0.6)] transition transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#01033E]"
            >
              <Square className="w-4 h-4 fill-current text-rose-500" />
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
          <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-[#D4D6E6] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left font-sans">
                <span className="text-xs text-[#D4D6E6]/80 block">Vehículo listo para autocobro:</span>
                <span className="text-sm font-bold text-[#D4D6E6]">
                  {vehicle.brand} {vehicle.model} (<span className="font-mono">{formatPlate(vehicle.plates)}</span>) • {owner.fullName}
                </span>
              </div>
            </div>

            <button
              type="button"
              aria-label="Registrar estacionamiento y activar parquímetro"
              onClick={() => handleStart(selectedZone)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0033FF] hover:bg-[#2250ff] text-white font-bold font-sans text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,51,255,0.6)] transition transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#01033E]"
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
