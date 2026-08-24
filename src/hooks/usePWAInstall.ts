import { useState, useEffect, useCallback } from 'react';

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type InstallStatus = 'installed' | 'prompted' | 'ios' | 'unsupported' | 'dismissed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Listen for the native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    // 4. Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsInstructionModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallStatus> => {
    if (isInstalled) {
      setIsInstructionModalOpen(true);
      return 'installed';
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsInstallable(false);
          return 'prompted';
        } else {
          return 'dismissed';
        }
      } catch (err) {
        console.error('Error prompting PWA install:', err);
        setIsInstructionModalOpen(true);
        return 'unsupported';
      }
    }

    // Fallback for iOS or browsers without native beforeinstallprompt
    setIsInstructionModalOpen(true);
    return isIOS ? 'ios' : 'unsupported';
  }, [deferredPrompt, isInstalled, isIOS]);

  const closeInstructionModal = useCallback(() => {
    setIsInstructionModalOpen(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isInstructionModalOpen,
    promptInstall,
    closeInstructionModal,
    openInstructionModal: () => setIsInstructionModalOpen(true)
  };
}
