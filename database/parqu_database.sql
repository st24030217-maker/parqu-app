-- =============================================================================
-- BASE DE DATOS OFICIAL: PARQU METROPOLITANO (XAMPP / MySQL / MariaDB)
-- Sistema Inteligente de Parquímetro Digital, Autocobro y Verificación NFC
-- Compatible con XAMPP (MariaDB 10.4+ / MySQL 5.7+ / MySQL 8.0+)
-- =============================================================================

SET NAMES utf8mb4;
SET TIME_zone = '-06:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `parqu_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `parqu_db`;

-- -----------------------------------------------------------------------------
-- 1. TABLA: titulares (Propietarios / Conductores registrados)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `titulares`;
CREATE TABLE `titulares` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre_completo` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(30) NOT NULL,
  `identificacion_oficial` VARCHAR(60) NOT NULL COMMENT 'INE / Pasaporte / Licencia',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_titulares_email` (`email`),
  KEY `idx_titulares_identificacion` (`identificacion_oficial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: vehiculos (Padrón vehicular vinculado al titular)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `vehiculos`;
CREATE TABLE `vehiculos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `titular_id` INT UNSIGNED NOT NULL,
  `placas` VARCHAR(20) NOT NULL,
  `marca` VARCHAR(60) NOT NULL,
  `modelo` VARCHAR(80) NOT NULL,
  `color` VARCHAR(50) NOT NULL,
  `anio` VARCHAR(10) NOT NULL,
  `tipo` VARCHAR(40) NOT NULL DEFAULT 'Sedán',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vehiculos_placas` (`placas`),
  KEY `fk_vehiculos_titular` (`titular_id`),
  CONSTRAINT `fk_vehiculos_titular` FOREIGN KEY (`titular_id`) REFERENCES `titulares` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: tarjetas_nfc (Tarjeta digital Parqu Pass y chip NFC AES-256)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `tarjetas_nfc`;
CREATE TABLE `tarjetas_nfc` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `titular_id` INT UNSIGNED NOT NULL,
  `vehiculo_id` INT UNSIGNED NOT NULL,
  `numero_tarjeta` VARCHAR(30) NOT NULL,
  `vigencia` VARCHAR(10) NOT NULL DEFAULT '12/28',
  `estado` ENUM('ACTIVA', 'EN_PARQUIMETRO', 'BLOQUEADA') NOT NULL DEFAULT 'ACTIVA',
  `saldo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `rfid_tag` VARCHAR(50) NOT NULL COMMENT 'UID único del chip NFC encriptado',
  `diseno_id` VARCHAR(20) NOT NULL DEFAULT 'blue' COMMENT 'blue | white | red',
  `etiqueta_personalizada` VARCHAR(60) NOT NULL DEFAULT 'PARQU PASS NFC',
  `estilo_overlay` VARCHAR(20) NOT NULL DEFAULT 'glass',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tarjetas_rfid` (`rfid_tag`),
  KEY `fk_tarjetas_titular` (`titular_id`),
  KEY `fk_tarjetas_vehiculo` (`vehiculo_id`),
  CONSTRAINT `fk_tarjetas_titular` FOREIGN KEY (`titular_id`) REFERENCES `titulares` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tarjetas_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: configuracion_autocobro (Reglas de débito automático por titular)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `configuracion_autocobro`;
CREATE TABLE `configuracion_autocobro` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `titular_id` INT UNSIGNED NOT NULL,
  `habilitado` TINYINT(1) NOT NULL DEFAULT 1,
  `fuente_fondos` ENUM('CARD', 'WALLET_BALANCE') NOT NULL DEFAULT 'CARD',
  `titular_tarjeta` VARCHAR(120) NOT NULL,
  `numero_tarjeta_bancaria` VARCHAR(30) NOT NULL,
  `banco` VARCHAR(80) NOT NULL,
  `limite_maximo_sesion` DECIMAL(10,2) NOT NULL DEFAULT 180.00,
  `auto_renovar` TINYINT(1) NOT NULL DEFAULT 1,
  `notificacion_sms` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_autorizacion` DATE NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_autocobro_titular` (`titular_id`),
  CONSTRAINT `fk_autocobro_titular` FOREIGN KEY (`titular_id`) REFERENCES `titulares` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: zonas_parquimetro (Catálogo oficial de polígonos y cajones)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `zonas_parquimetro`;
CREATE TABLE `zonas_parquimetro` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `codigo_espacio` VARCHAR(30) NOT NULL,
  `nombre_zona` VARCHAR(120) NOT NULL,
  `poligono` VARCHAR(100) NOT NULL,
  `tarifa_hora` DECIMAL(10,2) NOT NULL DEFAULT 6.00,
  `latitud` DECIMAL(10,7) NOT NULL,
  `longitud` DECIMAL(10,7) NOT NULL,
  `estado` ENUM('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO') NOT NULL DEFAULT 'DISPONIBLE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_codigo_espacio` (`codigo_espacio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: sesiones_parquimetro (Estancias activas e históricas en tiempo real)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `sesiones_parquimetro`;
CREATE TABLE `sesiones_parquimetro` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sesion_uid` VARCHAR(40) NOT NULL,
  `vehiculo_id` INT UNSIGNED NOT NULL,
  `tarjeta_id` INT UNSIGNED NOT NULL,
  `placas` VARCHAR(20) NOT NULL,
  `zona_nombre` VARCHAR(150) NOT NULL,
  `tarifa_hora` DECIMAL(10,2) NOT NULL DEFAULT 6.00,
  `latitud` DECIMAL(10,7) DEFAULT NULL,
  `longitud` DECIMAL(10,7) DEFAULT NULL,
  `hora_inicio` DATETIME NOT NULL,
  `hora_fin` DATETIME DEFAULT NULL,
  `segundos_transcurridos` INT UNSIGNED NOT NULL DEFAULT 0,
  `horas_programadas` INT UNSIGNED NOT NULL DEFAULT 1,
  `costo_actual` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `limite_maximo` DECIMAL(10,2) NOT NULL DEFAULT 180.00,
  `estado` ENUM('ACTIVA', 'FINALIZADA', 'EXPIRADA', 'CANCELADA') NOT NULL DEFAULT 'ACTIVA',
  `folio_ticket` VARCHAR(30) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sesion_uid` (`sesion_uid`),
  KEY `idx_sesiones_placas_estado` (`placas`, `estado`),
  KEY `fk_sesiones_vehiculo` (`vehiculo_id`),
  KEY `fk_sesiones_tarjeta` (`tarjeta_id`),
  CONSTRAINT `fk_sesiones_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sesiones_tarjeta` FOREIGN KEY (`tarjeta_id`) REFERENCES `tarjetas_nfc` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. TABLA: transacciones (Historial de cobros, recargas y pagos de multas)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `transacciones`;
CREATE TABLE `transacciones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `txn_uid` VARCHAR(40) NOT NULL,
  `folio` VARCHAR(30) NOT NULL,
  `vehiculo_id` INT UNSIGNED NOT NULL,
  `placas` VARCHAR(20) NOT NULL,
  `sesion_id` INT UNSIGNED DEFAULT NULL,
  `zona` VARCHAR(150) NOT NULL,
  `duracion_minutos` INT UNSIGNED NOT NULL DEFAULT 0,
  `monto` DECIMAL(10,2) NOT NULL,
  `metodo_pago` VARCHAR(120) NOT NULL,
  `estado` ENUM('COMPLETADO', 'PENDIENTE', 'RECHAZADO', 'REEMBOLSADO') NOT NULL DEFAULT 'COMPLETADO',
  `fecha_transaccion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_txn_uid` (`txn_uid`),
  KEY `idx_transacciones_folio` (`folio`),
  KEY `idx_transacciones_placas` (`placas`),
  KEY `fk_transacciones_vehiculo` (`vehiculo_id`),
  CONSTRAINT `fk_transacciones_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. TABLA: ubicaciones_fijadas (Bitácora GPS de cajones guardados en el mapa)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `ubicaciones_fijadas`;
CREATE TABLE `ubicaciones_fijadas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pin_uid` VARCHAR(40) NOT NULL,
  `vehiculo_id` INT UNSIGNED NOT NULL,
  `placas` VARCHAR(20) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `direccion` VARCHAR(200) NOT NULL,
  `latitud` DECIMAL(10,7) NOT NULL,
  `longitud` DECIMAL(10,7) NOT NULL,
  `notas` VARCHAR(255) DEFAULT NULL,
  `tarifa_hora` DECIMAL(10,2) NOT NULL DEFAULT 6.00,
  `estado` ENUM('ACTIVA', 'GUARDADA', 'COMPLETADO') NOT NULL DEFAULT 'GUARDADA',
  `folio` VARCHAR(30) DEFAULT NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pin_uid` (`pin_uid`),
  KEY `fk_ubicaciones_vehiculo` (`vehiculo_id`),
  CONSTRAINT `fk_ubicaciones_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. TABLA: inspecciones_nfc (Bitácora de verificaciones de Oficiales Viales)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `inspecciones_nfc`;
CREATE TABLE `inspecciones_nfc` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `insp_uid` VARCHAR(40) NOT NULL,
  `vehiculo_id` INT UNSIGNED DEFAULT NULL,
  `placas` VARCHAR(20) NOT NULL,
  `oficial_id` VARCHAR(50) NOT NULL DEFAULT 'OFICIAL-TR-084',
  `resultado` ENUM('APROBADO', 'INFRACCION') NOT NULL,
  `folio_infraccion` VARCHAR(30) DEFAULT NULL,
  `notas` VARCHAR(255) DEFAULT NULL,
  `fecha_inspeccion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_insp_uid` (`insp_uid`),
  KEY `idx_inspecciones_placas` (`placas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. TABLA: infracciones (Boletas de infracción vial y pronto pago 50%)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `infracciones`;
CREATE TABLE `infracciones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `inf_uid` VARCHAR(40) NOT NULL,
  `folio` VARCHAR(30) NOT NULL,
  `vehiculo_id` INT UNSIGNED DEFAULT NULL,
  `placas` VARCHAR(20) NOT NULL,
  `oficial_id` VARCHAR(50) NOT NULL DEFAULT 'OFICIAL-TR-084',
  `zona` VARCHAR(150) NOT NULL,
  `motivo` VARCHAR(255) NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL DEFAULT 542.85,
  `monto_descuento` DECIMAL(10,2) NOT NULL DEFAULT 271.43,
  `estado` ENUM('PENDIENTE', 'PAGADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  `fecha_emision` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_pago` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inf_uid` (`inf_uid`),
  UNIQUE KEY `uk_infracciones_folio` (`folio`),
  KEY `idx_infracciones_placas` (`placas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. TABLA: suscripciones_push (Endpoints Web Push VAPID / FCM en vivo)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `suscripciones_push`;
CREATE TABLE `suscripciones_push` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `placas` VARCHAR(20) NOT NULL,
  `endpoint` TEXT NOT NULL,
  `p256dh` VARCHAR(255) NOT NULL,
  `auth` VARCHAR(120) NOT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_push_placas` (`placas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- VISTA: vista_estado_vehicular_completo
-- Consulta unificada para el Dashboard y el Inspector Vial NFC
-- =============================================================================
DROP VIEW IF EXISTS `vista_estado_vehicular_completo`;
CREATE VIEW `vista_estado_vehicular_completo` AS
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
FROM `vehiculos` v
INNER JOIN `titulares` t ON t.id = v.titular_id
LEFT JOIN `tarjetas_nfc` c ON c.vehiculo_id = v.id
LEFT JOIN `configuracion_autocobro` a ON a.titular_id = t.id
LEFT JOIN `sesiones_parquimetro` s ON s.vehiculo_id = v.id AND s.estado = 'ACTIVA';

-- =============================================================================
-- DATOS SEMILLA INICIALES (SEED DATA OFICIAL DE LA APP PARQU)
-- =============================================================================

INSERT INTO `titulares` (`id`, `nombre_completo`, `email`, `telefono`, `identificacion_oficial`)
VALUES
  (1, 'Sebastián Salinas', 'sebastian.salinas@email.com', '55 4912 3456', 'INE-78912304');

INSERT INTO `vehiculos` (`id`, `titular_id`, `placas`, `marca`, `modelo`, `color`, `anio`, `tipo`, `activo`)
VALUES
  (1, 1, 'XYZ-7842', 'Volkswagen', 'Jetta Sportline', 'Plata Metálico', '2023', 'Sedán', 1);

INSERT INTO `tarjetas_nfc` (`id`, `titular_id`, `vehiculo_id`, `numero_tarjeta`, `vigencia`, `estado`, `saldo`, `rfid_tag`, `diseno_id`, `etiqueta_personalizada`, `estilo_overlay`)
VALUES
  (1, 1, 1, '4890 •••• •••• 9142', '12/28', 'ACTIVA', 320.00, 'NFC-MX-09142-PK', 'blue', 'PARQU PASS NFC', 'glass');

INSERT INTO `configuracion_autocobro` (`id`, `titular_id`, `habilitado`, `fuente_fondos`, `titular_tarjeta`, `numero_tarjeta_bancaria`, `banco`, `limite_maximo_sesion`, `auto_renovar`, `notificacion_sms`, `fecha_autorizacion`)
VALUES
  (1, 1, 1, 'CARD', 'Sebastián Salinas', '•••• •••• •••• 8821', 'Santander Platinum Débito', 180.00, 1, 1, '2026-01-15');

INSERT INTO `zonas_parquimetro` (`codigo_espacio`, `nombre_zona`, `poligono`, `tarifa_hora`, `latitud`, `longitud`, `estado`)
VALUES
  ('ESP-1042', 'Espacio #1042 • Centro Histórico', 'Polígono Centro Histórico', 6.00, 19.4342000, -99.1318000, 'DISPONIBLE'),
  ('ESP-2055', 'Espacio #2055 • Centro Cultural', 'Polígono Bellas Artes / Alameda', 6.00, 19.4352000, -99.1412000, 'DISPONIBLE'),
  ('ESP-3018', 'Espacio #3018 • Zona Financiera Reforma', 'Polígono Paseo de la Reforma', 6.00, 19.4269000, -99.1678000, 'DISPONIBLE'),
  ('ESP-4090', 'Espacio #4090 • Corredor Roma / Condesa', 'Polígono Roma Norte', 6.00, 19.4194000, -99.1625000, 'DISPONIBLE');

INSERT INTO `transacciones` (`txn_uid`, `folio`, `vehiculo_id`, `placas`, `sesion_id`, `zona`, `duracion_minutos`, `monto`, `metodo_pago`, `estado`, `fecha_transaccion`)
VALUES
  ('TXN-901', 'PQM-88A2', 1, 'XYZ-7842', NULL, 'Zona Financiera (Espacio #1042)', 75, 7.50, 'Autocobro Débito Directo (Santander •••• 8821)', 'COMPLETADO', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ('TXN-902', 'PQM-34F1', 1, 'XYZ-7842', NULL, 'Centro Cultural (Espacio #2055)', 120, 12.00, 'Autocobro Débito Directo (Santander •••• 8821)', 'COMPLETADO', DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO `ubicaciones_fijadas` (`pin_uid`, `vehiculo_id`, `placas`, `nombre`, `direccion`, `latitud`, `longitud`, `notas`, `tarifa_hora`, `estado`, `folio`, `fecha_registro`)
VALUES
  ('PIN-101', 1, 'XYZ-7842', 'Espacio #1042 • Centro Histórico', 'Av. Juárez y Eje Central, Cuauhtémoc', 19.4342000, -99.1318000, 'Junto al parquímetro municipal #04', 6.00, 'COMPLETADO', 'PQM-88A2', DATE_SUB(NOW(), INTERVAL 3 HOUR));

SET FOREIGN_KEY_CHECKS = 1;
