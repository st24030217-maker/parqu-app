import React, { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Car,
  User,
  MapPin,
  FileWarning,
  CheckCircle2,
  Share2,
  Smartphone,
  CreditCard,
  Radio,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { sileo } from 'sileo';
import { useParking } from '../context/ParkingContext';
import {
  fetchVehicleStateFromCloud,
  subscribeToVehiclePlate,
  normalizePlateKey,
} from '../utils/cloudSync';
import { triggerHaptic } from '../utils/haptics';

const INFRACTION_REASONS = [
  {
    id: 'NO_PAYMENT',
    label: 'Omisión de pago en zona de parquímetro digital (Art. 30 Fracc. II)',
    amount: 542.85,
  },
  {
    id: 'EXPIRED_TIME',
    label: 'Tiempo de estancia vencido sin renovación activa',
    amount: 542.85,
  },
  {
    id: 'INVALID_ZONE',
    label: 'Estacionamiento fuera de cajón autorizado en polígono',
    amount: 759.99,
  },
];

export const InspectorNFCView = ({ initialPlate = '' }) => {
  const {
    vehicle,
    owner,
    card,
    activeSession,
    infractions,
    lastInspection,
    issueInfraction,
    recordInspectionApproval,
    payInfraction,
    cloudStatus,
    lastCloudSyncAt,
    syncNowToCloud,
  } = useParking();

  const [queryPlate, setQueryPlate] = useState(
    () => (initialPlate || vehicle?.plates || 'XYZ-7842').toUpperCase()
  );
  const [inspectedPlate, setInspectedPlate] = useState(
    () => (initialPlate || vehicle?.plates || 'XYZ-7842').toUpperCase()
  );
  const [remoteState, setRemoteState] = useState(null);
  const [isScanningNFC, setIsScanningNFC] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveConnectionState, setLiveConnectionState] = useState('CONNECTED');
  const [selectedReasonId, setSelectedReasonId] = useState('NO_PAYMENT');
  const [officerBadge, setOfficerBadge] = useState('OFICIAL-TR-084');
  const [liveTimerSeconds, setLiveTimerSeconds] = useState(0);

  const isLocalPlate =
    normalizePlateKey(inspectedPlate) === normalizePlateKey(vehicle?.plates || 'XYZ-7842');

  // Datos combinados en tiempo real (si es la misma placa usa contexto sincronizado + nube; si es otra placa usa el estado remoto de la nube)
  const effectiveVehicle = isLocalPlate
    ? vehicle
    : remoteState?.vehicle || {
        plates: inspectedPlate,
        brand: 'Vehículo en Padrón NFC',
        model: 'Registro Metropolitano',
        color: 'Verificado',
        year: '2024',
      };

  const effectiveOwner = isLocalPlate
    ? owner
    : remoteState?.owner || {
        fullName: 'Conductor Registrado Parqu',
        idNumber: 'NFC-VERIFICADO',
      };

  const effectiveCard = isLocalPlate
    ? card
    : remoteState?.card || {
        rfidTag: `NFC-MX-${normalizePlateKey(inspectedPlate)}`,
        status: remoteState?.activeSession ? 'EN_PARQUIMETRO' : 'ACTIVA',
        balance: 0,
      };

  const effectiveSession = isLocalPlate ? activeSession : remoteState?.activeSession || null;
  const effectiveInfractions = isLocalPlate ? infractions : remoteState?.infractions || [];
  const effectiveLastInspection = isLocalPlate
    ? lastInspection
    : remoteState?.lastInspection || null;

  // Suscripción en tiempo real a la placa inspeccionada en la nube
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = subscribeToVehiclePlate(
      inspectedPlate,
      (envelope) => {
        setRemoteState(envelope);
        setIsSyncing(false);
      },
      (status) => {
        setLiveConnectionState(status);
        setIsSyncing(false);
      }
    );

    const timeout = setTimeout(() => setIsSyncing(false), 1200);
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [inspectedPlate]);

  // Cronómetro en vivo al segundo cuando el vehículo inspeccionado tiene pago activo
  useEffect(() => {
    if (!effectiveSession || !effectiveSession.startTime) {
      setLiveTimerSeconds(0);
      return undefined;
    }

    const updateTimer = () => {
      const elapsed = Math.max(
        Number(effectiveSession.secondsElapsed) || 0,
        Math.floor((Date.now() - new Date(effectiveSession.startTime).getTime()) / 1000)
      );
      setLiveTimerSeconds(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [effectiveSession]);

  const formatDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Consultar placa manualmente o refrescar desde la nube
  const handleSearchPlate = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const cleaned = (queryPlate || '').trim().toUpperCase();
    if (!cleaned) return;
    triggerHaptic();
    setIsSyncing(true);
    setInspectedPlate(cleaned);

    if (normalizePlateKey(cleaned) === normalizePlateKey(vehicle?.plates)) {
      await syncNowToCloud();
    }
    const cloudData = await fetchVehicleStateFromCloud(cleaned);
    if (cloudData) {
      setRemoteState(cloudData);
    }
    setIsSyncing(false);
    sileo.info({
      title: `Placa ${cleaned} Sincronizada`,
      description: 'Estado obtenido en tiempo real desde la nube Parqu NFC.',
    });
  };

  // Escanear Chip NFC físico (Web NFC API NDEFReader en Android + Simulación instantánea)
  const handleScanNFCChip = useCallback(async () => {
    triggerHaptic();
    setIsScanningNFC(true);

    try {
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        const ndef = new window.NDEFReader();
        await ndef.scan();
        sileo.info({
          title: 'Lector NFC Activo',
          description: 'Acerca el teléfono al chip NFC del parabrisas o tarjeta Parqu.',
        });

        ndef.onreading = async (event) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            const text = decoder.decode(record.data);
            const match = text.match(/nfc=([A-Z0-9-]+)/i);
            const detectedPlate = match ? match[1].toUpperCase() : text.trim().toUpperCase();
            if (detectedPlate) {
              setQueryPlate(detectedPlate);
              setInspectedPlate(detectedPlate);
              const cloudData = await fetchVehicleStateFromCloud(detectedPlate);
              if (cloudData) setRemoteState(cloudData);
              break;
            }
          }
          setIsScanningNFC(false);
          sileo.success({
            title: '¡Chip NFC Leído con Éxito!',
            description: 'Datos del vehículo y estado de pago cargados en vivo.',
          });
        };
        return;
      }
    } catch {
      // Fallback a lectura simulada en dispositivos sin Web NFC nativo (iOS / Desktop)
    }

    setTimeout(async () => {
      const target = (queryPlate || vehicle?.plates || 'XYZ-7842').trim().toUpperCase();
      setInspectedPlate(target);
      const cloudData = await fetchVehicleStateFromCloud(target);
      if (cloudData) setRemoteState(cloudData);
      setIsScanningNFC(false);
      sileo.success({
        title: `Chip NFC Leído (${target})`,
        description: effectiveSession
          ? 'Semáforo VERDE: Pago de parquímetro activo y verificado.'
          : 'Semáforo ROJO: Vehículo sin sesión de parquímetro activa.',
      });
    }, 900);
  }, [queryPlate, vehicle?.plates, effectiveSession]);

  // Grabar Chip NFC físico o copiar enlace NFC para programar etiqueta NTAG213/215
  const handleWriteOrShareNFC = async () => {
    triggerHaptic();
    const baseUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'https://parqu.app/';
    const nfcUrl = `${baseUrl}?nfc=${encodeURIComponent(inspectedPlate)}`;

    // Intentar grabar en chip físico si Web NFC está disponible
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.write({
          records: [{ recordType: 'url', data: nfcUrl }],
        });
        sileo.success({
          title: '¡Chip NFC Programado!',
          description: `La placa ${inspectedPlate} quedó grabada en el chip NFC físico.`,
        });
        return;
      } catch {
        // Fallback a copiar enlace
      }
    }

    try {
      await navigator.clipboard.writeText(nfcUrl);
      sileo.success({
        title: 'Enlace para Chip NFC Copiado',
        description: `Pégalo en NFC Tools o ábrelo en otro celular: ${nfcUrl}`,
      });
    } catch {
      sileo.info({
        title: 'URL de Chip NFC',
        description: nfcUrl,
      });
    }
  };

  // Oficial aprueba inspección (Todo en orden)
  const handleApproveInspection = () => {
    triggerHaptic();
    recordInspectionApproval({
      targetState: isLocalPlate ? null : remoteState || { plates: inspectedPlate },
      officerId: officerBadge,
      notes: `Pago vigente verificado vía NFC en ${effectiveSession?.zoneName || 'Zona Parqu'}`,
    });
    sileo.success({
      title: 'Verificación Vial Aprobada',
      description: `Se notificó en vivo al conductor de la placa ${inspectedPlate} que todo está en orden.`,
    });
  };

  // Oficial emite multa / boleta de infracción en tiempo real
  const handleEmitInfraction = () => {
    triggerHaptic();
    const reasonObj =
      INFRACTION_REASONS.find((r) => r.id === selectedReasonId) || INFRACTION_REASONS[0];

    const created = issueInfraction({
      targetState: isLocalPlate ? null : remoteState || { plates: inspectedPlate },
      reason: reasonObj.label,
      amount: reasonObj.amount,
      officerId: officerBadge,
      zone: 'Polígono Centro Histórico • Inspección NFC',
    });

    sileo.error({
      title: `Multa Emitida en Vivo (${created.folio})`,
      description: `Enviada en tiempo real a la placa ${inspectedPlate} por $${created.amount.toFixed(2)} MXN.`,
    });
  };

  const liveAmountCovered = effectiveSession
    ? Math.max(
        Number(effectiveSession.currentCost) || 0,
        (liveTimerSeconds / 3600) * (Number(effectiveSession.ratePerHour) || 6.0)
      ).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-5 sm:space-y-6 font-sans">
      {/* ── ENCABEZADO DE CONEXIÓN EN TIEMPO REAL Y LECTOR DE CHIP NFC ── */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#070B2E] text-white border border-white/10 shadow-xl relative overflow-hidden">
        <div
          className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(circle, #0044FF 0%, #807DFE 50%, transparent 75%)',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {liveConnectionState === 'CONNECTED' || cloudStatus === 'CONNECTED'
                  ? 'BASE DE DATOS EN VIVO CONECTADA'
                  : 'SINCRONIZANDO NUBE EN VIVO'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-[#D4D6E6] text-[10px] font-mono font-bold">
                CHIP ID: {effectiveCard?.rfidTag || 'NFC-MX-09142-PK'}
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-[#807DFE]" />
              Terminal de Inspección Vial NFC en Tiempo Real
            </h2>
            <p className="text-xs text-[#D4D6E6]/85 mt-1 max-w-2xl leading-relaxed">
              Cuando el oficial de tránsito acerca su dispositivo al chip NFC del vehículo (o ingresa la placa desde otro celular), el sistema consulta en vivo si el parquímetro está pagado o permite generar una boleta de infracción al instante.
            </p>
          </div>

          {/* Botones de Acción NFC (Leer Chip / Programar Chip) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleScanNFCChip}
              disabled={isScanningNFC}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0044FF] hover:bg-[#0033CC] text-white text-xs font-bold transition shadow-lg cursor-pointer border-0"
            >
              <Wifi className={`w-4 h-4 rotate-90 ${isScanningNFC ? 'animate-ping' : ''}`} />
              <span>{isScanningNFC ? 'Leyendo Chip NFC...' : 'Leer Chip NFC'}</span>
            </button>

            <button
              type="button"
              onClick={handleWriteOrShareNFC}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/15"
            >
              <Share2 className="w-3.5 h-3.5 text-[#807DFE]" />
              <span>Link / Grabar Chip NFC</span>
            </button>
          </div>
        </div>

        {/* Buscador en Vivo de Placa entre Dispositivos */}
        <form
          onSubmit={handleSearchPlate}
          className="relative z-10 mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#807DFE] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={queryPlate}
              onChange={(e) => setQueryPlate(e.target.value.toUpperCase())}
              placeholder="Ingresa placa a verificar en vivo (ej. XYZ-7842)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm font-mono font-bold uppercase text-white placeholder:text-white/40 focus:outline-none focus:border-[#807DFE]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Verificar Placa en Vivo</span>
            </button>

            {normalizePlateKey(inspectedPlate) !== normalizePlateKey(vehicle?.plates) && (
              <button
                type="button"
                onClick={() => {
                  const myPlate = (vehicle?.plates || 'XYZ-7842').toUpperCase();
                  setQueryPlate(myPlate);
                  setInspectedPlate(myPlate);
                }}
                className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border-0"
              >
                Mi Placa ({vehicle?.plates})
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── SEMÁFORO OFICIAL DE TRÁNSITO EN TIEMPO REAL (VERDE = PAGADO / ROJO = SIN PAGO) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* COLUMNA IZQUIERDA (7 COLS): DICTAMEN EN VIVO DEL PARQUÍMETRO */}
        <div className="lg:col-span-7 space-y-4">
          {effectiveSession ? (
            /* 🟢 ESTADO VERDE: PAGO DE PARQUÍMETRO VIGENTE */
            <div className="p-5 sm:p-6 rounded-3xl bg-emerald-950 text-white border-2 border-emerald-400/50 shadow-xl space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shrink-0">
                    <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-slate-950" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-mono font-black uppercase tracking-widest">
                      ● SEMÁFORO VIAL: VERDE (PAGO VIGENTE)
                    </span>
                    <h3 className="text-lg sm:text-2xl font-black text-white mt-0.5">
                      Estancia Activa — Vehículo en Regla
                    </h3>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-white/10 font-mono font-black text-xs sm:text-sm text-emerald-300 border border-emerald-400/30">
                  {inspectedPlate}
                </span>
              </div>

              {/* Cronómetro en Vivo y Monto Cubierto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/30 border border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-300/80 block">
                    Tiempo Activo en Vivo
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {formatDuration(liveTimerSeconds)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-300/80 block">
                    Monto Devengado ($6/hr)
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                    ${liveAmountCovered} MXN
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-300/80 block">
                    Tiempo Autorizado
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white">
                    {effectiveSession.scheduledHours || 1} hr(s)
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-emerald-100/90 font-sans">
                <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <span className="text-emerald-200/70">Zona / Cajón:</span>
                  <strong className="font-mono text-white">{effectiveSession.zoneName}</strong>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                  <span className="text-emerald-200/70">Folio de Sesión Activa:</span>
                  <strong className="font-mono text-emerald-300">{effectiveSession.id}</strong>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-emerald-200/70">Modalidad de Pago:</span>
                  <strong className="text-white">Autocobro Digital NFC Activo</strong>
                </div>
              </div>

              {/* Botón para que el Agente registre inspección aprobada */}
              <button
                type="button"
                onClick={handleApproveInspection}
                className="w-full py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer border-0"
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Registrar Inspección Vial Aprobada (Notificar al Conductor)</span>
              </button>
            </div>
          ) : (
            /* 🔴 ESTADO ROJO: SIN PAGO ACTIVO — GENERADOR DE MULTA PARA TRÁNSITO */
            <div className="p-5 sm:p-6 rounded-3xl bg-rose-950 text-white border-2 border-rose-400/50 shadow-xl space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shrink-0">
                    <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-400/20 text-rose-300 text-[10px] font-mono font-black uppercase tracking-widest">
                      ● SEMÁFORO VIAL: ROJO (SIN PAGO ACTIVO)
                    </span>
                    <h3 className="text-lg sm:text-2xl font-black text-white mt-0.5">
                      Parquímetro Inactivo — Sujeto a Multa
                    </h3>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-white/10 font-mono font-black text-xs sm:text-sm text-rose-300 border border-rose-400/30">
                  {inspectedPlate}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/30 border border-rose-400/20 text-xs text-rose-100 leading-relaxed">
                El chip NFC vinculado a la placa <strong className="font-mono text-white">{inspectedPlate}</strong> no registra un pago de parquímetro activo en este instante. El agente vial puede emitir la boleta de infracción digital o el conductor puede activar su parquímetro para cambiar el semáforo a verde en vivo.
              </div>

              {/* Formulario de Emisión de Multa en Tiempo Real */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-rose-200 mb-1.5 font-bold">
                    Motivo de Infracción Vial
                  </label>
                  <select
                    value={selectedReasonId}
                    onChange={(e) => setSelectedReasonId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-xs text-white focus:outline-none focus:border-rose-400"
                  >
                    {INFRACTION_REASONS.map((reason) => (
                      <option key={reason.id} value={reason.id} className="bg-slate-900 text-white">
                        {reason.label} (${reason.amount.toFixed(2)} MXN)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-rose-200 mb-1 font-bold">
                      Credencial Oficial de Tránsito
                    </label>
                    <input
                      type="text"
                      value={officerBadge}
                      onChange={(e) => setOfficerBadge(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/20 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="px-3.5 py-2 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between text-xs">
                      <span className="text-rose-200">50% Pronto Pago:</span>
                      <strong className="font-mono text-emerald-300">
                        $
                        {(
                          ((INFRACTION_REASONS.find((r) => r.id === selectedReasonId)?.amount ||
                            542.85) *
                            0.5)
                        ).toFixed(2)}{' '}
                        MXN
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEmitInfraction}
                  className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer border-0"
                >
                  <FileWarning className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Emitir Boleta de Multa en Tiempo Real</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA (5 COLS): EXPEDIENTE DEL CHIP NFC Y BOLETAS EMITIDAS */}
        <div className="lg:col-span-5 space-y-4">
          {/* Datos vinculados al Chip NFC */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0033FF] font-bold">
                  EXPEDIENTE CHIP NFC
                </span>
                <h4 className="text-base font-black text-slate-900">
                  Datos Leídos del Vehículo
                </h4>
              </div>
              <Car className="w-5 h-5 text-[#0033FF]" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Placas Oficiales</span>
                <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  {effectiveVehicle?.plates || inspectedPlate}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Vehículo</span>
                <strong className="text-slate-900">
                  {effectiveVehicle?.brand} {effectiveVehicle?.model} ({effectiveVehicle?.year})
                </strong>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Color</span>
                <strong className="text-slate-900">{effectiveVehicle?.color}</strong>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Titular Registrado</span>
                <strong className="text-slate-900">{effectiveOwner?.fullName}</strong>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Última Sincronización Nube</span>
                <span className="font-mono text-[11px] text-slate-700">
                  {new Date(remoteState?.updatedAt || lastCloudSyncAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {effectiveLastInspection && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] flex items-center justify-between">
                <div>
                  <span className="font-mono uppercase font-bold text-slate-500 block">
                    Última Revisión de Tránsito
                  </span>
                  <strong className="text-slate-900">
                    {effectiveLastInspection.officerId} •{' '}
                    {new Date(effectiveLastInspection.date).toLocaleTimeString()}
                  </strong>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] ${
                    effectiveLastInspection.result === 'APROBADO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {effectiveLastInspection.result}
                </span>
              </div>
            )}
          </div>

          {/* Lista de Multas / Infracciones en Tiempo Real */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Boletas de Infracción ({effectiveInfractions.length})
              </h4>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                EN TIEMPO REAL
              </span>
            </div>

            {effectiveInfractions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl">
                Sin multas ni infracciones registradas para la placa{' '}
                <strong className="font-mono text-slate-800">{inspectedPlate}</strong>.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {effectiveInfractions.map((inf) => (
                  <div
                    key={inf.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-slate-900">
                        {inf.folio} • {inf.plate}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          inf.status === 'PAGADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inf.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{inf.reason}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-slate-500">
                        Monto: <strong>${Number(inf.amount).toFixed(2)}</strong>
                      </span>
                      {inf.status !== 'PAGADA' && isLocalPlate && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic();
                            const paid = payInfraction(inf.id);
                            if (paid) {
                              sileo.success({
                                title: `Multa ${inf.folio} Pagada`,
                                description: `Se aplicó 50% de descuento ($${paid.amount.toFixed(2)} MXN).`,
                              });
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#0033FF] hover:bg-[#0026CC] text-white text-[11px] font-bold transition cursor-pointer border-0"
                        >
                          Pagar con 50% Desc. ($
                          {(inf.discountAmount || inf.amount * 0.5).toFixed(2)})
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectorNFCView;
