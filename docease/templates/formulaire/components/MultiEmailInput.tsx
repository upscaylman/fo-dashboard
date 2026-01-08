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
}

export const MultiEmailInput: React.FC<MultiEmailInputProps> = ({
  label,
  value,
  onChange,
  required,
  error,
  placeholder = 'Saisissez ou sélectionnez des emails...',
  predefinedEmails = [],
  helpText
}) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      // Ne pas fermer si on clique dans le container ou dans le dropdown portal
      if (containerRef.current && !containerRef.current.contains(target)) {
        // Vérifier si le clic est dans le dropdown portal
        const dropdownElement = document.querySelector('[data-dropdown-portal]');
        if (!dropdownElement || !dropdownElement.contains(target)) {
          setShowDropdown(false);
        }
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
    // Ouvrir le dropdown automatiquement au focus si on a des emails prédéfinis
    if (predefinedEmails.length > 0) {
      setShowDropdown(true);
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
    setShowDropdown(!showDropdown);
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
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        {helpText && (
          <span className="relative group/help inline-flex mr-1">
            <span className="cursor-help">
              <span className="material-icons text-gray-700 dark:text-gray-300" style={{ fontSize: '14px' }}>help</span>
            </span>
            <span className="absolute right-0 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-200 pointer-events-none">
              {helpText}
              <span className="absolute right-3 top-full border-4 border-transparent border-t-gray-800"></span>
            </span>
          </span>
        )}
      </div>

      <div
        className={`
          w-full bg-[#fdfbff] dark:bg-[rgb(37,37,37)] border-2 text-base rounded-2xl
          outline-none transition-all duration-200
          flex items-center gap-2 cursor-text overflow-x-auto overflow-y-hidden
          h-[52px] px-4
          ${error
            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10'
            : 'border-[#e7e0ec] dark:border-[rgb(75,85,99)] focus-within:border-[#a84383] focus-within:ring-4 focus-within:ring-[#a84383]/10'
          }
        `}
        onClick={() => inputRef.current?.focus()}
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Chips des emails sélectionnés */}
        <div className="flex items-center gap-1.5 flex-nowrap">
          {emails.map((email, index) => (
            <div
              key={index}
              className="
                flex items-center gap-1 px-2 rounded-full text-xs font-medium
                bg-[#E8DEF8] dark:bg-[#4a1a36]
                text-[#21005D] dark:text-[#e062b1]
                transition-colors whitespace-nowrap flex-shrink-0
                h-[1.875rem]
              "
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
          className="
            flex-1 min-w-[150px] outline-none bg-transparent
            text-[#1c1b1f] dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
          "
        />

        {/* Bouton dropdown */}
        {predefinedEmails.length > 0 && (
          <button
            type="button"
            onClick={toggleDropdown}
            className="
              flex items-center justify-center w-8 h-8 rounded-full
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
            "
          >
            <span className="material-icons text-gray-600 dark:text-gray-400">
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
          className="
            bg-white dark:bg-[rgb(47,47,47)]
            border-2 border-[#a84383] dark:border-[#e062b1]
            rounded-2xl shadow-xl overflow-y-auto
          "
        >
          <div className="p-2">
            {/* Bouton "Tout sélectionner" */}
            {filteredPredefined.length > 0 && (
              <button
                type="button"
                onClick={selectAll}
                className="
                  w-full text-left px-3 py-2 rounded-xl mb-2
                  bg-[#a84383] dark:bg-[#e062b1]
                  text-white font-medium
                  hover:bg-[#8d3a6e] dark:hover:bg-[#c54d9a]
                  transition-colors flex items-center gap-2
                "
              >
                <span className="material-icons text-sm">done_all</span>
                Tout sélectionner
              </button>
            )}

            {/* Liste des emails prédéfinis */}
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
              Sélectionnez un ou plusieurs destinataires :
            </div>
            {filteredPredefined.length > 0 ? (
              filteredPredefined.map(({ name, email }, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectPredefinedEmail(email)}
                  className="
                    w-full text-left px-3 py-2 rounded-xl
                    hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50
                    transition-colors flex items-start gap-2
                  "
                >
                  <span className="material-icons text-[#a84383] dark:text-[#e062b1] text-sm mt-0.5">
                    person
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{email}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Tous les destinataires ont été sélectionnés
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

