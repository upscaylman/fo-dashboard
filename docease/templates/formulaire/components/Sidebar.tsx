import React, { useState, useEffect, memo } from 'react';
import { Template } from '../types';
import { OptimizedImage } from './OptimizedImage';

interface SidebarProps {
  templates: Template[];
  selectedTemplate: string | null;
  onSelect: (id: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onDesktopCollapseChange?: (collapsed: boolean) => void;
  showSuccess?: (message: string) => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({ templates, selectedTemplate, onSelect, isOpenMobile, setIsOpenMobile, onDesktopCollapseChange, showSuccess }) => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isButtonCompact, setIsButtonCompact] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Détecter le thème (light/dark)
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Notifier le parent quand l'état collapse change
  const handleToggleCollapse = () => {
    const newState = !isDesktopCollapsed;
    setIsDesktopCollapsed(newState);
    if (onDesktopCollapseChange) {
      onDesktopCollapseChange(newState);
    }
  };

  // Obtenir la description du template
  const getTemplateDescription = (templateId: string): string => {
    switch (templateId) {
      case 'designation':
        return 'Désignation de délégué syndical';
      case 'negociation':
        return 'Mandat de négociation collective';
      case 'convocations':
        return 'Convocations Bureau ou CA Fédérale';
      case 'circulaire':
        return 'Circulaire d\'informations';
      case 'custom':
        return 'Document personnalisé avec contenu IA';
      default:
        return '';
    }
  };

  // Handle click outside to close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpenMobile(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpenMobile]);

  // Timer pour compacter le bouton après 10s d'inactivité
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      setIsButtonCompact(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsButtonCompact(true);
      }, 10000); // 10 secondes
    };

    // Démarrer le timer au montage
    resetTimer();

    // Réinitialiser le timer sur toute interaction
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(timer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpenMobile(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky inset-y-0 md:top-0 left-0 z-[60] md:z-40
          bg-white dark:bg-[rgb(30,30,30)] border-r border-gray-100 dark:border-gray-800 shadow-2xl md:shadow-none
          transform transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isDesktopCollapsed ? 'w-[280px] md:w-[88px]' : 'w-[280px]'}
          flex flex-col h-dvh md:h-screen
        `}
        role="complementary"
        aria-label="Sélection de modèles de documents"
      >
        {/* Header avec Titre et Toggle Desktop */}
        <div className={`
          h-20 flex items-center border-b border-gray-100 dark:border-gray-800
          ${isDesktopCollapsed ? 'justify-center px-0' : 'justify-between px-6'}
        `}>
          {!isDesktopCollapsed && (
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 whitespace-nowrap overflow-hidden">
              <span className="material-icons text-[#aa4584] dark:text-[#e062b1]">dashboard</span>
              <span>Modèles</span>
            </h2>
          )}

          {/* Bouton Toggle Desktop (Changement d'icône) */}
          <button
            className="hidden md:flex p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
            onClick={handleToggleCollapse}
            title={isDesktopCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
            aria-label={isDesktopCollapsed ? "Ouvrir le menu" : "Réduire le menu"}
          >
            <span className="material-icons">
              {isDesktopCollapsed ? 'menu_open' : 'first_page'}
            </span>
          </button>

          {/* Bouton Close Mobile */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
            onClick={() => setIsOpenMobile(false)}
            aria-label="Fermer le menu des modèles"
          >
            <span className="material-icons" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Contenu de la liste */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{ overflow: isDesktopCollapsed ? 'visible' : undefined }} aria-label="Liste des modèles">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template.id);
                setIsOpenMobile(false);
                // En mode collapsed desktop : ne pas rouvrir, juste afficher un toast
                if (isDesktopCollapsed && showSuccess) {
                  showSuccess(`Modèle "${template.title}" sélectionné`);
                }
              }}
              className={`
                group relative cursor-pointer transition-all duration-300 w-full text-left
                ${isDesktopCollapsed
                  ? 'flex flex-col items-center justify-center p-2 rounded-xl'
                  : 'p-3 rounded-2xl border-2'}
                ${selectedTemplate === template.id
                  ? (isDesktopCollapsed
                      ? ''
                      : 'border-[#aa4584] dark:border-[#e062b1] bg-[#ffd8ec]/30 dark:bg-[#4a1a36]/50 shadow-md scale-[1.02]')
                  : (isDesktopCollapsed
                      ? ''
                      : 'border-[rgb(229,231,235)] dark:border-[rgb(55,65,81)] hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-gray-600')}
              `}
              aria-pressed={selectedTemplate === template.id}
              aria-label={`Sélectionner le modèle ${template.title}`}
            >
              {/* Conteneur Image (Rond si réduit, Rectangle 4/3 si étendu) */}
              <div className={`
                relative transition-all duration-300 overflow-hidden shadow-sm
                ${isDesktopCollapsed
                  ? 'w-10 h-10 rounded-full mb-0'
                  : 'aspect-[4/3] w-full rounded-xl mb-3'}
                ${isDesktopCollapsed
                  ? (selectedTemplate === template.id
                      ? 'ring-2 ring-[#aa4584] dark:ring-[#e062b1] ring-offset-2 dark:ring-offset-[#0f0f0f]'
                      : 'ring-2 ring-offset-2 dark:ring-offset-[#0f0f0f]')
                  : ''}
              `}
              style={isDesktopCollapsed && selectedTemplate !== template.id ? {
                '--tw-ring-color': isDarkMode ? 'rgb(229 231 235 / var(--tw-border-opacity, 1))' : 'rgba(0, 0, 0, 0.2)'
              } as React.CSSProperties : undefined}>
                <OptimizedImage
                  src={template.image}
                  alt={`Aperçu du modèle ${template.title}`}
                  className={`
                    w-full h-full object-cover transform transition-all duration-500
                    ${selectedTemplate === template.id
                      ? 'scale-100 grayscale-0 opacity-100'
                      : 'grayscale-[0.8] opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105'}
                  `}
                  loading="lazy"
                />

                {/* Overlay Checkmark (si sélectionné) */}
                {selectedTemplate === template.id && (
                  <div className="absolute inset-0 bg-[#aa4584]/20 flex items-center justify-center animate-[fadeIn_0.3s]" aria-hidden="true">
                    <div className={`
                      bg-[#aa4584] dark:bg-[#e062b1] rounded-full flex items-center justify-center shadow-lg
                      ${isDesktopCollapsed
                        ? 'w-5 h-5'
                        : 'w-8 h-8 animate-[bounce_0.5s_infinite_alternate]'}
                    `}>
                      <span className="material-icons text-white" style={{ fontSize: isDesktopCollapsed ? '14px' : '16px' }}>check</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Titre et Description du Template (Visible uniquement si étendu) */}
              {!isDesktopCollapsed && (
                <div className="flex flex-col items-center gap-1">
                  <h3 className={`
                    font-bold text-sm text-center transition-colors duration-300
                    whitespace-nowrap overflow-hidden text-ellipsis w-full
                    ${selectedTemplate === template.id
                      ? 'text-[#aa4584] dark:text-[#e062b1]'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'}
                  `}>
                    {template.title}
                  </h3>
                  <p className="text-xs text-center transition-colors duration-300 w-full px-2"
                     style={{ color: 'rgb(107 114 128 / var(--tw-text-opacity, 1))' }}>
                    {getTemplateDescription(template.id)}
                  </p>
                </div>
              )}

              {/* Tooltip au survol (Visible uniquement si réduit ET non sélectionné) */}
              {isDesktopCollapsed && selectedTemplate !== template.id && (
                <div className={`
                  absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-800 text-white dark:text-[rgb(156,163,175)] text-xs rounded-lg transition-all duration-200 whitespace-nowrap z-[9999] shadow-xl pointer-events-none transform
                  opacity-0 invisible translate-x-[-10px] group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
                `}>
                  {template.title}
                  {/* Flèche du tooltip */}
                  <div className="absolute top-1/2 right-full -translate-y-1/2 -mr-[1px] border-8 border-transparent border-r-gray-800"></div>
                </div>
              )}

              {/* Flèche indicatrice pour le template sélectionné (sans tooltip) */}
              {isDesktopCollapsed && selectedTemplate === template.id && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1 pointer-events-none">
                  <div className="border-8 border-transparent border-l-[#aa4584] dark:border-l-[#e062b1]"></div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {isDesktopCollapsed ? (
          /* Logo FO Métaux si fermé */
          <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center">
            <img
              src={isDarkMode ? "/assets/img/navBar_titleImage@2x (2).png" : "/assets/img/navBar_titleImage@2x_nb.png"}
              alt="FO Métaux"
              className="w-10 h-10 object-contain"
            />
          </div>
        ) : (
          /* Texte d'information si ouvert */
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]" role="status" aria-live="polite">
            <p className="text-xs text-center text-gray-400">
              Sélectionnez un modèle pour commencer
            </p>
          </div>
        )}
      </aside>

      {/* Mobile Toggle Button (Fixed Bottom) */}
      {!isOpenMobile && (
        <button
          onClick={() => setIsOpenMobile(true)}
          className={`
            md:hidden fixed bottom-6 left-6 z-40 bg-[rgb(168,67,131)] dark:bg-[rgb(166,65,130)] text-white shadow-xl ring-2 ring-[rgb(168,67,131)] dark:ring-[rgb(168,67,131)]
            flex items-center justify-center hover:scale-105
            ${isButtonCompact
              ? 'w-14 h-14 rounded-full p-0'
              : 'w-auto h-14 rounded-full px-5'
            }
          `}
          style={{
            transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s, transform 0.2s ease'
          }}
          aria-label="Ouvrir le menu des modèles"
        >
           <span
             className="material-icons flex-shrink-0"
             aria-hidden="true"
             style={{
               fontSize: '24px'
             }}
           >
             dashboard
           </span>
           <span
             className="font-bold whitespace-nowrap overflow-hidden"
             style={{
               maxWidth: isButtonCompact ? '0px' : '100px',
               opacity: isButtonCompact ? 0 : 1,
               marginLeft: isButtonCompact ? '0px' : '8px',
               transition: 'opacity 0.15s ease, max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1) 0.05s, margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1) 0.05s'
             }}
           >
             Modèles
           </span>
        </button>
      )}
    </>
  );
};

// Mémoriser le composant pour éviter les re-renders inutiles
export const Sidebar = memo(SidebarComponent);