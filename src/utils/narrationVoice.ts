/**
 * Utilitário de Síntese de Voz (Text-to-Speech) para o Mestre IA.
 * Utiliza a Web Speech API nativa dos navegadores e Electron,
 * garantindo funcionamento 100% gratuito e offline, sem consumir tokens de API.
 * 
 * Inclui:
 * - Fila inteligente de reprodução (Speech Queue): não corta frases anteriores ao receber novos dados/mensagens
 * - Divisão em sentenças (Chunking): contorna o bug crônico do Chromium/Electron que trava após 15 segundos
 * - Filtro de narrabilidade: evita narrar relatórios mecânicos crus (movimento, dados puros, avisos de sistema)
 * - Modos de narração configuráveis ('story_only' vs 'all')
 */

const STORAGE_KEY_AUTO_VOICE = 'arcanasheet_auto_voice_narration';
const STORAGE_KEY_VOICE_MODE = 'arcanasheet_voice_narration_mode';

export type VoiceNarrationMode = 'story_only' | 'all';

export interface SpeakOptions {
  id?: string;
  interrupt?: boolean; // Se true, interrompe imediatamente o áudio atual e limpa a fila. Se false (padrão), enfileira suavemente
  queue?: boolean;     // Se true ou quando interrupt é false, adiciona à fila
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: unknown) => void;
}

interface QueueItem {
  id?: string;
  originalText: string;
  sentences: string[];
  options: SpeakOptions;
}

// Estado interno da fila de síntese
let speechQueue: QueueItem[] = [];
let isProcessingQueue = false;
let currentSpeakingId: string | null = null;
let activeKeepAliveTimer: ReturnType<typeof setInterval> | null = null;
const stateListeners: Set<(isSpeaking: boolean, id: string | null) => void> = new Set();

function notifyStateListeners(isSpeaking: boolean, id: string | null) {
  stateListeners.forEach((listener) => {
    try {
      listener(isSpeaking, id);
    } catch {
      // ignore
    }
  });
}

export function onSpeakingStateChange(
  listener: (isSpeaking: boolean, id: string | null) => void
): () => void {
  stateListeners.add(listener);
  listener(isNarrativeSpeaking(), currentSpeakingId);
  return () => {
    stateListeners.delete(listener);
  };
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function isAutoNarrationEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_AUTO_VOICE) === 'true';
  } catch {
    return false;
  }
}

export function setAutoNarrationEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_VOICE, String(enabled));
  } catch {
    // ignore
  }
}

export function toggleAutoNarration(): boolean {
  const next = !isAutoNarrationEnabled();
  setAutoNarrationEnabled(next);
  if (!next) {
    stopNarrativeVoice();
  }
  return next;
}

export function getVoiceNarrationMode(): VoiceNarrationMode {
  if (typeof localStorage === 'undefined') return 'story_only';
  try {
    const mode = localStorage.getItem(STORAGE_KEY_VOICE_MODE);
    return mode === 'all' ? 'all' : 'story_only';
  } catch {
    return 'story_only';
  }
}

export function setVoiceNarrationMode(mode: VoiceNarrationMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_MODE, mode);
  } catch {
    // ignore
  }
}

export function toggleVoiceNarrationMode(): VoiceNarrationMode {
  const current = getVoiceNarrationMode();
  const next: VoiceNarrationMode = current === 'story_only' ? 'all' : 'story_only';
  setVoiceNarrationMode(next);
  return next;
}

/**
 * Remove formatações Markdown, emojis, marcadores de prompt e cálculos mecânicos crus
 * para que a leitura em voz alta soe fluida, dramática e imersiva.
 */
export function cleanNarrativeForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text
    // Remove tags de menção ao Mestre / IA
    .replace(/@mestre\b/gi, '')
    .replace(/@ia\b/gi, '')
    .replace(/@dm\b/gi, '')
    .replace(/\/mestre\b/gi, '')
    .replace(/\/ia\b/gi, '')
    // Remove cabeçalhos Markdown (# Título)
    .replace(/^#+\s+/gm, '')
    // Remove negrito e itálico (*texto* ou **texto**)
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
    // Remove tags de código (`código`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [texto](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove blocos de comandos internos entre colchetes mecânicos [RESULTADO DO ATAQUE:...] ou [ROLAGEM...]
    .replace(/\[(?:ROLAGEM|RESULTADO|SALVAGUARDA|TESTE|DANO|ATAQUE)[^\]]*\]/gi, '')
    // Remove anotações matemáticas de dados crus ex: [1d20+4] = 18 ou [2d6] = 8
    .replace(/\[\d+d\d+[^\]]*\]\s*=\s*\d+/gi, '')
    .replace(/\[\d+d\d+[^\]]*\]/gi, '')
    // Substitui abreviações comuns de D&D por pronúncia natural
    .replace(/\b(\d+)\s*PVs?\b/gi, '$1 pontos de vida')
    .replace(/\bPVs?\b/gi, 'pontos de vida')
    .replace(/\bCA\s*(\d+)\b/gi, 'classe de armadura $1')
    .replace(/\bCD\s*(\d+)\b/gi, 'classe de dificuldade $1')
    .replace(/\bD&D\b/gi, 'D and D')
    // Remove citações em bloco (> frase)
    .replace(/^>\s+/gm, '')
    // Remove emojis e caracteres gráficos complexos
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    // Substitui quebras múltiplas por pausa natural
    .replace(/\n+/g, ' ')
    // Limpa espaços duplicados
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Se restou apenas símbolos ou pontuação, descarta
  if (!/[a-zA-Z0-9À-ÿ]/.test(cleaned)) {
    return '';
  }

  return cleaned;
}

/**
 * Divide textos longos em sentenças naturais (máx ~180 caracteres cada).
 * Isso contorna o problema do Chromium/Electron que trava áudios longos após 15 segundos.
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];

  // Quebra por pontuação terminal (. ! ? ; ou quebra de linha)
  const rawParts = text.match(/[^.!?;\n]+[.!?;\n]+|[^.!?;\n]+$/g) || [text];
  const results: string[] = [];

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.length > 180) {
      // Divide por vírgula ou espaço caso a oração seja longa demais
      const subParts = trimmed.match(/.{1,160}(?:[,\s]|$)/g) || [trimmed];
      for (const sp of subParts) {
        const subTrimmed = sp.trim();
        if (subTrimmed) results.push(subTrimmed);
      }
    } else {
      results.push(trimmed);
    }
  }

  return results.length > 0 ? results : [text.trim()];
}

/**
 * Identifica se uma mensagem de chat é narrável pelo Mestre IA,
 * descartando logs puramente mecânicos (movimento, dados isolados, avisos de sistema).
 */
export function isNarratableMessage(msg: {
  text: string;
  type?: string;
  senderName?: string;
  diceRoll?: unknown;
}): boolean {
  if (!msg || !msg.text) return false;

  const raw = msg.text.trim();
  if (!raw) return false;

  // Erros de sistema ou alertas técnicos
  if (
    raw.startsWith('🔮 O Mestre hesitou') ||
    raw.startsWith('⚠️ O Mestre IA precisa de configuração')
  ) {
    return false;
  }

  // Logs mecânicos automáticos de combate e mapa tático
  if (
    /^⚠️\s*\*\*Reforços Inimigos:/i.test(raw) ||
    /^👣\s*\*\*Movimentação:/i.test(raw) ||
    /^💀\s*\*\*Derrota:/i.test(raw) ||
    /^⏳\s*\*\*Turno de/i.test(raw) ||
    /^🎲\s*\*\*Iniciativa/i.test(raw) ||
    /^Rolou em segredo:/i.test(raw)
  ) {
    return false;
  }

  // Comandos de prompt técnico enviados pelo jogador
  if (
    raw.startsWith('@mestre [RESULTADO DO ATAQUE]') ||
    raw.startsWith('@mestre [SALVAGUARDA CONTRA A MORTE]')
  ) {
    return false;
  }

  // Relatórios de rolagem e ataque mecânico de monstros (ex: "⚔️ Carniçal desferiu Mordida... 🎲 Rolagem de Ataque:")
  if (
    raw.includes('🎲 **Rolagem de Ataque:') ||
    raw.includes('Rolagem de Ataque:') ||
    /^⚔️\s*\*\*[^*]+\*\*\s*desferiu/i.test(raw)
  ) {
    return false;
  }

  // Anúncios curtos puramente mecânicos de acerto/erro/dano sem prosa narrativa
  if (
    (raw.startsWith('🎯 ACERTOU!') ||
      raw.startsWith('💥 ACERTO CRÍTICO!') ||
      raw.startsWith('❌ ERROU!') ||
      raw.startsWith('💨 FALHA CRÍTICA') ||
      raw.startsWith('🩸 FALHA NA SALVAGUARDA') ||
      raw.startsWith('✨ SUCESSO NA SALVAGUARDA')) &&
    !raw.toLowerCase().includes('descreva') &&
    raw.length < 180
  ) {
    return false;
  }

  // Se após limpeza não houver conteúdo verbal válido
  const cleaned = cleanNarrativeForSpeech(raw);
  return cleaned.length >= 4;
}

/**
 * Obtém a melhor voz em Português disponível no sistema operacional
 */
export function getPortugueseVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Prioriza vozes pt-BR naturais ou padrão do Windows/Google/Edge
  const ptBr = voices.find(
    (v) => v.lang.toLowerCase().includes('pt-br') || v.lang.toLowerCase().includes('pt_br')
  );
  if (ptBr) return ptBr;

  const ptGeneric = voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
  return ptGeneric || voices[0] || null;
}

function startKeepAlive() {
  stopKeepAlive();
  activeKeepAliveTimer = setInterval(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }
  }, 10000);
}

function stopKeepAlive() {
  if (activeKeepAliveTimer) {
    clearInterval(activeKeepAliveTimer);
    activeKeepAliveTimer = null;
  }
}

/**
 * Processa a fila de fala item por item, sentença por sentença
 */
function processQueue() {
  if (!isSpeechSynthesisSupported()) {
    speechQueue = [];
    isProcessingQueue = false;
    currentSpeakingId = null;
    notifyStateListeners(false, null);
    return;
  }

  if (speechQueue.length === 0) {
    isProcessingQueue = false;
    currentSpeakingId = null;
    stopKeepAlive();
    notifyStateListeners(false, null);
    return;
  }

  isProcessingQueue = true;
  const currentItem = speechQueue[0];
  currentSpeakingId = currentItem.id || null;
  notifyStateListeners(true, currentSpeakingId);
  startKeepAlive();

  playSentences(
    currentItem.sentences,
    0,
    currentItem.options,
    () => {
      // Sentenças do item atual concluídas com sucesso
      currentItem.options.onEnd?.();
      speechQueue.shift();
      processQueue();
    },
    (err) => {
      currentItem.options.onError?.(err);
      speechQueue.shift();
      processQueue();
    }
  );
}

/**
 * Executa uma lista de sentenças sequencialmente
 */
function playSentences(
  sentences: string[],
  index: number,
  options: SpeakOptions,
  onComplete: () => void,
  onFailure: (err?: unknown) => void
) {
  if (index >= sentences.length) {
    onComplete();
    return;
  }

  const sentence = sentences[index];
  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = 'pt-BR';
  utterance.rate = options.rate ?? 1.02;
  utterance.pitch = options.pitch ?? 0.95;

  const voice = getPortugueseVoice();
  if (voice) {
    utterance.voice = voice;
  }

  let hasEnded = false;

  utterance.onstart = () => {
    if (index === 0) {
      options.onStart?.();
    }
  };

  utterance.onend = () => {
    if (hasEnded) return;
    hasEnded = true;
    playSentences(sentences, index + 1, options, onComplete, onFailure);
  };

  utterance.onerror = (e) => {
    // Erros de interrupção intencional não devem quebrar o fluxo
    if (e.error === 'interrupted' || e.error === 'canceled') {
      return;
    }
    if (hasEnded) return;
    hasEnded = true;
    onFailure(e);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    onFailure(err);
  }
}

/**
 * Fala o texto narrativo fornecido usando a voz do Mestre.
 * Por padrão enfileira o texto sem cortar falas anteriores, a menos que `interrupt: true`.
 */
export function speakNarrative(
  text: string,
  optionsOrCallbacks?:
    | SpeakOptions
    | {
        onStart?: () => void;
        onEnd?: () => void;
        onError?: (err?: unknown) => void;
      }
): boolean {
  if (!isSpeechSynthesisSupported()) return false;

  const cleaned = cleanNarrativeForSpeech(text);
  if (!cleaned) return false;

  const sentences = splitIntoSentences(cleaned);
  if (sentences.length === 0) return false;

  const options: SpeakOptions = optionsOrCallbacks || {};
  const shouldInterrupt = options.interrupt === true;

  if (shouldInterrupt) {
    // Interrupção manual explícita (ex: clique no botão parar ou nova mensagem do usuário)
    stopNarrativeVoice();
  }

  // Limite de segurança na fila para não acumular atrasos excessivos
  if (speechQueue.length >= 6) {
    speechQueue = speechQueue.slice(-2);
  }

  speechQueue.push({
    id: options.id,
    originalText: text,
    sentences,
    options,
  });

  if (!isProcessingQueue) {
    processQueue();
  }

  return true;
}

/**
 * Interrompe qualquer narração de voz em andamento e esvazia a fila
 */
export function stopNarrativeVoice(): void {
  if (!isSpeechSynthesisSupported()) return;
  speechQueue = [];
  isProcessingQueue = false;
  currentSpeakingId = null;
  stopKeepAlive();
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
  notifyStateListeners(false, null);
}

/**
 * Verifica se a síntese de voz está falando no momento
 */
export function isNarrativeSpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return isProcessingQueue || window.speechSynthesis.speaking;
}

/**
 * Retorna o ID da mensagem que está sendo falada no momento
 */
export function getCurrentSpeakingId(): string | null {
  return currentSpeakingId;
}

