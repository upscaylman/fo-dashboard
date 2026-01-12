import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MultiEmailInputProps {
  label: string;
  value: string; // Emails séparés par des virgules
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  predefinedEmails?: Array<{ name: string; email: string }>;
  helpText?: string; // Texte d'aide affiché dans une info-bulle
  inputClassName?: string;
  forceLightMode?: boolean;
}

export const MultiEmailInput: React.FC<MultiEmailInputProps> = ({
  label,
  value,
  onChange,
  required,
  error,
  placeholder = 'Saisissez ou sélectionnez des emails...',
  predefinedEmails = [],
  helpText,
  inputClassName = '',
  forceLightMode = false
}) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialiser les emails depuis la valeur
  useEffect(() => {
    if (value) {
      const emailList = value.split(',').map(e => e.trim()).filter(e => e);
      setEmails(emailList);
    } else {
      setEmails([]);
    }
  }, [value]);

  // Calculer la position du dropdown et la mettre à jour lors du scroll
  useEffect(() => {
    const updatePosition = () => {
      if (showDropdown && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();

        // Utiliser visualViewport pour tenir compte du clavier mobile
        const viewport = window.visualViewport;
        const viewportHeight = viewport ? viewport.height : window.innerHeight;
        const viewportOffsetTop = viewport ? viewport.offsetTop : 0;

        // Calculer l'espace disponible en tenant compte du viewport
        const spaceBelow = viewportHeight + viewportOffsetTop - rect.bottom;
        const spaceAbove = rect.top - viewportOffsetTop;

        // Déterminer si on affiche en dessous ou au-dessus
        const showBelow = spaceBelow >= 150; // Au moins 150px pour afficher en dessous

        // Calculer la hauteur max disponible (en laissant 16px de marge)
        const availableSpace = showBelow ? spaceBelow : spaceAbove;
        const maxHeight = Math.max(Math.min(availableSpace - 16, 320), 150);

        setDropdownStyle({
          position: 'fixed',
          top: showBelow ? `${rect.bottom + 8}px` : 'auto',
          bottom: showBelow ? 'auto' : `${viewportHeight + viewportOffsetTop - rect.top + 8}px`,
          left: `${Math.max(8, rect.left)}px`,
          right: `${Math.max(8, window.innerWidth - rect.right)}px`,
          width: 'auto',
          maxHeight: `${maxHeight}px`,
          zIndex: 9999,
        });
      }
    };

    if (showDropdown) {
      updatePosition();

      // Mettre à jour la position lors du scroll, resize et changement de viewport (clavier mobile)
      const scrollHandler = () => updatePosition();
      const resizeHandler = () => {
        updatePosition();
      };

      window.addEventListener('scroll', scrollHandler, true);
      window.addEventListener('resize', resizeHandler);

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', resizeHandler);
        window.visualViewport.addEventListener('scroll', scrollHandler);
      }

      return () => {
        window.removeEventListener('scroll', scrollHandler, true);
        window.removeEventListener('resize', resizeHandler);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', resizeHandler);
          window.visualViewport.removeEventListener('scroll', scrollHandler);
        }
      };
    }
  }, [showDropdown]);

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ne pas fermer si on clique dans la zone d'input ou dans le dropdown portal
      const isInInputContainer = inputContainerRef.current && inputContainerRef.current.contains(target);
      const dropdownElement = document.querySelector('[data-dropdown-portal]');
      const isInDropdown = dropdownElement && dropdownElement.contains(target);
      
      if (!isInInputContainer && !isInDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && trimmedEmail.includes('@') && !emails.includes(trimmedEmail)) {
      const newEmails = [...emails, trimmedEmail];
      setEmails(newEmails);
      onChange(newEmails.join(', '));
      return true;
    }
    return false;
  };

  const removeEmail = (emailToRemove: string) => {
    const newEmails = emails.filter(e => e !== emailToRemove);
    setEmails(newEmails);
    onChange(newEmails.join(', '));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Détecter virgule, point-virgule ou espace pour ajouter l'email
    if (val.includes(',') || val.includes(';') || val.includes(' ')) {
      const parts = val.split(/[,;\s]+/);
      parts.forEach(part => {
        if (part.trim()) {
          addEmail(part);
        }
      });
      setInputValue('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '' && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handleInputFocus = () => {
    // Ouvrir le dropdown automatiquement au focus si on a des emails prédéfinis (desktop uniquement)
    if (predefinedEmails.length > 0 && !isMobile) {
      setShowDropdown(true);
    }
    // Sur mobile, on ouvre la modal
    if (predefinedEmails.length > 0 && isMobile) {
      setShowMobileModal(true);
    }
  };

  const handleInputBlur = () => {
    // Ajouter l'email en cours de saisie quand on perd le focus
    if (inputValue.trim()) {
      addEmail(inputValue);
      setInputValue('');
    }
  };

  const toggleDropdown = () => {
    if (isMobile) {
      setShowMobileModal(true);
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const toggleEmailSelection = (email: string) => {
    if (emails.includes(email)) {
      const newEmails = emails.filter(e => e !== email);
      setEmails(newEmails);
      onChange(newEmails.join(', '));
    } else {
      const newEmails = [...emails, email];
      setEmails(newEmails);
      onChange(newEmails.join(', '));
    }
  };

  const selectPredefinedEmail = (email: string) => {
    addEmail(email);
    // Ne pas fermer le dropdown pour permettre la sélection multiple
    // inputRef.current?.focus();
  };

  const selectAll = () => {
    // Collecter tous les emails à ajouter
    const emailsToAdd = predefinedEmails
      .map(({ email }) => email)
      .filter(email => !emails.includes(email));

    if (emailsToAdd.length > 0) {
      const newEmails = [...emails, ...emailsToAdd];
      setEmails(newEmails);
      onChange(newEmails.join(', '));
    }
  };

  const filteredPredefined = predefinedEmails.filter(
    ({ email }) => !emails.includes(email)
  );

  return (
    <div className="relative group w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-1 ml-1 min-h-[28px]">
        <label className={`text-sm font-medium ${forceLightMode ? 'text-gray-700' : 'text-gray-700 dark:text-gray-300'} flex items-center`}>
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        {helpText && (
          <span className="relative group/help inline-flex mr-1">
            <span className="cursor-help">
              <span className={`material-icons ${forceLightMode ? 'text-gray-700' : 'text-gray-700 dark:text-gray-300'}`} style={{ fontSize: '14px' }}>help</span>
            </span>
            <span className="absolute right-0 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-200 pointer-events-none">
              {helpText}
              <span className="absolute right-3 top-full border-4 border-transparent border-t-gray-800"></span>
            </span>
          </span>
        )}
      </div>

      <div
        ref={inputContainerRef}
        className={`
          w-full bg-[#fdfbff] ${forceLightMode ? '' : 'dark:bg-[rgb(37,37,37)]'} border-2 text-base rounded-2xl
          outline-none transition-all duration-200
          flex items-center gap-2 cursor-text overflow-x-auto overflow-y-hidden
          h-[52px] px-4
          ${error
            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10'
            : `border-[#e7e0ec] ${forceLightMode ? '' : 'dark:border-[rgb(75,85,99)]'} focus-within:border-[#a84383] focus-within:ring-4 focus-within:ring-[#a84383]/10`
          }
          ${inputClassName}
        `}
        onClick={() => inputRef.current?.focus()}
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Chips des emails sélectionnés */}
        <div className="flex items-center gap-1.5 flex-nowrap">
          {emails.map((email, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-1 px-2 rounded-full text-xs font-medium
                bg-[#E8DEF8] ${forceLightMode ? '' : 'dark:bg-[#4a1a36]'}
                text-[#21005D] ${forceLightMode ? '' : 'dark:text-[#e062b1]'}
                transition-colors whitespace-nowrap flex-shrink-0
                h-[1.875rem]
              `}
            >
              <span className="material-icons" style={{ fontSize: '14px' }}>email</span>
              <span className="max-w-[100px] overflow-hidden text-ellipsis">{email}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(email);
                }}
                className="flex items-center justify-center hover:text-red-500 transition-colors"
              >
                <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
              </button>
            </div>
          ))}
        </div>

        {/* Input pour saisir un nouvel email */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={emails.length === 0 ? placeholder : ''}
          className={`
            flex-1 min-w-[150px] outline-none bg-transparent
            text-[#1c1b1f] ${forceLightMode ? '' : 'dark:text-white'}
            placeholder:text-gray-400 ${forceLightMode ? '' : 'dark:placeholder:text-gray-500'}
          `}
        />

        {/* Bouton dropdown */}
        {predefinedEmails.length > 0 && (
          <button
            type="button"
            onClick={toggleDropdown}
            className={`
              flex items-center justify-center w-8 h-8 rounded-full
              hover:bg-gray-100 ${forceLightMode ? '' : 'dark:hover:bg-gray-700'}
              transition-colors
            `}
          >
            <span className={`material-icons text-gray-600 ${forceLightMode ? '' : 'dark:text-gray-400'}`}>
              {showDropdown ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
          <span className="material-icons text-sm">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Dropdown avec les emails prédéfinis */}
      {showDropdown && predefinedEmails.length > 0 && createPortal(
        <div
          data-dropdown-portal
          style={dropdownStyle}
          className={`
            bg-white ${forceLightMode ? '' : 'dark:bg-[rgb(47,47,47)]'}
            border-2 border-[#a84383] ${forceLightMode ? '' : 'dark:border-[#e062b1]'}
            rounded-2xl shadow-xl overflow-y-auto
          `}
        >
          <div className="p-2">
            {/* Bouton "Tout sélectionner" */}
            {filteredPredefined.length > 0 && (
              <button
                type="button"
                onClick={selectAll}
                className={`
                  w-full text-left px-3 py-2 rounded-xl mb-2
                  bg-[#a84383] ${forceLightMode ? '' : 'dark:bg-[#e062b1]'}
                  text-white font-medium
                  hover:bg-[#8d3a6e] ${forceLightMode ? '' : 'dark:hover:bg-[#c54d9a]'}
                  transition-colors flex items-center gap-2
                `}
              >
                <span className="material-icons text-sm">done_all</span>
                Tout sélectionner
              </button>
            )}

            {/* Liste des emails prédéfinis */}
            <div className={`text-xs text-gray-500 ${forceLightMode ? '' : 'dark:text-gray-400'} px-3 py-2 font-medium`}>
              Sélectionnez un ou plusieurs destinataires :
            </div>
            {filteredPredefined.length > 0 ? (
              filteredPredefined.map(({ name, email }, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectPredefinedEmail(email)}
                  className={`
                    w-full text-left px-3 py-2 rounded-xl
                    hover:bg-[#ffecf8] ${forceLightMode ? '' : 'dark:hover:bg-[#4a1a36]/50'}
                    transition-colors flex items-start gap-2
                  `}
                >
                  <span className={`material-icons text-[#a84383] ${forceLightMode ? '' : 'dark:text-[#e062b1]'} text-sm mt-0.5`}>
                    person
                  </span>
                  <div className="flex-1">
                    <div className={`font-medium text-gray-900 ${forceLightMode ? '' : 'dark:text-gray-100'}`}>{name}</div>
                    <div className={`text-xs text-gray-500 ${forceLightMode ? '' : 'dark:text-gray-400'}`}>{email}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className={`px-3 py-4 text-center text-sm text-gray-500 ${forceLightMode ? '' : 'dark:text-gray-400'}`}>
                Tous les destinataires ont été sélectionnés
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Modal mobile plein écran */}
      {showMobileModal && isMobile && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 z-[99999] flex items-end"
          onClick={() => setShowMobileModal(false)}
        >
          <div 
            className={`w-full bg-white ${forceLightMode ? '' : 'dark:bg-[rgb(37,37,37)]'} rounded-t-3xl max-h-[80vh] flex flex-col animate-[slideUp_0.3s_ease-out]`}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${forceLightMode ? '' : 'dark:border-gray-700'}`}>
              <h3 className={`text-lg font-semibold text-gray-900 ${forceLightMode ? '' : 'dark:text-white'}`}>
                Sélectionner les destinataires
              </h3>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 ${forceLightMode ? '' : 'dark:hover:bg-gray-700'}`}
              >
                <span className={`material-icons text-gray-600 ${forceLightMode ? '' : 'dark:text-gray-400'}`}>close</span>
              </button>
            </div>

            {/* Bouton Tout sélectionner */}
            <div className={`p-4 border-b border-gray-200 ${forceLightMode ? '' : 'dark:border-gray-700'}`}>
              <button
                type="button"
                onClick={() => {
                  const allEmails = predefinedEmails.map(p => p.email);
                  const allSelected = allEmails.every(e => emails.includes(e));
                  if (allSelected) {
                    // Tout désélectionner
                    setEmails([]);
                    onChange('');
                  } else {
                    // Tout sélectionner
                    setEmails(allEmails);
                    onChange(allEmails.join(', '));
                  }
                }}
                className={`w-full py-3 px-4 bg-[#a84383] ${forceLightMode ? '' : 'dark:bg-[#e062b1]'} text-white font-medium rounded-xl flex items-center justify-center gap-2`}
              >
                <span className="material-icons text-xl">
                  {predefinedEmails.every(p => emails.includes(p.email)) ? 'remove_done' : 'done_all'}
                </span>
                {predefinedEmails.every(p => emails.includes(p.email)) ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>

            {/* Liste des destinataires */}
            <div className="flex-1 overflow-y-auto p-2">
              {predefinedEmails.map(({ name, email }, index) => {
                const isSelected = emails.includes(email);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleEmailSelection(email)}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl mb-1
                      flex items-center gap-3 transition-colors
                      ${isSelected 
                        ? `bg-[#ffecf8] ${forceLightMode ? '' : 'dark:bg-[#4a1a36]'}`
                        : `hover:bg-gray-100 ${forceLightMode ? '' : 'dark:hover:bg-gray-800'}`
                      }
                    `}
                  >
                    {/* Checkbox */}
                    <div className={`
                      w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0
                      ${isSelected 
                        ? `bg-[#a84383] border-[#a84383] ${forceLightMode ? '' : 'dark:bg-[#e062b1] dark:border-[#e062b1]'}`
                        : `border-gray-300 ${forceLightMode ? '' : 'dark:border-gray-600'}`
                      }
                    `}>
                      {isSelected && (
                        <span className="material-icons text-white text-lg">check</span>
                      )}
                    </div>

                    {/* Info destinataire */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-gray-900 ${forceLightMode ? '' : 'dark:text-gray-100'} truncate`}>{name}</div>
                      <div className={`text-sm text-gray-500 ${forceLightMode ? '' : 'dark:text-gray-400'} truncate`}>{email}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer avec compteur */}
            <div className={`p-4 border-t border-gray-200 ${forceLightMode ? '' : 'dark:border-gray-700'} bg-gray-50 ${forceLightMode ? '' : 'dark:bg-[rgb(30,30,30)]'}`}>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className={`w-full py-3 bg-gray-900 ${forceLightMode ? '' : 'dark:bg-white'} text-white ${forceLightMode ? '' : 'dark:text-gray-900'} font-medium rounded-xl`}
              >
                Valider ({emails.length} sélectionné{emails.length > 1 ? 's' : ''})
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
