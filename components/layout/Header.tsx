import React from 'react';
import { Globe, Bell, Search, Sun, Moon, Monitor, Menu, LogOut } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useTheme } from '../../context/ThemeContext';
import { useMobileMenu } from '../../context/MobileMenuContext';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { toggleMenu } = useMobileMenu();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-[1440px] mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-md3-md border border-white/50 dark:border-slate-700/50 px-4 sm:px-6 py-3 pointer-events-auto flex items-center justify-between transition-all duration-300">
        
        {/* Left Section: Burger & Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMenu}
            className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-fo-red p-2.5 rounded-full shadow-lg shadow-red-500/30 shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">FO Métaux</h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Portail Secrétaires</p>
            </div>
          </div>
        </div>

        {/* Center Search (Trigger for Command Palette) */}
        <div 
            className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 w-96 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all group"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
        >
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          <span className="text-sm text-slate-400 dark:text-slate-500 flex-1">Rechercher...</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900">
             <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Ctrl K</span>
          </div>
        </div>

        {/* User Profile & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Theme Toggle */}
          <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700">
            <Tooltip content="Thème clair">
              <button 
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow text-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Thème sombre">
              <button 
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-600 shadow text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Système">
              <button 
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-full transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-600 shadow text-slate-700 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          <Tooltip content="3 notifications">
            <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
          </Tooltip>
          
          <div className="pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">En ligne</p>
            </div>
            
            <div className="relative group">
                <Tooltip content="Mon Profil" position="left">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-0.5 cursor-pointer hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-700 transition-all">
                    <img 
                        src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie"} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full bg-white dark:bg-slate-800"
                    />
                    </div>
                </Tooltip>

                {/* Dropdown simple pour la déconnexion */}
                <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
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