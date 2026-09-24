import React, { useState } from 'react';
import { Car, User, Check, RefreshCw } from 'lucide-react';
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
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-cyan-400" />
            Registro de Vehículo y Titular
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Estos datos se vinculan y proyectan en tu Tarjeta Digital de Parquímetro
          </p>
        </div>

        {savedNotification && (
          <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            ¡Actualizado en la Tarjeta!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección del Coche */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold text-cyan-400 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            1. Datos del Vehículo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Placas Vehiculares *
              </label>
              <input
                type="text"
                name="plates"
                required
                value={vehFormData.plates}
                onChange={handleVehicleChange}
                placeholder="Ej. XYZ-7842"
                className="w-full uppercase font-mono px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Marca *
              </label>
              <input
                type="text"
                name="brand"
                required
                value={vehFormData.brand}
                onChange={handleVehicleChange}
                placeholder="Ej. Volkswagen"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Modelo / Versión *
              </label>
              <input
                type="text"
                name="model"
                required
                value={vehFormData.model}
                onChange={handleVehicleChange}
                placeholder="Ej. Jetta Sportline"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={vehFormData.color}
                onChange={handleVehicleChange}
                placeholder="Ej. Plata Metálico"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Año
              </label>
              <input
                type="text"
                name="year"
                value={vehFormData.year}
                onChange={handleVehicleChange}
                placeholder="Ej. 2023"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tipo de Carrocería
              </label>
              <select
                name="type"
                value={vehFormData.type}
                onChange={handleVehicleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 transition"
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
        <div className="pt-2 border-t border-slate-800">
          <h3 className="text-xs uppercase tracking-wider font-bold text-cyan-400 mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            2. Datos del Titular
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre Completo del Titular *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={ownerFormData.fullName}
                onChange={handleOwnerChange}
                placeholder="Nombre y Apellidos"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Identificación Oficial / INE / Licencia *
              </label>
              <input
                type="text"
                name="idNumber"
                required
                value={ownerFormData.idNumber}
                onChange={handleOwnerChange}
                placeholder="Ej. INE-84930219"
                className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Correo Electrónico para Recibos
              </label>
              <input
                type="email"
                name="email"
                value={ownerFormData.email}
                onChange={handleOwnerChange}
                placeholder="correo@ejemplo.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Teléfono Celular (SMS de Autocobro)
              </label>
              <input
                type="tel"
                name="phone"
                value={ownerFormData.phone}
                onChange={handleOwnerChange}
                placeholder="55 1234 5678"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar Datos en Tarjeta Digital
          </button>
        </div>
      </form>
    </div>
  );
};
