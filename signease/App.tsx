import React, { lazy, Suspense, useState, useEffect } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

// ⏱️ Diagnostic
(window as any).__PERF?.mark('App.tsx module chargé');
import { SplashScreen } from "./components/SplashScreen";
import { ToastProvider } from "./components/Toast";
import { UserProvider, useUser } from "./components/UserContext";
import Header from "./components/Header";

// Lazy load des composants non-critiques pour le premier rendu
const LoginPage = lazy(() => import("./pages/LoginPage"));
const InstallPWAButton = lazy(() => import("./components/InstallPWAButton").then(m => ({ default: m.InstallPWAButton })));
const VersionUpdateBanner = lazy(() => import("./components/VersionUpdateBanner"));

// Vérification Firebase différée (pas bloquant)
if (typeof window !== 'undefined') {
  requestIdleCallback?.(() => import("./utils/firebaseCheck"), { timeout: 10000 });
}

// Lazy load des pages lourdes (PDF, signature, etc.)
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PrepareDocumentPage = lazy(() => import("./pages/PrepareDocumentPage"));
const QuickSignPage = lazy(() => import("./pages/QuickSignPage"));
const SignDocumentPage = lazy(() => import("./pages/SignDocumentPage"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const VerifyPage = lazy(() => import("./pages/VerifyPage"));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage"));
const DeleteUserDataPage = lazy(() => import("./pages/DeleteUserDataPage"));

// Lazy load des composants secondaires
const CookieBanner = lazy(() => import("./components/CookieBanner"));
const Footer = lazy(() => import("./components/Footer"));
const PresenceTracker = lazy(() => import("./components/PresenceTracker").then(m => ({ default: m.PresenceTracker })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
  </div>
);

const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser, isLoading } = useUser();
  const location = useLocation();
  
  // ⏱️ Diagnostic - mesurer le premier rendu
  useEffect(() => {
    (window as any).__PERF?.mark('AppContent monté (1er rendu React)');
  }, []);
  
  // Splash screen au premier chargement
  const [showSplash, setShowSplash] = useState(() => {
    const hasShownSplash = sessionStorage.getItem('signease-splash-shown');
    return !hasShownSplash;
  });
  
  const handleSplashFinished = () => {
    setShowSplash(false);
    sessionStorage.setItem('signease-splash-shown', 'true');
  };

  // Vérifier si on est sur une route /sign/:token
  const isSigningRoute = location.pathname.startsWith("/sign/");

  if (isLoading) {
    return (
      <>
        {showSplash && <SplashScreen onFinished={handleSplashFinished} minDuration={800} />}
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <p className="mt-4 text-onSurfaceVariant">Chargement...</p>
          </div>
        </div>
      </>
    );
  }

  // Afficher la page de connexion SEULEMENT si pas d'utilisateur ET pas sur une route /sign/:token
  if (!currentUser && !isSigningRoute) {
    return (
      <>
        {showSplash && <SplashScreen onFinished={handleSplashFinished} minDuration={800} />}
        <Suspense fallback={null}>
          <LoginPage
            onSubmit={(email) => setCurrentUser({ email })}
          />
        </Suspense>
        <Suspense fallback={null}><InstallPWAButton /></Suspense>
      </>
    );
  }

  // Vérifier si on est sur une page qui doit afficher le Footer
  const shouldShowFooter = location.pathname === "/dashboard" || location.pathname === "/verify" || location.pathname === "/cookies";

  // Si utilisateur, afficher l'app
  return (
    <>
      {showSplash && <SplashScreen onFinished={handleSplashFinished} minDuration={800} />}
      {currentUser && <Header />}
      {currentUser && <Suspense fallback={null}><PresenceTracker /></Suspense>}
      <main className="flex-grow animate-fade-in page-transition">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/prepare" element={<PrepareDocumentPage />} />
          <Route path="/quick-sign" element={<QuickSignPage />} />
          {/* Route /sign/:token accessible SANS authentification - SignDocumentPage fera l'auto-login */}
          <Route path="/sign/:token" element={<SignDocumentPage />} />
          {/* Route /sign/view pour les documents envoyés (token dans sessionStorage, pas dans l'URL) */}
          <Route path="/sign/view" element={<SignDocumentPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/admin/delete-user-data" element={<DeleteUserDataPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
        </Suspense>
      </main>
      {currentUser && shouldShowFooter && <Suspense fallback={null}><Footer /></Suspense>}
      {currentUser && <Suspense fallback={null}><CookieBanner /></Suspense>}
      <Suspense fallback={null}><InstallPWAButton /></Suspense>
    </>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <ToastProvider>
        <HashRouter>
          <div className="min-h-screen bg-background text-onBackground flex flex-col">
            <AppContent />
            <Suspense fallback={null}><VersionUpdateBanner /></Suspense>
          </div>
        </HashRouter>
      </ToastProvider>
    </UserProvider>
  );
};

export default App;
