<?php
/**
 * =============================================================================
 * API REST OFICIAL DE PARQU PARA XAMPP (PHP + MySQL / MariaDB PDO)
 * Ubicación en XAMPP: C:\xampp\htdocs\parqu-api\index.php
 * Base de datos: parqu_db (puerto 3306, usuario root)
 * =============================================================================
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$DB_HOST = '127.0.0.1';
$DB_PORT = '3306';
$DB_NAME = 'parqu_db';
$DB_USER = 'root';
$DB_PASS = '';

try {
    $dsn = "mysql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Error de conexión a MySQL en XAMPP: ' . $e->getMessage(),
        'hint' => 'Asegúrate de que el módulo MySQL esté iniciado en XAMPP Control Panel y que exista la base de datos parqu_db.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET['action'] ?? 'status';
$method = $_SERVER['REQUEST_METHOD'];
$rawBody = file_get_contents('php://input');
$body = $rawBody ? json_decode($rawBody, true) : [];

try {
    // -------------------------------------------------------------------------
    // 1. STATUS DE LA BASE DE DATOS EN XAMPP
    // -------------------------------------------------------------------------
    if ($action === 'status') {
        $counts = [];
        $tables = [
            'titulares',
            'vehiculos',
            'tarjetas_nfc',
            'configuracion_autocobro',
            'zonas_parquimetro',
            'sesiones_parquimetro',
            'transacciones',
            'ubicaciones_fijadas',
            'inspecciones_nfc',
            'infracciones'
        ];
        foreach ($tables as $t) {
            $stmt = $pdo->query("SELECT COUNT(*) AS total FROM `{$t}`");
            $counts[$t] = (int) $stmt->fetch()['total'];
        }
        echo json_encode([
            'ok' => true,
            'database' => $DB_NAME,
            'engine' => 'XAMPP MySQL / MariaDB',
            'counts' => $counts,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // -------------------------------------------------------------------------
    // 2. OBTENER ESTADO COMPLETO DEL VEHÍCULO Y TITULAR DESDE MYSQL
    // -------------------------------------------------------------------------
    if ($action === 'state') {
        $plates = strtoupper(trim($_GET['plates'] ?? 'XYZ-7842'));

        $stmt = $pdo->prepare("SELECT * FROM `vehiculos` WHERE `placas` = ? LIMIT 1");
        $stmt->execute([$plates]);
        $vehRow = $stmt->fetch();

        if (!$vehRow) {
            // Si no existe esa placa aún, devolver el primer vehículo registrado
            $stmt = $pdo->query("SELECT * FROM `vehiculos` ORDER BY `id` ASC LIMIT 1");
            $vehRow = $stmt->fetch();
        }

        if (!$vehRow) {
            echo json_encode(['ok' => false, 'error' => 'No hay vehículos registrados en parqu_db'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $vehiculoId = (int) $vehRow['id'];
        $titularId = (int) $vehRow['titular_id'];
        $placasActual = $vehRow['placas'];

        // Titular
        $stmt = $pdo->prepare("SELECT * FROM `titulares` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$titularId]);
        $titRow = $stmt->fetch();

        // Tarjeta NFC
        $stmt = $pdo->prepare("SELECT * FROM `tarjetas_nfc` WHERE `vehiculo_id` = ? LIMIT 1");
        $stmt->execute([$vehiculoId]);
        $cardRow = $stmt->fetch();

        // Autocobro
        $stmt = $pdo->prepare("SELECT * FROM `configuracion_autocobro` WHERE `titular_id` = ? LIMIT 1");
        $stmt->execute([$titularId]);
        $autoRow = $stmt->fetch();

        // Sesión activa
        $stmt = $pdo->prepare("SELECT * FROM `sesiones_parquimetro` WHERE `vehiculo_id` = ? AND `estado` = 'ACTIVA' ORDER BY `id` DESC LIMIT 1");
        $stmt->execute([$vehiculoId]);
        $sessRow = $stmt->fetch();

        // Transacciones
        $stmt = $pdo->prepare("SELECT * FROM `transacciones` WHERE `vehiculo_id` = ? ORDER BY `fecha_transaccion` DESC, `id` DESC LIMIT 50");
        $stmt->execute([$vehiculoId]);
        $txnsRows = $stmt->fetchAll();

        // Ubicaciones fijadas
        $stmt = $pdo->prepare("SELECT * FROM `ubicaciones_fijadas` WHERE `vehiculo_id` = ? ORDER BY `fecha_registro` DESC, `id` DESC LIMIT 30");
        $stmt->execute([$vehiculoId]);
        $pinsRows = $stmt->fetchAll();

        // Infracciones
        $stmt = $pdo->prepare("SELECT * FROM `infracciones` WHERE `placas` = ? ORDER BY `fecha_emision` DESC, `id` DESC LIMIT 25");
        $stmt->execute([$placasActual]);
        $infRows = $stmt->fetchAll();

        // Última inspección NFC
        $stmt = $pdo->prepare("SELECT * FROM `inspecciones_nfc` WHERE `placas` = ? ORDER BY `fecha_inspeccion` DESC, `id` DESC LIMIT 1");
        $stmt->execute([$placasActual]);
        $inspRow = $stmt->fetch();

        // Formatear respuesta para React Context
        $response = [
            'ok' => true,
            'vehicle' => [
                'plates' => $vehRow['placas'],
                'brand' => $vehRow['marca'],
                'model' => $vehRow['modelo'],
                'color' => $vehRow['color'],
                'year' => $vehRow['anio'],
                'type' => $vehRow['tipo'],
            ],
            'owner' => $titRow ? [
                'fullName' => $titRow['nombre_completo'],
                'email' => $titRow['email'],
                'phone' => $titRow['telefono'],
                'idNumber' => $titRow['identificacion_oficial'],
            ] : null,
            'card' => $cardRow ? [
                'cardNumber' => $cardRow['numero_tarjeta'],
                'validThru' => $cardRow['vigencia'],
                'status' => $cardRow['estado'],
                'balance' => (float) $cardRow['saldo'],
                'rfidTag' => $cardRow['rfid_tag'],
                'designId' => $cardRow['diseno_id'],
                'customLabel' => $cardRow['etiqueta_personalizada'],
                'overlayStyle' => $cardRow['estilo_overlay'],
            ] : null,
            'autoPay' => $autoRow ? [
                'enabled' => (bool) $autoRow['habilitado'],
                'fundingSource' => $autoRow['fuente_fondos'],
                'cardHolder' => $autoRow['titular_tarjeta'],
                'cardNumber' => $autoRow['numero_tarjeta_bancaria'],
                'bank' => $autoRow['banco'],
                'maxLimitPerSession' => (float) $autoRow['limite_maximo_sesion'],
                'autoRenew' => (bool) $autoRow['auto_renovar'],
                'smsNotification' => (bool) $autoRow['notificacion_sms'],
                'authorizedAt' => $autoRow['fecha_autorizacion'],
            ] : null,
            'activeSession' => $sessRow ? [
                'id' => $sessRow['sesion_uid'],
                'zoneName' => $sessRow['zona_nombre'],
                'ratePerHour' => (float) $sessRow['tarifa_hora'],
                'coords' => ($sessRow['latitud'] !== null && $sessRow['longitud'] !== null) ? [
                    'lat' => (float) $sessRow['latitud'],
                    'lng' => (float) $sessRow['longitud'],
                ] : null,
                'startTime' => date('c', strtotime($sessRow['hora_inicio'])),
                'secondsElapsed' => (int) $sessRow['segundos_transcurridos'],
                'scheduledHours' => (int) $sessRow['horas_programadas'],
                'currentCost' => (float) $sessRow['costo_actual'],
                'maxLimit' => (float) $sessRow['limite_maximo'],
            ] : null,
            'transactions' => array_map(function ($r) {
                return [
                    'id' => $r['txn_uid'],
                    'folio' => $r['folio'],
                    'date' => date('c', strtotime($r['fecha_transaccion'])),
                    'zone' => $r['zona'],
                    'durationMinutes' => (int) $r['duracion_minutos'],
                    'amount' => (float) $r['monto'],
                    'method' => $r['metodo_pago'],
                    'plate' => $r['placas'],
                    'status' => $r['estado'],
                ];
            }, $txnsRows),
            'pinnedLocations' => array_map(function ($p) {
                return [
                    'id' => $p['pin_uid'],
                    'name' => $p['nombre'],
                    'address' => $p['direccion'],
                    'lat' => (float) $p['latitud'],
                    'lng' => (float) $p['longitud'],
                    'date' => date('c', strtotime($p['fecha_registro'])),
                    'plates' => $p['placas'],
                    'notes' => $p['notas'],
                    'status' => $p['estado'],
                    'ratePerHour' => (float) $p['tarifa_hora'],
                    'folio' => $p['folio'],
                ];
            }, $pinsRows),
            'infractions' => array_map(function ($inf) {
                return [
                    'id' => $inf['inf_uid'],
                    'folio' => $inf['folio'],
                    'date' => date('c', strtotime($inf['fecha_emision'])),
                    'plate' => $inf['placas'],
                    'reason' => $inf['motivo'],
                    'amount' => (float) $inf['monto'],
                    'discountAmount' => (float) $inf['monto_descuento'],
                    'officerId' => $inf['oficial_id'],
                    'zone' => $inf['zona'],
                    'status' => $inf['estado'],
                ];
            }, $infRows),
            'lastInspection' => $inspRow ? [
                'id' => $inspRow['insp_uid'],
                'date' => date('c', strtotime($inspRow['fecha_inspeccion'])),
                'officerId' => $inspRow['oficial_id'],
                'plate' => $inspRow['placas'],
                'result' => $inspRow['resultado'],
                'folio' => $inspRow['folio_infraccion'],
                'notes' => $inspRow['notas'],
            ] : null,
        ];

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // -------------------------------------------------------------------------
    // 3. SINCRONIZAR ESTADO DESDE LA APP REACT HACIA MYSQL EN XAMPP
    // -------------------------------------------------------------------------
    if ($action === 'sync' && $method === 'POST') {
        $pdo->beginTransaction();

        $owner = $body['owner'] ?? null;
        $vehicle = $body['vehicle'] ?? null;
        $card = $body['card'] ?? null;
        $autoPay = $body['autoPay'] ?? null;
        $activeSession = array_key_exists('activeSession', $body) ? $body['activeSession'] : '__OMITTED__';
        $transactions = $body['transactions'] ?? null;
        $pinnedLocations = $body['pinnedLocations'] ?? null;
        $infractions = $body['infractions'] ?? null;
        $lastInspection = $body['lastInspection'] ?? null;

        $titularId = 1;
        $vehiculoId = 1;
        $tarjetaId = 1;

        // 3.1 Actualizar o insertar Titular
        if (is_array($owner) && !empty($owner['fullName'])) {
            $stmt = $pdo->prepare("
                UPDATE `titulares`
                SET `nombre_completo` = ?, `email` = ?, `telefono` = ?, `identificacion_oficial` = ?
                WHERE `id` = 1
            ");
            $stmt->execute([
                $owner['fullName'] ?? 'Sebastián Salinas',
                $owner['email'] ?? 'sebastian.salinas@email.com',
                $owner['phone'] ?? '55 4912 3456',
                $owner['idNumber'] ?? 'INE-78912304',
            ]);
        }

        // 3.2 Actualizar Vehículo
        if (is_array($vehicle) && !empty($vehicle['plates'])) {
            $stmt = $pdo->prepare("
                UPDATE `vehiculos`
                SET `placas` = ?, `marca` = ?, `modelo` = ?, `color` = ?, `anio` = ?, `tipo` = ?
                WHERE `id` = 1
            ");
            $stmt->execute([
                strtoupper(trim($vehicle['plates'])),
                $vehicle['brand'] ?? 'Volkswagen',
                $vehicle['model'] ?? 'Jetta Sportline',
                $vehicle['color'] ?? 'Plata Metálico',
                $vehicle['year'] ?? '2023',
                $vehicle['type'] ?? 'Sedán',
            ]);
        }

        // 3.3 Actualizar Tarjeta NFC
        if (is_array($card)) {
            $stmt = $pdo->prepare("
                UPDATE `tarjetas_nfc`
                SET `numero_tarjeta` = ?, `vigencia` = ?, `estado` = ?, `saldo` = ?, `rfid_tag` = ?,
                    `diseno_id` = ?, `etiqueta_personalizada` = ?, `estilo_overlay` = ?
                WHERE `id` = 1
            ");
            $stmt->execute([
                $card['cardNumber'] ?? '4890 •••• •••• 9142',
                $card['validThru'] ?? '12/28',
                $card['status'] ?? 'ACTIVA',
                (float) ($card['balance'] ?? 320.00),
                $card['rfidTag'] ?? 'NFC-MX-09142-PK',
                $card['designId'] ?? 'blue',
                $card['customLabel'] ?? 'PARQU PASS NFC',
                $card['overlayStyle'] ?? 'glass',
            ]);
        }

        // 3.4 Actualizar Configuración de Autocobro
        if (is_array($autoPay)) {
            $stmt = $pdo->prepare("
                UPDATE `configuracion_autocobro`
                SET `habilitado` = ?, `fuente_fondos` = ?, `titular_tarjeta` = ?, `numero_tarjeta_bancaria` = ?,
                    `banco` = ?, `limite_maximo_sesion` = ?, `auto_renovar` = ?, `notificacion_sms` = ?
                WHERE `titular_id` = 1
            ");
            $stmt->execute([
                !empty($autoPay['enabled']) ? 1 : 0,
                $autoPay['fundingSource'] ?? 'CARD',
                $autoPay['cardHolder'] ?? 'Sebastián Salinas',
                $autoPay['cardNumber'] ?? '•••• •••• •••• 8821',
                $autoPay['bank'] ?? 'Santander Platinum Débito',
                (float) ($autoPay['maxLimitPerSession'] ?? 180.00),
                !empty($autoPay['autoRenew']) ? 1 : 0,
                !empty($autoPay['smsNotification']) ? 1 : 0,
            ]);
        }

        $currentPlates = strtoupper(trim($vehicle['plates'] ?? 'XYZ-7842'));

        // 3.5 Sincronizar Sesión de Parquímetro
        if ($activeSession !== '__OMITTED__') {
            if ($activeSession === null) {
                $stmt = $pdo->prepare("
                    UPDATE `sesiones_parquimetro`
                    SET `estado` = 'FINALIZADA', `hora_fin` = NOW()
                    WHERE `vehiculo_id` = 1 AND `estado` = 'ACTIVA'
                ");
                $stmt->execute();
            } elseif (is_array($activeSession) && !empty($activeSession['id'])) {
                $startTimeMysql = !empty($activeSession['startTime'])
                    ? date('Y-m-d H:i:s', strtotime($activeSession['startTime']))
                    : date('Y-m-d H:i:s');
                $lat = $activeSession['coords']['lat'] ?? null;
                $lng = $activeSession['coords']['lng'] ?? null;

                $stmt = $pdo->prepare("
                    INSERT INTO `sesiones_parquimetro`
                    (`sesion_uid`, `vehiculo_id`, `tarjeta_id`, `placas`, `zona_nombre`, `tarifa_hora`, `latitud`, `longitud`,
                     `hora_inicio`, `segundos_transcurridos`, `horas_programadas`, `costo_actual`, `limite_maximo`, `estado`)
                    VALUES (?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVA')
                    ON DUPLICATE KEY UPDATE
                        `segundos_transcurridos` = VALUES(`segundos_transcurridos`),
                        `horas_programadas` = VALUES(`horas_programadas`),
                        `costo_actual` = VALUES(`costo_actual`),
                        `estado` = 'ACTIVA'
                ");
                $stmt->execute([
                    $activeSession['id'],
                    $currentPlates,
                    $activeSession['zoneName'] ?? 'Espacio #1042 • Centro Histórico',
                    (float) ($activeSession['ratePerHour'] ?? 6.00),
                    $lat,
                    $lng,
                    $startTimeMysql,
                    (int) ($activeSession['secondsElapsed'] ?? 0),
                    (int) ($activeSession['scheduledHours'] ?? 1),
                    (float) ($activeSession['currentCost'] ?? 0.00),
                    (float) ($activeSession['maxLimit'] ?? 180.00),
                ]);
            }
        }

        // 3.6 Sincronizar Transacciones Nuevas
        if (is_array($transactions)) {
            $stmtTxn = $pdo->prepare("
                INSERT IGNORE INTO `transacciones`
                (`txn_uid`, `folio`, `vehiculo_id`, `placas`, `zona`, `duracion_minutos`, `monto`, `metodo_pago`, `estado`, `fecha_transaccion`)
                VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($transactions as $t) {
                if (empty($t['id'])) continue;
                $fechaMysql = !empty($t['date']) ? date('Y-m-d H:i:s', strtotime($t['date'])) : date('Y-m-d H:i:s');
                $stmtTxn->execute([
                    $t['id'],
                    $t['folio'] ?? 'PQM-0000',
                    $t['plate'] ?? $currentPlates,
                    $t['zone'] ?? 'Zona Metropolitana',
                    (int) ($t['durationMinutes'] ?? 0),
                    (float) ($t['amount'] ?? 0.00),
                    $t['method'] ?? 'Autocobro Parqu',
                    $t['status'] ?? 'COMPLETADO',
                    $fechaMysql,
                ]);
            }
        }

        // 3.7 Sincronizar Ubicaciones Fijadas en Mapa GPS
        if (is_array($pinnedLocations)) {
            $stmtPin = $pdo->prepare("
                INSERT INTO `ubicaciones_fijadas`
                (`pin_uid`, `vehiculo_id`, `placas`, `nombre`, `direccion`, `latitud`, `longitud`, `notas`, `tarifa_hora`, `estado`, `folio`, `fecha_registro`)
                VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `estado` = VALUES(`estado`),
                    `folio` = VALUES(`folio`)
            ");
            foreach ($pinnedLocations as $p) {
                if (empty($p['id']) || !isset($p['lat']) || !isset($p['lng'])) continue;
                $fechaPin = !empty($p['date']) ? date('Y-m-d H:i:s', strtotime($p['date'])) : date('Y-m-d H:i:s');
                $stmtPin->execute([
                    $p['id'],
                    $p['plates'] ?? $currentPlates,
                    $p['name'] ?? 'Ubicación Fijada',
                    $p['address'] ?? '',
                    (float) $p['lat'],
                    (float) $p['lng'],
                    $p['notes'] ?? '',
                    (float) ($p['ratePerHour'] ?? 6.00),
                    $p['status'] ?? 'GUARDADA',
                    $p['folio'] ?? null,
                    $fechaPin,
                ]);
            }
        }

        // 3.8 Sincronizar Infracciones Viales
        if (is_array($infractions)) {
            $stmtInf = $pdo->prepare("
                INSERT INTO `infracciones`
                (`inf_uid`, `folio`, `vehiculo_id`, `placas`, `oficial_id`, `zona`, `motivo`, `monto`, `monto_descuento`, `estado`, `fecha_emision`)
                VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `estado` = VALUES(`estado`),
                    `fecha_pago` = IF(VALUES(`estado`) = 'PAGADA', NOW(), `fecha_pago`)
            ");
            foreach ($infractions as $inf) {
                if (empty($inf['id'])) continue;
                $fechaInf = !empty($inf['date']) ? date('Y-m-d H:i:s', strtotime($inf['date'])) : date('Y-m-d H:i:s');
                $stmtInf->execute([
                    $inf['id'],
                    $inf['folio'] ?? ('MUL-' . rand(1000, 9999)),
                    $inf['plate'] ?? $currentPlates,
                    $inf['officerId'] ?? 'OFICIAL-TR-084',
                    $inf['zone'] ?? 'Polígono Centro Histórico',
                    $inf['reason'] ?? 'Sin pago activo',
                    (float) ($inf['amount'] ?? 542.85),
                    (float) ($inf['discountAmount'] ?? 271.43),
                    $inf['status'] ?? 'PENDIENTE',
                    $fechaInf,
                ]);
            }
        }

        // 3.9 Sincronizar Última Inspección NFC
        if (is_array($lastInspection) && !empty($lastInspection['id'])) {
            $fechaInsp = !empty($lastInspection['date'])
                ? date('Y-m-d H:i:s', strtotime($lastInspection['date']))
                : date('Y-m-d H:i:s');
            $stmtInsp = $pdo->prepare("
                INSERT IGNORE INTO `inspecciones_nfc`
                (`insp_uid`, `vehiculo_id`, `placas`, `oficial_id`, `resultado`, `folio_infraccion`, `notas`, `fecha_inspeccion`)
                VALUES (?, 1, ?, ?, ?, ?, ?, ?)
            ");
            $stmtInsp->execute([
                $lastInspection['id'],
                $lastInspection['plate'] ?? $currentPlates,
                $lastInspection['officerId'] ?? 'OFICIAL-TR-084',
                $lastInspection['result'] ?? 'APROBADO',
                $lastInspection['folio'] ?? null,
                $lastInspection['notes'] ?? null,
                $fechaInsp,
            ]);
        }

        $pdo->commit();

        echo json_encode([
            'ok' => true,
            'message' => 'Datos sincronizados correctamente en XAMPP MySQL (parqu_db)',
            'syncedAt' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'ok' => false,
        'error' => 'Acción no reconocida: ' . $action
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $err) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $err->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
