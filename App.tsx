import React, { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SplashScreen from './components/layout/SplashScreen';
import ChatAssistant from './components/dashboard/ChatAssistant';
import CommandPalette from './components/ui/CommandPalette';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { MobileMenuProvider } from './context/MobileMenuContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Composant bandeau d'impersonation
const ImpersonationBanner: React.FC = () => {
  const { user, realUser, isImpersonating, stopImpersonation } = useAuth();

  if (!isImpersonating || !realUser) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-between gap-4 shadow-lg z-50">
      <div className="flex items-center gap-3">
        <Eye className="w-5 h-5" />
        <span className="font-medium text-sm sm:text-base">
          <span className="hidden sm:inline">Vous visualisez l'interface en tant que </span>
          <strong>{user?.name}</strong>
          <span className="text-amber-100 ml-2 text-xs">({user?.role})</span>
        </span>
      </div>
      <button
        onClick={stopImpersonation}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
      >
        <X className="w-4 h-4" />
        <span className="hidden sm:inline">Revenir à mon compte</span>
        <span className="sm:hidden">Quitter</span>
      </button>
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
    <div className="min-h-screen w-full bg-[#FDF8F6] dark:bg-slate-950 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden transition-colors duration-300 flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <ImpersonationBanner />
      <Header onNavigate={navigateTo} />
      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {currentPath === '/profile' ? <ProfilePage /> : <DashboardPage />}
      </main>
      <Footer />
      <ChatAssistant />
      <CommandPalette />
    </div>
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