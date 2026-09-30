// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserStorageKey,
  migrateLegacyKeysToUser,
  BASE_STORAGE_KEYS,
  LEGACY_MIGRATION_FLAG_KEY,
} from './accountStorage';

describe('accountStorage utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve retornar chaves base quando userId não for fornecido', () => {
    expect(getUserStorageKey(BASE_STORAGE_KEYS.ENCOUNTER, null)).toBe(BASE_STORAGE_KEYS.ENCOUNTER);
    expect(getUserStorageKey(BASE_STORAGE_KEYS.CHARACTERS, undefined)).toBe(BASE_STORAGE_KEYS.CHARACTERS);
  });

  it('deve retornar chaves isoladas por userId', () => {
    expect(getUserStorageKey(BASE_STORAGE_KEYS.ENCOUNTER, 'user_123')).toBe('arcanasheet_encounter_state_user_123');
    expect(getUserStorageKey(BASE_STORAGE_KEYS.CHARACTERS, 'user_123')).toBe('arcanasheet_characters_user_123');
    expect(getUserStorageKey(BASE_STORAGE_KEYS.ACTIVE_CHARACTER, 'user_123')).toBe('arcanasheet_active_user_123');
    expect(getUserStorageKey(BASE_STORAGE_KEYS.AI_DM_HISTORY, 'user_123')).toBe('arcanasheet_ai_dm_history_user_123');
  });

  it('migra chaves legadas para o primeiro usuário sem dados prévios e limpa as chaves legadas', () => {
    localStorage.setItem(BASE_STORAGE_KEYS.CHARACTERS, JSON.stringify([{ id: 'c1', name: 'Guerreiro' }]));
    localStorage.setItem(BASE_STORAGE_KEYS.ENCOUNTER, JSON.stringify({ round: 2 }));

    const res = migrateLegacyKeysToUser('alice');
    expect(res.migrated).toBe(true);
    expect(res.migratedKeys).toContain(BASE_STORAGE_KEYS.CHARACTERS);
    expect(res.migratedKeys).toContain(BASE_STORAGE_KEYS.ENCOUNTER);

    // Dados foram transferidos para a conta de Alice
    expect(localStorage.getItem('arcanasheet_characters_alice')).toBeDefined();
    expect(localStorage.getItem('arcanasheet_encounter_state_alice')).toBeDefined();

    // Chaves legadas foram removidas
    expect(localStorage.getItem(BASE_STORAGE_KEYS.CHARACTERS)).toBeNull();
    expect(localStorage.getItem(BASE_STORAGE_KEYS.ENCOUNTER)).toBeNull();

    // Flag de migração gravada
    expect(localStorage.getItem(LEGACY_MIGRATION_FLAG_KEY)).toBe('alice');
  });

  it('não deve migrar dados para um segundo usuário se já foi migrado', () => {
    localStorage.setItem(LEGACY_MIGRATION_FLAG_KEY, 'alice');
    localStorage.setItem(BASE_STORAGE_KEYS.CHARACTERS, JSON.stringify([{ id: 'c2', name: 'Invasor' }]));

    const res = migrateLegacyKeysToUser('bob');
    expect(res.migrated).toBe(false);
    expect(res.migratedKeys).toHaveLength(0);
    expect(localStorage.getItem('arcanasheet_characters_bob')).toBeNull();
  });

  it('não deve sobrescrever dados se o usuário já tiver dados próprios', () => {
    localStorage.setItem('arcanasheet_characters_alice', JSON.stringify([{ id: 'c-mine', name: 'Meu Personagem' }]));
    localStorage.setItem(BASE_STORAGE_KEYS.CHARACTERS, JSON.stringify([{ id: 'c-old', name: 'Velho' }]));

    const res = migrateLegacyKeysToUser('alice');
    expect(res.migrated).toBe(false);
    // Dados originais de Alice permanecem intocados
    const current = JSON.parse(localStorage.getItem('arcanasheet_characters_alice')!);
    expect(current[0].name).toBe('Meu Personagem');
  });
});
