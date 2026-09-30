import type { SyncMessage } from '../types/combat';

const CHANNEL_NAME = 'arcanasheet_rpg_sync';

let channel: BroadcastChannel | null = null;
const subscribers = new Set<(msg: SyncMessage) => void>();
let isListening = false;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!channel && 'BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {
      console.warn('BroadcastChannel não disponível, usando fallback local', e);
    }
  }
  return channel;
}

function ensureListening(): void {
  if (isListening) return;
  isListening = true;

  const ch = getChannel();
  if (ch) {
    ch.addEventListener('message', (event: MessageEvent<SyncMessage>) => {
      if (event.data && event.data.type) {
        subscribers.forEach((cb) => {
          try {
            cb(event.data);
          } catch (e) {
            console.error('[syncChannel] Erro em listener:', e);
          }
        });
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'arcanasheet_last_sync_event' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as SyncMessage;
          subscribers.forEach((cb) => {
            try {
              cb(parsed);
            } catch (e) {
              console.error('[syncChannel] Erro em listener de storage:', e);
            }
          });
        } catch {
          // ignore
        }
      }
    });
  }
}

/**
 * Envia uma mensagem para outras abas/janelas do app em tempo real
 */
export function broadcastSyncMessage(message: Omit<SyncMessage, 'timestamp'>): void {
  const fullMessage: SyncMessage = {
    ...message,
    timestamp: Date.now(),
  };

  const ch = getChannel();
  if (ch) {
    ch.postMessage(fullMessage);
  }

  // Fallback via localStorage event (desencadeia evento 'storage' em outras abas)
  try {
    localStorage.setItem('arcanasheet_last_sync_event', JSON.stringify(fullMessage));
  } catch {
    // ignore
  }
}

/**
 * Registra um ouvinte para mensagens sincronizadas através de um multiplexador
 * único para evitar vazamento de memória de EventTarget / BroadcastChannel.
 */
export function subscribeToSync(callback: (msg: SyncMessage) => void): () => void {
  ensureListening();
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
}
