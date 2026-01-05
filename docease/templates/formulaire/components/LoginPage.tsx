/**
 * Page de connexion DocEase
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
    <div className="min-h-screen bg-gradient-to-br from-[#fdf2f8] via-white to-gray-50 dark:from-[#1e1e1e] dark:via-[#2f2f2f] dark:to-[#1e1e1e] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#aa4584] to-[#e062b1] rounded-2xl shadow-lg mb-4 transform hover:scale-105 transition-transform duration-300">
            <span className="material-icons text-white text-4xl">description</span>
          </div>
          <h1 className="text-3xl font-bold text-[#aa4584] dark:text-[#e062b1] mb-2">DocEase</h1>
          <p className="text-gray-500 dark:text-gray-400">Générateur de documents FO Métaux</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-8 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Connexion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse email professionnelle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-gray-400 dark:text-gray-500 text-xl">email</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="prenom.nom@fo-metaux.fr"
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#aa4584] focus:border-[#aa4584] dark:focus:ring-[#e062b1] dark:focus:border-[#e062b1] transition-colors ${
                    displayError ? 'border-red-300 dark:border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'
                  }`}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Champ nom (affiché après validation email) */}
            {showNameField && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Votre nom (optionnel)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-icons text-gray-400 dark:text-gray-500 text-xl">person</span>
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prénom Nom"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#3a3a3a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#aa4584] focus:border-[#aa4584] dark:focus:ring-[#e062b1] dark:focus:border-[#e062b1] transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Message d'erreur */}
            {displayError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                <span className="material-icons text-lg">error_outline</span>
                <span>{displayError}</span>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                isLoading || !email
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#aa4584] to-[#e062b1] hover:from-[#993d77] hover:to-[#d050a0] shadow-lg hover:shadow-xl hover:shadow-[#aa4584]/25 transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-icons text-xl">login</span>
                  Se connecter
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Info sécurité */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10">
            <span className="material-icons text-green-500 dark:text-green-400 text-lg">verified_user</span>
            <span>Connexion sécurisée réservée aux membres FO Métaux</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} FO Métaux - Tous droits réservés
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
