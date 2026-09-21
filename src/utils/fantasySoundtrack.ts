/**
 * Sistema de Trilha Sonora Procedural & Reprodutor de Músicas do Mestre.
 * Suporta tanto temas sintéticos gerados em tempo real via Web Audio API
 * (100% offline e sem consumo de banda) quanto importação de arquivos de áudio locais (.mp3, .wav, .ogg).
 */

export type ProceduralTrackId = 'epic-battle' | 'dungeon-synth' | 'tavern-celebration' | 'victory-march';

export interface SoundTrack {
  id: string;
  title: string;
  category: 'batalha' | 'exploracao' | 'ambiente' | 'vitoria' | 'customizado';
  description: string;
  bpm?: number;
  isCustom?: boolean;
  fileName?: string;
  duration?: number;
}

export const PRESET_TRACKS: SoundTrack[] = [
  {
    id: 'epic-battle',
    title: 'Marcha da Batalha Ancestral',
    category: 'batalha',
    description: 'Bateria de guerra rítmica, cordas graves tensas e metais imponentes.',
    bpm: 125,
  },
  {
    id: 'dungeon-synth',
    title: 'Ecos das Criptas Esquecidas',
    category: 'exploracao',
    description: 'Sons profundos, ressonâncias místicas cavernosas e atmosfera sombria.',
    bpm: 60,
  },
  {
    id: 'tavern-celebration',
    title: 'Festa do Dragão Bêbado',
    category: 'ambiente',
    description: 'Arpeggios animados de alaúde, ritmo festivo e calor da taberna.',
    bpm: 135,
  },
  {
    id: 'victory-march',
    title: 'Triunfo dos Heróis',
    category: 'vitoria',
    description: 'Fanfarra gloriosa em acordes triunfantes celebrando a vitória.',
    bpm: 110,
  },
];

type StateChangeListener = (currentTrack: SoundTrack | null, isPlaying: boolean, volume: number) => void;

let audioCtx: AudioContext | null = null;
let currentTrackGain: GainNode | null = null;
let activeIntervals: number[] = [];
let activeNodes: AudioNode[] = [];
let currentTrack: SoundTrack | null = null;
let isPlaying = false;
let masterVolume = 0.5; // 0.0 a 1.0

let customAudioElement: HTMLAudioElement | null = null;
const listeners = new Set<StateChangeListener>();

function notifyListeners() {
  listeners.forEach(cb => {
    try {
      cb(currentTrack, isPlaying, masterVolume);
    } catch {
      // Ignorar erros em listeners
    }
  });
}

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

// -------------------------------------------------------------
// 1. GERADORES DE SÍNTESE PROCEDURAL
// -------------------------------------------------------------

function startEpicBattleTrack(ctx: AudioContext, gainNode: GainNode) {
  // Drone grave tenso em Dó menor
  const bassDrone = ctx.createOscillator();
  const bassGain = ctx.createGain();
  const bassFilter = ctx.createBiquadFilter();

  bassDrone.type = 'sawtooth';
  bassDrone.frequency.setValueAtTime(65.41, ctx.currentTime); // C2

  bassFilter.type = 'lowpass';
  bassFilter.frequency.setValueAtTime(180, ctx.currentTime);

  bassGain.gain.setValueAtTime(0.4, ctx.currentTime);

  bassDrone.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(gainNode);

  bassDrone.start();
  activeNodes.push(bassDrone, bassGain, bassFilter);

  // Batidas de Guerra (Taiko / War Drums) a 125 BPM (480ms por batida)
  let beatIndex = 0;
  const drumInterval = window.setInterval(() => {
    if (ctx.state !== 'running') return;

    // Batida grave (Kick Taiko)
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(120, ctx.currentTime);
    kick.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.25);

    kickGain.gain.setValueAtTime(0.7, ctx.currentTime);
    kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    kick.connect(kickGain);
    kickGain.connect(gainNode);
    kick.start();
    kick.stop(ctx.currentTime + 0.3);

    // Efeito de percussão metálica no contratempo
    if (beatIndex % 2 === 1) {
      const snareNoise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }
      snareNoise.buffer = buffer;
      const sFilter = ctx.createBiquadFilter();
      sFilter.type = 'bandpass';
      sFilter.frequency.setValueAtTime(1200, ctx.currentTime);
      const sGain = ctx.createGain();
      sGain.gain.setValueAtTime(0.3, ctx.currentTime);

      snareNoise.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(gainNode);

      snareNoise.start();
      snareNoise.stop(ctx.currentTime + 0.1);
    }

    beatIndex++;
  }, 480);

  activeIntervals.push(drumInterval);
}

function startDungeonSynthTrack(ctx: AudioContext, gainNode: GainNode) {
  // Drone atmosférico etéreo
  const pad1 = ctx.createOscillator();
  const pad2 = ctx.createOscillator();
  const padGain = ctx.createGain();
  const padFilter = ctx.createBiquadFilter();

  pad1.type = 'sine';
  pad1.frequency.setValueAtTime(55, ctx.currentTime); // A1

  pad2.type = 'triangle';
  pad2.frequency.setValueAtTime(82.41, ctx.currentTime); // E2 (quinta justa)

  padFilter.type = 'lowpass';
  padFilter.frequency.setValueAtTime(320, ctx.currentTime);

  padGain.gain.setValueAtTime(0.35, ctx.currentTime);

  pad1.connect(padFilter);
  pad2.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(gainNode);

  pad1.start();
  pad2.start();
  activeNodes.push(pad1, pad2, padFilter, padGain);

  // Pingos de água e ressonância mística a cada 3 a 6 segundos
  const dropInterval = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const drop = ctx.createOscillator();
    const dropGain = ctx.createGain();
    const noteFreqs = [440, 523.25, 659.25, 783.99, 880];
    const freq = noteFreqs[Math.floor(Math.random() * noteFreqs.length)];

    drop.type = 'sine';
    drop.frequency.setValueAtTime(freq, ctx.currentTime);
    drop.frequency.exponentialRampToValueAtTime(freq * 0.95, ctx.currentTime + 0.8);

    dropGain.gain.setValueAtTime(0.2, ctx.currentTime);
    dropGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    drop.connect(dropGain);
    dropGain.connect(gainNode);

    drop.start();
    drop.stop(ctx.currentTime + 1.3);
  }, 3500);

  activeIntervals.push(dropInterval);
}

function startTavernCelebrationTrack(ctx: AudioContext, gainNode: GainNode) {
  // Progressão folk em arpeggio alegre (Dm, C, Bb, A)
  const notes = [
    293.66, 349.23, 440.0, 587.33, // Dm
    261.63, 329.63, 392.0, 523.25, // C
    233.08, 293.66, 349.23, 466.16, // Bb
    220.00, 277.18, 329.63, 440.00  // A
  ];

  let step = 0;
  const arpeggioInterval = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(notes[step % notes.length], ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.Q.setValueAtTime(2, ctx.currentTime);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(gainNode);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);

    step++;
  }, 220); // ~136 bpm

  activeIntervals.push(arpeggioInterval);
}

function startVictoryMarchTrack(ctx: AudioContext, gainNode: GainNode) {
  // Fanfarra triunfante em Ré Maior (D4, F#4, A4, D5)
  const fanfareNotes = [293.66, 369.99, 440.0, 587.33, 440.0, 587.33];
  let noteIndex = 0;

  const fanfareInterval = window.setInterval(() => {
    if (ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(fanfareNotes[noteIndex % fanfareNotes.length], ctx.currentTime);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(gainNode);

    osc.start();
    osc.stop(ctx.currentTime + 0.52);

    noteIndex++;
  }, 500);

  activeIntervals.push(fanfareInterval);
}

// -------------------------------------------------------------
// 2. CONTROLE DE REPRODUÇÃO GLOBAL
// -------------------------------------------------------------

export function stopCurrentTrack() {
  // Parar áudio customizado caso ativo
  if (customAudioElement) {
    customAudioElement.pause();
    customAudioElement.currentTime = 0;
    customAudioElement = null;
  }

  // Limpar nós de síntese
  activeIntervals.forEach(interval => clearInterval(interval));
  activeIntervals = [];

  activeNodes.forEach(node => {
    try {
      if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
        (node as AudioScheduledSourceNode).stop();
      }
      node.disconnect();
    } catch {
      // Nó já desconectado
    }
  });
  activeNodes = [];

  if (currentTrackGain) {
    try {
      currentTrackGain.disconnect();
    } catch {
      // Ignorar
    }
    currentTrackGain = null;
  }

  isPlaying = false;
  notifyListeners();
}

export function playProceduralTrack(trackId: ProceduralTrackId, volume = masterVolume) {
  stopCurrentTrack();

  const foundPreset = PRESET_TRACKS.find(t => t.id === trackId);
  if (!foundPreset) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  currentTrackGain = ctx.createGain();
  currentTrackGain.gain.setValueAtTime(volume, ctx.currentTime);
  currentTrackGain.connect(ctx.destination);

  currentTrack = foundPreset;
  masterVolume = volume;
  isPlaying = true;

  switch (trackId) {
    case 'epic-battle':
      startEpicBattleTrack(ctx, currentTrackGain);
      break;
    case 'dungeon-synth':
      startDungeonSynthTrack(ctx, currentTrackGain);
      break;
    case 'tavern-celebration':
      startTavernCelebrationTrack(ctx, currentTrackGain);
      break;
    case 'victory-march':
      startVictoryMarchTrack(ctx, currentTrackGain);
      break;
  }

  notifyListeners();
}

export function playCustomAudioFile(file: File, volume = masterVolume) {
  stopCurrentTrack();

  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = volume;

  customAudioElement = audio;
  currentTrack = {
    id: `custom-${Date.now()}`,
    title: file.name.replace(/\.[^/.]+$/, ''),
    category: 'customizado',
    description: `Arquivo local importado (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
    isCustom: true,
    fileName: file.name,
  };

  masterVolume = volume;
  isPlaying = true;

  audio.play().catch(err => {
    console.warn('Falha ao reproduzir arquivo customizado:', err);
    stopCurrentTrack();
  });

  notifyListeners();
}

export function setMasterSoundtrackVolume(volume: number) {
  masterVolume = Math.max(0, Math.min(1, volume));

  if (currentTrackGain && audioCtx) {
    currentTrackGain.gain.setValueAtTime(masterVolume, audioCtx.currentTime);
  }

  if (customAudioElement) {
    customAudioElement.volume = masterVolume;
  }

  notifyListeners();
}

export function subscribeToSoundtrack(callback: StateChangeListener): () => void {
  listeners.add(callback);
  callback(currentTrack, isPlaying, masterVolume);
  return () => {
    listeners.delete(callback);
  };
}

export function getSoundtrackState() {
  return {
    currentTrack,
    isPlaying,
    masterVolume,
  };
}
