-- =============================================================================
-- LIMPIEZA COMPLETA DE PARQU_DB PARA NUEVOS INGRESOS (PRODUCCIÓN / INICIO LIMPIO)
-- Deja saldo en $0.00, vacía historiales, multas, sesiones y ubicaciones fijadas.
-- =============================================================================

USE `parqu_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Vaciar historial de transacciones (recibos y cobros pasados)
TRUNCATE TABLE `transacciones`;

-- 2. Vaciar sesiones de parquímetro activas y pasadas
TRUNCATE TABLE `sesiones_parquimetro`;

-- 3. Vaciar ubicaciones fijadas y bitácora de GPS
TRUNCATE TABLE `ubicaciones_fijadas`;

-- 4. Vaciar infracciones y boletas de tránsito
TRUNCATE TABLE `infracciones`;

-- 5. Vaciar inspecciones viales NFC
TRUNCATE TABLE `inspecciones_nfc`;

-- 6. Vaciar suscripciones push antiguas
TRUNCATE TABLE `suscripciones_push`;

-- 7. Restablecer tarjeta digital a saldo $0.00 para nuevos ingresos
UPDATE `tarjetas_nfc`
SET
  `saldo` = 0.00,
  `estado` = 'ACTIVA',
  `numero_tarjeta` = '4890 •••• •••• 0001',
  `vigencia` = '12/29',
  `rfid_tag` = 'NFC-MX-00001-PK',
  `diseno_id` = 'blue',
  `etiqueta_personalizada` = 'PARQU PASS NFC',
  `estilo_overlay` = 'glass'
WHERE `id` = 1;

-- 8. Restablecer titular y vehículo a estado limpio para nuevo registro
UPDATE `titulares`
SET
  `nombre_completo` = 'Nuevo Conductor',
  `email` = 'conductor@parqu.app',
  `telefono` = '55 0000 0000',
  `identificacion_oficial` = 'REG-00000001'
WHERE `id` = 1;

UPDATE `vehiculos`
SET
  `placas` = 'NUEVO-01',
  `marca` = 'Marca Vehículo',
  `modelo` = 'Modelo',
  `color` = 'Blanco',
  `anio` = '2025',
  `tipo` = 'Sedán',
  `activo` = 1
WHERE `id` = 1;

-- 9. Restablecer configuración de autocobro inicial
UPDATE `configuracion_autocobro`
SET
  `habilitado` = 1,
  `fuente_fondos` = 'CARD',
  `titular_tarjeta` = 'Nuevo Conductor',
  `numero_tarjeta_bancaria` = '•••• •••• •••• 0000',
  `banco` = 'Tarjeta de Débito / Crédito',
  `limite_maximo_sesion` = 180.00,
  `auto_renovar` = 1,
  `notificacion_sms` = 1,
  `fecha_autorizacion` = CURDATE()
WHERE `titular_id` = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar estado limpio
SELECT 'Saldo Tarjeta' AS Campo, saldo FROM tarjetas_nfc WHERE id = 1
UNION ALL
SELECT 'Total Transacciones', count(*) FROM transacciones
UNION ALL
SELECT 'Sesiones Activas', count(*) FROM sesiones_parquimetro
UNION ALL
SELECT 'Ubicaciones Fijadas', count(*) FROM ubicaciones_fijadas
UNION ALL
SELECT 'Infracciones', count(*) FROM infracciones;
