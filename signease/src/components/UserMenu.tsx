/**
 * Menu utilisateur SignEase
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSigneaseAuth } from '../context/AuthContext';

export const UserMenu: React.FC = () => {
  const { user, logout } = useSigneaseAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600'
    ];
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton utilisateur */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-gray-200 transition-all duration-200 hover:shadow-md"
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(user.email)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
          {getInitials(user.name)}
        </div>
        
        {/* Nom (masqué sur mobile) */}
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {user.name}
        </span>

        {/* Indicateur en ligne */}
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="En ligne" />

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
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn">
          {/* Info utilisateur */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(user.email)} flex items-center justify-center text-white text-sm font-bold`}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>Connecté depuis {new Date(user.logged_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            {/* Lien vers le dashboard */}
            <a
              href="/"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Retour au Dashboard
            </a>

            {/* Déconnexion */}
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
