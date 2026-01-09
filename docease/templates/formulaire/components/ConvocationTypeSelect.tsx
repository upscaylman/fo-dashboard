import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConvocationTypeSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

// Types de convocation disponibles avec icônes et descriptions
const CONVOCATION_OPTIONS = [
  {
    id: 'CA Fédérale',
    name: 'CA Fédérale',
    description: 'Commission Administrative Fédérale (2 jours)',
    icon: 'groups',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  },
  {
    id: 'Bureau Fédéral',
    name: 'Bureau Fédéral',
    description: 'Réunion du Bureau Fédéral (1 jour)',
    icon: 'meeting_room',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  }
];

export const ConvocationTypeSelect: React.FC<ConvocationTypeSelectProps> = ({
  label,
  value,
  onChange,
  required,
  error,
  placeholder = 'Sélectionnez un type de convocation...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Trouver l'option sélectionnée
  const selectedOption = CONVOCATION_OPTIONS.find(opt => opt.id === value);

  // Calculer la position du dropdown
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ne pas fermer si on clique dans le container ou le dropdown
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  // Version mobile avec select natif
  if (isMobile) {
    return (
      <div className="relative w-full">
        {/* Label */}
        <div className="flex items-center justify-between mb-1 ml-1 h-[28px]">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            {label}
            {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
          </label>
        </div>

        {/* Select natif avec style personnalisé */}
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className={`
              w-full bg-[#fdfbff] dark:bg-[rgb(37,37,37)] border-2 text-base rounded-2xl
              outline-none transition-colors duration-150
              h-[52px] px-4 pl-12 appearance-none cursor-pointer
              text-gray-900 dark:text-white
              ${error
                ? 'border-red-500'
                : 'border-[#e7e0ec] dark:border-[rgb(75,85,99)] focus:border-[#a84383]'
              }
            `}
          >
            <option value="">{placeholder}</option>
            {CONVOCATION_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} - {option.description}
              </option>
            ))}
          </select>
          
          {/* Icône à gauche */}
          <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            category
          </span>
          
          {/* Chevron à droite */}
          <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
            expand_more
          </span>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Version desktop avec dropdown personnalisé
  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Label */}
      <div className="flex items-center justify-between mb-1 ml-1 h-[28px]">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
      </div>

      {/* Bouton principal */}
      <button
        type="button"
        onClick={handleToggle}
        className={`
          w-full bg-[#fdfbff] dark:bg-[rgb(37,37,37)] border-2 text-base rounded-2xl
          outline-none transition-colors duration-150
          flex items-center gap-3 cursor-pointer
          h-[52px] px-4
          ${error
            ? 'border-red-500'
            : isOpen
              ? 'border-[#a84383]'
              : 'border-[#e7e0ec] dark:border-[rgb(75,85,99)] hover:border-[#a84383]/50'
          }
        `}
      >
        {/* Icône */}
        <span className="material-icons text-gray-400 dark:text-gray-500 flex-shrink-0">
          category
        </span>

        {/* Contenu sélectionné ou placeholder */}
        {selectedOption ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${selectedOption.color}`}>
              <span className="material-icons text-xl">{selectedOption.icon}</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {selectedOption.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {selectedOption.description}
              </div>
            </div>
          </div>
        ) : (
          <span className="flex-1 text-left text-gray-400 dark:text-gray-500 truncate">
            {placeholder}
          </span>
        )}

        {/* Chevron */}
        <span className={`material-icons text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600" role="alert">
          <span className="material-icons text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Dropdown via Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 99999
          }}
          className="bg-white dark:bg-[rgb(47,47,47)] border-2 border-[#a84383] dark:border-[#e062b1] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-2">
            {/* Texte d'aide */}
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium flex items-center gap-2">
              <span className="material-icons text-sm text-[#a84383] dark:text-[#e062b1]">info</span>
              Sélectionnez le type de convocation à générer :
            </div>

            {/* Liste des options */}
            {CONVOCATION_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`
                  w-full text-left px-3 py-3 rounded-xl
                  transition-colors duration-150 flex items-center gap-3
                  ${value === option.id
                    ? 'bg-[#ffecf8] dark:bg-[#4a1a36]'
                    : 'hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50'
                  }
                `}
              >
                {/* Icône de l'option */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${option.color}`}>
                  <span className="material-icons text-2xl">{option.icon}</span>
                </div>

                {/* Texte de l'option */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    {option.name}
                    {value === option.id && (
                      <span className="material-icons text-[#a84383] dark:text-[#e062b1] text-lg flex-shrink-0">
                        check_circle
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
