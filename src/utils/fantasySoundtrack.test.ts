import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PRESET_TRACKS, 
  stopCurrentTrack, 
  setMasterSoundtrackVolume, 
  getSoundtrackState, 
  subscribeToSoundtrack 
} from './fantasySoundtrack';

describe('fantasySoundtrack utility', () => {
  beforeEach(() => {
    stopCurrentTrack();
    setMasterSoundtrackVolume(0.5);
  });

  it('contains the 4 preset procedural tracks', () => {
    expect(PRESET_TRACKS).toHaveLength(4);
    const ids = PRESET_TRACKS.map(t => t.id);
    expect(ids).toContain('epic-battle');
    expect(ids).toContain('dungeon-synth');
    expect(ids).toContain('tavern-celebration');
    expect(ids).toContain('victory-march');
  });

  it('allows adjusting master volume clamped between 0 and 1', () => {
    setMasterSoundtrackVolume(0.8);
    expect(getSoundtrackState().masterVolume).toBe(0.8);

    setMasterSoundtrackVolume(1.5);
    expect(getSoundtrackState().masterVolume).toBe(1.0);

    setMasterSoundtrackVolume(-0.2);
    expect(getSoundtrackState().masterVolume).toBe(0.0);
  });

  it('notifies subscribers of state changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSoundtrack(listener);

    // Initial invocation on subscribe
    expect(listener).toHaveBeenCalledWith(null, false, 0.5);

    setMasterSoundtrackVolume(0.75);
    expect(listener).toHaveBeenCalledWith(null, false, 0.75);

    unsubscribe();
    setMasterSoundtrackVolume(0.2);
    // Should not receive call after unsubscribe
    expect(listener).not.toHaveBeenCalledWith(null, false, 0.2);
  });

  it('stops current track and resets playing state', () => {
    stopCurrentTrack();
    const state = getSoundtrackState();
    expect(state.isPlaying).toBe(false);
  });
});
