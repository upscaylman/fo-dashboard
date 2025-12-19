import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Edit3, Globe, Moon, Sun, Monitor, Calculator, Mail, ExternalLink } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
  action: () => void;
}

const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setTheme } = useTheme();

  const commands: CommandItem[] = [
    { id: 'docease', label: 'Ouvrir DocEase (Générateur de courriers)', icon: FileText, category: 'Applications', action: () => window.open('https://fo-docease.netlify.app/', '_blank') },
    { id: 'signease', label: 'Ouvrir SignEase (Signature électronique)', icon: Edit3, category: 'Applications', action: () => window.open('https://fde-signease.netlify.app/', '_blank') },
    { id: 'website', label: 'Site officiel FO Métaux', icon: Globe, category: 'Ressources', action: () => window.open('https://www.fo-metaux.fr/', '_blank') },
    { id: 'convention', label: 'Convention Collective', icon: FileText, category: 'Ressources', action: () => window.open('https://conventioncollectivemetallurgie.fr/', '_blank') },
    { id: 'calc', label: "Calculateur prime d'ancienneté", icon: Calculator, category: 'Ressources', action: () => window.open('https://www.fo-metaux.fr/calculateur-de-prime-danciennet', '_blank') },
    { id: 'theme-light', label: 'Apparence : Thème Clair', icon: Sun, category: 'Paramètres', action: () => setTheme('light') },
    { id: 'theme-dark', label: 'Apparence : Thème Sombre', icon: Moon, category: 'Paramètres', action: () => setTheme('dark') },
    { id: 'theme-system', label: 'Apparence : Thème Système', icon: Monitor, category: 'Paramètres', action: () => setTheme('system') },
    { id: 'contact', label: 'Contacter le support', icon: Mail, category: 'Support', action: () => window.location.href = 'mailto:contact@fo-metaux.fr' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);

  useEffect(() => {
    if (isOpen) {
        // Petit délai pour s'assurer que l'input est monté
        setTimeout(() => inputRef.current?.focus(), 10);
        setSelectedIndex(0);
        setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transform transition-all animate-[zoomIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
            placeholder="Que souhaitez-vous faire ?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">ESC</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <p>Aucun résultat pour "{query}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); setIsOpen(false); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${
                    idx === selectedIndex 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <cmd.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-sm">{cmd.label}</span>
                      <span className="text-xs opacity-70">{cmd.category}</span>
                    </div>
                  </div>
                  {idx === selectedIndex && <ExternalLink className="w-4 h-4 opacity-50" />}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex gap-3">
             <span><strong className="text-slate-600 dark:text-slate-300">↑↓</strong> naviguer</span>
             <span><strong className="text-slate-600 dark:text-slate-300">↵</strong> choisir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-fo-red"></div>
            FO Métaux Quick Access
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;