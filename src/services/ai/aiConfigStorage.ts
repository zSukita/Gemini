import type { AiDmConfig, AiMessage, AiProvider } from '../../types/aiDm';

export const API_KEY_STORAGE_KEY = 'arcanasheet_gemini_api_key';
export const GROQ_API_KEY_STORAGE_KEY = 'arcanasheet_groq_api_key';
export const PROVIDER_STORAGE_KEY = 'arcanasheet_ai_provider';
export const CONFIG_STORAGE_KEY = 'arcanasheet_ai_dm_config';
export const CHAT_HISTORY_STORAGE_KEY = 'arcanasheet_ai_dm_history';
export const CAMPAIGN_SUMMARY_STORAGE_KEY = 'arcanasheet_ai_campaign_summary';
export const GROQ_ACTIVE_MODEL_STORAGE_KEY = 'arcanasheet_groq_active_model';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_POLLINATIONS_MODEL = 'openai';

export const DEFAULT_MODEL = DEFAULT_GEMINI_MODEL;

export function getStoredGroqModel(): string {
  if (typeof localStorage !== 'undefined') {
    const m = localStorage.getItem(GROQ_ACTIVE_MODEL_STORAGE_KEY);
    if (m && m.trim()) return m.trim();
  }
  return DEFAULT_GROQ_MODEL;
}

export function saveStoredGroqModel(model: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(GROQ_ACTIVE_MODEL_STORAGE_KEY, model.trim());
  }
}

/**
 * Consulta a lista de modelos ativos e acessíveis para a chave da Groq
 */
export async function fetchActiveGroqModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data: Array<{ id: string }> = json.data || [];
    return data
      .map((d) => d.id)
      .filter(
        (id) =>
          !id.includes('whisper') &&
          !id.includes('guard') &&
          !id.includes('vision') &&
          !id.includes('embedding')
      );
  } catch (err) {
    console.warn('Erro ao consultar modelos ativos no Groq:', err);
    return [];
  }
}

/**
 * Seleciona o melhor modelo disponível para texto e narrativa
 */
export function pickBestGroqModel(availableModels: string[]): string {
  const preferred = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'qwen/qwen3.6-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ];
  for (const p of preferred) {
    if (availableModels.includes(p)) return p;
  }
  const gptOss = availableModels.find((m) => m.includes('gpt-oss'));
  if (gptOss) return gptOss;
  const llama = availableModels.find((m) => m.includes('llama'));
  if (llama) return llama;
  const qwen = availableModels.find((m) => m.includes('qwen'));
  if (qwen) return qwen;

  return availableModels[0] || DEFAULT_GROQ_MODEL;
}

export function getStoredAiProvider(): AiProvider {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY) as AiProvider;
    if (stored && (stored === 'groq' || stored === 'gemini' || stored === 'pollinations')) {
      return stored;
    }
    // Se tiver chave Groq salva, default para groq
    if (localStorage.getItem(GROQ_API_KEY_STORAGE_KEY)?.trim()) {
      return 'groq';
    }
  }
  return 'groq'; // Recomenda Groq como primeira opção padrão
}

export function saveStoredAiProvider(provider: AiProvider): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  }
}

export function getStoredGroqApiKey(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(GROQ_API_KEY_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  }
  const envKey = (import.meta as unknown as { env?: { VITE_GROQ_API_KEY?: string } }).env?.VITE_GROQ_API_KEY;
  return envKey?.trim() || '';
}

export function saveStoredGroqApiKey(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(GROQ_API_KEY_STORAGE_KEY, key.trim());
  }
}

export const DEFAULT_AI_CONFIG: AiDmConfig = {
  provider: 'groq',
  apiKey: '',
  groqApiKey: '',
  model: DEFAULT_GROQ_MODEL,
  tone: 'heroic',
  customInstructions: '',
  includeCharacterStats: true,
  campaignSummary: '',
};

export function getStoredApiKey(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  }
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY;
  return envKey?.trim() || '';
}

export function saveStoredApiKey(key: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  }
}

export function getStoredCampaignSummary(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(CAMPAIGN_SUMMARY_STORAGE_KEY) || '';
    }
  } catch {
    // fallback
  }
  return '';
}

export function saveStoredCampaignSummary(summary: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CAMPAIGN_SUMMARY_STORAGE_KEY, summary.trim());
    }
  } catch (err) {
    console.error('Falha ao salvar resumo da campanha', err);
  }
}

export function getStoredAiConfig(): AiDmConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      const provider = getStoredAiProvider();
      const groqKey = getStoredGroqApiKey();
      const geminiKey = getStoredApiKey();

      if (raw) {
        const parsed = JSON.parse(raw);
        // Migra automaticamente modelos descontinuados pelo Google (2.5, 2.0, 1.5, 1.0)
        const isInvalidOrDeprecated =
          !parsed.model ||
          parsed.model.includes('2.5') ||
          parsed.model.includes('2.0') ||
          parsed.model.includes('1.5') ||
          parsed.model.includes('1.0');
        
        const isGeminiModel = typeof parsed.model === 'string' && parsed.model.startsWith('gemini');
        const activeProvider: AiProvider = parsed.provider || (isGeminiModel ? 'gemini' : provider);
        let model = parsed.model;
        if (isInvalidOrDeprecated && (activeProvider === 'gemini' || isGeminiModel)) {
          model = DEFAULT_GEMINI_MODEL;
        }
        if (!model) {
          model = activeProvider === 'groq' ? DEFAULT_GROQ_MODEL : DEFAULT_GEMINI_MODEL;
        }

        if (isInvalidOrDeprecated && (activeProvider === 'gemini' || isGeminiModel) && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ ...parsed, model: DEFAULT_GEMINI_MODEL }));
          } catch {
            // ignore
          }
        }

        return {
          ...DEFAULT_AI_CONFIG,
          ...parsed,
          provider: activeProvider,
          apiKey: geminiKey,
          groqApiKey: groqKey,
          model,
          campaignSummary: parsed.campaignSummary ?? getStoredCampaignSummary(),
        };
      }
    }
  } catch (err) {
    console.error('Falha ao ler configuração da IA', err);
  }
  return {
    ...DEFAULT_AI_CONFIG,
    provider: getStoredAiProvider(),
    apiKey: getStoredApiKey(),
    groqApiKey: getStoredGroqApiKey(),
  };
}

export function saveStoredAiConfig(config: AiDmConfig): void {
  try {
    const { apiKey, groqApiKey, provider, ...rest } = config;
    if (apiKey !== undefined) {
      saveStoredApiKey(apiKey);
    }
    if (groqApiKey !== undefined) {
      saveStoredGroqApiKey(groqApiKey);
    }
    if (provider !== undefined) {
      saveStoredAiProvider(provider);
    }
    if (config.campaignSummary !== undefined) {
      saveStoredCampaignSummary(config.campaignSummary);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ ...rest, provider }));
    }
  } catch (err) {
    console.error('Falha ao salvar configurações do Mestre IA', err);
  }
}

export function getStoredChatHistory(): AiMessage[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveStoredChatHistory(history: AiMessage[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
  } catch (err) {
    console.error('Falha ao salvar histórico da aventura com a IA', err);
  }
}

export function clearStoredChatHistory(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
  }
}
