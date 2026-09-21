import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import {
  startAmbience,
  stopAmbience,
  stopAllAmbience,
  isAmbienceActive,
  setAmbienceVolume,
  playVictoryFanfare,
  playDangerAlarm,
  playGoldCoins,
  playMonsterRoar,
} from './ambienceSound';

describe('ambienceSound procedural audio system', () => {
  beforeAll(() => {
    const mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        value: 1,
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    const mockOscillatorNode = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        value: 440,
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockBiquadFilter = {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
        value: 1000,
      },
      Q: { value: 1 },
      connect: vi.fn(),
    };

    const mockBufferSource = {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    class MockAudioContext {
      state = 'running';
      currentTime = 0;
      sampleRate = 44100;
      destination = {};
      createGain = vi.fn(() => mockGainNode);
      createOscillator = vi.fn(() => mockOscillatorNode);
      createBiquadFilter = vi.fn(() => mockBiquadFilter);
      createBuffer = vi.fn((_channels: number, length: number) => ({
        getChannelData: vi.fn(() => new Float32Array(length)),
      }));
      createBufferSource = vi.fn(() => mockBufferSource);
      resume = vi.fn(async () => {});
    }

    (globalThis as any).AudioContext = MockAudioContext;
    if (typeof window !== 'undefined') {
      (window as any).AudioContext = MockAudioContext;
    }
  });

  beforeEach(() => {
    stopAllAmbience();
  });

  it('should start and stop rain ambience without throwing', () => {
    expect(isAmbienceActive('rain')).toBe(false);
    startAmbience('rain', 0.4);
    expect(isAmbienceActive('rain')).toBe(true);

    stopAmbience('rain');
    expect(isAmbienceActive('rain')).toBe(false);
  });

  it('should stop all playing ambiences when stopAllAmbience is called', () => {
    startAmbience('tavern', 0.5);
    startAmbience('campfire', 0.3);
    expect(isAmbienceActive('tavern')).toBe(true);
    expect(isAmbienceActive('campfire')).toBe(true);

    stopAllAmbience();
    expect(isAmbienceActive('tavern')).toBe(false);
    expect(isAmbienceActive('campfire')).toBe(false);
  });

  it('should adjust volume without throwing', () => {
    startAmbience('battle', 0.5);
    expect(() => setAmbienceVolume('battle', 0.8)).not.toThrow();
  });

  it('should trigger sound effect stings safely', () => {
    expect(() => playVictoryFanfare()).not.toThrow();
    expect(() => playDangerAlarm()).not.toThrow();
    expect(() => playGoldCoins()).not.toThrow();
    expect(() => playMonsterRoar()).not.toThrow();
  });
});
