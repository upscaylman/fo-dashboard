/**
 * Page de connexion DocEase - Material Design 3 Expressive
 * Authentification avec validation @fo-metaux.fr
 */

import React, { useState, useEffect } from 'react';
import { useDoceaseAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, validateEmail, error, isLoading } = useDoceaseAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showNameField, setShowNameField] = useState(false);

  // Réinitialiser l'erreur locale quand l'email change
  useEffect(() => {
    setLocalError(null);
  }, [email]);

  const handleEmailBlur = () => {
    if (email) {
      const validation = validateEmail(email);
      if (!validation.valid) {
        setLocalError(validation.error || null);
      } else {
        setLocalError(null);
        setShowNameField(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Valider l'email
    const validation = validateEmail(email);
    if (!validation.valid) {
      setLocalError(validation.error || 'Email invalide');
      return;
    }

    // Tenter la connexion
    const success = await login(email, name || undefined);
    if (success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-[#fdf2f8] via-white to-gray-50 dark:from-[#1e1e1e] dark:via-[#2f2f2f] dark:to-[#1e1e1e]">
      
      {/* Colonne Gauche - Visuel (Caché sur mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background avec image et overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#aa4584] via-[#aa4584]/90 to-[#e062b1]/80"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white/10 rounded-full animate-[float_8s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-40 right-20 w-24 h-24 border-2 border-white/10 rounded-2xl rotate-45 animate-[float_6s_ease-in-out_infinite]"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-xl animate-[float_4s_ease-in-out_infinite]"></div>
          
          {/* Light rays */}
          <div className="absolute top-0 left-1/3 w-1 h-full bg-gradient-to-b from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-0.5 h-full bg-gradient-to-b from-transparent via-white/5 to-transparent transform skew-x-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 p-12 xl:p-16 flex flex-col justify-between h-full text-white">
          {/* Logo et Titre */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-white/15 backdrop-blur-xl p-3 rounded-xl flex items-center justify-center shadow-lg shadow-black/20 border border-white/20 transition-transform hover:scale-110">
                <span className="material-icons text-white text-3xl">description</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">DocEase</h1>
                <p className="text-sm text-white/70">by FO Métaux</p>
              </div>
            </div>
            
            <h2 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Générez vos documents<br />
              <span className="text-white/80">en toute simplicité</span>
            </h2>
            <p className="text-lg text-white/70 max-w-md leading-relaxed">
              La solution de génération automatique de courriers professionnels, 
              assistée par intelligence artificielle.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 group">
              <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <span className="material-icons text-green-300 text-xl">auto_awesome</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">IA Intégrée</h3>
                <p className="text-sm text-white/60">Rédaction assistée par IA</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 group">
              <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <span className="material-icons text-blue-300 text-xl">bolt</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Ultra Rapide</h3>
                <p className="text-sm text-white/60">Génération en quelques clics</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300 group">
              <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <span className="material-icons text-purple-300 text-xl">folder_special</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Modèles Prêts</h3>
                <p className="text-sm text-white/60">Courriers types personnalisables</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne Droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Background pattern subtil */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#aa4584]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e062b1]/15 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Mobile Header */}
          <div className="text-center lg:text-left">
            <div className="inline-flex lg:hidden bg-gradient-to-br from-[#aa4584] to-[#e062b1] p-3 rounded-xl shadow-lg shadow-[#aa4584]/30 mb-6">
              <span className="material-icons text-white text-3xl">description</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenue</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Connectez-vous pour créer vos courriers.
            </p>
          </div>

          {/* Message d'erreur */}
          {displayError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl animate-[shake_0.5s_ease-in-out]">
              <span className="material-icons text-red-500 dark:text-red-400 mt-0.5">error_outline</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">Erreur d'authentification</h3>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">{displayError}</p>
              </div>
              <button
                onClick={() => setLocalError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                Adresse email professionnelle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <span className="material-icons text-gray-400 dark:text-gray-500 text-xl">email</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl leading-5 bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#aa4584]/20 focus:border-[#aa4584] dark:focus:ring-[#e062b1]/20 dark:focus:border-[#e062b1] hover:border-[#aa4584]/50 dark:hover:border-[#e062b1]/50 shadow-sm hover:shadow-md transition-all"
                  placeholder="prenom.nom@fo-metaux.fr"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Champ nom (affiché après validation email) */}
            {showNameField && (
              <div className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                  Votre nom (optionnel)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <span className="material-icons text-gray-400 dark:text-gray-500 text-xl">person</span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl leading-5 bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-[#aa4584]/20 focus:border-[#aa4584] dark:focus:ring-[#e062b1]/20 dark:focus:border-[#e062b1] hover:border-[#aa4584]/50 dark:hover:border-[#e062b1]/50 shadow-sm hover:shadow-md transition-all"
                    placeholder="Prénom Nom"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              Accès réservé aux membres FO Métaux (@fo-metaux.fr)
            </p>

            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full h-14 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
                isLoading || !email
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#aa4584] to-[#e062b1] hover:from-[#993d77] hover:to-[#d050a0] shadow-lg shadow-[#aa4584]/30 hover:shadow-xl hover:shadow-[#aa4584]/40 hover:-translate-y-0.5 btn-docease-shine'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <span className="material-icons text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-[#fdf2f8] via-white to-gray-50 dark:from-[#1e1e1e] dark:via-[#2f2f2f] dark:to-[#1e1e1e] text-gray-500 dark:text-gray-400">Comment ça marche ?</span>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-[#aa4584]/10 dark:bg-[#aa4584]/20 rounded-2xl border border-[#aa4584]/20 dark:border-[#aa4584]/30 hover:bg-[#aa4584]/20 dark:hover:bg-[#aa4584]/30 transition-all duration-300 group">
              <div className="w-10 h-10 bg-[#aa4584]/20 dark:bg-[#aa4584]/30 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                <span className="text-[#aa4584] dark:text-[#e062b1] font-bold">1</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white font-medium">Connectez-vous</p>
            </div>
            <div className="text-center p-4 bg-[#c55a9a]/10 dark:bg-[#c55a9a]/20 rounded-2xl border border-[#c55a9a]/20 dark:border-[#c55a9a]/30 hover:bg-[#c55a9a]/20 dark:hover:bg-[#c55a9a]/30 transition-all duration-300 group">
              <div className="w-10 h-10 bg-[#c55a9a]/20 dark:bg-[#c55a9a]/30 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                <span className="text-[#c55a9a] dark:text-[#e062b1] font-bold">2</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white font-medium">Remplissez le formulaire</p>
            </div>
            <div className="text-center p-4 bg-[#e062b1]/10 dark:bg-[#e062b1]/20 rounded-2xl border border-[#e062b1]/20 dark:border-[#e062b1]/30 hover:bg-[#e062b1]/20 dark:hover:bg-[#e062b1]/30 transition-all duration-300 group">
              <div className="w-10 h-10 bg-[#e062b1]/20 dark:bg-[#e062b1]/30 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                <span className="text-[#e062b1] font-bold">3</span>
              </div>
              <p className="text-xs text-gray-900 dark:text-white font-medium">Téléchargez le PDF</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4 pt-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © 2026 DocEase by FO Métaux. Tous droits réservés.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="material-icons text-green-500 dark:text-green-400 text-base">verified_user</span>
              <span>Connexion sécurisée réservée aux membres</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
