import crypto from 'node:crypto';

/**
 * Parqu Serverless Web Push API (RFC 8030 / RFC 8291 aes128gcm / RFC 8292 VAPID ES256)
 * 100% Zero-dependency implementation using Node.js native crypto & fetch.
 * Compatible with Google FCM (Android/Chrome), Apple Web Push (iOS 16.4+ PWA), and Desktop browsers.
 */

export const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BFjAAnsl4IG6qPfODHCl4oVBDCVJc1ThM0aDeitfYKutnTN4TEtaypZunWrehoE64KZgp53RxMknC0Ko2yeqM_A';

const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'LuTN64IF3RucxDqHiWkRUFLKcpM-4i-R2Yscs7DbI9w';

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:soporte@parqu.app';

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(base64UrlStr) {
  const normalized = String(base64UrlStr)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

/**
 * Generates an RFC 8292 VAPID Authorization header (ES256 JWT) using JWK private key import
 */
function createVapidAuthHeader(endpoint, publicKeyB64, privateKeyB64, subject) {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;

  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud: audience, exp, sub: subject };

  const unsignedToken = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(
    JSON.stringify(payload)
  )}`;

  const pubBuf = fromBase64Url(publicKeyB64); // 65 bytes: 0x04 || X (32) || Y (32)
  const x = toBase64Url(pubBuf.subarray(1, 33));
  const y = toBase64Url(pubBuf.subarray(33, 65));
  const d = toBase64Url(fromBase64Url(privateKeyB64));

  const privateKeyObj = crypto.createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x,
      y,
      d,
    },
    format: 'jwk',
  });

  const signature = crypto.sign('sha256', Buffer.from(unsignedToken), {
    key: privateKeyObj,
    dsaEncoding: 'ieee-p1363',
  });

  const jwt = `${unsignedToken}.${toBase64Url(signature)}`;
  return `vapid t=${jwt}, k=${publicKeyB64}`;
}

/**
 * Encrypts a JSON string payload according to RFC 8291 (aes128gcm)
 */
function encryptWebPushPayload(payloadText, clientPublicKeyB64, clientAuthB64) {
  const clientPublicKey = fromBase64Url(clientPublicKeyB64);
  const userAuth = fromBase64Url(clientAuthB64);
  const salt = crypto.randomBytes(16);

  const serverECDH = crypto.createECDH('prime256v1');
  const serverPublicKey = serverECDH.generateKeys();
  const sharedSecret = serverECDH.computeSecret(clientPublicKey);

  // IKM via HKDF-SHA256: "WebPush: info\0" || ua_public || as_public
  const keyInfo = Buffer.concat([
    Buffer.from('WebPush: info\0', 'ascii'),
    clientPublicKey,
    serverPublicKey,
  ]);
  const ikm = Buffer.from(crypto.hkdfSync('sha256', sharedSecret, userAuth, keyInfo, 32));

  // Content Encryption Key (CEK) & Nonce
  const cekInfo = Buffer.from('Content-Encoding: aes128gcm\0', 'ascii');
  const nonceInfo = Buffer.from('Content-Encoding: nonce\0', 'ascii');
  const cek = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, cekInfo, 16));
  const nonce = Buffer.from(crypto.hkdfSync('sha256', ikm, salt, nonceInfo, 12));

  // Plaintext + padding delimiter 0x02
  const plaintext = Buffer.concat([Buffer.from(payloadText, 'utf8'), Buffer.from([2])]);

  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  // aes128gcm header: salt (16) || rs (4, uint32BE = 4096) || idlen (1 = 65) || keyid (65 = serverPublicKey)
  const rsBuf = Buffer.alloc(4);
  rsBuf.writeUInt32BE(4096, 0);
  const idLenBuf = Buffer.from([serverPublicKey.length]);

  return Buffer.concat([salt, rsBuf, idLenBuf, serverPublicKey, encrypted]);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      publicKey: DEFAULT_VAPID_PUBLIC_KEY,
      service: 'Parqu Web Push High-Priority Gateway (FCM / Apple Push / VAPID)',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { subscription, payload, delayMs = 0 } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return res.status(400).json({
        ok: false,
        error: 'Suscripción Push incompleta o no proporcionada.',
      });
    }

    const safeDelay = Math.min(6000, Math.max(0, Number(delayMs) || 0));
    if (safeDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, safeDelay));
    }

    const notificationPayload = JSON.stringify({
      title: payload?.title || 'Parqu • Estancia Activa ($6.00/hr)',
      body:
        payload?.body ||
        'Tu vehículo está protegido. Toca para extender +1 Hora o finalizar tu estancia.',
      tag: 'parqu-live-parking-status',
      priority: 'high',
      openModal: true,
      data: payload?.data || {},
      sentAt: Date.now(),
    });

    const encryptedBody = encryptWebPushPayload(
      notificationPayload,
      subscription.keys.p256dh,
      subscription.keys.auth
    );

    const vapidAuthorization = createVapidAuthHeader(
      subscription.endpoint,
      DEFAULT_VAPID_PUBLIC_KEY,
      DEFAULT_VAPID_PRIVATE_KEY,
      VAPID_SUBJECT
    );

    const pushResponse = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        Authorization: vapidAuthorization,
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(encryptedBody.length),
        TTL: '3600',
        Urgency: 'high',
      },
      body: encryptedBody,
    });

    if (!pushResponse.ok) {
      const errText = await pushResponse.text().catch(() => '');
      return res.status(pushResponse.status).json({
        ok: false,
        status: pushResponse.status,
        error: errText || 'Error en el servidor Push (FCM / APNs)',
      });
    }

    return res.status(200).json({
      ok: true,
      deliveredAt: Date.now(),
      urgency: 'high',
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Error interno al enviar notificación Push',
    });
  }
}
