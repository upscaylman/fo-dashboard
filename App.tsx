import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SplashScreen from './components/layout/SplashScreen';
import ChatAssistant from './components/dashboard/ChatAssistant';
import CommandPalette from './components/ui/CommandPalette';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { MobileMenuProvider } from './context/MobileMenuContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Composant interne pour gérer la logique d'affichage
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Gestion du Splash Screen au premier chargement
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen w-full bg-[#FDF8F6] dark:bg-slate-950 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden transition-colors duration-300 flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <Header />
      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <DashboardPage />
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