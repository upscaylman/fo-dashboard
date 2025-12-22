import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // null = pas encore vérifié
  const [isChecking, setIsChecking] = useState(false);

  // Vérifier si le tunnel ngrok est actif (asynchrone, non-bloquant)
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkHealth = async () => {
      // Ne pas afficher "checking" si c'est la première vérification
      const isFirstCheck = isOnline === null;

      if (!isFirstCheck) {
        setIsChecking(true);
      }

      try {
        // Extraire l'URL de base depuis CONFIG.WEBHOOK_PDF_CONVERT_URL
        // Ex: "https://xxxx.ngrok-free.app/api/convert-pdf" -> "https://xxxx.ngrok-free.app"
        const baseUrl = CONFIG.WEBHOOK_PDF_CONVERT_URL.replace(/\/api\/convert-pdf$/, '');
        const healthUrl = `${baseUrl}/api/health`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': '1'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (isMounted) {
          if (response.ok) {
            const data = await response.json();
            setIsOnline(data.status === 'ok');
          } else {
            setIsOnline(false);
          }
        }
      } catch (error) {
        // Silencieux en console pour ne pas polluer
        if (isMounted) {
          setIsOnline(false);
        }
      } finally {
        if (isMounted && !isFirstCheck) {
          setIsChecking(false);
        }
      }
    };

    // Vérifier après un court délai pour ne pas bloquer le rendu initial
    timeoutId = setTimeout(() => {
      checkHealth();
    }, 100);

    // Puis vérifier toutes les 30 secondes
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [isOnline]);

  return (
    <footer className="bg-[#2a2a2a] text-white py-6 border-t border-white/10 mt-auto">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-xs text-gray-400">
            <span>Site réalisé par FO Métaux</span>
            <span className="hidden md:inline text-white/20">•</span>
            <span className="flex items-center gap-1">
              <span className="material-icons text-[14px]">copyright</span>
              {currentYear} FO Métaux. Tous droits réservés
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <span
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  isOnline === null
                    ? 'bg-gray-500 opacity-50'
                    : isChecking
                      ? 'bg-yellow-500 animate-pulse'
                      : isOnline
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-red-500'
                }`}
                title={
                  isOnline === null
                    ? 'Initialisation...'
                    : isChecking
                      ? 'Vérification...'
                      : isOnline
                        ? 'Serveur en ligne'
                        : 'Serveur hors ligne'
                }
              ></span>
              <span className="text-[10px] text-gray-300 font-mono transition-opacity duration-300">
                v2.9.1 •{' '}
                {isOnline === null ? (
                  <span className="opacity-50">...</span>
                ) : isChecking ? (
                  'Checking...'
                ) : isOnline ? (
                  'Online'
                ) : (
                  'Offline'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
