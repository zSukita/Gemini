import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import {
  safeSetItem,
  safeGetItem,
  safeRemoveItem,
  safeSetJson,
  safeGetJson,
  isLocalStorageAvailable,
} from './safeStorage';

describe('safeStorage utility', () => {
  const store: Record<string, string> = {};

  beforeAll(() => {
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      length: 0,
      key: () => null,
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.restoreAllMocks();
  });

  it('deve confirmar disponibilidade do localStorage', () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });

  it('deve gravar e recuperar itens em texto com segurança', () => {
    expect(safeSetItem('test_key', 'hello_rpg')).toBe(true);
    expect(safeGetItem('test_key')).toBe('hello_rpg');
    expect(safeGetItem('non_existent')).toBeNull();
  });

  it('deve remover itens com segurança', () => {
    safeSetItem('to_remove', '123');
    expect(safeGetItem('to_remove')).toBe('123');

    safeRemoveItem('to_remove');
    expect(safeGetItem('to_remove')).toBeNull();
  });

  it('deve salvar e carregar objetos JSON com fallback', () => {
    const data = { campaign: 'Curse of Strahd', level: 5, active: true };
    expect(safeSetJson('campaign_data', data)).toBe(true);

    const loaded = safeGetJson('campaign_data', { campaign: '', level: 1, active: false });
    expect(loaded).toEqual(data);

    // Fallback em caso de JSON corrompido
    store['corrupted_json'] = 'invalid{json:';
    const fallback = safeGetJson('corrupted_json', { defaultValue: true });
    expect(fallback).toEqual({ defaultValue: true });
  });

  it('deve lidar com QuotaExceededError limpando dados dispensáveis', () => {
    store['arcanasheet_last_sync_event'] = 'sync_payload';
    store['arcanasheet_ai_dm_history'] = JSON.stringify(new Array(30).fill({ text: 'msg' }));

    let throwOnce = true;
    const originalSetItem = localStorage.setItem;

    vi.spyOn(localStorage, 'setItem').mockImplementation((k, v) => {
      if (throwOnce && k === 'critical_data') {
        throwOnce = false;
        const quotaError = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        throw quotaError;
      }
      return originalSetItem.call(localStorage, k, v);
    });

    const success = safeSetItem('critical_data', 'saved_after_prune');
    expect(success).toBe(true);
    expect(safeGetItem('critical_data')).toBe('saved_after_prune');
    expect(store['arcanasheet_last_sync_event']).toBeUndefined();
  });
});
