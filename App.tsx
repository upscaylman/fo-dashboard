import React, { useState, useEffect, useCallback } from 'react';
import { Eye, X, AlertCircle } from 'lucide-react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SplashScreen from './components/layout/SplashScreen';
import ChatAssistant from './components/dashboard/ChatAssistant';
import CommandPalette from './components/ui/CommandPalette';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { MobileMenuProvider } from './context/MobileMenuContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Composant bandeau d'impersonation avec mode observation
const ImpersonationBanner: React.FC = () => {
  const { user, realUser, isImpersonating, stopImpersonation } = useAuth();

  if (!isImpersonating || !realUser) return null;

  // Vérifier si le vrai utilisateur est super_admin (mode observation)
  const isObservationMode = realUser.role === 'super_admin';

  return (
    <div className={`${isObservationMode ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} text-white px-4 py-2 flex items-center justify-between gap-4 shadow-lg z-50`}>
      <div className="flex items-center gap-3">
        <Eye className="w-5 h-5" />
        <span className="font-medium text-sm sm:text-base">
          {isObservationMode ? (
            <>
              <AlertCircle className="w-4 h-4 inline mr-1" />
              <span className="hidden sm:inline">Mode observation : </span>
              <strong>{user?.name}</strong>
              <span className="text-amber-100 ml-2 text-xs">({user?.role}) — Aucune interaction possible</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Vous visualisez l'interface en tant que </span>
              <strong>{user?.name}</strong>
              <span className="text-blue-100 ml-2 text-xs">({user?.role})</span>
            </>
          )}
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        data-impersonation-exit
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
      >
        <X className="w-4 h-4" />
        <span className="hidden sm:inline">Revenir à mon compte</span>
        <span className="sm:hidden">Quitter</span>
      </button>
    </div>
  );
};

// Composant de blocage global pour le mode observation
const ReadOnlyOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isImpersonating, realUser, stopImpersonation } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  // Mode observation = super_admin qui impersonne
  const isObservationMode = isImpersonating && realUser?.role === 'super_admin';
  
  // Gérer les clics - bloquer sauf pour les éléments autorisés
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isObservationMode) return;
    
    const target = e.target as HTMLElement;
    
    // Éléments autorisés :
    // 1. Bouton de sortie d'impersonation
    const isExitButton = target.closest('[data-impersonation-exit]') !== null;
    // 2. Navigation principale (Header)
    const isMainNavigation = target.closest('[data-navigation]') !== null || target.closest('header') !== null;
    // 3. Onglets du dashboard (Stats Tabs)
    const isTabNavigation = target.closest('[data-stats-tabs]') !== null;
    // 4. Sélecteur de période (filtre date)
    const isPeriodSelector = target.closest('[data-period-selector]') !== null;
    
    // Si c'est un élément autorisé, on laisse passer
    if (isExitButton || isMainNavigation || isTabNavigation || isPeriodSelector) {
      return;
    }
    
    // Sinon on bloque les éléments interactifs
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
    const isInteractive = interactiveElements.includes(target.tagName) || 
                         target.closest('button') || 
                         target.closest('a') ||
                         target.closest('input') ||
                         target.closest('[role="button"]') ||
                         target.classList.contains('cursor-pointer');
    
    if (isInteractive) {
      e.preventDefault();
      e.stopPropagation();
      setClickCount(prev => prev + 1);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 2500);
    }
  }, [isObservationMode]);
  
  if (!isObservationMode) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative" onClickCapture={handleClick}>
      {/* Contenu normal mais avec style désactivé pour les éléments non-navigation */}
      <div className="observation-mode">
        {children}
      </div>
      
      {/* Warning toast quand on essaie de cliquer */}
      {showWarning && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]">
          <div className="bg-amber-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex flex-col items-center gap-3 text-center animate-pulse">
            <Eye className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">Mode Observation</p>
              <p className="text-amber-100 text-sm mt-1">Aucune interaction n'est possible</p>
              <p className="text-amber-200 text-xs mt-2">Cliquez sur "Revenir à mon compte" pour quitter</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Indicateur visuel permanent en bas à droite */}
      <div className="fixed bottom-4 right-4 z-[9998] pointer-events-none">
        <div className="bg-amber-500/95 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium">
          <Eye className="w-4 h-4 animate-pulse" />
          <span>Mode Observation</span>
          {clickCount > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full ml-1">{clickCount} clics bloqués</span>}
        </div>
      </div>
      
      {/* Style CSS pour griser visuellement les éléments interactifs (sauf navigation et onglets) */}
      <style>{`
        .observation-mode button:not([data-impersonation-exit]):not([data-stats-tabs] button):not([data-period-selector] *):not(header button),
        .observation-mode input:not([data-period-selector] input),
        .observation-mode textarea,
        .observation-mode select:not([data-period-selector] select),
        .observation-mode main a,
        .observation-mode main [role="button"]:not([data-stats-tabs] [role="button"]) {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
        }
        /* Garder les onglets cliquables visuellement */
        [data-stats-tabs] button {
          opacity: 1 !important;
          cursor: pointer !important;
        }
        /* Garder le sélecteur de période cliquable mais ne pas forcer opacity sur le select transparent */
        [data-period-selector] label,
        [data-period-selector] span,
        [data-period-selector] svg {
          opacity: 1 !important;
          cursor: pointer !important;
        }
        /* Le select reste avec son opacity-0 original pour rester invisible */
        [data-period-selector] select {
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
};

// Composant interne pour gérer la logique d'affichage
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Gestion du Splash Screen au premier chargement
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Fonction de navigation personnalisée pour éviter le rechargement de page
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Gérer le bouton "Précédent" du navigateur
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F6] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-fo-red border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  // Routes publiques
  if (!isAuthenticated) {
    // Si l'utilisateur est sur '/' et non authentifié, on redirige vers /login pour la logique
    // (mais visuellement c'est la page de login)
    if (currentPath === '/' && window.location.pathname === '/') {
      // Optionnel: on pourrait forcer le path à /login
    }

    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigateTo} />;
    }
    // Par défaut, afficher Login pour toutes les autres routes non-auth
    return <LoginPage onNavigate={navigateTo} />;
  }

  return (
    <ReadOnlyOverlay>
      <div className="min-h-screen w-full bg-[#FDF8F6] dark:bg-slate-950 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden transition-colors duration-300 flex flex-col animate-[fadeIn_0.5s_ease-out]">
        <ImpersonationBanner />
        <Header onNavigate={navigateTo} data-navigation />
        <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
          {currentPath === '/profile' ? <ProfilePage /> : <DashboardPage />}
        </main>
        <Footer />
        <ChatAssistant />
        <CommandPalette />
      </div>
    </ReadOnlyOverlay>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ToastProvider>
        <AuthProvider>
          <BookmarkProvider>
            <MobileMenuProvider>
              <AppContent />
            </MobileMenuProvider>
          </BookmarkProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;