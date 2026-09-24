import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import {
  cleanNarrativeForSpeech,
  isAutoNarrationEnabled,
  setAutoNarrationEnabled,
  toggleAutoNarration,
} from './narrationVoice';

describe('narrationVoice utility', () => {
  const storage: Record<string, string> = {};

  beforeAll(() => {
    const localStorageMock = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, val: string) => {
        storage[key] = String(val);
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      },
      length: 0,
      key: () => null,
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    vi.restoreAllMocks();
  });

  it('deve limpar formatações de markdown e colchetes mecânicos', () => {
    const input = `### O Guardião das Sombras
O orc avança com seu machado **pesado**!
[ROLAGEM DE DADO: Atletismo CD 15]
Ele sussurra: *"Vocês nunca sairão vivos daqui!"*`;

    const cleaned = cleanNarrativeForSpeech(input);

    expect(cleaned).not.toContain('###');
    expect(cleaned).not.toContain('**');
    expect(cleaned).not.toContain('[ROLAGEM');
    expect(cleaned).toContain('O orc avança com seu machado pesado!');
    expect(cleaned).toContain('Vocês nunca sairão vivos daqui!');
  });

  it('deve gerenciar estado de auto-narração no localStorage', () => {
    expect(isAutoNarrationEnabled()).toBe(false);

    setAutoNarrationEnabled(true);
    expect(isAutoNarrationEnabled()).toBe(true);

    const toggled = toggleAutoNarration();
    expect(toggled).toBe(false);
    expect(isAutoNarrationEnabled()).toBe(false);
  });
});
