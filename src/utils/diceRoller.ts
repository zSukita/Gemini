import confetti from 'canvas-confetti';
import type { AdvantageMode, DiceRollResult } from '../types/dnd5e';

/**
 * Rola um dado de N faces (ex: 20, 6, 8, etc.)
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Toca um efeito sonoro tátil de rolagem usando a Web Audio API (sem dependências externas)
 */
export function playDiceSound(isCrit = false, isFumble = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (isCrit) {
      // Fanfarra de sucesso crítico (agudo, triplo acorde triunfante)
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
      return;
    }

    if (isFumble) {
      // Som grave e descendente de falha crítica
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      return;
    }

    // Som de rolagem rápida de dados batendo na mesa (ruído rápido filtrado)
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 200, ctx.currentTime + i * 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.07);
    }
  } catch {
    // Ignorar falhas de áudio silenciosamente se o navegador bloquear autoplay
  }
}

/**
 * Efeito visual de confetes dourados para Acerto Crítico (20 natural)
 */
export function fireCritConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d4af37', '#ffd700', '#ffffff', '#e63946'],
    });
  } catch {
    // Fallback silencioso
  }
}

/**
 * Rola um teste com d20 considerando Vantagem, Desvantagem ou Normal
 */
export function rollD20(
  label: string,
  modifier = 0,
  advantageMode: AdvantageMode = 'normal'
): DiceRollResult {
  const roll1 = rollDie(20);
  let selected = roll1;
  const rolls = [roll1];

  if (advantageMode === 'advantage') {
    const roll2 = rollDie(20);
    rolls.push(roll2);
    selected = Math.max(roll1, roll2);
  } else if (advantageMode === 'disadvantage') {
    const roll2 = rollDie(20);
    rolls.push(roll2);
    selected = Math.min(roll1, roll2);
  }

  const isCriticalSuccess = selected === 20;
  const isCriticalFailure = selected === 1;
  const total = selected + modifier;

  let breakdown = '';
  if (advantageMode === 'normal') {
    breakdown = `d20 (${selected}) ${modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}`;
  } else {
    const modeLabel = advantageMode === 'advantage' ? 'Vantagem' : 'Desvantagem';
    breakdown = `d20 [${rolls.join(', ')}] (${modeLabel}: ${selected}) ${
      modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`
    }`;
  }

  if (isCriticalSuccess) {
    fireCritConfetti();
    playDiceSound(true, false);
  } else if (isCriticalFailure) {
    playDiceSound(false, true);
  } else {
    playDiceSound(false, false);
  }

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    label,
    dieType: 'd20',
    rolls,
    selectedRoll: selected,
    modifier,
    total,
    advantageMode,
    isCriticalSuccess,
    isCriticalFailure,
    breakdown,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Interpreta e rola uma fórmula de dano ou dados como "1d8 + 3", "2d6 + 4", "1d10 - 1" ou "d12"
 */
export function rollFormula(
  formula: string,
  label: string,
  isCriticalDamage = false
): DiceRollResult {
  const cleaned = formula.replace(/\s+/g, '');
  // regex: /(\d*)d(\d+)([+-]\d+)?/i
  const match = cleaned.match(/^(\d*)d(\d+)([+-]\d+)?$/i);

  let diceCount = 1;
  let sides = 6;
  let mod = 0;

  if (match) {
    diceCount = match[1] ? parseInt(match[1], 10) : 1;
    sides = parseInt(match[2], 10);
    mod = match[3] ? parseInt(match[3], 10) : 0;
  } else {
    // Tenta número fixo ou fallback
    const num = parseInt(formula, 10);
    if (!isNaN(num)) {
      return {
        id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        label,
        dieType: 'flat',
        rolls: [num],
        selectedRoll: num,
        modifier: 0,
        total: num,
        advantageMode: 'normal',
        breakdown: `${num}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
      };
    }
  }

  // Em acerto crítico no D&D 5e, o número de dados de dano dobra!
  const finalDiceCount = isCriticalDamage ? diceCount * 2 : diceCount;
  const rolls: number[] = [];

  for (let i = 0; i < finalDiceCount; i++) {
    rolls.push(rollDie(sides));
  }

  const diceSum = rolls.reduce((acc, curr) => acc + curr, 0);
  const total = Math.max(0, diceSum + mod);

  const breakdown = `${finalDiceCount}d${sides} [${rolls.join(', ')}] ${
    mod > 0 ? `+ ${mod}` : mod < 0 ? `- ${Math.abs(mod)}` : ''
  }${isCriticalDamage ? ' (Crítico: Dados Dobrados)' : ''}`;

  playDiceSound(false, false);

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    label: isCriticalDamage ? `${label} (DANO CRÍTICO)` : label,
    dieType: `d${sides}`,
    rolls,
    selectedRoll: diceSum,
    modifier: mod,
    total,
    advantageMode: 'normal',
    breakdown,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}
