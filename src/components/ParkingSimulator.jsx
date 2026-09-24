import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Car, 
  Receipt, 
  Download, 
  Play, 
  Square,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { formatCurrency, formatTimeFromSeconds, formatDate, formatPlate } from '../utils/formatters';

const PARKING_ZONES = [
  { id: 'Z1', name: 'Zona Centro Histórico (Cajón #A-14)', ratePerHour: 18.00, color: 'border-cyan-500' },
  { id: 'Z2', name: 'Zona Financiera & Bancaria (Cajón #B-08)', ratePerHour: 24.00, color: 'border-blue-500' },
  { id: 'Z3', name: 'Distrito Gastronómico & Gourmet (Cajón #C-21)', ratePerHour: 20.00, color: 'border-purple-500' },
  { id: 'Z4', name: 'Zona Hospitalaria & Médica (Cajón #H-02)', ratePerHour: 14.00, color: 'border-emerald-500' },
];

export const ParkingSimulator = () => {
  const { 
    vehicle, 
    owner, 
    activeSession, 
    startParking, 
    stopParkingAndAutoCharge, 
    autoPay,
    lastReceipt,
    setLastReceipt
  } = useParking();

  const [selectedZone, setSelectedZone] = useState(PARKING_ZONES[0]);
  const [justChargedNotice, setJustChargedNotice] = useState(null);

  const handleStart = () => {
    startParking(selectedZone.name, selectedZone.ratePerHour);
    setJustChargedNotice(null);
  };

  const handleStop = () => {
    const receipt = stopParkingAndAutoCharge();
    if (receipt) {
      setJustChargedNotice(receipt);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Simulador de Parquímetro en Tiempo Real
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Prueba cómo la tarjeta digital y el autocobro interactúan al ocupar un cajón de estacionamiento
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSession ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Sesión Activa
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Listo para Estacionar
            </span>
          )}
        </div>
      </div>

      {/* Notificación de Autocobro Ejecutado */}
      {justChargedNotice && !activeSession && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  ¡Autocobro Realizado Exitosamente!
                  <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                    Folio: {justChargedNotice.folio}
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Se ha cobrado <strong className="text-white">{formatCurrency(justChargedNotice.amount)}</strong> a través de{' '}
                  <strong className="text-cyan-300">{justChargedNotice.method}</strong> por un tiempo de{' '}
                  <strong className="text-white">{justChargedNotice.durationMinutes} min</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setJustChargedNotice(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cuando está ESTACIONADO */}
      {activeSession ? (
        <div className="space-y-6">
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden">
            {/* Fondo con brillo sutil */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Cronómetro en Vivo */}
              <div className="text-center md:text-left">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Tiempo Transcurrido
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-black text-cyan-300 tracking-wider">
                  {formatTimeFromSeconds(activeSession.secondsElapsed)}
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  Inicio: {new Date(activeSession.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Monto Acumulado en Vivo */}
              <div className="text-center md:text-left border-y md:border-y-0 md:border-x border-slate-800 py-4 md:py-0 md:px-6">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  Monto a Cobrar (Autocobro)
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-black text-emerald-400">
                  {formatCurrency(activeSession.currentCost)}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tarifa: {formatCurrency(activeSession.ratePerHour)}/hr</span>
                </div>
              </div>

              {/* Detalles de la Detección y Vehículo */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Zona / Cajón:</span>
                  <span className="font-semibold text-white truncate max-w-[160px]">{activeSession.zoneName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Placas del Coche:</span>
                  <span className="font-bold text-cyan-300 font-mono">{formatPlate(vehicle.plates)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Método de Cargo:</span>
                  <span className="font-semibold text-emerald-400">
                    {autoPay.fundingSource === 'CARD' ? 'Débito Bancario' : 'Saldo Tarjeta'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Tope de Seguridad:</span>
                  <span className="font-mono text-slate-300">{formatCurrency(activeSession.maxLimit)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Salir y Ejecutar Autocobro */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">¿Listo para salir del cajón?</h4>
                <p className="text-xs text-slate-400">
                  El sistema detectará la salida y efectuará el autocobro sin que tengas que hacer filas.
                </p>
              </div>
            </div>

            <button
              onClick={handleStop}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition transform active:scale-95"
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
            <label className="text-xs uppercase tracking-wider font-bold text-slate-300 block mb-3">
              1. Selecciona la Zona de Estacionamiento a Ocupar
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PARKING_ZONES.map((zone) => {
                const isSelected = selectedZone.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">
                          {zone.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Tarifa: {formatCurrency(zone.ratePerHour)} por hora
                        </span>
                      </div>
                    </div>

                    <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-600">
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen del Vehículo y Autocobro antes de iniciar */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-400 block">Vehículo listo para autocobro:</span>
                <span className="text-sm font-bold text-white">
                  {vehicle.brand} {vehicle.model} ({formatPlate(vehicle.plates)}) • {owner.fullName}
                </span>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition transform active:scale-95"
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
