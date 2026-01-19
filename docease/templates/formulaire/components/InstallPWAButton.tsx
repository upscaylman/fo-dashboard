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

type OSType = 'ios' | 'android' | 'desktop' | 'unknown';

const detectOS = (): OSType => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  if (/android/.test(userAgent)) {
    return 'android';
  }
  if (/windows|mac|linux/.test(userAgent)) {
    return 'desktop';
  }
  return 'unknown';
};

const checkIfInstalled = (): boolean => {
  // Méthode 1: display-mode standalone (PWA lancée)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Méthode 2: iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  // Méthode 3: Vérifier si déjà installé via getInstalledRelatedApps
  if ('getInstalledRelatedApps' in navigator) {
    (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
      if (apps.length > 0) {
        localStorage.setItem('docease-pwa-installed', 'true');
      }
    });
  }
  
  // Méthode 4: localStorage flag (défini après installation)
  return localStorage.getItem('docease-pwa-installed') === 'true';
};

export const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [osType, setOsType] = useState<OSType>('unknown');
  const [showInstructions, setShowInstructions] = useState(false);
  const hasPromptRef = useRef(false);

  useEffect(() => {
    // Détecter l'OS en premier
    const os = detectOS();
    setOsType(os);

    // Vérifier si déjà installé
    if (checkIfInstalled()) {
      console.log('📱 App is running in standalone mode (PWA installed)');
      setIsInstalled(true);
      return;
    }

    // Vérifier si l'utilisateur a déjà refusé
    const dismissed = localStorage.getItem('docease-pwa-banner-dismissed');
    if (dismissed) return;

    // Pour iOS, pas de beforeinstallprompt, afficher directement le banner
    if (os === 'ios') {
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Pour Android/Desktop, attendre le beforeinstallprompt
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
      setShowInstructions(false);
      setDeferredPrompt(null);
      localStorage.setItem('docease-pwa-installed', 'true');
      localStorage.removeItem('docease-pwa-banner-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Fallback: si pas de prompt après 5s sur desktop, afficher quand même
    const fallbackTimer = setTimeout(() => {
      if (!hasPromptRef.current && osType !== 'ios') {
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
    // Si on a un prompt natif (Chrome/Edge Android/Desktop), l'utiliser
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ Installation acceptée');
          setIsInstalled(true);
          localStorage.setItem('docease-pwa-installed', 'true');
        } else {
          console.log('❌ Installation refusée');
        }
        
        setDeferredPrompt(null);
        setShowBanner(false);
      } catch (error) {
        console.error('Erreur installation:', error);
        // En cas d'erreur, afficher les instructions manuelles
        setShowInstructions(true);
      }
      return;
    }

    // Sinon, afficher les instructions selon l'OS
    setShowInstructions(true);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowInstructions(false);
    localStorage.setItem('docease-pwa-banner-dismissed', 'true');
  };

  // Ne rien afficher si déjà installé
  if (isInstalled) return null;
  
  // Ne rien afficher si l'utilisateur a déjà fermé le banner
  if (!showBanner) return null;

  // Instructions détaillées selon l'OS
  if (showInstructions) {
    const instructions = {
      ios: {
        icon: '📱',
        title: 'Installation sur iPhone/iPad',
        steps: [
          'Appuyez sur le bouton Partager en bas de Safari',
          'Faites défiler et appuyez sur "Sur l\'écran d\'accueil"',
          'Appuyez sur "Ajouter" en haut à droite',
        ],
      },
      android: {
        icon: '🤖',
        title: 'Installation sur Android',
        steps: [
          'Ouvrez le menu du navigateur (⋮ en haut à droite)',
          'Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
          'Confirmez l\'installation',
        ],
      },
      desktop: {
        icon: '💻',
        title: 'Installation sur ordinateur',
        steps: [
          'Cliquez sur l\'icône d\'installation dans la barre d\'adresse',
          'Ou ouvrez le menu du navigateur (⋮)',
          'Sélectionnez "Installer DocEase"',
        ],
      },
      unknown: {
        icon: '📲',
        title: 'Installation',
        steps: [
          'Ouvrez le menu de votre navigateur',
          'Recherchez "Installer" ou "Ajouter à l\'écran d\'accueil"',
          'Suivez les instructions à l\'écran',
        ],
      },
    };

    const instruction = instructions[osType];

    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
        <div className="rounded-2xl shadow-2xl p-4 text-white" style={{ background: 'linear-gradient(to right, #e062b1, #aa4584)' }}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              {instruction.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{instruction.title}</h3>
              <ol className="text-sm text-white/90 mt-2 space-y-2 list-decimal list-inside">
                {instruction.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
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
          <button 
            onClick={handleDismiss} 
            className="w-full mt-4 px-4 py-2.5 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            J'ai compris
          </button>
        </div>
        <style>{`@keyframes slide-up{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}.animate-slide-up{animation:slide-up .4s cubic-bezier(.16,1,.3,1) forwards}`}</style>
      </div>
    );
  }

  // Banner d'invitation à l'installation
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
            {deferredPrompt ? 'Installer maintenant' : 'Comment installer'}
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
