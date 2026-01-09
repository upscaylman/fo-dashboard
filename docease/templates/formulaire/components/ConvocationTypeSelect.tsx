import React, { useState, useEffect } from 'react';
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
    bgColor: 'rgba(59, 130, 246, 0.15)',
    textColor: '#3b82f6'
  },
  {
    id: 'Bureau Fédéral',
    name: 'Bureau Fédéral',
    description: 'Réunion du Bureau Fédéral (1 jour)',
    icon: 'meeting_room',
    bgColor: 'rgba(147, 51, 234, 0.15)',
    textColor: '#9333ea'
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
  const [showMobileSelect, setShowMobileSelect] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // EXACTEMENT comme Input.tsx
  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue);
    setShowMobileSelect(false);
  };

  const selectValue = value || '';

  return (
    <div className="relative w-full">
      {/* Label */}
      <div className="flex items-center justify-between mb-2 ml-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
      </div>

      {/* Version Desktop : Cartes cliquables */}
      {!isMobile && (
        <div className="grid grid-cols-2 gap-4">
          {CONVOCATION_OPTIONS.map((option) => {
            const isSelected = selectValue === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={`
                  relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300
                  ${isSelected
                    ? 'border-[#a84383] bg-[#ffecf8] dark:bg-[#4a1a36] shadow-lg scale-[1.02]'
                    : 'border-[#e7e0ec] dark:border-[rgb(75,85,99)] bg-[#fdfbff] dark:bg-[rgb(37,37,37)] hover:border-[#a84383]/50 hover:shadow-md'
                  }
                `}
              >
                {/* Checkmark */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <span className="material-icons text-[#a84383] dark:text-[#e062b1]">check_circle</span>
                  </div>
                )}

                {/* Icône */}
                <div 
                  className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                  style={{ backgroundColor: option.bgColor, color: option.textColor }}
                >
                  <span className="material-icons text-4xl">{option.icon}</span>
                </div>

                {/* Texte */}
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
                    {option.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Version Mobile : Bouton qui ouvre le bottom sheet */}
      {isMobile && (
        <button
          type="button"
          onClick={() => setShowMobileSelect(true)}
          className={`
            w-full bg-[#fdfbff] dark:bg-[rgb(37,37,37)] border-2 text-base rounded-2xl
            outline-none transition-colors duration-150
            flex items-center gap-3 cursor-pointer
            h-[52px] px-4
            ${error
              ? 'border-red-500'
              : 'border-[#e7e0ec] dark:border-[rgb(75,85,99)] hover:border-[#a84383]/50'
            }
          `}
        >
          {/* Icône */}
          <span className="material-icons text-gray-400 dark:text-gray-500 flex-shrink-0">
            category
          </span>

          {/* Contenu sélectionné ou placeholder */}
          {selectValue ? (
            (() => {
              const selectedOption = CONVOCATION_OPTIONS.find(opt => opt.id === selectValue);
              return selectedOption ? (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: selectedOption.bgColor, color: selectedOption.textColor }}
                  >
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
              ) : null;
            })()
          ) : (
            <span className="flex-1 text-left text-gray-400 dark:text-gray-500 truncate">
              {placeholder}
            </span>
          )}

          {/* Chevron */}
          <span className="material-icons text-gray-500 dark:text-gray-400 flex-shrink-0">
            expand_more
          </span>
        </button>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600" role="alert">
          <span className="material-icons text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Modal mobile (bottom sheet) - COPIÉ EXACTEMENT de Input.tsx */}
      {showMobileSelect && isMobile && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 z-[99999] flex items-end"
          onClick={() => setShowMobileSelect(false)}
        >
          <div 
            className="w-full bg-white dark:bg-[rgb(37,37,37)] rounded-t-3xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {label}
              </h3>
              <button
                type="button"
                onClick={() => setShowMobileSelect(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="material-icons text-gray-600 dark:text-gray-400">close</span>
              </button>
            </div>

            {/* Texte d'aide */}
            <div className="text-xs text-gray-500 dark:text-gray-400 px-5 py-3 font-medium flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
              <span className="material-icons text-sm text-[#a84383] dark:text-[#e062b1]">info</span>
              Sélectionnez le type de convocation à générer :
            </div>

            {/* Liste des options avec le style original */}
            <div className="flex-1 overflow-y-auto p-2">
              {CONVOCATION_OPTIONS.map((option, index) => {
                const isSelected = selectValue === option.id;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectOption(option.id)}
                    className={`
                      w-full text-left px-3 py-3 rounded-xl mb-1
                      flex items-center gap-3 transition-colors
                      ${isSelected 
                        ? 'bg-[#ffecf8] dark:bg-[#4a1a36]' 
                        : 'hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50 active:bg-[#ffecf8]'
                      }
                    `}
                  >
                    {/* Icône de l'option */}
                    <div 
                      className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: option.bgColor, color: option.textColor }}
                    >
                      <span className="material-icons text-2xl">{option.icon}</span>
                    </div>

                    {/* Texte de l'option */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {option.name}
                        {isSelected && (
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
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
