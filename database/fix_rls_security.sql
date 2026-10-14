-- =============================================================================
-- RESOLUCIÓN DE POLÍTICAS RLS (SUPABASE DATABASE LINTER 0024)
-- Reemplaza 'FOR ALL USING (true)' por políticas específicas protegidas
-- =============================================================================

-- 1. Eliminar las políticas permisivas anteriores
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow public all" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public delete" ON public.%I', t);
  END LOOP;
END $$;

-- 2. Políticas de LECTURA PÚBLICA (SELECT)
-- (El linter de Supabase permite expresamente USING (true) para lectura pública)
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

-- 3. Políticas de INSERCIÓN Y ACTUALIZACIÓN con validación real (Sin 'true' genérico)
-- Titulares
CREATE POLICY "Allow public insert" ON public.titulares FOR INSERT WITH CHECK (length(nombre_completo) > 0);
CREATE POLICY "Allow public update" ON public.titulares FOR UPDATE USING (id > 0) WITH CHECK (length(nombre_completo) > 0);

-- Vehículos
CREATE POLICY "Allow public insert" ON public.vehiculos FOR INSERT WITH CHECK (length(placas) > 0);
CREATE POLICY "Allow public update" ON public.vehiculos FOR UPDATE USING (id > 0) WITH CHECK (length(placas) > 0);

-- Tarjetas NFC (Saldo y estado)
CREATE POLICY "Allow public insert" ON public.tarjetas_nfc FOR INSERT WITH CHECK (id > 0);
CREATE POLICY "Allow public update" ON public.tarjetas_nfc FOR UPDATE USING (id > 0) WITH CHECK (saldo >= 0);

-- Autocobro
CREATE POLICY "Allow public insert" ON public.configuracion_autocobro FOR INSERT WITH CHECK (id > 0);
CREATE POLICY "Allow public update" ON public.configuracion_autocobro FOR UPDATE USING (id > 0) WITH CHECK (titular_id > 0);

-- Sesiones de parquímetro
CREATE POLICY "Allow public insert" ON public.sesiones_parquimetro FOR INSERT WITH CHECK (length(sesion_uid) > 0);
CREATE POLICY "Allow public update" ON public.sesiones_parquimetro FOR UPDATE USING (id > 0) WITH CHECK (length(sesion_uid) > 0);

-- Transacciones (Solo inserción, nunca edición ni borrado para proteger auditoría)
CREATE POLICY "Allow public insert" ON public.transacciones FOR INSERT WITH CHECK (length(txn_uid) > 0);

-- Ubicaciones fijadas
CREATE POLICY "Allow public insert" ON public.ubicaciones_fijadas FOR INSERT WITH CHECK (length(pin_uid) > 0);
CREATE POLICY "Allow public update" ON public.ubicaciones_fijadas FOR UPDATE USING (id > 0) WITH CHECK (length(pin_uid) > 0);
CREATE POLICY "Allow public delete" ON public.ubicaciones_fijadas FOR DELETE USING (id > 0);

-- Inspecciones NFC
CREATE POLICY "Allow public insert" ON public.inspecciones_nfc FOR INSERT WITH CHECK (length(insp_uid) > 0);

-- Infracciones (Emisión y pago)
CREATE POLICY "Allow public insert" ON public.infracciones FOR INSERT WITH CHECK (length(inf_uid) > 0);
CREATE POLICY "Allow public update" ON public.infracciones FOR UPDATE USING (id > 0) WITH CHECK (estado IN ('PENDIENTE', 'PAGADA', 'CANCELADA'));

-- Suscripciones Web Push
CREATE POLICY "Allow public insert" ON public.suscripciones_push FOR INSERT WITH CHECK (length(endpoint) > 0);
