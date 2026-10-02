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
      containerClassName="w-full bg-slate-950 text-white border-0 shadow-2xl shadow-slate-950/50 transition-colors"
      className="p-6 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-0 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#0033FF]/20 border-0 text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4D6E6]">
              PADRÓN VIAL METROPOLITANO
            </span>
            <span className="text-[#D4D6E6]/60 text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-[#D4D6E6]">EXPEDIENTE OFICIAL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Car className="w-6 h-6 text-white" />
            Registro de Vehículo & Titular
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans max-w-2xl leading-relaxed">
            Vinculación de matrículas y padrón vehicular con tecnología de <span className="text-white font-bold">SSS.Solutions</span>.
          </p>
        </div>

        {savedNotification && (
          <span className="flex items-center gap-1.5 text-xs font-sans font-semibold px-3.5 py-1.5 rounded-full bg-white/10 text-[#D4D6E6] border-0 animate-in fade-in self-start sm:self-auto shadow-xl">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            ¡Actualizado en la Tarjeta!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección del Coche */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 mb-3.5 flex items-center gap-2 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0033FF]"></span>
            1. Datos del Vehículo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-sans">
            <div>
              <label htmlFor="veh-plates" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Placas Vehiculares *
              </label>
              <input
                id="veh-plates"
                type="text"
                name="plates"
                required
                aria-required="true"
                value={vehFormData.plates}
                onChange={handleVehicleChange}
                placeholder="Ej. XYZ-7842"
                className="w-full uppercase font-mono px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="veh-brand" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Marca *
              </label>
              <input
                id="veh-brand"
                type="text"
                name="brand"
                required
                aria-required="true"
                value={vehFormData.brand}
                onChange={handleVehicleChange}
                placeholder="Ej. Volkswagen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm font-sans shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="veh-model" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Submarca / Modelo *
              </label>
              <input
                id="veh-model"
                type="text"
                name="model"
                required
                aria-required="true"
                value={vehFormData.model}
                onChange={handleVehicleChange}
                placeholder="Ej. Golf GTI"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm font-sans shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="veh-color" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Color
              </label>
              <input
                id="veh-color"
                type="text"
                name="color"
                value={vehFormData.color}
                onChange={handleVehicleChange}
                placeholder="Ej. Blanco Puro"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm font-sans shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="veh-year" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Año / Modelo
              </label>
              <input
                id="veh-year"
                type="text"
                name="year"
                value={vehFormData.year}
                onChange={handleVehicleChange}
                placeholder="Ej. 2024"
                className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="veh-state" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Estado Emisor de Placas
              </label>
              <input
                id="veh-state"
                type="text"
                name="state"
                value={vehFormData.state}
                onChange={handleVehicleChange}
                placeholder="Ej. Jalisco / CDMX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm font-sans shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Sección del Titular */}
        <div className="pt-4 border-0">
          <h3 className="text-xs uppercase tracking-wider font-bold text-[#D4D6E6] mb-3.5 flex items-center gap-2 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4D6E6]"></span>
            2. Datos del Titular de la Tarjeta
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-sans">
            <div className="sm:col-span-2">
              <label htmlFor="owner-fullName" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Nombre Completo del Propietario / Titular *
              </label>
              <input
                id="owner-fullName"
                type="text"
                name="fullName"
                required
                aria-required="true"
                value={ownerFormData.fullName}
                onChange={handleOwnerChange}
                placeholder="Ej. Sebastián Salinas"
                className="w-full uppercase px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm font-sans shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="owner-rfc" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                RFC o Identificador
              </label>
              <input
                id="owner-rfc"
                type="text"
                name="rfc"
                value={ownerFormData.rfc}
                onChange={handleOwnerChange}
                placeholder="Ej. SASS940212AB1"
                className="w-full uppercase font-mono px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="owner-email" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Correo Electrónico para Recibos
              </label>
              <input
                id="owner-email"
                type="email"
                name="email"
                value={ownerFormData.email}
                onChange={handleOwnerChange}
                placeholder="correo@ejemplo.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm font-sans shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="owner-phone" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Teléfono de Notificaciones SMS
              </label>
              <input
                id="owner-phone"
                type="tel"
                name="phone"
                value={ownerFormData.phone}
                onChange={handleOwnerChange}
                placeholder="Ej. 33 1234 5678"
                className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            aria-label="Guardar datos y actualizar tarjeta virtual"
            className="px-6 py-3.5 rounded-2xl bg-[#0033FF] hover:bg-[#2250ff] text-white font-bold font-sans text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,51,255,0.6)] transition transform active:scale-95 cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#01033E]"
          >
            <RefreshCw className="w-4 h-4 text-white" />
            Guardar & Actualizar Tarjeta Virtual
          </button>
        </div>
      </form>
    </WobbleCard>
  );
};

export default VehicleOwnerForm;
