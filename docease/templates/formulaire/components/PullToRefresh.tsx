import React, { useEffect, useRef, useState } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, disabled = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 70;
  const MAX_PULL = 120;

  useEffect(() => {
    if (disabled) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Le conteneur scrollable est généralement le parent
    const scrollContainer = container.parentElement; 
    if (!scrollContainer) return;

    const handleTouchStart = (e: TouchEvent) => {
      // On ne commence le pull que si on est tout en haut du scroll
      if (scrollContainer.scrollTop <= 0) {
        touchStartY.current = e.touches[0].clientY;
        // On ne met pas encore isPulling à true, on attend le move
      } else {
        touchStartY.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === 0 || scrollContainer.scrollTop > 0) return;
      
      const touchY = e.touches[0].clientY;
      const dist = touchY - touchStartY.current;

      if (dist > 0) {
        // Si on tire vers le bas alors qu'on est en haut
        isPulling.current = true;
        
        // Empêcher le scroll natif (important sur Android Chrome pour éviter le conflit)
        if (e.cancelable) {
          e.preventDefault();
        }
        
        // Résistance exponentielle pour un feeling naturel
        const dampedDist = Math.min(dist * 0.4, MAX_PULL);
        setPullDistance(dampedDist);
      } else {
        // On scrolle vers le bas, on laisse faire
        isPulling.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (isPulling.current) {
        if (pullDistance > THRESHOLD) {
          setIsRefreshing(true);
          setPullDistance(THRESHOLD); // Snap à la position de chargement
          
          // Exécuter le refresh
          Promise.resolve(onRefresh()).finally(() => {
            setTimeout(() => {
              setIsRefreshing(false);
              setPullDistance(0);
            }, 500); // Petit délai pour voir l'animation de fin
          });
        } else {
          // Annuler si pas assez tiré
          setPullDistance(0);
        }
        isPulling.current = false;
        touchStartY.current = 0;
      }
    };

    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollContainer.addEventListener('touchend', handleTouchEnd);

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, onRefresh, disabled, isRefreshing]);

  return (
    <div className="relative min-h-full">
      {/* Indicateur de chargement */}
      <div 
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-10"
        style={{ 
          top: -40, // Position initiale cachée
          transform: `translateY(${pullDistance}px)`,
          opacity: Math.min(pullDistance / (THRESHOLD / 2), 1),
          transition: isPulling.current ? 'none' : 'transform 0.3s ease-out, opacity 0.3s'
        }}
      >
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#2f2f2f] shadow-lg border border-gray-100 dark:border-gray-700
          ${isRefreshing ? 'animate-spin' : ''}
        `}>
          {isRefreshing ? (
            <span className="material-icons text-[#a84383] text-xl">refresh</span>
          ) : (
            <span 
              className="material-icons text-[#a84383] text-xl transition-transform duration-200"
              style={{ transform: `rotate(${pullDistance > THRESHOLD ? 180 : 0}deg)` }}
            >
              arrow_downward
            </span>
          )}
        </div>
      </div>

      {/* Contenu principal déplaçable */}
      <div 
        ref={containerRef} 
        style={{ 
          transform: `translateY(${pullDistance}px)`, 
          transition: isPulling.current ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' 
        }}
      >
        {children}
      </div>
    </div>
  );
};
