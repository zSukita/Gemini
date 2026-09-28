/**
 * Utilitário de Armazenamento Seguro (Safe LocalStorage)
 * Protege contra erros de cota (QuotaExceededError), ambientes restritos
 * ou falhas de parse de JSON, garantindo que o app nunca trave por problemas de persistência.
 */

export function isLocalStorageAvailable(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const testKey = '__arcanasheet_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Salva com segurança um valor em texto no localStorage.
 * Trata QuotaExceededError limpando chaves temporárias dispensáveis se necessário.
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof localStorage === 'undefined') return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: unknown) {
    const isQuotaError =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014);

    if (isQuotaError) {
      console.warn('[SafeStorage] Limite de armazenamento local atingido! Purgando caches temporários...');
      tryPruneTemporaryData();
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.error('[SafeStorage] Não foi possível salvar mesmo após limpeza:', retryErr);
        return false;
      }
    }

    console.warn(`[SafeStorage] Falha ao gravar chave "${key}":`, err);
    return false;
  }
}

/**
 * Lê com segurança um valor do localStorage
 */
export function safeGetItem(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Falha ao ler chave "${key}":`, err);
    return null;
  }
}

/**
 * Remove com segurança uma chave do localStorage
 */
export function safeRemoveItem(key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Falha ao remover chave "${key}":`, err);
  }
}

/**
 * Salva um objeto serializado em JSON com proteção contra falhas
 */
export function safeSetJson<T>(key: string, data: T): boolean {
  try {
    const serialized = JSON.stringify(data);
    return safeSetItem(key, serialized);
  } catch (err) {
    console.warn(`[SafeStorage] Falha ao serializar JSON para "${key}":`, err);
    return false;
  }
}

/**
 * Lê e desserializa um objeto JSON com fallback seguro
 */
export function safeGetJson<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Falha ao desserializar JSON de "${key}", retornando fallback:`, err);
    return fallback;
  }
}

/**
 * Remove chaves de cache, eventos e históricos secundários temporários
 * para liberar espaço caso o disco/cota esteja no limite.
 */
function tryPruneTemporaryData(): void {
  if (typeof localStorage === 'undefined') return;

  const expendableKeys = [
    'arcanasheet_last_sync_event',
    'arcanasheet_dice_roll_history',
    'arcanasheet_temp_handouts',
  ];

  for (const k of expendableKeys) {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }

  // Se o histórico de IA for muito grande, trunca mantendo as últimas 20 mensagens
  try {
    const historyKey = 'arcanasheet_ai_dm_history';
    const raw = localStorage.getItem(historyKey);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 20) {
        localStorage.setItem(historyKey, JSON.stringify(list.slice(-20)));
      }
    }
  } catch {
    // ignore
  }
}
