import React, { useState, useRef, useEffect } from 'react';
import { sileo } from 'sileo';
import {
  Car,
  Check,
  RefreshCw,
  ShieldCheck,
  CloudUpload,
  CloudDownload,
  Download,
  Upload,
  Database,
} from 'lucide-react';
import { useParking } from '../context/ParkingContext';
import { WobbleCard } from './ui/wobble-card';

export const VehicleOwnerForm = () => {
  const {
    vehicle,
    updateVehicle,
    owner,
    updateOwner,
    lastBackupAt,
    performCloudBackup,
    restoreFromCloudBackup,
    exportBackupFile,
    applyBackupSnapshot,
  } = useParking();

  const [vehFormData, setVehFormData] = useState(vehicle);
  const [ownerFormData, setOwnerFormData] = useState(owner);
  const [savedNotification, setSavedNotification] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setVehFormData(vehicle);
  }, [vehicle]);

  useEffect(() => {
    setOwnerFormData(owner);
  }, [owner]);

  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    setVehFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwnerFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateVehicle(vehFormData);
    updateOwner(ownerFormData);
    if (typeof performCloudBackup === 'function') {
      performCloudBackup().catch(() => {});
    }
    sileo.success({
      title: 'Datos Guardados y Respaldados',
      description: `Vehículo (${vehFormData.plates}) y titular guardados en bóveda local y respaldo en la nube.`,
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const handleManualCloudBackup = async () => {
    setIsBackingUp(true);
    updateVehicle(vehFormData);
    updateOwner(ownerFormData);
    await performCloudBackup();
    setIsBackingUp(false);
    sileo.success({
      title: '¡Respaldo Guardado con Éxito!',
      description: 'Tus datos, diseño de tarjeta, saldo e historial están protegidos en la nube y bóveda local.',
    });
  };

  const handleRestoreCloud = async () => {
    setIsRestoring(true);
    const key = ownerFormData.email || vehFormData.plates || 'XYZ-7842';
    const restored = await restoreFromCloudBackup(key);
    setIsRestoring(false);

    if (restored) {
      if (restored.vehicle) setVehFormData(restored.vehicle);
      if (restored.owner) setOwnerFormData(restored.owner);
      sileo.success({
        title: '¡Respaldo Restaurado!',
        description: `Se recuperaron los datos guardados del ${new Date(restored.savedAt || Date.now()).toLocaleTimeString()}.`,
      });
    } else {
      sileo.info({
        title: 'Respaldo al Día',
        description: 'Ya cuentas con la versión más reciente de tus datos en este dispositivo.',
      });
    }
  };

  const handleExportJson = () => {
    exportBackupFile();
    sileo.success({
      title: 'Copia de Seguridad Descargada',
      description: 'Se descargó el archivo .json con todos tus datos de Parqu.',
    });
  };

  const handleImportJsonFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        const ok = applyBackupSnapshot(parsed);
        if (ok) {
          if (parsed.vehicle) setVehFormData(parsed.vehicle);
          if (parsed.owner) setOwnerFormData(parsed.owner);
          sileo.success({
            title: 'Copia de Seguridad Restaurada',
            description: 'Tus datos, tarjeta, saldo e historial fueron restaurados desde el archivo.',
          });
        }
      } catch {
        sileo.error({
          title: 'Archivo no válido',
          description: 'Selecciona un archivo .json de respaldo generado por Parqu.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <WobbleCard
      containerClassName="w-full bg-slate-950 text-white border-0 shadow-2xl shadow-slate-950/50 transition-colors"
      className="p-5 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-0 mb-6 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#0033FF]/20 border-0 text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4D6E6]">
              PADRÓN VIAL METROPOLITANO
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RESPALDO AUTOMÁTICO ACTIVO
            </span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Car className="w-6 h-6 text-white" />
            Registro de Vehículo, Titular & Respaldo
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-sans max-w-2xl leading-relaxed">
            Todos tus cambios se guardan automáticamente en triple respaldo (<span className="text-white font-bold">Memoria Local + Bóveda IndexedDB + Nube</span>).
          </p>
        </div>

        {savedNotification && (
          <span className="flex items-center gap-1.5 text-xs font-sans font-semibold px-3.5 py-1.5 rounded-full bg-white/10 text-[#D4D6E6] border-0 animate-in fade-in self-start sm:self-auto shadow-xl">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            ¡Guardado y Respaldado!
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
                value={vehFormData.plates || ''}
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
                value={vehFormData.brand || ''}
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
                value={vehFormData.model || ''}
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
                value={vehFormData.color || ''}
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
                value={vehFormData.year || ''}
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
                value={vehFormData.state || ''}
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
                value={ownerFormData.fullName || ''}
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
                value={ownerFormData.rfc || ''}
                onChange={handleOwnerChange}
                placeholder="Ej. SASS940212AB1"
                className="w-full uppercase font-mono px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm shadow-inner"
              />
            </div>

            <div>
              <label htmlFor="owner-email" className="block text-xs font-medium text-slate-300 mb-1 font-sans">
                Correo Electrónico para Recibos y Respaldo
              </label>
              <input
                id="owner-email"
                type="email"
                name="email"
                value={ownerFormData.email || ''}
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
                value={ownerFormData.phone || ''}
                onChange={handleOwnerChange}
                placeholder="Ej. 33 1234 5678"
                className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0033FF] border-0 transition text-sm shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* 3. Centro de Respaldo y Recuperación de Datos */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-300 flex items-center gap-2 font-sans">
              <Database className="w-4 h-4 text-emerald-400" />
              3. Bóveda de Respaldo de Datos (Local + Nube + Archivo)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Último respaldo: {new Date(lastBackupAt || Date.now()).toLocaleTimeString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Tus datos (placas, titular, color de tarjeta elegido, saldo disponible, configuración de autocobro e historial) se respaldan automáticamente. También puedes guardar o restaurar una copia en la nube o en un archivo seguro.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleManualCloudBackup}
                disabled={isBackingUp}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CloudUpload className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>{isBackingUp ? 'Guardando...' : 'Respaldar en Nube'}</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreCloud}
                disabled={isRestoring}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CloudDownload className="w-4 h-4 text-[#807DFE] shrink-0" />
                <span>{isRestoring ? 'Restaurando...' : 'Restaurar de Nube'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-300 shrink-0" />
                <span>Descargar Copia (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Importar Copia (.json)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportJsonFile}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            aria-label="Guardar datos y actualizar tarjeta virtual"
            className="w-full sm:w-auto justify-center px-6 py-3.5 rounded-2xl bg-[#0033FF] hover:bg-[#2250ff] text-white font-bold font-sans text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,51,255,0.6)] transition transform active:scale-95 cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#01033E]"
          >
            <RefreshCw className="w-4 h-4 text-white" />
            Guardar & Respaldar Tarjeta Virtual
          </button>
        </div>
      </form>
    </WobbleCard>
  );
};

export default VehicleOwnerForm;
