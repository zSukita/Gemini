import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerServiceWorker } from './pwa';

describe('PWA utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('não lança erro ao chamar registerServiceWorker em ambiente sem suporte ou teste', () => {
    expect(() => registerServiceWorker()).not.toThrow();
  });
});
