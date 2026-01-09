import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

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
    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Vérifier si déjà fermé
    const dismissed = localStorage.getItem('fo-metaux-pwa-banner-dismissed');
    if (dismissed) {
      return;
    }

    // Détecter iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Sur iOS, afficher le bandeau après 3 secondes
    if (isIOSDevice) {
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      hasPromptRef.current = true;
      setTimeout(() => setShowBanner(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Afficher le bandeau après 5 secondes (fallback)
    const fallbackTimer = setTimeout(() => {
      if (!hasPromptRef.current) {
        setShowBanner(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    // Sur iOS, afficher les instructions
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback: ouvrir dans un nouvel onglet pour suggérer l'installation manuelle
      alert('Pour installer l\'application :\n\n1. Ouvrez le menu de votre navigateur (⋮)\n2. Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ Installation acceptée');
      }
    } catch (error) {
      console.error('Erreur installation:', error);
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    localStorage.setItem('fo-metaux-pwa-banner-dismissed', 'true');
  };

  if (isInstalled) {
    return null;
  }

  if (!showBanner) {
    return null;
  }

  if (localStorage.getItem('fo-metaux-pwa-banner-dismissed')) {
    return null;
  }

  // Instructions spécifiques iOS
  if (showIOSInstructions) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-fo-red to-red-700 rounded-2xl shadow-2xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">Installation sur iPhone/iPad</h3>
              <ol className="text-sm text-white/90 mt-2 space-y-1 list-decimal list-inside">
                <li>Appuyez sur le bouton <strong>Partager</strong> <span className="inline-block w-5 h-5 bg-white/20 rounded text-center text-xs leading-5">↑</span></li>
                <li>Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
                <li>Appuyez sur <strong>Ajouter</strong></li>
              </ol>
            </div>
            <button 
              onClick={handleDismiss}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full mt-4 px-4 py-2.5 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            J'ai compris
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-red-800 to-red-950 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">Installer FO Métaux</h3>
            <p className="text-sm text-white/80 mt-1">
              Ajoutez le portail à votre écran d'accueil pour un accès rapide
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
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
            className="flex-1 px-4 py-2.5 bg-white text-fo-red rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Installer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default InstallPWAButton;
