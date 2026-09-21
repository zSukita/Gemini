import type { SyncMessage } from '../types/combat';

const CHANNEL_NAME = 'arcanasheet_rpg_sync';

let channel: BroadcastChannel | null = null;

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

/**
 * Envia uma mensagem para outras abas/janelas do app em tempo real
 */
export function broadcastSyncMessage(message: Omit<SyncMessage, 'timestamp'>) {
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
 * Registra um ouvinte para mensagens sincronizadas
 */
export function subscribeToSync(callback: (msg: SyncMessage) => void): () => void {
  const ch = getChannel();

  const handleBroadcast = (event: MessageEvent<SyncMessage>) => {
    if (event.data && event.data.type) {
      callback(event.data);
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'arcanasheet_last_sync_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue) as SyncMessage;
        callback(parsed);
      } catch {
        // ignore
      }
    }
  };

  if (ch) {
    ch.addEventListener('message', handleBroadcast);
  }
  window.addEventListener('storage', handleStorage);

  return () => {
    if (ch) {
      ch.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}
