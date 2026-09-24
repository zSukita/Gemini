/**
 * Utilitário de Síntese de Voz (Text-to-Speech) para o Mestre IA.
 * Utiliza a Web Speech API nativa dos navegadores e Electron,
 * garantindo funcionamento 100% gratuito e offline, sem consumir tokens de API.
 */

const STORAGE_KEY_AUTO_VOICE = 'arcanasheet_auto_voice_narration';

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
  return next;
}

/**
 * Remove formatações Markdown, emojis e anotações mecânicas
 * para que a leitura em voz alta soe fluida e dramática.
 */
export function cleanNarrativeForSpeech(text: string): string {
  if (!text) return '';

  return text
    // Remove cabeçalhos Markdown (# Título)
    .replace(/^#+\s+/gm, '')
    // Remove negrito e itálico (*texto* ou **texto**)
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    // Remove tags de código (`código`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [texto](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove anotações entre colchetes mecânicos [ROLAGEM...]
    .replace(/\[.*?\]/g, '')
    // Remove citações em bloco (> frase)
    .replace(/^>\s+/gm, '')
    // Remove emojis e caracteres gráficos complexos
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    // Substitui quebras múltiplas por pausa natural
    .replace(/\n+/g, ' ')
    // Limpa espaços duplicados
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Obtém a melhor voz em Português disponível no sistema operacional
 */
export function getPortugueseVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Prioriza vozes pt-BR naturais ou padrão do Windows/Google/Edge
  const ptBr = voices.find((v) => v.lang.toLowerCase().includes('pt-br') || v.lang.toLowerCase().includes('pt_br'));
  if (ptBr) return ptBr;

  const ptGeneric = voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
  return ptGeneric || voices[0] || null;
}

/**
 * Fala o texto narrativo fornecido usando a voz do Mestre
 */
export function speakNarrative(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err?: unknown) => void;
  }
): boolean {
  if (!isSpeechSynthesisSupported()) return false;

  const cleaned = cleanNarrativeForSpeech(text);
  if (!cleaned) return false;

  try {
    // Interrompe qualquer áudio em andamento antes de começar
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.02; // Cadência narrativa natural
    utterance.pitch = 0.95; // Tom ligeiramente grave de narrador

    const voice = getPortugueseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    if (callbacks?.onStart) {
      utterance.onstart = () => callbacks.onStart?.();
    }
    if (callbacks?.onEnd) {
      utterance.onend = () => callbacks.onEnd?.();
    }
    if (callbacks?.onError) {
      utterance.onerror = (e) => callbacks.onError?.(e);
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    callbacks?.onError?.(err);
    return false;
  }
}

/**
 * Interrompe qualquer narração de voz em andamento
 */
export function stopNarrativeVoice(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}

/**
 * Verifica se a síntese de voz está falando no momento
 */
export function isNarrativeSpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
}
