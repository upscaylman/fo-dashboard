import React, { useEffect, useState } from 'react';

interface UpdateNotificationProps {
  checkInterval?: number; // Intervalle de vérification en ms (défaut: 5 minutes)
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ 
  checkInterval = 5 * 60 * 1000 // 5 minutes par défaut
}) => {
  const [showNotification, setShowNotification] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  // Fonction pour obtenir le hash de la version actuelle
  const getCurrentVersionHash = async (): Promise<string> => {
    try {
      // On utilise le timestamp du fichier index.html comme version
      const response = await fetch('/index.html', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const lastModified = response.headers.get('last-modified');
      const etag = response.headers.get('etag');
      return etag || lastModified || Date.now().toString();
    } catch (error) {
      console.error('Erreur lors de la vérification de version:', error);
      return Date.now().toString();
    }
  };

  // Vérifier si une nouvelle version est disponible
  const checkForUpdates = async () => {
    const newVersion = await getCurrentVersionHash();
    
    if (currentVersion === null) {
      // Première vérification, on enregistre la version actuelle
      setCurrentVersion(newVersion);
      localStorage.setItem('app_version', newVersion);
    } else if (newVersion !== currentVersion) {
      // Nouvelle version détectée
      const notificationShown = sessionStorage.getItem('update_notification_shown');
      
      if (!notificationShown) {
        setShowNotification(true);
        sessionStorage.setItem('update_notification_shown', 'true');
      }
    }
  };

  // Gérer le clic sur OK
  const handleUpdate = () => {
    // Vider le cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Vider le localStorage de la version
    localStorage.removeItem('app_version');
    
    // Rafraîchir la page en forçant le rechargement depuis le serveur
    window.location.reload();
  };

  // Initialiser et démarrer la vérification périodique
  useEffect(() => {
    // Récupérer la version stockée au démarrage
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion) {
      setCurrentVersion(storedVersion);
    }

    // Première vérification immédiate
    checkForUpdates();

    // Vérification périodique
    const interval = setInterval(checkForUpdates, checkInterval);

    // Vérification lors du focus de la fenêtre
    const handleFocus = () => {
      checkForUpdates();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentVersion, checkInterval]);

  if (!showNotification) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 animate-scaleIn">
        {/* Icône */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#aa4584] to-[#dd60b0] rounded-full flex items-center justify-center animate-bounce">
            <span className="material-icons text-white text-4xl">system_update</span>
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
          Nouvelle version disponible ! 🎉
        </h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-8">
          Une mise à jour de l'application est disponible. Cliquez sur "Mettre à jour" pour profiter des dernières améliorations.
        </p>

        {/* Bouton */}
        <button
          onClick={handleUpdate}
          className="w-full bg-gradient-to-r from-[#aa4584] to-[#dd60b0] text-white font-bold py-4 px-6 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span className="material-icons">refresh</span>
          Mettre à jour maintenant
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

