import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  onPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
  hasData: boolean;
  sidebarWidth?: number;
}

export const Header: React.FC<HeaderProps> = ({ onPreview, onDownload, onShare, hasData, sidebarWidth = 280 }) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5 shadow-sm transition-all duration-300"
      style={{
        left: isDesktop ? `${sidebarWidth}px` : '0px',
      }}
      role="banner"
    >
      <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo Area */}
        <div className="flex items-center gap-4 group cursor-pointer">
          <div
            className="w-12 h-12 bg-gradient-to-br from-[#aa4584] to-[#e062b1] rounded-2xl flex items-center justify-center shadow-lg shadow-[#aa4584]/20 transform group-hover:scale-110 transition-transform duration-300"
            role="img"
            aria-label="Logo DocEase"
          >
             <span className="material-icons text-white text-2xl drop-shadow-lg" aria-hidden="true">description</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-gray-900 dark:text-white">Doc</span>
              <span className="text-[#aa4584] dark:text-[#e062b1]">Ease</span>
            </h1>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest hidden sm:block">by FO Métaux</span>
          </div>
        </div>

        {/* Action Buttons */}
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Actions principales">
          {/* Prévisualiser - Desktop uniquement */}
          <Button
            variant="primary"
            icon="visibility"
            label="Prévisualiser"
            onClick={onPreview}
            disabled={!hasData}
            className="hidden md:inline-flex"
            aria-label="Prévisualiser le document"
          />

          {/* Télécharger - Desktop uniquement */}
          <Button
            variant="secondary"
            icon="download"
            label="Télécharger"
            onClick={onDownload}
            disabled={!hasData}
            className="hidden md:inline-flex"
            aria-label="Télécharger le document PDF"
          />

          {/* Partager - Toujours visible */}
          <Button
            variant="outlined"
            icon="share"
            label="Partager"
            onClick={onShare}
            disabled={!hasData}
            className="hidden sm:inline-flex"
            aria-label="Partager le document par email"
          />
          {/* Bouton partager mobile */}
          <button
            onClick={onShare}
            disabled={!hasData}
            className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2f2f2f] text-[#aa4584] dark:text-[#e062b1] disabled:opacity-50 transition-all hover:scale-105"
            aria-label="Partager le document par email"
            title="Partager"
          >
            <span className="material-icons" aria-hidden="true">share</span>
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

          {/* User Menu */}
          <UserMenu />
        </nav>
      </div>
    </header>
  );
};
