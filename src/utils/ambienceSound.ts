/**
 * Sistema de Áudio Ambiental e Soundboard Procedural para o Mestre via Web Audio API.
 * Funciona 100% offline sem arquivos de mídia externos, garantindo reprodução
 * contínua, estável e ultra-leve no navegador e no Electron.
 */

export type AmbienceType = 'tavern' | 'rain' | 'campfire' | 'dungeon' | 'battle';

export type AmbienceCleanup = AudioNode | number | ReturnType<typeof setInterval>;

interface ActiveAmbience {
  nodes: AmbienceCleanup[]; // nodes e timers para limpeza
  gainNode: GainNode;
  isPlaying: boolean;
  volume: number;
}

const activeAmbiences: Partial<Record<AmbienceType, ActiveAmbience>> = {};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AudioContextClass =
    (typeof window !== 'undefined' &&
      (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) ||
    (typeof globalThis !== 'undefined' && (globalThis as unknown as { AudioContext: typeof AudioContext }).AudioContext);
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ==================== 1. AMBIENTES CONTÍNUOS ====================

/**
 * 🌧️ CHUVA & TEMPESTADE: Ruído de chuva contínuo + trovões aleatórios
 */
function createRainAmbience(ctx: AudioContext, masterGain: GainNode): AmbienceCleanup[] {
  const cleanup: AmbienceCleanup[] = [];

  // Buffer de ruído rosa/marrom para chuva
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    output[i] = (b0 + b1 + b2) * 0.12;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 850;

  whiteNoise.connect(filter);
  filter.connect(masterGain);
  whiteNoise.start();
  cleanup.push(whiteNoise, filter);

  // Trovões aleatórios a cada 8 a 15 segundos
  const thunderInterval = setInterval(() => {
    if (ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const tGain = ctx.createGain();
    const tFilter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 2.5);

    tFilter.type = 'lowpass';
    tFilter.frequency.value = 180;

    tGain.gain.setValueAtTime(0.01, ctx.currentTime);
    tGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.3);
    tGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);

    osc.connect(tFilter);
    tFilter.connect(tGain);
    tGain.connect(masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 3.2);
  }, 11000);

  cleanup.push(thunderInterval);
  return cleanup;
}

/**
 * 🔥 FOGUEIRA DE ACAMPAMENTO: Estalos de madeira e brisa suave
 */
function createCampfireAmbience(ctx: AudioContext, masterGain: GainNode): AmbienceCleanup[] {
  const cleanup: AmbienceCleanup[] = [];

  // Vento brando de fundo
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const windGain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 95;
  filter.type = 'lowpass';
  filter.frequency.value = 220;
  windGain.gain.value = 0.08;

  osc.connect(filter);
  filter.connect(windGain);
  windGain.connect(masterGain);
  osc.start();
  cleanup.push(osc, filter, windGain);

  // Estalos crepitantes (Crackle) aleatórios frequentes
  const crackleInterval = setInterval(() => {
    if (ctx.state !== 'running') return;
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const snap = ctx.createBufferSource();
    snap.buffer = buffer;
    const snapGain = ctx.createGain();
    snapGain.gain.value = 0.12 + Math.random() * 0.18;

    snap.connect(snapGain);
    snapGain.connect(masterGain);
    snap.start();
  }, 220);

  cleanup.push(crackleInterval);
  return cleanup;
}

/**
 * 🍺 TAVERNA MEDIEVAL: Burburinho e notas de alaúde acústico
 */
function createTavernAmbience(ctx: AudioContext, masterGain: GainNode): AmbienceCleanup[] {
  const cleanup: AmbienceCleanup[] = [];

  // Burburinho morno de vozes
  const noiseSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < noiseSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.1;
  }
  const chatter = ctx.createBufferSource();
  chatter.buffer = buffer;
  chatter.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 450;
  bandpass.Q.value = 1.2;

  const chatterGain = ctx.createGain();
  chatterGain.gain.value = 0.2;

  chatter.connect(bandpass);
  bandpass.connect(chatterGain);
  chatterGain.connect(masterGain);
  chatter.start();
  cleanup.push(chatter, bandpass, chatterGain);

  // Notas de alaúde periódicas (Dó, Sol, Ré, Lá)
  const luthNotes = [261.63, 329.63, 392.0, 440.0, 523.25];
  const luthInterval = setInterval(() => {
    if (ctx.state !== 'running') return;
    const note = luthNotes[Math.floor(Math.random() * luthNotes.length)];
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note, ctx.currentTime);

    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc.connect(g);
    g.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 1.3);
  }, 1800);

  cleanup.push(luthInterval);
  return cleanup;
}

/**
 * 🏰 MASMORRA SOMBRIA: Vento uivante e ecos profundos
 */
function createDungeonAmbience(ctx: AudioContext, masterGain: GainNode): AmbienceCleanup[] {
  const cleanup: AmbienceCleanup[] = [];

  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(55, ctx.currentTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, ctx.currentTime);

  gain.gain.value = 0.2;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  osc.start();
  cleanup.push(osc, filter, gain);

  // Goteira subterrânea em eco
  const dropInterval = setInterval(() => {
    if (ctx.state !== 'running') return;
    const dropOsc = ctx.createOscillator();
    const dropGain = ctx.createGain();
    dropOsc.type = 'sine';
    dropOsc.frequency.setValueAtTime(900 + Math.random() * 400, ctx.currentTime);
    dropOsc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.08);

    dropGain.gain.setValueAtTime(0.12, ctx.currentTime);
    dropGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    dropOsc.connect(dropGain);
    dropGain.connect(masterGain);
    dropOsc.start();
    dropOsc.stop(ctx.currentTime + 0.25);
  }, 3200);

  cleanup.push(dropInterval);
  return cleanup;
}

/**
 * ⚔️ BATALHA ÉPICA: Tambores de guerra rítmicos tensos
 */
function createBattleAmbience(ctx: AudioContext, masterGain: GainNode): AmbienceCleanup[] {
  const cleanup: AmbienceCleanup[] = [];

  let beat = 0;
  const drumInterval = setInterval(() => {
    if (ctx.state !== 'running') return;
    const isStrongBeat = beat % 4 === 0;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isStrongBeat ? 80 : 60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(isStrongBeat ? 0.35 : 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);

    beat++;
  }, 500); // 120 BPM

  cleanup.push(drumInterval);
  return cleanup;
}

// ==================== CONTROLES DE AMBIENTE ====================

export function toggleAmbience(type: AmbienceType, volume = 0.5): boolean {
  const current = activeAmbiences[type];
  if (current && current.isPlaying) {
    stopAmbience(type);
    return false;
  } else {
    startAmbience(type, volume);
    return true;
  }
}

export function startAmbience(type: AmbienceType, volume = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Se já estiver tocando, interrompe antes de recriar
  stopAmbience(type);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  masterGain.connect(ctx.destination);

  let nodes: AmbienceCleanup[] = [];
  switch (type) {
    case 'rain':
      nodes = createRainAmbience(ctx, masterGain);
      break;
    case 'campfire':
      nodes = createCampfireAmbience(ctx, masterGain);
      break;
    case 'tavern':
      nodes = createTavernAmbience(ctx, masterGain);
      break;
    case 'dungeon':
      nodes = createDungeonAmbience(ctx, masterGain);
      break;
    case 'battle':
      nodes = createBattleAmbience(ctx, masterGain);
      break;
  }

  activeAmbiences[type] = {
    nodes,
    gainNode: masterGain,
    isPlaying: true,
    volume,
  };
}

export function stopAmbience(type: AmbienceType): void {
  const item = activeAmbiences[type];
  if (!item) return;

  item.nodes.forEach((n) => {
    if (typeof n === 'number' || typeof n === 'object') {
      clearInterval(n as any);
    } else if ('stop' in n && typeof (n as AudioScheduledSourceNode).stop === 'function') {
      try {
        (n as AudioScheduledSourceNode).stop();
      } catch {
        // ignore
      }
    }
  });

  try {
    item.gainNode.disconnect();
  } catch {
    // ignore
  }

  delete activeAmbiences[type];
}

export function stopAllAmbience(): void {
  (Object.keys(activeAmbiences) as AmbienceType[]).forEach((type) => {
    stopAmbience(type);
  });
}

export function setAmbienceVolume(type: AmbienceType, volume: number): void {
  const item = activeAmbiences[type];
  if (!item || !audioCtx) return;
  item.volume = volume;
  item.gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
}

export function isAmbienceActive(type: AmbienceType): boolean {
  return !!activeAmbiences[type]?.isPlaying;
}

// ==================== 2. EFEITOS SONOROS RÁPIDOS (STINGS) ====================

/**
 * 🎺 Fanfarra Triunfal de Vitória
 */
export function playVictoryFanfare(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const start = ctx.currentTime + i * 0.12;
    const dur = i === notes.length - 1 ? 0.6 : 0.18;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    g.gain.setValueAtTime(0.001, start);
    g.gain.linearRampToValueAtTime(0.25, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  });
}

/**
 * ⚠️ Alarme de Emboscada / Perigo
 */
export function playDangerAlarm(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const start = ctx.currentTime;

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(650, start);
  osc.frequency.linearRampToValueAtTime(320, start + 0.35);

  g.gain.setValueAtTime(0.2, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + 0.45);
}

/**
 * 💰 Moedas de Ouro
 */
export function playGoldCoins(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  [1200, 1450, 1600].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const start = ctx.currentTime + idx * 0.07;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    g.gain.setValueAtTime(0.18, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.18);
  });
}

/**
 * 🐉 Rugido de Fera / Criatura
 */
export function playMonsterRoar(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  const start = ctx.currentTime;

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(160, start);
  osc.frequency.exponentialRampToValueAtTime(45, start + 0.9);

  filter.type = 'lowpass';
  filter.frequency.value = 350;

  g.gain.setValueAtTime(0.01, start);
  g.gain.linearRampToValueAtTime(0.35, start + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, start + 1.0);

  osc.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + 1.1);
}
