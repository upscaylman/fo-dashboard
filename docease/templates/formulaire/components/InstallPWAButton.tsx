import React, { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const hasPromptRef = useRef(false);

  useEffect(() => {
    // Détection si l'app est déjà installée (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;

    if (isStandalone) {
      console.log('📱 App is running in standalone mode (PWA installed)');
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem('docease-pwa-banner-dismissed');
    if (dismissed) return;

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Sur iOS, on ne peut pas détecter si l'app est installée quand on est dans Safari
      // On affiche la bannière après un délai si on n'est pas en standalone
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      console.log('👋 beforeinstallprompt fired');
      e.preventDefault();
      setDeferredPrompt(e);
      hasPromptRef.current = true;
      setTimeout(() => setShowBanner(true), 3000);
    };

    const handleAppInstalled = () => {
      console.log('✅ App installed');
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Suppression du fallback timer qui forçait l'affichage sur Android même si installé
    // Sur Android, si l'app est installée, beforeinstallprompt ne se déclenche pas,
    // donc on ne doit PAS afficher la bannière manuellement.

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      alert('Pour installer l\'application :\n\n1. Ouvrez le menu de votre navigateur (⋮)\n2. Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') console.log('✅ Installation acceptée');
    } catch (error) {
      console.error('Erreur installation:', error);
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem('docease-pwa-banner-dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;
  if (localStorage.getItem('docease-pwa-banner-dismissed')) return null;

  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="rounded-2xl shadow-2xl p-4 text-white" style={{ background: 'linear-gradient(to right, #e062b1, #aa4584)' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">Installation sur iPhone/iPad</h3>
              <ol className="text-sm text-white/90 mt-2 space-y-1 list-decimal list-inside">
                <li>Appuyez sur <strong>Partager</strong> <span className="inline-block w-5 h-5 bg-white/20 rounded text-center text-xs leading-5">↑</span></li>
                <li>Appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
                <li>Appuyez sur <strong>Ajouter</strong></li>
              </ol>
            </div>
            <button onClick={handleDismiss} className="text-white/60 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <button onClick={handleDismiss} className="w-full mt-4 px-4 py-2.5 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30">J'ai compris</button>
        </div>
        <style>{`@keyframes slide-up{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}.animate-slide-up{animation:slide-up .4s cubic-bezier(.16,1,.3,1) forwards}`}</style>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="rounded-2xl shadow-2xl p-4 text-white" style={{ background: 'linear-gradient(to right, #e062b1, #aa4584)' }}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">Installer DocEase</h3>
            <p className="text-sm text-white/80 mt-1">
              Ajoutez DocEase à votre écran d'accueil pour un accès rapide
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Plus tard
          </button>
          <button
            onClick={handleInstallClick}
            className="flex-1 px-4 py-2.5 bg-white text-fuchsia-800 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Installer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWAButton;
