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
  ShieldCheck
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatTimeFromSeconds, formatPlate } from '../utils/formatters';

const PARKING_ZONES = [
  { id: 'Z1', name: 'Zona Centro Histórico (Cajón #A-14)', ratePerHour: 18.00 },
  { id: 'Z2', name: 'Zona Financiera & Bancaria (Cajón #B-08)', ratePerHour: 24.00 },
  { id: 'Z3', name: 'Distrito Gastronómico & Gourmet (Cajón #C-21)', ratePerHour: 20.00 },
  { id: 'Z4', name: 'Zona Hospitalaria & Médica (Cajón #H-02)', ratePerHour: 14.00 },
];

export const ParkingSimulator = () => {
  const { 
    vehicle, 
    owner, 
    activeSession, 
    startParking, 
    stopParkingAndAutoCharge, 
    autoPay,
    setLastReceipt
  } = useParking();

  const [selectedZone, setSelectedZone] = useState(PARKING_ZONES[0]);
  const [justChargedNotice, setJustChargedNotice] = useState(null);

  const handleStart = () => {
    startParking(selectedZone.name, selectedZone.ratePerHour);
    setJustChargedNotice(null);
    sileo.info({
      title: 'Parquímetro Activado',
      description: `Cajón ocupado en ${selectedZone.name}. Autocobro activo para ${vehicle.plates}.`,
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
    <div className="bg-neutral-950/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-800 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="tracking-widest uppercase">Módulo de Simulación en Vivo</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
            <Clock className="w-5 h-5 text-white" />
            Simulador de Parquímetro en Tiempo Real
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Prueba cómo la tarjeta digital y el autocobro interactúan al ocupar un cajón de estacionamiento
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          {activeSession ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Sesión Activa
            </span>
          ) : (
            <span className="text-xs font-medium text-neutral-300 bg-neutral-900 px-3.5 py-1.5 rounded-full border border-neutral-800">
              Listo para Estacionar
            </span>
          )}
        </div>
      </div>

      {/* Notificación de Autocobro Ejecutado */}
      {justChargedNotice && !activeSession && (
        <div className="mb-6 p-5 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-[0_0_30px_rgba(255,255,255,0.08)] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  ¡Autocobro Realizado Exitosamente!
                  <span className="text-xs font-normal text-neutral-300 bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700 font-mono">
                    Folio: {justChargedNotice.folio}
                  </span>
                </h4>
                <p className="text-xs text-neutral-300 mt-1 font-mono">
                  Se ha cobrado <strong className="text-white">{formatCurrency(justChargedNotice.amount)}</strong> a través de{' '}
                  <strong className="text-neutral-100 underline decoration-neutral-500">{justChargedNotice.method}</strong> por un tiempo de{' '}
                  <strong className="text-white">{justChargedNotice.durationMinutes} min</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setJustChargedNotice(null)}
              className="text-xs text-neutral-400 hover:text-white px-2 py-1 font-mono"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cuando está ESTACIONADO */}
      {activeSession ? (
        <div className="space-y-6">
          <div className="bg-black/90 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            {/* Fondo con brillo sutil monocromático */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Cronómetro en Vivo */}
              <div className="text-center md:text-left">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1 font-mono">
                  Tiempo Transcurrido
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-black text-white tracking-wider">
                  {formatTimeFromSeconds(activeSession.secondsElapsed)}
                </div>
                <span className="text-xs text-neutral-400 mt-1 block font-mono">
                  Inicio: {new Date(activeSession.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Monto Acumulado en Vivo */}
              <div className="text-center md:text-left border-y md:border-y-0 md:border-x border-neutral-800 py-4 md:py-0 md:px-6">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 block mb-1 font-mono">
                  Monto a Cobrar (Autocobro)
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-black text-white">
                  {formatCurrency(activeSession.currentCost)}
                </div>
                <div className="text-xs text-neutral-400 mt-1 flex items-center justify-center md:justify-start gap-1 font-mono">
                  <Zap className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Tarifa: {formatCurrency(activeSession.ratePerHour)}/hr</span>
                </div>
              </div>

              {/* Detalles de la Detección y Vehículo */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Zona / Cajón:</span>
                  <span className="font-semibold text-white truncate max-w-[160px]">{activeSession.zoneName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Placas del Coche:</span>
                  <span className="font-bold text-white">{formatPlate(vehicle.plates)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800">
                  <span className="text-neutral-400">Método de Cargo:</span>
                  <span className="font-semibold text-neutral-200">
                    {autoPay.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Tarjeta'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-400">Tope de Seguridad:</span>
                  <span className="text-neutral-300">{formatCurrency(activeSession.maxLimit)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Salir y Ejecutar Autocobro */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono">¿Listo para salir del cajón?</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  El sistema detectará la salida y efectuará el autocobro sin que tengas que hacer filas.
                </p>
              </div>
            </div>

            <button
              onClick={handleStop}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition transform active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
              Liberar Cajón & Ejecutar Autocobro
            </button>
          </div>
        </div>
      ) : (
        /* Cuando NO está estacionado (Panel para Iniciar) */
        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-neutral-300 block mb-3 font-mono">
              1. Selecciona la Zona de Estacionamiento a Ocupar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PARKING_ZONES.map((zone) => {
                const isSelected = selectedZone.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                        : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/70 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected ? 'bg-white text-black font-bold' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block font-mono">
                          {zone.name}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono">
                          Tarifa: {formatCurrency(zone.ratePerHour)} por hora
                        </span>
                      </div>
                    </div>

                    <div className="w-5 h-5 rounded-full border flex items-center justify-center border-neutral-700">
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen del Vehículo y Autocobro antes de iniciar */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left font-mono">
                <span className="text-xs text-neutral-400 block">Vehículo listo para autocobro:</span>
                <span className="text-sm font-bold text-white">
                  {vehicle.brand} {vehicle.model} ({formatPlate(vehicle.plates)}) • {owner.fullName}
                </span>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              Ocupar Cajón & Iniciar Parquímetro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
