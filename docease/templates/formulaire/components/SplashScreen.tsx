import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinished?: () => void;
  minDuration?: number; // Durée minimale d'affichage en ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinished, 
  minDuration = 1500 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Attendre la durée minimale puis commencer le fade out
    const timer = setTimeout(() => {
      setIsFading(true);
      
      // Attendre la fin de l'animation de fade avant de masquer
      setTimeout(() => {
        setIsVisible(false);
        onFinished?.();
      }, 500); // Durée du fade out
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onFinished]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#1e1e1e] via-[#2a2a2a] to-[#1e1e1e] transition-opacity duration-500 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-label="Chargement de DocEase"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, #aa4584 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6 px-8">
        {/* Logo animé */}
        <div className="relative">
          {/* Cercle de pulsation */}
          <div className="absolute inset-0 w-28 h-28 bg-[#aa4584]/20 rounded-3xl animate-ping" />
          
          {/* Logo principal avec image */}
          <div 
            className="relative w-28 h-28 bg-gradient-to-br from-[#aa4584] to-[#e062b1] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#aa4584]/30 animate-bounce-slow overflow-hidden"
          >
            <img 
              src="/assets/img/docEase_HD.png" 
              alt="DocEase Logo" 
              className="w-20 h-20 object-contain"
              onError={(e) => {
                // Fallback vers l'icône Material si l'image ne charge pas
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const icon = document.createElement('span');
                  icon.className = 'material-icons text-white text-5xl drop-shadow-lg';
                  icon.textContent = 'description';
                  parent.appendChild(icon);
                }
              }}
            />
          </div>
        </div>

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            Doc<span className="text-[#e062b1]">Ease</span>
          </h1>
          <p className="text-sm text-gray-400 uppercase tracking-[0.3em]">
            by FO Métaux
          </p>
        </div>

        {/* Barre de chargement */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-gradient-to-r from-[#aa4584] to-[#e062b1] rounded-full animate-loading-bar"
          />
        </div>

        {/* Texte de chargement */}
        <p className="text-gray-500 text-sm animate-pulse">
          Chargement...
        </p>
      </div>

      {/* Version */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-gray-600 text-xs">
          Version 2.0
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
