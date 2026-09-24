import { useState, useCallback } from 'react';
import type { CampaignHandout } from '../firebase/campaignSync';

export function useModalManager() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShortRestOpen, setIsShortRestOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);
  const [isEndSessionOpen, setIsEndSessionOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isHandoutModalOpen, setIsHandoutModalOpen] = useState(false);
  const [activeHandout, setActiveHandout] = useState<CampaignHandout | null>(null);
  const [isHandoutViewerOpen, setIsHandoutViewerOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [isAiDmOpen, setIsAiDmOpen] = useState(false);
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);
  const [isSpellCompendiumOpen, setIsSpellCompendiumOpen] = useState(false);
  const [isOnlineListPinned, setIsOnlineListPinnedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arcanasheet_online_list_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const setIsOnlineListPinned = useCallback((pinned: boolean) => {
    setIsOnlineListPinnedState(pinned);
    try {
      localStorage.setItem('arcanasheet_online_list_pinned', String(pinned));
    } catch {
      // ignore
    }
  }, []);

  const closeAllModals = useCallback(() => {
    setIsHistoryOpen(false);
    setIsShortRestOpen(false);
    setIsManagerOpen(false);
    setIsWizardOpen(false);
    setIsMultiplayerOpen(false);
    setIsEndSessionOpen(false);
    setIsCampaignModalOpen(false);
    setIsHandoutModalOpen(false);
    setIsHandoutViewerOpen(false);
    setIsPrintOpen(false);
    setIsChatOpen(false);
    setIsLevelUpOpen(false);
    setIsMusicPlayerOpen(false);
    setIsAiDmOpen(false);
    setIsBestiaryOpen(false);
    setIsSpellCompendiumOpen(false);
  }, []);

  return {
    isHistoryOpen,
    setIsHistoryOpen,
    isShortRestOpen,
    setIsShortRestOpen,
    isManagerOpen,
    setIsManagerOpen,
    isWizardOpen,
    setIsWizardOpen,
    isMultiplayerOpen,
    setIsMultiplayerOpen,
    isEndSessionOpen,
    setIsEndSessionOpen,
    isCampaignModalOpen,
    setIsCampaignModalOpen,
    isHandoutModalOpen,
    setIsHandoutModalOpen,
    activeHandout,
    setActiveHandout,
    isHandoutViewerOpen,
    setIsHandoutViewerOpen,
    isPrintOpen,
    setIsPrintOpen,
    isChatOpen,
    setIsChatOpen,
    isLevelUpOpen,
    setIsLevelUpOpen,
    isMusicPlayerOpen,
    setIsMusicPlayerOpen,
    isAiDmOpen,
    setIsAiDmOpen,
    isBestiaryOpen,
    setIsBestiaryOpen,
    isSpellCompendiumOpen,
    setIsSpellCompendiumOpen,
    isOnlineListPinned,
    setIsOnlineListPinned,
    closeAllModals,
  };
}
