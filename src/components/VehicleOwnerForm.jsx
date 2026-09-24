import React, { useState } from 'react';
import { sileo } from 'sileo';
import { Car, Check, RefreshCw } from 'lucide-react';
import { useParking } from '../context/ParkingContext';

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
      title: 'Datos Guardados',
      description: `Vehículo (${vehFormData.plates}) y titular vinculados a la tarjeta digital.`,
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="bg-neutral-950/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-800 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="tracking-widest uppercase">Expediente Oficial</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
            <Car className="w-5 h-5 text-white" />
            Registro de Vehículo y Titular
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            Estos datos se vinculan y proyectan en tu Tarjeta Digital de Parquímetro
          </p>
        </div>

        {savedNotification && (
          <span className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3.5 py-1.5 rounded-full bg-neutral-900 text-white border border-neutral-700 animate-in fade-in self-start sm:self-auto shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            ¡Actualizado en la Tarjeta!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección del Coche */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold text-white mb-3.5 flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
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
                className="w-full uppercase font-mono px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition text-sm"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Modelo / Versión *
              </label>
              <input
                type="text"
                name="model"
                required
                value={vehFormData.model}
                onChange={handleVehicleChange}
                placeholder="Ej. Jetta Sportline"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition text-sm"
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
                placeholder="Ej. Plata Metálico"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Año
              </label>
              <input
                type="text"
                name="year"
                value={vehFormData.year}
                onChange={handleVehicleChange}
                placeholder="Ej. 2023"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Tipo de Carrocería
              </label>
              <select
                name="type"
                value={vehFormData.type}
                onChange={handleVehicleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-neutral-500 transition text-sm"
              >
                <option value="Sedán">Sedán</option>
                <option value="SUV / Camioneta">SUV / Camioneta</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Pickup">Pickup</option>
                <option value="Motocicleta">Motocicleta</option>
                <option value="Eléctrico / Híbrido">Eléctrico / Híbrido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección del Titular */}
        <div className="pt-4 border-t border-neutral-800">
          <h3 className="text-xs uppercase tracking-wider font-bold text-white mb-3.5 flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            2. Datos del Titular
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nombre Completo del Titular *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={ownerFormData.fullName}
                onChange={handleOwnerChange}
                placeholder="Nombre y Apellidos"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition uppercase text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Identificación Oficial / INE / Licencia *
              </label>
              <input
                type="text"
                name="idNumber"
                required
                value={ownerFormData.idNumber}
                onChange={handleOwnerChange}
                placeholder="Ej. INE-84930219"
                className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition text-sm"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Teléfono Celular (SMS de Autocobro)
              </label>
              <input
                type="tel"
                name="phone"
                value={ownerFormData.phone}
                onChange={handleOwnerChange}
                placeholder="55 1234 5678"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition text-sm"
              />
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition transform active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar Datos en Tarjeta Digital
          </button>
        </div>
      </form>
    </div>
  );
};
