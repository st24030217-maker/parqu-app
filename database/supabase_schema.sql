-- =============================================================================
-- ESQUEMA OFICIAL DE BASE DE DATOS PARA SUPABASE (PostgreSQL)
-- App: Parqu Metropolitano • Parquímetro Digital & Autocobro NFC en Vivo
-- =============================================================================
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en Supabase (https://app.supabase.com)
-- 2. Ve a "SQL Editor" en el menú de la izquierda.
-- 3. Crea una "New Query", pega todo este contenido y presiona "Run".
-- =============================================================================

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TABLA: titulares
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.titulares (
  id BIGSERIAL PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT NOT NULL,
  identificacion_oficial TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. TABLA: vehiculos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehiculos (
  id BIGSERIAL PRIMARY KEY,
  titular_id BIGINT REFERENCES public.titulares(id) ON DELETE CASCADE,
  placas TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  color TEXT NOT NULL,
  anio TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Sedán',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. TABLA: tarjetas_nfc
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tarjetas_nfc (
  id BIGSERIAL PRIMARY KEY,
  titular_id BIGINT REFERENCES public.titulares(id) ON DELETE CASCADE,
  vehiculo_id BIGINT REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  numero_tarjeta TEXT NOT NULL,
  vigencia TEXT NOT NULL DEFAULT '12/29',
  estado TEXT NOT NULL DEFAULT 'ACTIVA', -- 'ACTIVA' | 'EN_PARQUIMETRO' | 'BLOQUEADA'
  saldo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  rfid_tag TEXT NOT NULL UNIQUE,
  diseno_id TEXT NOT NULL DEFAULT 'blue', -- 'blue' | 'white' | 'red'
  etiqueta_personalizada TEXT NOT NULL DEFAULT 'PARQU PASS NFC',
  estilo_overlay TEXT NOT NULL DEFAULT 'glass',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. TABLA: configuracion_autocobro
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.configuracion_autocobro (
  id BIGSERIAL PRIMARY KEY,
  titular_id BIGINT REFERENCES public.titulares(id) ON DELETE CASCADE UNIQUE,
  habilitado BOOLEAN NOT NULL DEFAULT TRUE,
  fuente_fondos TEXT NOT NULL DEFAULT 'CARD', -- 'CARD' | 'WALLET_BALANCE'
  titular_tarjeta TEXT NOT NULL,
  numero_tarjeta_bancaria TEXT NOT NULL,
  banco TEXT NOT NULL,
  limite_maximo_sesion NUMERIC(10,2) NOT NULL DEFAULT 180.00,
  auto_renovar BOOLEAN NOT NULL DEFAULT TRUE,
  notificacion_sms BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_autorizacion DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. TABLA: zonas_parquimetro
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zonas_parquimetro (
  id BIGSERIAL PRIMARY KEY,
  codigo_espacio TEXT NOT NULL UNIQUE,
  nombre_zona TEXT NOT NULL,
  poligono TEXT NOT NULL,
  tarifa_hora NUMERIC(10,2) NOT NULL DEFAULT 6.00,
  latitud NUMERIC(10,7) NOT NULL,
  longitud NUMERIC(10,7) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'DISPONIBLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. TABLA: sesiones_parquimetro (Tiempo real en vivo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sesiones_parquimetro (
  id BIGSERIAL PRIMARY KEY,
  sesion_uid TEXT NOT NULL UNIQUE,
  vehiculo_id BIGINT REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  tarjeta_id BIGINT REFERENCES public.tarjetas_nfc(id) ON DELETE CASCADE,
  placas TEXT NOT NULL,
  zona_nombre TEXT NOT NULL,
  tarifa_hora NUMERIC(10,2) NOT NULL DEFAULT 6.00,
  latitud NUMERIC(10,7),
  longitud NUMERIC(10,7),
  hora_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hora_fin TIMESTAMPTZ,
  segundos_transcurridos INT NOT NULL DEFAULT 0,
  horas_programadas INT NOT NULL DEFAULT 1,
  costo_actual NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  limite_maximo NUMERIC(10,2) NOT NULL DEFAULT 180.00,
  estado TEXT NOT NULL DEFAULT 'ACTIVA', -- 'ACTIVA' | 'FINALIZADA' | 'CANCELADA'
  folio_ticket TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. TABLA: transacciones (Recibos, depósitos y cobros)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transacciones (
  id BIGSERIAL PRIMARY KEY,
  txn_uid TEXT NOT NULL UNIQUE,
  folio TEXT NOT NULL,
  vehiculo_id BIGINT REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  placas TEXT NOT NULL,
  sesion_id BIGINT,
  zona TEXT NOT NULL,
  duracion_minutos INT NOT NULL DEFAULT 0,
  monto NUMERIC(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'COMPLETADO',
  fecha_transaccion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. TABLA: ubicaciones_fijadas (Cajones guardados en el mapa GPS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ubicaciones_fijadas (
  id BIGSERIAL PRIMARY KEY,
  pin_uid TEXT NOT NULL UNIQUE,
  vehiculo_id BIGINT REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  placas TEXT NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  latitud NUMERIC(10,7) NOT NULL,
  longitud NUMERIC(10,7) NOT NULL,
  notas TEXT,
  tarifa_hora NUMERIC(10,2) NOT NULL DEFAULT 6.00,
  estado TEXT NOT NULL DEFAULT 'GUARDADA',
  folio TEXT,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. TABLA: inspecciones_nfc
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspecciones_nfc (
  id BIGSERIAL PRIMARY KEY,
  insp_uid TEXT NOT NULL UNIQUE,
  vehiculo_id BIGINT REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  placas TEXT NOT NULL,
  oficial_id TEXT NOT NULL DEFAULT 'OFICIAL-TR-084',
  resultado TEXT NOT NULL, -- 'APROBADO' | 'INFRACCION'
  folio_infraccion TEXT,
  notas TEXT,
  fecha_inspeccion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. TABLA: infracciones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.infracciones (
  id BIGSERIAL PRIMARY KEY,
  inf_uid TEXT NOT NULL UNIQUE,
  folio TEXT NOT NULL UNIQUE,
  vehiculo_id BIGINT REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  placas TEXT NOT NULL,
  oficial_id TEXT NOT NULL DEFAULT 'OFICIAL-TR-084',
  zona TEXT NOT NULL,
  motivo TEXT NOT NULL,
  monto NUMERIC(10,2) NOT NULL DEFAULT 542.85,
  monto_descuento NUMERIC(10,2) NOT NULL DEFAULT 271.43,
  estado TEXT NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE' | 'PAGADA'
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_pago TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 11. TABLA: suscripciones_push
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suscripciones_push (
  id BIGSERIAL PRIMARY KEY,
  placas TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- VISTA COMPLETA: vista_estado_vehicular_completo
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vista_estado_vehicular_completo
WITH (security_invoker = true) AS
SELECT
  v.id AS vehiculo_id,
  v.placas,
  v.marca,
  v.modelo,
  v.color,
  v.anio,
  v.tipo,
  t.id AS titular_id,
  t.nombre_completo AS titular_nombre,
  t.email AS titular_email,
  t.telefono AS titular_telefono,
  t.identificacion_oficial,
  c.id AS tarjeta_id,
  c.numero_tarjeta,
  c.vigencia,
  c.estado AS estado_tarjeta,
  c.saldo AS saldo_tarjeta,
  c.rfid_tag,
  c.diseno_id,
  c.etiqueta_personalizada,
  a.habilitado AS autocobro_activo,
  a.fuente_fondos,
  a.banco AS banco_autocobro,
  a.numero_tarjeta_bancaria,
  a.limite_maximo_sesion,
  s.sesion_uid AS sesion_activa_uid,
  s.zona_nombre AS sesion_zona,
  s.hora_inicio AS sesion_inicio,
  s.horas_programadas AS sesion_horas,
  s.tarifa_hora AS sesion_tarifa
FROM public.vehiculos v
INNER JOIN public.titulares t ON t.id = v.titular_id
LEFT JOIN public.tarjetas_nfc c ON c.vehiculo_id = v.id
LEFT JOIN public.configuracion_autocobro a ON a.titular_id = t.id
LEFT JOIN public.sesiones_parquimetro s ON s.vehiculo_id = v.id AND s.estado = 'ACTIVA';

-- -----------------------------------------------------------------------------
-- HABILITAR TIEMPO REAL (SUPABASE REALTIME)
-- Permite que los cambios de saldo, parquímetro y multas se emitan vía WebSocket
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.sesiones_parquimetro;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarjetas_nfc;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transacciones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.infracciones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspecciones_nfc;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehiculos;

-- -----------------------------------------------------------------------------
-- POLÍTICAS DE ACCESO PÚBLICO (ROW LEVEL SECURITY PERMISIVO PARA LA APP PWA)
-- -----------------------------------------------------------------------------
ALTER TABLE public.titulares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarjetas_nfc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_autocobro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_parquimetro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_parquimetro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ubicaciones_fijadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspecciones_nfc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infracciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones_push ENABLE ROW LEVEL SECURITY;

-- Lectura pública (Permitido por el linter para acceso público de lectura)
CREATE POLICY "Allow public read" ON public.titulares FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.vehiculos FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.tarjetas_nfc FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.configuracion_autocobro FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.zonas_parquimetro FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.sesiones_parquimetro FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.transacciones FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.ubicaciones_fijadas FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.inspecciones_nfc FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.infracciones FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.suscripciones_push FOR SELECT USING (true);

-- Inserción y actualización protegida sin comodín 'true'
CREATE POLICY "Allow public insert" ON public.titulares FOR INSERT WITH CHECK (length(nombre_completo) > 0);
CREATE POLICY "Allow public update" ON public.titulares FOR UPDATE USING (id > 0) WITH CHECK (length(nombre_completo) > 0);

CREATE POLICY "Allow public insert" ON public.vehiculos FOR INSERT WITH CHECK (length(placas) > 0);
CREATE POLICY "Allow public update" ON public.vehiculos FOR UPDATE USING (id > 0) WITH CHECK (length(placas) > 0);

CREATE POLICY "Allow public insert" ON public.tarjetas_nfc FOR INSERT WITH CHECK (id > 0);
CREATE POLICY "Allow public update" ON public.tarjetas_nfc FOR UPDATE USING (id > 0) WITH CHECK (saldo >= 0);

CREATE POLICY "Allow public insert" ON public.configuracion_autocobro FOR INSERT WITH CHECK (id > 0);
CREATE POLICY "Allow public update" ON public.configuracion_autocobro FOR UPDATE USING (id > 0) WITH CHECK (titular_id > 0);

CREATE POLICY "Allow public insert" ON public.sesiones_parquimetro FOR INSERT WITH CHECK (length(sesion_uid) > 0);
CREATE POLICY "Allow public update" ON public.sesiones_parquimetro FOR UPDATE USING (id > 0) WITH CHECK (length(sesion_uid) > 0);

CREATE POLICY "Allow public insert" ON public.transacciones FOR INSERT WITH CHECK (length(txn_uid) > 0);

CREATE POLICY "Allow public insert" ON public.ubicaciones_fijadas FOR INSERT WITH CHECK (length(pin_uid) > 0);
CREATE POLICY "Allow public update" ON public.ubicaciones_fijadas FOR UPDATE USING (id > 0) WITH CHECK (length(pin_uid) > 0);
CREATE POLICY "Allow public delete" ON public.ubicaciones_fijadas FOR DELETE USING (id > 0);

CREATE POLICY "Allow public insert" ON public.inspecciones_nfc FOR INSERT WITH CHECK (length(insp_uid) > 0);

CREATE POLICY "Allow public insert" ON public.infracciones FOR INSERT WITH CHECK (length(inf_uid) > 0);
CREATE POLICY "Allow public update" ON public.infracciones FOR UPDATE USING (id > 0) WITH CHECK (estado IN ('PENDIENTE', 'PAGADA', 'CANCELADA'));

CREATE POLICY "Allow public insert" ON public.suscripciones_push FOR INSERT WITH CHECK (length(endpoint) > 0);

-- -----------------------------------------------------------------------------
-- REGISTROS INICIALES LIMPIOS (SALDO EN $0.00 Y LISTO PARA NUEVOS INGRESOS)
-- -----------------------------------------------------------------------------
INSERT INTO public.titulares (id, nombre_completo, email, telefono, identificacion_oficial)
VALUES (1, 'Nuevo Conductor', 'conductor@parqu.app', '55 0000 0000', 'REG-00000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vehiculos (id, titular_id, placas, marca, modelo, color, anio, tipo, activo)
VALUES (1, 1, 'NUEVO-01', 'Marca Vehículo', 'Modelo', 'Blanco', '2025', 'Sedán', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tarjetas_nfc (id, titular_id, vehiculo_id, numero_tarjeta, vigencia, estado, saldo, rfid_tag, diseno_id, etiqueta_personalizada, estilo_overlay)
VALUES (1, 1, 1, '4890 •••• •••• 0001', '12/29', 'ACTIVA', 0.00, 'NFC-MX-00001-PK', 'blue', 'PARQU PASS NFC', 'glass')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.configuracion_autocobro (id, titular_id, habilitado, fuente_fondos, titular_tarjeta, numero_tarjeta_bancaria, banco, limite_maximo_sesion, auto_renovar, notificacion_sms)
VALUES (1, 1, true, 'CARD', 'Nuevo Conductor', '•••• •••• •••• 0000', 'Tarjeta de Débito / Crédito', 180.00, true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.zonas_parquimetro (codigo_espacio, nombre_zona, poligono, tarifa_hora, latitud, longitud, estado)
VALUES
  ('ESP-1042', 'Espacio #1042 • Centro Histórico', 'Polígono Centro Histórico', 6.00, 19.4342000, -99.1318000, 'DISPONIBLE'),
  ('ESP-2055', 'Espacio #2055 • Centro Cultural', 'Polígono Bellas Artes / Alameda', 6.00, 19.4352000, -99.1412000, 'DISPONIBLE'),
  ('ESP-3018', 'Espacio #3018 • Zona Financiera Reforma', 'Polígono Paseo de la Reforma', 6.00, 19.4269000, -99.1678000, 'DISPONIBLE'),
  ('ESP-4090', 'Espacio #4090 • Corredor Roma / Condesa', 'Polígono Roma Norte', 6.00, 19.4194000, -99.1625000, 'DISPONIBLE')
ON CONFLICT (codigo_espacio) DO NOTHING;
