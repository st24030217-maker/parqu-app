// Motor Híbrido de Música de Fondo para Parqu:
// 1. Si existe `/musica-fondo.mp3` en la carpeta `public/`, reproduce ese archivo en loop con fade suave.
// 2. Por defecto, sintetiza en tiempo real un paisaje sonoro Chill / Cloud-Sky Ambient
//    (acordes cálidos Maj9/Sus2 con filtro low-pass + gotas melódicas pentatónicas suaves)
//    100% libre de peso extra y sincronizado con la atmósfera de nubes.

const STORAGE_KEY = 'parqu_bg_music_enabled';
const CUSTOM_MP3_PATH = './musica-fondo.mp3';

let audioCtx = null;
let masterGain = null;
let isPlaying = false;
let isEnabled = true; // Activo por defecto
let chordInterval = null;
let melodyInterval = null;
let activeNodes = [];
let chordStep = 0;

// Soporte opcional para archivo MP3 personalizado en public/musica-fondo.mp3
let htmlAudio = null;
let useCustomMp3 = false;
let customMp3Checked = false;

// Leer preferencia guardada
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      isEnabled = saved === '1';
    }
  } catch (_) {}
}

// Progresión de acordes cálidos estilo Cloud-Sky / Dreamy Ambient (Hz)
// Acorde 1: Fmaj9 (Fa, Do, Mi, Sol, La)
// Acorde 2: Cmaj9 (Do, Sol, Si, Re, Mi)
// Acorde 3: Am9   (La, Mi, Sol, Si, Do)
// Acorde 4: G6/9  (Sol, Re, Mi, La, Si)
const AMBIENT_CHORDS = [
  [174.61, 261.63, 329.63, 392.00, 440.00],
  [130.81, 196.00, 246.94, 293.66, 329.63],
  [110.00, 220.00, 261.63, 329.63, 392.00],
  [146.83, 196.00, 246.94, 293.66, 392.00],
];

// Notas pentatónicas suaves para destellos tipo piano eléctrico / celesta
const SPARKLE_NOTES = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

/**
 * Toca un acorde pad cálido y envolvente de larga duración (6.5 segundos)
 */
function triggerAmbientChord() {
  if (!isPlaying || !isEnabled || useCustomMp3) return;
  const ctx = ensureContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  const chord = AMBIENT_CHORDS[chordStep % AMBIENT_CHORDS.length];
  chordStep += 1;

  const duration = 6.8;

  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    // Mezcla de onda senoidal para graves y triángulo filtrado para calidez
    osc.type = idx === 0 ? 'sine' : 'triangle';
    // Ligero detune orgánico para efecto chorus espacial
    const detuneCents = (idx % 2 === 0 ? 1 : -1) * (idx * 2.5);
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(detuneCents, now);

    // Filtro pasa-bajos muy suave para que nunca canse el oído
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.linearRampToValueAtTime(780, now + duration * 0.45);
    filter.frequency.linearRampToValueAtTime(380, now + duration);

    const maxVol = idx === 0 ? 0.045 : 0.022;
    noteGain.gain.setValueAtTime(0.0001, now);
    // Ataque lento tipo pad de nubes (2.2s)
    noteGain.gain.linearRampToValueAtTime(maxVol, now + 2.2);
    // Caída sedosa
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);

    activeNodes.push(osc);
    osc.onended = () => {
      activeNodes = activeNodes.filter((n) => n !== osc);
    };
  });
}

/**
 * Toca una nota suave ocasional tipo piano Rhodes / gota de cristal
 */
function triggerGentleSparkle() {
  if (!isPlaying || !isEnabled || useCustomMp3) return;
  const ctx = ensureContext();
  if (!ctx || ctx.state !== 'running') return;

  // Solo suena el 65% de las veces para mantener aire y espacio
  if (Math.random() > 0.65) return;

  const now = ctx.currentTime;
  const freq =
    SPARKLE_NOTES[Math.floor(Math.random() * SPARKLE_NOTES.length)];

  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.018, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 2.9);
}

/**
 * Verifica si el usuario colocó un archivo `public/musica-fondo.mp3`.
 * Si existe, usa ese MP3; si no existe, usa el sintetizador ambiental Cloud-Sky.
 */
async function checkCustomMp3() {
  if (customMp3Checked || typeof window === 'undefined') return useCustomMp3;
  customMp3Checked = true;
  try {
    const res = await fetch(CUSTOM_MP3_PATH, { method: 'HEAD' });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('audio')) {
      useCustomMp3 = true;
      htmlAudio = new Audio(CUSTOM_MP3_PATH);
      htmlAudio.loop = true;
      htmlAudio.volume = 0.25;
    }
  } catch (_) {
    useCustomMp3 = false;
  }
  return useCustomMp3;
}

export async function startBackgroundMusic() {
  if (!isEnabled) return false;

  await checkCustomMp3();

  if (useCustomMp3 && htmlAudio) {
    try {
      await htmlAudio.play();
      isPlaying = true;
      return true;
    } catch (_) {
      return false;
    }
  }

  const ctx = ensureContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (_) {}
  }

  if (ctx.state !== 'running') {
    return false;
  }

  if (isPlaying) return true;
  isPlaying = true;

  const now = ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.001), now);
  masterGain.gain.linearRampToValueAtTime(0.85, now + 1.5);

  triggerAmbientChord();
  if (chordInterval) clearInterval(chordInterval);
  if (melodyInterval) clearInterval(melodyInterval);

  chordInterval = setInterval(triggerAmbientChord, 5200);
  melodyInterval = setInterval(triggerGentleSparkle, 2600);

  return true;
}

export function stopBackgroundMusic() {
  isPlaying = false;

  if (chordInterval) {
    clearInterval(chordInterval);
    chordInterval = null;
  }
  if (melodyInterval) {
    clearInterval(melodyInterval);
    melodyInterval = null;
  }

  if (htmlAudio) {
    htmlAudio.pause();
  }

  if (audioCtx && masterGain) {
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  }
}

export function isBackgroundMusicEnabled() {
  return isEnabled;
}

export function isBackgroundMusicPlaying() {
  return isPlaying;
}

export async function toggleBackgroundMusic() {
  isEnabled = !isEnabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, isEnabled ? '1' : '0');
    } catch (_) {}
  }

  if (isEnabled) {
    await startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
  return isEnabled;
}
