import React from 'react';
import { Globe, Search, Menu, LogOut, User, Users } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { NotificationPanel } from '../ui/NotificationPanel';
import { useMobileMenu } from '../../context/MobileMenuContext';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../hooks/usePresence';
import { usePermissions } from '../../hooks/usePermissions';

// Couleurs de bordure selon le rôle
const getRoleBorderColor = (role?: string) => {
  switch (role) {
    case 'super_admin':
      return 'ring-purple-500 ring-2';
    case 'secretary_general':
      return 'ring-indigo-500 ring-2';
    case 'secretary_federal':
      return 'ring-blue-500 ring-2';
    case 'secretary':
      return 'ring-emerald-500 ring-2';
    default:
      return 'ring-slate-300 dark:ring-slate-600 ring-1';
  }
};

// Tooltip du rôle
const getRoleTooltip = (role?: string) => {
  switch (role) {
    case 'super_admin':
      return 'Super Administrateur';
    case 'secretary_general':
      return 'Secrétaire Général';
    case 'secretary_federal':
      return 'Secrétaire Fédéral';
    case 'secretary':
      return 'Secrétaire';
    default:
      return 'Utilisateur';
  }
};

interface HeaderProps {
  onNavigate?: (path: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { toggleMenu } = useMobileMenu();
  const { user, logout } = useAuth();
  const { activeUsers } = usePresence();
  const { isAdmin, isSuperAdmin } = usePermissions();

  // Seuls les admins et super_admins peuvent voir les utilisateurs en ligne
  const canSeeOnlineUsers = isAdmin || isSuperAdmin;

  return (
    <header className="sticky top-4 z-40 px-2 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-[1440px] mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-md3-md border border-white/50 dark:border-slate-700/50 px-3 sm:px-6 py-2.5 sm:py-3 pointer-events-auto flex items-center justify-between transition-all duration-300 gap-2 sm:gap-4">

        {/* Left Section: Burger & Logo */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-1.5 sm:p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button 
            onClick={() => onNavigate?.('/')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="bg-fo-red p-2 sm:p-2.5 rounded-full shadow-lg shadow-red-500/30 shrink-0">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">FO Métaux</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Portail Secrétaires</p>
            </div>
          </button>
        </div>

        {/* Center Search (Trigger for Command Palette) */}
        <div
          className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-3 sm:px-4 py-2 flex-1 max-w-[180px] sm:max-w-[280px] md:max-w-[400px] mx-2 sm:mx-4 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all group"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
        >
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0" />
          <span className="text-sm text-slate-400 dark:text-slate-500 flex-1 truncate">Rechercher...</span>
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Ctrl K</span>
          </div>
        </div>

        {/* Mobile Search Icon */}
        <button
          className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          aria-label="Rechercher"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* User Profile & Notifications */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Indicateur utilisateurs en ligne - visible uniquement pour admin/super_admin */}
          {canSeeOnlineUsers && (
            <Tooltip content={`${activeUsers.length} utilisateur${activeUsers.length > 1 ? 's' : ''} en ligne`} position="bottom">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{activeUsers.length}</span>
              </div>
            </Tooltip>
          )}

          <div className="relative">
            <NotificationPanel />
          </div>

          <div className="pl-1.5 sm:pl-4 border-l border-slate-200 dark:border-slate-700 flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name || 'Utilisateur'}</p>
            </div>

            <div className="relative group">
              <Tooltip content={getRoleTooltip(user?.role)} position="left">
                {/* Avatar avec bordure colorée selon le rôle */}
                <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full p-0.5 cursor-pointer transition-all ${getRoleBorderColor(user?.role)} hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-slate-900`}>
                  <img
                    src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                    alt="Avatar"
                    className="w-full h-full rounded-full bg-white dark:bg-slate-800"
                  />
                  {/* Point vert en ligne sur l'avatar */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse"></div>
                </div>
              </Tooltip>

              {/* Dropdown pour profil et déconnexion */}
              <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                <button
                  onClick={() => onNavigate?.('/profile')}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Mon Profil
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;