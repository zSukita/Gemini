/**
 * Sistema de Síntese de Efeitos Sonoros de Dados via Web Audio API.
 * Funciona 100% offline e sem dependências de arquivos de áudio externos,
 * garantindo compatibilidade total com navegadores modernos e Electron.
 */

const STORAGE_KEY_SOUND_MUTED = 'arcanasheet_dice_sound_muted';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isDiceSoundMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_SOUND_MUTED) === 'true';
}

export function setDiceSoundMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_SOUND_MUTED, String(muted));
}

export function toggleDiceSound(): boolean {
  const current = isDiceSoundMuted();
  const next = !current;
  setDiceSoundMuted(next);
  return next;
}

/**
 * Toca o barulho de dados rolando / quicando na mesa (chocalho de dados).
 */
export function playDiceRattle(): void {
  if (isDiceSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bounces = 4 + Math.floor(Math.random() * 3); // 4 a 6 batidinhas

  for (let i = 0; i < bounces; i++) {
    const time = now + i * (0.08 + Math.random() * 0.05);
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let j = 0; j < bufferSize; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.25));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + Math.random() * 800, time);
    filter.Q.setValueAtTime(3.5, time);

    const gain = ctx.createGain();
    const volume = (0.15 + Math.random() * 0.1) * (1 - i / (bounces + 1));
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
    noise.stop(time + 0.05);
  }
}

/**
 * Toca o impacto do dado batendo firme na mesa de madeira ao parar.
 */
export function playDiceImpact(isCritSuccess = false, isCritFail = false): void {
  if (isDiceSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Impacto grave do dado na mesa
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);

  // 2. Efeito sonoro triunfal para Acerto Crítico (Natural 20)
  if (isCritSuccess) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // Dó, Mi, Sol, Dó alto
    notes.forEach((freq, idx) => {
      const noteTime = now + 0.08 + idx * 0.09;
      const noteOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      noteOsc.type = 'sine';
      noteOsc.frequency.setValueAtTime(freq, noteTime);

      noteGain.gain.setValueAtTime(0.18, noteTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      noteOsc.connect(noteGain);
      noteGain.connect(ctx.destination);

      noteOsc.start(noteTime);
      noteOsc.stop(noteTime + 0.45);
    });
  }

  // 3. Efeito sonoro sombrio para Falha Crítica (Natural 1)
  if (isCritFail) {
    const failOsc = ctx.createOscillator();
    const failGain = ctx.createGain();

    failOsc.type = 'sawtooth';
    failOsc.frequency.setValueAtTime(110, now + 0.05);
    failOsc.frequency.linearRampToValueAtTime(55, now + 0.5);

    failGain.gain.setValueAtTime(0.22, now + 0.05);
    failGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    failOsc.connect(failGain);
    failGain.connect(ctx.destination);

    failOsc.start(now + 0.05);
    failOsc.stop(now + 0.55);
  }
}
