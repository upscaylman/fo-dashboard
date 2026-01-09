import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinished?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinished, 
  minDuration = 1500 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      
      setTimeout(() => {
        setIsVisible(false);
        onFinished?.();
      }, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onFinished]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #FFFBFF 0%, #FFDAD4 50%, #FFFBFF 100%)'
      }}
      role="status"
      aria-label="Chargement de SignEase"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, #B71C1C 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6 px-8">
        {/* Logo animé */}
        <div className="relative">
          {/* Cercle de pulsation */}
          <div className="absolute inset-0 w-28 h-28 bg-primary/20 rounded-3xl animate-ping" />
          
          {/* Logo principal avec image */}
          <div 
            className="relative w-28 h-28 bg-gradient-to-br from-primary to-error rounded-3xl flex items-center justify-center shadow-2xl animate-bounce-slow overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(183, 28, 28, 0.3)' }}
          >
            <img 
              src="/signEase_HD.png" 
              alt="SignEase Logo" 
              className="w-20 h-20 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('span');
                  fallback.className = 'text-5xl';
                  fallback.textContent = '✍️';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </div>

        {/* Titre */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-onBackground tracking-tight mb-2">
            Sign<span className="text-primary">Ease</span>
          </h1>
          <p className="text-sm text-onSurfaceVariant uppercase tracking-[0.3em]">
            by FO Métaux
          </p>
        </div>

        {/* Barre de chargement */}
        <div className="w-48 h-1.5 bg-outline/20 rounded-full overflow-hidden mt-4">
          <div 
            className="h-full bg-gradient-to-r from-primary to-error rounded-full animate-loading-bar"
          />
        </div>

        {/* Texte de chargement */}
        <p className="text-onSurfaceVariant text-sm animate-pulse">
          Chargement...
        </p>
      </div>

      {/* Version */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-outline text-xs">
          Signature Électronique
        </p>
      </div>

      {/* Styles pour les animations */}
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 100%; margin-left: 0%; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
