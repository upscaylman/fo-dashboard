import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Phase 1: Affichage fixe
    const timer1 = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    // Phase 2: Fin de l'animation de sortie
    const timer2 = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#FDF8F6] dark:bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Logo Animation */}
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-fo-red rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="bg-gradient-to-br from-fo-red to-red-700 p-6 rounded-3xl shadow-2xl relative z-10 animate-[bounce_2s_infinite]">
                <Globe className="w-16 h-16 text-white" />
            </div>
        </div>

        {/* Text Animation */}
        <div className="text-center space-y-2 animate-[fadeIn_1s_ease-out]">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                FO Métaux
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
                Portail Secrétaires & Militants
            </p>
        </div>

        {/* Loading Bar */}
        <div className="mt-12 w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-fo-red rounded-full animate-[loading_2s_ease-in-out_infinite] w-full origin-left"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;