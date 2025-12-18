/**
 * Page de connexion SignEase
 * Authentification avec validation @fo-metaux.fr
 */

import React, { useState, useEffect } from 'react';
import { useSigneaseAuth } from '../context/AuthContext';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, validateEmail, error, isLoading } = useSigneaseAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SignEase</h1>
          <p className="text-gray-500">Signature électronique FO Métaux</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Connexion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email professionnelle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="prenom.nom@fo-metaux.fr"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    displayError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Seules les adresses @fo-metaux.fr sont autorisées
              </p>
            </div>

            {/* Champ nom (affiché après validation email) */}
            {showNameField && (
              <div className="animate-fadeIn">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Votre nom (optionnel)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prénom Nom"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Message d'erreur */}
            {displayError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{displayError}</span>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                isLoading || !email
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
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
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        {/* Info sécurité */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-gray-500 border border-gray-100">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Connexion sécurisée réservée aux membres FO Métaux</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} FO Métaux - Tous droits réservés
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
