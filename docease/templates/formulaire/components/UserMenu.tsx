/**
 * Menu utilisateur dans le header DocEase
 * Affiche l'utilisateur connecté et permet la déconnexion
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDoceaseAuth } from '../context/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, logout } = useDoceaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const menuRef = useRef<HTMLDivElement>(null);

  // Appliquer le thème au chargement et aux changements
  useEffect(() => {
    const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
      if (selectedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (selectedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setIsThemeSubmenuOpen(false);
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Clair';
      case 'dark': return 'Sombre';
      case 'system': return 'Système';
    }
  };

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Générer les initiales
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Générer une couleur basée sur l'email
  const getAvatarColor = (email: string) => {
    const colors = [
      'from-red-500 to-red-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600',
      'from-pink-500 to-pink-600'
    ];
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton utilisateur */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#2f2f2f]/80 hover:bg-white dark:hover:bg-[#2f2f2f] border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md"
      >
        {/* Avatar avec pastille en ligne (visible seulement sur mobile) */}
        <div className="relative">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(user.email)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
            {getInitials(user.name)}
          </div>
          {/* Pastille en ligne sur l'avatar (mobile uniquement) */}
          <span className="sm:hidden absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-[#2f2f2f] animate-pulse" title="En ligne" />
        </div>
        
        {/* Nom (masqué sur mobile) */}
        <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
          {user.name}
        </span>

        {/* Indicateur en ligne (desktop uniquement) */}
        <span className="hidden sm:block w-2 h-2 rounded-full bg-green-500 animate-pulse" title="En ligne" />

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#2f2f2f] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fadeIn">
          {/* Info utilisateur */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user.email)} flex items-center justify-center text-white text-sm font-bold`}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            
            {/* Badge rôle */}
            {user.role && user.role !== 'user' && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role}
                </span>
              </div>
            )}
          </div>

          {/* Statut */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>Connecté depuis {new Date(user.logged_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            {/* Sélecteur de thème */}
            <div className="relative">
              <button
                onClick={() => setIsThemeSubmenuOpen(!isThemeSubmenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="flex-1 text-left">Thème</span>
                <span className="text-xs text-gray-400">{getThemeLabel()}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isThemeSubmenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Sous-menu thème */}
              {isThemeSubmenuOpen && (
                <div className="bg-gray-50 dark:bg-gray-800 py-1">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`w-full flex items-center gap-3 px-8 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'light' ? 'text-[#aa4584] dark:text-[#e062b1]' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                    </svg>
                    Clair
                    {theme === 'light' && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`w-full flex items-center gap-3 px-8 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'dark' ? 'text-[#aa4584] dark:text-[#e062b1]' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.37 5.51c-.18.64-.27 1.31-.27 1.99 0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27C17.45 17.19 14.93 19 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                    </svg>
                    Sombre
                    {theme === 'dark' && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`w-full flex items-center gap-3 px-8 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'system' ? 'text-[#aa4584] dark:text-[#e062b1]' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                    </svg>
                    Système
                    {theme === 'system' && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Déconnexion */}
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
