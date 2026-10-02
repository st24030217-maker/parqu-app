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
import { CurrencyDollarIcon, PlugConnectedIcon } from './icons';
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
      containerClassName="w-full bg-slate-900/30 backdrop-blur-2xl border border-slate-300/30 shadow-none transition-colors"
      className="p-6 sm:p-8 flex flex-col justify-between"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#0033FF]/20 border border-[#807DFE]/40 text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4D6E6]">
              TECNOLOGÍA SSS.SOLUTIONS
            </span>
            <span className="text-[#D4D6E6]/60 text-xs font-mono">•</span>
            <span className="text-[11px] font-mono text-[#D4D6E6]">DÉBITO AUTOMATIZADO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#D4D6E6] tracking-tight flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-amber-400" />
            Configuración de Autocobro Continuo
          </h2>
          <p className="text-xs sm:text-sm text-[#D4D6E6] mt-1 font-sans max-w-2xl leading-relaxed">
            Elimina multas y filas domiciliando el cobro directo de tus estancias de parquímetro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#D4D6E6] font-sans">Estado:</span>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border font-mono flex items-center gap-1.5 ${
            formData.enabled 
              ? 'bg-white/10 backdrop-blur-sm border border-white/10 text-[#D4D6E6] shadow-[0_0_15px_rgba(0,51,255,0.4)]' 
              : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
          }`}>
            <PlugConnectedIcon size={14} className={formData.enabled ? 'text-emerald-400' : 'text-rose-400'} />
            {formData.enabled ? 'AUTOCOBRO CONECTADO' : 'PAUSADO'}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 p-4 bg-black border border-neutral-800 rounded-2xl text-white text-xs font-sans font-semibold flex items-center gap-2.5 shadow-2xl">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Toggle General de Autocobro */}
        <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400">
              <PlugConnectedIcon size={20} className="text-emerald-400" />
            </div>
            <div>
              <label htmlFor="enabled" className="text-sm font-bold text-white cursor-pointer font-sans">
                Habilitar Débito / Autocobro Inteligente
              </label>
              <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                Al terminar tu tiempo o retirarte del estacionamiento, el importe se cobrará automáticamente.
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
        <fieldset role="radiogroup" aria-labelledby="funding-source-legend">
          <legend id="funding-source-legend" className="text-xs uppercase tracking-wider font-bold text-[#D4D6E6] block mb-2.5 font-sans">
            Fuente de Pago para Autocobro
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label htmlFor="fundingSource-card" className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
              formData.fundingSource === 'CARD'
                ? 'bg-[#0033FF]/20 backdrop-blur-sm border-[#807DFE]/60 text-[#D4D6E6] shadow-[0_0_15px_rgba(0,51,255,0.2)]'
                : 'bg-white/5 border-white/10 text-[#D4D6E6]/80 hover:bg-white/8'
            }`}>
              <input
                type="radio"
                id="fundingSource-card"
                name="fundingSource"
                value="CARD"
                checked={formData.fundingSource === 'CARD'}
                onChange={handleChange}
                className="mt-1 text-[#0033FF] focus:ring-[#807DFE]"
              />
              <div>
                <span className="text-sm font-bold block flex items-center gap-1.5 text-[#D4D6E6] font-sans">
                  <CreditCard className="w-4 h-4 text-[#D4D6E6]" />
                  Tarjeta de Débito / Crédito
                </span>
                <span className="text-xs text-[#D4D6E6] block mt-0.5 font-sans">
                  Cargo directo a cuenta bancaria con recibo fiscal instantáneo.
                </span>
              </div>
            </label>

            <label htmlFor="fundingSource-wallet" className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
              formData.fundingSource === 'WALLET_BALANCE'
                ? 'bg-[#0033FF]/20 backdrop-blur-sm border-[#807DFE]/60 text-[#D4D6E6] shadow-[0_0_15px_rgba(0,51,255,0.2)]'
                : 'bg-white/5 border-white/10 text-[#D4D6E6]/80 hover:bg-white/8'
            }`}>
              <input
                type="radio"
                id="fundingSource-wallet"
                name="fundingSource"
                value="WALLET_BALANCE"
                checked={formData.fundingSource === 'WALLET_BALANCE'}
                onChange={handleChange}
                className="mt-1 text-[#0033FF] focus:ring-[#807DFE]"
              />
              <div>
                <span className="text-sm font-bold block flex items-center gap-1.5 text-[#D4D6E6] font-sans">
                  <Wallet className="w-4 h-4 text-[#D4D6E6]" />
                  Saldo Prepago de Tarjeta Digital
                </span>
                <span className="text-xs text-[#D4D6E6] block mt-0.5 font-sans">
                  Se descuenta del saldo acumulado en tu monedero virtual.
                </span>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Datos Bancarios (si aplica tarjeta) */}
        {formData.fundingSource === 'CARD' && (
          <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4D6E6] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <Lock className="w-3.5 h-3.5 text-[#D4D6E6]" />
                Datos de la Tarjeta para Domiciliación
              </span>
              <span className="text-[10px] text-[#D4D6E6] font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Encriptación SSL 256-bit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cardHolder" className="block text-xs font-medium text-[#D4D6E6] mb-1 font-sans">
                  Nombre del Titular en la Tarjeta *
                </label>
                <input
                  id="cardHolder"
                  type="text"
                  name="cardHolder"
                  required
                  aria-required="true"
                  value={formData.cardHolder}
                  onChange={handleChange}
                  placeholder="NOMBRE TAL COMO APARECE"
                  className="w-full uppercase px-3.5 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-[#D4D6E6] placeholder-neutral-600 focus:outline-none focus:border-[#D4D6E6]/70 transition font-sans text-sm"
                />
              </div>

              <div>
                <label htmlFor="cardNumber" className="block text-xs font-medium text-[#D4D6E6] mb-1 font-sans">
                  Número de Tarjeta (16 dígitos) *
                </label>
                <input
                  id="cardNumber"
                  type="text"
                  name="cardNumber"
                  required
                  aria-required="true"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="4152 •••• •••• 9921"
                  className="w-full font-mono px-3.5 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-[#D4D6E6] placeholder-neutral-600 focus:outline-none focus:border-[#D4D6E6]/70 transition text-sm"
                />
              </div>

              <div>
                <label htmlFor="bank" className="block text-xs font-medium text-[#D4D6E6] mb-1 font-sans">
                  Banco Emisor / Identificador
                </label>
                <input
                  id="bank"
                  type="text"
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  placeholder="Ej. BBVA, Santander, Banorte, Nu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-[#D4D6E6] placeholder-neutral-600 focus:outline-none focus:border-[#D4D6E6]/70 transition font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="expiry" className="block text-xs font-medium text-[#D4D6E6] mb-1 font-sans">
                    Vencimiento (MM/AA)
                  </label>
                  <input
                    id="expiry"
                    type="text"
                    name="expiry"
                    maxLength="5"
                    value={formData.expiry}
                    onChange={handleChange}
                    placeholder="12/28"
                    className="w-full font-mono text-center px-3.5 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-[#D4D6E6] focus:outline-none focus:border-[#D4D6E6]/70 transition text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cvv" className="block text-xs font-medium text-[#D4D6E6] mb-1 font-sans">
                    CVV Dinámico
                  </label>
                  <input
                    id="cvv"
                    type="password"
                    name="cvv"
                    maxLength="4"
                    value={formData.cvv}
                    onChange={handleChange}
                    placeholder="•••"
                    className="w-full font-mono text-center px-3.5 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-[#D4D6E6] focus:outline-none focus:border-[#D4D6E6]/70 transition text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reglas de Seguridad y Límites de Autocobro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxLimitPerSession" className="block text-xs font-medium text-[#D4D6E6] mb-1 font-sans">
              Tope Máximo de Autocobro por Sesión (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-neutral-500 pointer-events-none flex items-center justify-center">
                <CurrencyDollarIcon size={16} strokeWidth={2} className="text-[#D4D6E6]" />
              </span>
              <input
                id="maxLimitPerSession"
                type="number"
                name="maxLimitPerSession"
                min="50"
                max="800"
                value={formData.maxLimitPerSession}
                onChange={handleChange}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-[#D4D6E6] font-mono focus:outline-none focus:border-[#D4D6E6]/70 transition text-sm"
              />
            </div>
            <p className="text-[11px] text-[#D4D6E6] mt-1 font-sans">
              Límite de seguridad contra cobros excesivos si olvidas retirar el vehículo.
            </p>
          </div>

          <div className="space-y-3 pt-2 font-sans">
            <label htmlFor="smsNotification" className="flex items-center gap-2.5 cursor-pointer text-xs text-[#D4D6E6]">
              <input
                id="smsNotification"
                type="checkbox"
                name="smsNotification"
                checked={formData.smsNotification}
                onChange={handleChange}
                className="rounded border-white/20 bg-white/5 text-[#0033FF] focus:ring-[#807DFE]"
              />
              <span>Enviar comprobante instantáneo vía SMS / Push</span>
            </label>

            <label htmlFor="autoRenew" className="flex items-center gap-2.5 cursor-pointer text-xs text-[#D4D6E6]">
              <input
                id="autoRenew"
                type="checkbox"
                name="autoRenew"
                checked={formData.autoRenew}
                onChange={handleChange}
                className="rounded border-white/20 bg-white/5 text-[#0033FF] focus:ring-[#807DFE]"
              />
              <span>Autorrenovación automática si el vehículo permanece estacionado</span>
            </label>
          </div>
        </div>

        {/* Autorización Legal / Términos de Autocobro */}
        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-start gap-3">
          <input
            type="checkbox"
            id="acceptedTerms"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleChange}
            className="mt-1 rounded border-white/20 bg-white/5 text-[#0033FF] focus:ring-[#807DFE]"
          />
          <label htmlFor="acceptedTerms" className="text-xs text-[#D4D6E6] leading-relaxed cursor-pointer font-sans">
            <span className="font-bold text-[#D4D6E6] block mb-0.5">
              Autorización expresa de débito para la placa <span className="font-mono">{vehicle.plates}</span>:
            </span>
            Autorizo al sistema de Parquímetros Digitales a debitar de forma automática el costo correspondiente 
            por tiempo de ocupación en parquímetros autorizados a nombre del titular <strong>{owner.fullName}</strong>.
          </label>
        </div>

        {/* Botón Guardar Formato */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            aria-label="Guardar formato y activar autocobro"
            className="px-6 py-3.5 rounded-2xl bg-[#0033FF] hover:bg-[#2250ff] text-white font-bold font-sans text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(0,51,255,0.6)] transition transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#01033E]"
          >
            <FileCheck2 className="w-4 h-4 text-white" />
            Guardar Formato y Activar Autocobro
          </button>
        </div>
      </form>
    </WobbleCard>
  );
};

export default AutoPaymentConfig;
