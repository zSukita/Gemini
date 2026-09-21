import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import {
  isDiceSoundMuted,
  setDiceSoundMuted,
  toggleDiceSound,
  playDiceRattle,
  playDiceImpact,
} from './diceSound';

describe('diceSound utils', () => {
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
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    vi.restoreAllMocks();
  });

  it('deve iniciar desmutado por padrão', () => {
    expect(isDiceSoundMuted()).toBe(false);
  });

  it('deve alternar e persistir o estado de mudo', () => {
    expect(isDiceSoundMuted()).toBe(false);

    const muted = toggleDiceSound();
    expect(muted).toBe(true);
    expect(isDiceSoundMuted()).toBe(true);

    const unmuted = toggleDiceSound();
    expect(unmuted).toBe(false);
    expect(isDiceSoundMuted()).toBe(false);
  });

  it('setDiceSoundMuted deve salvar no localStorage corretamente', () => {
    setDiceSoundMuted(true);
    expect(isDiceSoundMuted()).toBe(true);

    setDiceSoundMuted(false);
    expect(isDiceSoundMuted()).toBe(false);
  });

  it('playDiceRattle e playDiceImpact não devem lançar exceções mesmo sem AudioContext nativo', () => {
    expect(() => playDiceRattle()).not.toThrow();
    expect(() => playDiceImpact(false, false)).not.toThrow();
    expect(() => playDiceImpact(true, false)).not.toThrow();
    expect(() => playDiceImpact(false, true)).not.toThrow();
  });
});
