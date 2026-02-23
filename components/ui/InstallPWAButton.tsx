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
        localStorage.setItem('fo-metaux-pwa-installed', 'true');
      }
    });
  }
  
  // Méthode 4: localStorage flag (défini après installation)
  return localStorage.getItem('fo-metaux-pwa-installed') === 'true';
};

export const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [osType, setOsType] = useState<OSType>('unknown');
  const [showInstructions, setShowInstructions] = useState(false);
  const hasPromptRef = useRef(false);

  useEffect(() => {
    console.log('🔧 InstallPWAButton: useEffect initial');
    
    // Vérifier si déjà installé
    if (checkIfInstalled()) {
      console.log('✅ PWA déjà installée');
      setIsInstalled(true);
      return;
    }

    // Vérifier si l'utilisateur a déjà refusé
    const dismissed = localStorage.getItem('fo-metaux-pwa-banner-dismissed');
    if (dismissed) {
      console.log('🚫 Banner déjà fermé par l\'utilisateur');
      return;
    }

    // Détecter l'OS
    const os = detectOS();
    console.log('🖥️ OS détecté:', os);
    setOsType(os);

    // Pour iOS, pas de beforeinstallprompt, afficher directement le banner
    if (os === 'ios') {
      console.log('📱 iOS détecté, affichage du banner dans 3s');
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Pour Android/Desktop, attendre le beforeinstallprompt
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      console.log('🎯 Event beforeinstallprompt reçu');
      e.preventDefault();
      setDeferredPrompt(e);
      hasPromptRef.current = true;
      setTimeout(() => {
        console.log('📢 Affichage du banner');
        setShowBanner(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      console.log('🎉 App installée avec succès');
      setIsInstalled(true);
      setShowBanner(false);
      setShowInstructions(false);
      setDeferredPrompt(null);
      localStorage.setItem('fo-metaux-pwa-installed', 'true');
      localStorage.removeItem('fo-metaux-pwa-banner-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Fallback: si pas de prompt après 5s sur desktop, afficher quand même
    const fallbackTimer = setTimeout(() => {
      if (!hasPromptRef.current && (os === 'android' || os === 'desktop' || os === 'unknown')) {
        console.log('⏰ Fallback: pas de beforeinstallprompt après 5s, affichage du banner');
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
    console.log('🔘 InstallPWAButton: handleInstallClick appelé', {
      hasDeferredPrompt: !!deferredPrompt,
      osType,
      showBanner,
      isInstalled
    });

    // Si on a un prompt natif (Chrome/Edge Android/Desktop), l'utiliser
    if (deferredPrompt) {
      console.log('📲 Tentative d\'installation via deferredPrompt...');
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ Installation acceptée');
          setIsInstalled(true);
          localStorage.setItem('fo-metaux-pwa-installed', 'true');
        } else {
          console.log('❌ Installation refusée');
        }
        
        setDeferredPrompt(null);
        setShowBanner(false);
      } catch (error) {
        console.error('❌ Erreur installation:', error);
        // En cas d'erreur, afficher les instructions manuelles
        console.log('📖 Affichage des instructions manuelles suite à l\'erreur');
        setShowInstructions(true);
      }
      return;
    }

    // Sinon, afficher les instructions selon l'OS
    console.log('📖 Pas de deferredPrompt, affichage des instructions pour', osType);
    setShowInstructions(true);
  };

  const handleDismiss = () => {
    console.log('❌ InstallPWAButton: handleDismiss appelé');
    setShowBanner(false);
    setShowInstructions(false);
    localStorage.setItem('fo-metaux-pwa-banner-dismissed', 'true');
  };

  // Ne rien afficher si déjà installé
  if (isInstalled) {
    console.log('ℹ️ InstallPWAButton: return null (déjà installé)');
    return null;
  }

  // Ne rien afficher si l'utilisateur a déjà fermé le banner
  if (!showBanner) {
    return null;
  }

  console.log('🎨 InstallPWAButton: render', { showInstructions, osType, hasDeferredPrompt: !!deferredPrompt });

  // Instructions détaillées selon l'OS
  if (showInstructions) {
    const instructions = {
      ios: {
        icon: <Smartphone className="w-6 h-6" />,
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
          'Sélectionnez "Installer TeamEase"',
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
        <div className="bg-gradient-to-r from-fo-red to-red-700 rounded-2xl shadow-2xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              {typeof instruction.icon === 'string' ? (
                <span className="text-2xl">{instruction.icon}</span>
              ) : (
                instruction.icon
              )}
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

  // Banner d'invitation à l'installation
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-red-800 to-red-950 rounded-2xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">Installer TeamEase</h3>
            <p className="text-sm text-white/80 mt-1">
              Ajoutez TeamEase à votre écran d'accueil pour un accès rapide
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
