// Sintetizador Web Audio API de notas y música interactiva para movimientos de la ruleta 3D
// 100% libre de dependencias externas, cero latencia y ultra optimizado para móviles y escritorio

let audioCtx = null;
let soundEnabled = true;

// Escala Pentatónica Mayor cálida y armónica (C4 - D5)
const SCALE_NOTES = [
  261.63, // C4 (Do) - Tarjeta & Parquímetro
  293.66, // D4 (Re) - Recarga Inmediata
  329.63, // E4 (Mi) - Autocobro Inteligente
  392.00, // G4 (Sol) - Credencial QR Oficial
  440.00, // A4 (La) - Mapa Satelital GPS
  523.25, // C5 (Do alto) - Padrón Vehicular
  587.33, // D5 (Re alto) - Historial de Cobros
];

function getContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function resumeAudio() {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function isAudioEnabled() {
  return soundEnabled;
}

export function setAudioEnabled(enabled) {
  soundEnabled = !!enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('parqu_wheel_audio', soundEnabled ? '1' : '0');
    } catch (_) {}
  }
}

// Inicializar preferencia si existe
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('parqu_wheel_audio');
    if (saved !== null) {
      soundEnabled = saved === '1';
    }
  } catch (_) {}
}

/**
 * Reproduce una nota musical armónica y un micro-click mecánico
 * al pasar por cada opción de la ruleta.
 */
export function playMovementNote(index = 0, intensity = 1.0) {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const n = SCALE_NOTES.length;
  const noteIdx = ((index % n) + n) % n;
  const freq = SCALE_NOTES[noteIdx];

  // 1. Oscilador Principal (Onda senoidal pura cálida con armónico suave)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  // 2. Filtro suave para calidez acústica (tipo marimba / piano eléctrico suave)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(freq * 3.5, 2200), now);

  // 3. Segundo oscilador armónico ligero para brillo musical
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, now);

  const vol = Math.min(Math.max(intensity, 0.4), 1.2) * 0.18;

  // Envolvente de volumen (ataque ultra rápido de 3ms, caída percusiva musical de 120ms)
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(vol * 0.25, now + 0.003);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

  // 4. Click mecánico sutil (transitorio táctil tipo ruleta de precisión)
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = 'sine';
  clickOsc.frequency.setValueAtTime(1400, now);
  clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.012);

  clickGain.gain.setValueAtTime(vol * 0.45, now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

  // Conectar nodos
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);

  osc.start(now);
  osc2.start(now);
  clickOsc.start(now);

  osc.stop(now + 0.16);
  osc2.stop(now + 0.12);
  clickOsc.stop(now + 0.02);
}

/**
 * Acorde armónico de aterrizaje y resolución cuando la ruleta se detiene
 * en la opción final.
 */
export function playSettleChime(index = 0) {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const n = SCALE_NOTES.length;
  const noteIdx = ((index % n) + n) % n;
  const rootFreq = SCALE_NOTES[noteIdx];
  const fifthFreq = rootFreq * 1.4983; // Quinta justa armónica

  [rootFreq, fifthFreq].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(f, now);

    const baseVol = 0.08 / (i + 1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseVol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  });
}
