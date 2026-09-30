import { safeGetItem, safeSetItem, safeRemoveItem } from './safeStorage';

export const LEGACY_MIGRATION_FLAG_KEY = 'arcanasheet_legacy_migrated_to';

export const BASE_STORAGE_KEYS = {
  CHARACTERS: 'arcanasheet_characters_list',
  ACTIVE_CHARACTER: 'arcanasheet_active_character_id',
  ENCOUNTER: 'arcanasheet_encounter_state',
  BATTLEMAP_CONFIG: 'arcanasheet_battlemap_config',
  BATTLEMAP_TOKENS: 'arcanasheet_battlemap_tokens',
  AI_DM_CONFIG: 'arcanasheet_ai_dm_config',
  AI_DM_HISTORY: 'arcanasheet_ai_dm_history',
  AI_CAMPAIGN_SUMMARY: 'arcanasheet_ai_campaign_summary',
  LOCAL_CAMPAIGNS: 'arcanasheet_local_campaigns',
  ACTIVE_CAMPAIGN: 'arcanasheet_active_campaign_id',
} as const;

/**
 * Retorna a chave de armazenamento isolada por usuário.
 * Se o usuário for anônimo/convidado (sem userId), retorna a chave base.
 */
export function getUserStorageKey(baseKey: string, userId?: string | null): string {
  if (!userId) return baseKey;
  // Se for a chave de personagens ou active, mantém o padrão já existente no app para retrocompatibilidade
  if (baseKey === BASE_STORAGE_KEYS.CHARACTERS) return `arcanasheet_characters_${userId}`;
  if (baseKey === BASE_STORAGE_KEYS.ACTIVE_CHARACTER) return `arcanasheet_active_${userId}`;
  return `${baseKey}_${userId}`;
}

/**
 * Migração segura e atômica de chaves legadas locais.
 * Só migra dados para a primeira conta autenticada se essa conta ainda não possuir dados próprios,
 * impedindo que uma segunda conta (ou troca de usuário) herde ou sobrescreva dados de outrem.
 */
export function migrateLegacyKeysToUser(userId: string): { migrated: boolean; migratedKeys: string[] } {
  if (!userId) return { migrated: false, migratedKeys: [] };

  const migrationStatus = safeGetItem(LEGACY_MIGRATION_FLAG_KEY);
  if (migrationStatus) {
    // Já foi migrado para uma conta ou já foi finalizado. Não toca nas chaves para evitar vazamento cross-account.
    return { migrated: false, migratedKeys: [] };
  }

  // Verifica se o usuário atual já possui dados próprios de personagens
  const userCharactersKey = getUserStorageKey(BASE_STORAGE_KEYS.CHARACTERS, userId);
  const existingUserData = safeGetItem(userCharactersKey);
  if (existingUserData) {
    // O usuário já tem dados próprios, marca como finalizado para não poluir
    safeSetItem(LEGACY_MIGRATION_FLAG_KEY, userId);
    return { migrated: false, migratedKeys: [] };
  }

  const legacyMap: Record<string, string> = {
    [BASE_STORAGE_KEYS.CHARACTERS]: getUserStorageKey(BASE_STORAGE_KEYS.CHARACTERS, userId),
    [BASE_STORAGE_KEYS.ACTIVE_CHARACTER]: getUserStorageKey(BASE_STORAGE_KEYS.ACTIVE_CHARACTER, userId),
    [BASE_STORAGE_KEYS.ENCOUNTER]: getUserStorageKey(BASE_STORAGE_KEYS.ENCOUNTER, userId),
    [BASE_STORAGE_KEYS.BATTLEMAP_CONFIG]: getUserStorageKey(BASE_STORAGE_KEYS.BATTLEMAP_CONFIG, userId),
    [BASE_STORAGE_KEYS.BATTLEMAP_TOKENS]: getUserStorageKey(BASE_STORAGE_KEYS.BATTLEMAP_TOKENS, userId),
    [BASE_STORAGE_KEYS.AI_DM_CONFIG]: getUserStorageKey(BASE_STORAGE_KEYS.AI_DM_CONFIG, userId),
    [BASE_STORAGE_KEYS.AI_DM_HISTORY]: getUserStorageKey(BASE_STORAGE_KEYS.AI_DM_HISTORY, userId),
    [BASE_STORAGE_KEYS.AI_CAMPAIGN_SUMMARY]: getUserStorageKey(BASE_STORAGE_KEYS.AI_CAMPAIGN_SUMMARY, userId),
    [BASE_STORAGE_KEYS.LOCAL_CAMPAIGNS]: getUserStorageKey(BASE_STORAGE_KEYS.LOCAL_CAMPAIGNS, userId),
    [BASE_STORAGE_KEYS.ACTIVE_CAMPAIGN]: getUserStorageKey(BASE_STORAGE_KEYS.ACTIVE_CAMPAIGN, userId),
  };

  const migratedKeys: string[] = [];

  for (const [legacyKey, scopedKey] of Object.entries(legacyMap)) {
    const rawValue = safeGetItem(legacyKey);
    if (rawValue !== null && rawValue !== undefined) {
      // Grava na chave isolada do usuário
      safeSetItem(scopedKey, rawValue);
      // Remove da chave legada pública
      safeRemoveItem(legacyKey);
      migratedKeys.push(legacyKey);
    }
  }

  // Registra que a migração foi realizada com sucesso para este UID
  safeSetItem(LEGACY_MIGRATION_FLAG_KEY, userId);

  return { migrated: migratedKeys.length > 0, migratedKeys };
}
