import { useEffect } from 'react';

interface GlobalShortcutsOptions {
  onEscape?: () => void;
  onToggleMusic?: () => void;
  onToggleDiceHistory?: () => void;
}

export function useGlobalShortcuts({
  onEscape,
  onToggleMusic,
  onToggleDiceHistory,
}: GlobalShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em campos de texto
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (isInput) return;

      // Atalhos quando não estiver em inputs
      if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onToggleMusic?.();
      } else if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        onToggleDiceHistory?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onToggleMusic, onToggleDiceHistory]);
}
