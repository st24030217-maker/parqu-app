import React, { useState } from 'react';
import { sileo } from 'sileo';
import { Car, Check, RefreshCw, User, ShieldCheck, Sparkles } from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { WobbleCard } from './ui/wobble-card';

export const VehicleOwnerForm = () => {
  const { vehicle, updateVehicle, owner, updateOwner } = useParking();

  const [vehFormData, setVehFormData] = useState(vehicle);
  const [ownerFormData, setOwnerFormData] = useState(owner);
  const [savedNotification, setSavedNotification] = useState(false);

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwnerFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateVehicle(vehFormData);
    updateOwner(ownerFormData);
    sileo.success({
      title: 'Padrón Vial Actualizado',
      description: `Vehículo (${vehFormData.plates}) y titular vinculados a la tarjeta digital.`,
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <WobbleCard
      containerClassName="w-full bg-gradient-to-br from-purple-950/70 via-neutral-950 to-black border-purple-900/40 hover:border-purple-500/60 transition-colors shadow-2xl"
      className="p-6 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-800/80 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-purple-900/60 border border-purple-700/50 text-[10px] font-mono font-bold uppercase tracking-widest text-purple-200">
              PADRÓN VIAL METROPOLITANO
            </span>
            <span className="text-neutral-500 text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-neutral-400">EXPEDIENTE OFICIAL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Car className="w-6 h-6 text-purple-400" />
            Registro de Vehículo & Titular
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 font-mono max-w-2xl leading-relaxed">
            Vinculación de matrículas y padrón vehicular con telemetría de <span className="text-white font-bold">SSS.Solutions</span>.
          </p>
        </div>

        {savedNotification && (
          <span className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3.5 py-1.5 rounded-full bg-black text-white border border-neutral-800 animate-in fade-in self-start sm:self-auto shadow-xl">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            ¡Actualizado en la Tarjeta!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección del Coche */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold text-purple-200 mb-3.5 flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            1. Datos del Vehículo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Placas Vehiculares *
              </label>
              <input
                type="text"
                name="plates"
                required
                value={vehFormData.plates}
                onChange={handleVehicleChange}
                placeholder="Ej. XYZ-7842"
                className="w-full uppercase font-mono px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Marca *
              </label>
              <input
                type="text"
                name="brand"
                required
                value={vehFormData.brand}
                onChange={handleVehicleChange}
                placeholder="Ej. Volkswagen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Submarca / Modelo *
              </label>
              <input
                type="text"
                name="model"
                required
                value={vehFormData.model}
                onChange={handleVehicleChange}
                placeholder="Ej. Golf GTI"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={vehFormData.color}
                onChange={handleVehicleChange}
                placeholder="Ej. Blanco Puro"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Año / Modelo
              </label>
              <input
                type="text"
                name="year"
                value={vehFormData.year}
                onChange={handleVehicleChange}
                placeholder="Ej. 2024"
                className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Estado Emisor de Placas
              </label>
              <input
                type="text"
                name="state"
                value={vehFormData.state}
                onChange={handleVehicleChange}
                placeholder="Ej. Jalisco / CDMX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Sección del Titular */}
        <div className="pt-4 border-t border-neutral-800/80">
          <h3 className="text-xs uppercase tracking-wider font-bold text-purple-200 mb-3.5 flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            2. Datos del Titular de la Tarjeta
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nombre Completo del Propietario / Titular *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={ownerFormData.fullName}
                onChange={handleOwnerChange}
                placeholder="Ej. Sebastián Salinas"
                className="w-full uppercase px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                RFC o Identificador
              </label>
              <input
                type="text"
                name="rfc"
                value={ownerFormData.rfc}
                onChange={handleOwnerChange}
                placeholder="Ej. SASS940212AB1"
                className="w-full uppercase font-mono px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Correo Electrónico para Recibos
              </label>
              <input
                type="email"
                name="email"
                value={ownerFormData.email}
                onChange={handleOwnerChange}
                placeholder="correo@ejemplo.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Teléfono de Notificaciones SMS
              </label>
              <input
                type="tel"
                name="phone"
                value={ownerFormData.phone}
                onChange={handleOwnerChange}
                placeholder="Ej. 33 1234 5678"
                className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500 transition text-sm"
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition transform active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-purple-600" />
            Guardar & Actualizar Tarjeta Virtual
          </button>
        </div>
      </form>
    </WobbleCard>
  );
};

export default VehicleOwnerForm;
