import { useState, useEffect } from 'react';

export const useDoceaseStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkHealth = async () => {
      const isFirstCheck = isOnline === null;

      if (!isFirstCheck) {
        setIsChecking(true);
      }

      try {
        // Vérifier le backend ngrok (comme dans DocEase Footer.tsx)
        // URL par défaut ou depuis variable d'environnement
        const ngrokBaseUrl = import.meta.env.VITE_DOCEASE_NGROK_URL || 'https://dee-wakeful-succulently.ngrok-free.dev';
        const healthUrl = `${ngrokBaseUrl}/api/health`;

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
        if (isMounted) {
          setIsOnline(false);
        }
      } finally {
        if (isMounted && !isFirstCheck) {
          setIsChecking(false);
        }
      }
    };

    // Vérifier après un court délai
    timeoutId = setTimeout(() => {
      checkHealth();
    }, 100);

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [isOnline]);

  return { isOnline, isChecking };
};
