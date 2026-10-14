/**
 * =============================================================================
 * CLIENTE OFICIAL DE SUPABASE PARA PARQU (Nube PostgreSQL + Realtime WebSockets)
 * =============================================================================
 */
import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'parqu_supabase_url';
const STORAGE_KEY_KEY = 'parqu_supabase_anon_key';

const DEFAULT_SUPABASE_URL = 'https://tylmqyiyplessgyrxvyq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5bG1xeWl5cGxlc3NneXJ4dnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5OTk0MTQsImV4cCI6MjEwNzU3NTQxNH0.WLdhgY36EZ2cztchQpQVAkW4wsI1ojk8QYc0HfErYZk';

export function getSupabaseCredentials() {
  let url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL;
  let anonKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_KEY_URL);
    const customKey = localStorage.getItem(STORAGE_KEY_KEY);
    if (customUrl) url = customUrl;
    if (customKey) anonKey = customKey;
  }

  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function saveSupabaseCredentials(url, anonKey) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  }
}

let supabaseInstance = null;

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: { persistSession: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
    } catch (e) {
      console.warn('Error inicializando Supabase:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

/**
 * Obtiene el estado del vehículo y titular desde Supabase
 */
export async function fetchStateFromSupabase(plates = 'NUEVO-01') {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const cleanPlate = (plates || 'NUEVO-01').trim().toUpperCase();

    // Consultar vista consolidada
    const { data: vistaRows, error } = await supabase
      .from('vista_estado_vehicular_completo')
      .select('*')
      .eq('placas', cleanPlate)
      .limit(1);

    if (error || !vistaRows || vistaRows.length === 0) {
      // Intentar obtener el primer registro existente
      const { data: firstVeh } = await supabase
        .from('vehiculos')
        .select('*')
        .limit(1);
      if (!firstVeh || firstVeh.length === 0) return null;
    }

    const { data: vehRow } = await supabase
      .from('vehiculos')
      .select('*, titulares(*), tarjetas_nfc(*)')
      .eq('placas', cleanPlate)
      .maybeSingle();

    if (!vehRow) return null;

    const { data: autoRow } = await supabase
      .from('configuracion_autocobro')
      .select('*')
      .eq('titular_id', vehRow.titular_id)
      .maybeSingle();

    const { data: sessRow } = await supabase
      .from('sesiones_parquimetro')
      .select('*')
      .eq('vehiculo_id', vehRow.id)
      .eq('estado', 'ACTIVA')
      .maybeSingle();

    const { data: txns } = await supabase
      .from('transacciones')
      .select('*')
      .eq('vehiculo_id', vehRow.id)
      .order('fecha_transaccion', { ascending: false })
      .limit(50);

    const { data: pins } = await supabase
      .from('ubicaciones_fijadas')
      .select('*')
      .eq('vehiculo_id', vehRow.id)
      .order('fecha_registro', { ascending: false })
      .limit(30);

    const { data: infs } = await supabase
      .from('infracciones')
      .select('*')
      .eq('placas', cleanPlate)
      .order('fecha_emision', { ascending: false })
      .limit(20);

    const cardRow = Array.isArray(vehRow.tarjetas_nfc)
      ? vehRow.tarjetas_nfc[0]
      : vehRow.tarjetas_nfc;
    const titRow = vehRow.titulares;

    return {
      ok: true,
      vehicle: {
        plates: vehRow.placas,
        brand: vehRow.marca,
        model: vehRow.modelo,
        color: vehRow.color,
        year: vehRow.anio,
        type: vehRow.tipo,
      },
      owner: titRow
        ? {
            fullName: titRow.nombre_completo,
            email: titRow.email,
            phone: titRow.telefono,
            idNumber: titRow.identificacion_oficial,
          }
        : null,
      card: cardRow
        ? {
            cardNumber: cardRow.numero_tarjeta,
            validThru: cardRow.vigencia,
            status: cardRow.estado,
            balance: Number(cardRow.saldo) || 0.0,
            rfidTag: cardRow.rfid_tag,
            designId: cardRow.diseno_id,
            customLabel: cardRow.etiqueta_personalizada,
            overlayStyle: cardRow.estilo_overlay,
          }
        : null,
      autoPay: autoRow
        ? {
            enabled: autoRow.habilitado,
            fundingSource: autoRow.fuente_fondos,
            cardHolder: autoRow.titular_tarjeta,
            cardNumber: autoRow.numero_tarjeta_bancaria,
            bank: autoRow.banco,
            maxLimitPerSession: Number(autoRow.limite_maximo_sesion) || 180,
            autoRenew: autoRow.auto_renovar,
            smsNotification: autoRow.notificacion_sms,
            authorizedAt: autoRow.fecha_autorizacion,
          }
        : null,
      activeSession: sessRow
        ? {
            id: sessRow.sesion_uid,
            zoneName: sessRow.zona_nombre,
            ratePerHour: Number(sessRow.tarifa_hora) || 6,
            coords:
              sessRow.latitud && sessRow.longitud
                ? { lat: Number(sessRow.latitud), lng: Number(sessRow.longitud) }
                : null,
            startTime: sessRow.hora_inicio,
            secondsElapsed: sessRow.segundos_transcurridos || 0,
            scheduledHours: sessRow.horas_programadas || 1,
            currentCost: Number(sessRow.costo_actual) || 0,
            maxLimit: Number(sessRow.limite_maximo) || 180,
          }
        : null,
      transactions: (txns || []).map((t) => ({
        id: t.txn_uid,
        folio: t.folio,
        date: t.fecha_transaccion,
        zone: t.zona,
        durationMinutes: t.duracion_minutos,
        amount: Number(t.monto),
        method: t.metodo_pago,
        plate: t.placas,
        status: t.estado,
      })),
      pinnedLocations: (pins || []).map((p) => ({
        id: p.pin_uid,
        name: p.nombre,
        address: p.direccion,
        lat: Number(p.latitud),
        lng: Number(p.longitud),
        date: p.fecha_registro,
        plates: p.placas,
        notes: p.notas,
        status: p.estado,
        ratePerHour: Number(p.tarifa_hora),
        folio: p.folio,
      })),
      infractions: (infs || []).map((inf) => ({
        id: inf.inf_uid,
        folio: inf.folio,
        date: inf.fecha_emision,
        plate: inf.placas,
        reason: inf.motivo,
        amount: Number(inf.monto),
        discountAmount: Number(inf.monto_descuento),
        officerId: inf.oficial_id,
        zone: inf.zona,
        status: inf.estado,
      })),
    };
  } catch (err) {
    console.warn('Error fetching state from Supabase:', err);
    return null;
  }
}

/**
 * Sincroniza el estado actual hacia Supabase (Nube)
 */
export async function syncStateToSupabase(payload) {
  const supabase = getSupabaseClient();
  if (!supabase || !payload) return false;

  try {
    const { vehicle, owner, card, autoPay, activeSession, transactions, pinnedLocations, infractions } = payload;
    const cleanPlate = (vehicle?.plates || 'NUEVO-01').trim().toUpperCase();

    // 1. Titular
    if (owner?.fullName) {
      await supabase
        .from('titulares')
        .upsert(
          {
            id: 1,
            nombre_completo: owner.fullName,
            email: owner.email || 'conductor@parqu.app',
            telefono: owner.phone || '55 0000 0000',
            identificacion_oficial: owner.idNumber || 'REG-00000001',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    }

    // 2. Vehículo
    if (cleanPlate) {
      await supabase
        .from('vehiculos')
        .upsert(
          {
            id: 1,
            titular_id: 1,
            placas: cleanPlate,
            marca: vehicle?.brand || 'Marca',
            modelo: vehicle?.model || 'Modelo',
            color: vehicle?.color || 'Blanco',
            anio: vehicle?.year || '2025',
            tipo: vehicle?.type || 'Sedán',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    }

    // 3. Tarjeta NFC y Saldo
    if (card) {
      await supabase
        .from('tarjetas_nfc')
        .upsert(
          {
            id: 1,
            titular_id: 1,
            vehiculo_id: 1,
            numero_tarjeta: card.cardNumber || '4890 •••• •••• 0001',
            vigencia: card.validThru || '12/29',
            estado: card.status || 'ACTIVA',
            saldo: Number(card.balance) || 0.0,
            rfid_tag: card.rfidTag || 'NFC-MX-00001-PK',
            diseno_id: card.designId || 'blue',
            etiqueta_personalizada: card.customLabel || 'PARQU PASS NFC',
            estilo_overlay: card.overlayStyle || 'glass',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    }

    // 4. Autocobro
    if (autoPay) {
      await supabase
        .from('configuracion_autocobro')
        .upsert(
          {
            id: 1,
            titular_id: 1,
            habilitado: Boolean(autoPay.enabled),
            fuente_fondos: autoPay.fundingSource || 'CARD',
            titular_tarjeta: autoPay.cardHolder || 'Nuevo Conductor',
            numero_tarjeta_bancaria: autoPay.cardNumber || '•••• •••• •••• 0000',
            banco: autoPay.bank || 'Tarjeta Registrada',
            limite_maximo_sesion: Number(autoPay.maxLimitPerSession) || 180,
            auto_renovar: Boolean(autoPay.autoRenew),
            notificacion_sms: Boolean(autoPay.smsNotification),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    }

    // 5. Sesión activa
    if (activeSession === null) {
      await supabase
        .from('sesiones_parquimetro')
        .update({ estado: 'FINALIZADA', hora_fin: new Date().toISOString() })
        .eq('vehiculo_id', 1)
        .eq('estado', 'ACTIVA');
    } else if (activeSession && activeSession.id) {
      await supabase
        .from('sesiones_parquimetro')
        .upsert(
          {
            sesion_uid: activeSession.id,
            vehiculo_id: 1,
            tarjeta_id: 1,
            placas: cleanPlate,
            zona_nombre: activeSession.zoneName || 'Espacio #1042',
            tarifa_hora: Number(activeSession.ratePerHour) || 6,
            latitud: activeSession.coords?.lat || null,
            longitud: activeSession.coords?.lng || null,
            hora_inicio: activeSession.startTime || new Date().toISOString(),
            segundos_transcurridos: activeSession.secondsElapsed || 0,
            horas_programadas: activeSession.scheduledHours || 1,
            costo_actual: Number(activeSession.currentCost) || 0,
            limite_maximo: Number(activeSession.maxLimit) || 180,
            estado: 'ACTIVA',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'sesion_uid' }
        );
    }

    return true;
  } catch (err) {
    console.warn('Error syncing state to Supabase:', err);
    return false;
  }
}
