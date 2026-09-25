import React, { useState } from 'react';
import { sileo } from 'sileo';
import { 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Check, 
  Wallet, 
  Bell, 
  HelpCircle,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { CurrencyDollarIcon } from './icons/currency-dollar-icon';
import { useParking } from '../context/ParkingContext';
import { WobbleCard } from './ui/wobble-card';

export const AutoPaymentConfig = () => {
  const { autoPay, updateAutoPay, vehicle, owner } = useParking();

  const [formData, setFormData] = useState({
    enabled: autoPay.enabled ?? true,
    fundingSource: autoPay.fundingSource || 'CARD',
    cardHolder: autoPay.cardHolder || owner.fullName,
    cardNumber: autoPay.cardNumber || '•••• •••• •••• 8821',
    bank: autoPay.bank || 'Santander Débito',
    expiry: '11/29',
    cvv: '•••',
    maxLimitPerSession: autoPay.maxLimitPerSession || 180,
    autoRenew: autoPay.autoRenew ?? true,
    smsNotification: autoPay.smsNotification ?? true,
    acceptedTerms: true,
  });

  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.acceptedTerms && formData.enabled) {
      sileo.warning({
        title: 'Autorización Requerida',
        description: 'Debes aceptar la autorización de débito automático para activar el autocobro.',
      });
      return;
    }

    updateAutoPay({
      enabled: formData.enabled,
      fundingSource: formData.fundingSource,
      cardHolder: formData.cardHolder,
      cardNumber: formData.cardNumber,
      bank: formData.bank,
      maxLimitPerSession: Number(formData.maxLimitPerSession),
      autoRenew: formData.autoRenew,
      smsNotification: formData.smsNotification,
      authorizedAt: new Date().toISOString(),
    });

    sileo.success({
      title: 'Configuración Guardada',
      description: 'Formato de autocobro actualizado y vinculado a tu tarjeta digital.',
    });
    setStatusMessage('¡Formato de autocobro guardado y vinculado a tu tarjeta digital con éxito!');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  return (
    <WobbleCard
      containerClassName="w-full bg-gradient-to-br from-indigo-950/70 via-neutral-950 to-black border-indigo-900/40 hover:border-indigo-500/60 transition-colors shadow-2xl"
      className="p-6 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-neutral-800/80 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-200">
              TECNOLOGÍA SSS.SOLUTIONS
            </span>
            <span className="text-neutral-500 text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-neutral-400">DÉBITO AUTOMATIZADO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-amber-400" />
            Configuración de Autocobro Continuo
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 font-mono max-w-2xl leading-relaxed">
            Elimina multas y filas domiciliando el cobro directo de tus estancias de parquímetro.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-xs text-neutral-400">Estado:</span>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border font-mono flex items-center gap-1.5 ${
            formData.enabled 
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
          }`}>
            <span className={`w-2 h-2 rounded-full ${formData.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {formData.enabled ? 'AUTOCOBRO ACTIVO' : 'PAUSADO'}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 bg-black border border-neutral-800 rounded-2xl text-white text-xs font-mono font-semibold flex items-center gap-2.5 shadow-2xl">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle General de Autocobro */}
        <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <label htmlFor="enabled" className="text-sm font-bold text-white cursor-pointer font-mono">
                Habilitar Débito / Autocobro Inteligente
              </label>
              <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                Al terminar tu tiempo de estacionamiento o liberar el cajón, el importe se cobrará automáticamente.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={formData.enabled}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Modalidad de Autocobro */}
        <div>
          <label className="text-xs uppercase tracking-wider font-bold text-neutral-300 block mb-2.5 font-mono">
            Fuente de Pago para Autocobro
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
              formData.fundingSource === 'CARD'
                ? 'bg-indigo-950/50 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-900/90'
            }`}>
              <input
                type="radio"
                name="fundingSource"
                value="CARD"
                checked={formData.fundingSource === 'CARD'}
                onChange={handleChange}
                className="mt-1 text-indigo-500 focus:ring-indigo-400"
              />
              <div>
                <span className="text-sm font-bold block flex items-center gap-1.5 text-white font-mono">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  Tarjeta de Débito / Crédito
                </span>
                <span className="text-xs text-neutral-400 block mt-0.5 font-mono">
                  Cargo directo a cuenta bancaria con recibo fiscal instantáneo.
                </span>
              </div>
            </label>

            <label className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
              formData.fundingSource === 'WALLET_BALANCE'
                ? 'bg-indigo-950/50 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-900/90'
            }`}>
              <input
                type="radio"
                name="fundingSource"
                value="WALLET_BALANCE"
                checked={formData.fundingSource === 'WALLET_BALANCE'}
                onChange={handleChange}
                className="mt-1 text-indigo-500 focus:ring-indigo-400"
              />
              <div>
                <span className="text-sm font-bold block flex items-center gap-1.5 text-white font-mono">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  Saldo Prepago de Tarjeta Digital
                </span>
                <span className="text-xs text-neutral-400 block mt-0.5 font-mono">
                  Se descuenta del saldo acumulado en tu monedero virtual.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Datos Bancarios (si aplica tarjeta) */}
        {formData.fundingSource === 'CARD' && (
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-white" />
                Datos de la Tarjeta para Domiciliación
              </span>
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Encriptación SSL 256-bit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1 font-mono">
                  Nombre del Titular en la Tarjeta
                </label>
                <input
                  type="text"
                  name="cardHolder"
                  required
                  value={formData.cardHolder}
                  onChange={handleChange}
                  placeholder="NOMBRE TAL COMO APARECE"
                  className="w-full uppercase px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1 font-mono">
                  Número de Tarjeta (16 dígitos)
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  required
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="4152 •••• •••• 9921"
                  className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1 font-mono">
                  Banco Emisor / Identificador
                </label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  placeholder="Ej. BBVA, Santander, Banorte, Nu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 font-mono">
                    Vencimiento (MM/AA)
                  </label>
                  <input
                    type="text"
                    name="expiry"
                    maxLength="5"
                    value={formData.expiry}
                    onChange={handleChange}
                    placeholder="12/28"
                    className="w-full font-mono text-center px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1 font-mono">
                    CVV Dinámico
                  </label>
                  <input
                    type="password"
                    name="cvv"
                    maxLength="4"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="•••"
                    className="w-full font-mono text-center px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500 transition text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reglas de Seguridad y Límites de Autocobro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1 font-mono">
              Tope Máximo de Autocobro por Sesión (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-neutral-500 pointer-events-none flex items-center justify-center">
                <CurrencyDollarIcon size={16} strokeWidth={2} className="text-neutral-400" />
              </span>
              <input
                type="number"
                name="maxLimitPerSession"
                min="50"
                max="800"
                value={formData.maxLimitPerSession}
                onChange={handleChange}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-none focus:border-indigo-500 transition text-sm"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 font-mono">
              Límite de seguridad contra cobros excesivos si olvidas retirar el vehículo.
            </p>
          </div>

          <div className="space-y-3 pt-2 font-mono">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                name="smsNotification"
                checked={formData.smsNotification}
                onChange={handleChange}
                className="rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-400"
              />
              <span>Enviar comprobante instantáneo vía SMS / Push</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                name="autoRenew"
                checked={formData.autoRenew}
                onChange={handleChange}
                className="rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-400"
              />
              <span>Autorrenovación automática si el vehículo permanece en cajón</span>
            </label>
          </div>
        </div>

        {/* Autorización Legal / Términos de Autocobro */}
        <div className="p-4 rounded-2xl bg-black/60 border border-neutral-800 flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptedTerms"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleChange}
            className="mt-1 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-400"
          />
          <label htmlFor="acceptedTerms" className="text-xs text-neutral-400 leading-relaxed cursor-pointer font-mono">
            <span className="font-bold text-white block mb-0.5">
              Autorización expresa de débito para la placa {vehicle.plates}:
            </span>
            Autorizo al sistema de Parquímetros Digitales a debitar de forma automática el costo correspondiente 
            por tiempo de ocupación en cajones autorizados a nombre del titular <strong>{owner.fullName}</strong>.
          </label>
        </div>

        {/* Botón Guardar Formato */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition transform active:scale-95"
          >
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            Guardar Formato y Activar Autocobro
          </button>
        </div>
      </form>
    </WobbleCard>
  );
};

export default AutoPaymentConfig;
