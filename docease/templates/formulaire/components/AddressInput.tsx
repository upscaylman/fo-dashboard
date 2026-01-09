import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface AddressInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string, postalCode: string, city: string) => void;
  icon?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  resetKey?: string | number; // Pour forcer le reset quand on change de page
}

interface AddressFeature {
  properties: {
    label: string;
    name: string;
    postcode: string;
    city: string;
    context: string;
  };
}

export const AddressInput: React.FC<AddressInputProps> = ({
  label,
  value,
  onChange,
  onAddressSelect,
  icon,
  required,
  error: externalError,
  placeholder,
  resetKey
}) => {
  const [addresses, setAddresses] = useState<AddressFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);
  const hasUserTypedRef = useRef(false);
  // Initialiser avec la valeur actuelle pour éviter de déclencher une recherche au montage
  const lastSearchedValueRef = useRef<string>(value);
  const initialMountRef = useRef(true);

  const showError = !!externalError;

  const wrapperClass = "relative group";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1";
  const baseInputClass = `w-full bg-[#fdfbff] dark:bg-[rgb(37,37,37)] border-2 text-[#1c1b1f] dark:text-white text-base rounded-2xl py-3 outline-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${icon ? 'pl-12 pr-4' : 'px-4'}`;
  const inputClass = `${baseInputClass} ${
    showError
      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
      : 'border-[#e7e0ec] dark:border-[rgb(75,85,99)] focus:border-[#a84383] focus:ring-4 focus:ring-[#a84383]/10'
  }`;

  // Rechercher les adresses avec l'API officielle
  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.features || []);
        if (data.features && data.features.length > 0) {
          setShowSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresse:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    // Ignorer le premier rendu si une valeur existe déjà (retour sur la page)
    if (initialMountRef.current) {
      initialMountRef.current = false;
      if (value) {
        // Si une valeur existe au montage, la marquer comme déjà validée
        lastSearchedValueRef.current = value;
      }
      return;
    }

    // Ne pas rechercher si on vient de sélectionner une adresse
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    // NE PAS rechercher si la valeur n'a pas changé depuis la dernière recherche
    // Cela évite de relancer la recherche quand on revient sur la page avec une valeur déjà remplie
    if (value === lastSearchedValueRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (value.length >= 3) {
        hasUserTypedRef.current = true;
        lastSearchedValueRef.current = value;
        searchAddresses(value);
      } else {
        setAddresses([]);
        setShowSuggestions(false);
        hasUserTypedRef.current = false;
        lastSearchedValueRef.current = '';
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, searchAddresses]);

  // Sélectionner une adresse
  const selectAddress = (feature: AddressFeature) => {
    const { name, postcode, city } = feature.properties;
    isSelectingRef.current = true;
    hasUserTypedRef.current = false;
    lastSearchedValueRef.current = name; // Marquer cette valeur comme déjà recherchée
    setShowSuggestions(false);
    setAddresses([]);
    onChange(name);
    if (onAddressSelect) {
      onAddressSelect(name, postcode, city);
    }
  };

  // Calculer la position du dropdown
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current && showSuggestions) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'absolute',
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 10000
      });
    }
  }, [showSuggestions]);

  // Mettre à jour la position
  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showSuggestions, updateDropdownPosition]);

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    if (!showSuggestions) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ne pas fermer si on clique dans l'input ou le dropdown
      const isInInput = inputRef.current?.contains(target);
      const isInDropdown = dropdownRef.current?.contains(target);
      
      if (!isInInput && !isInDropdown) {
        setShowSuggestions(false);
        setAddresses([]);
        hasUserTypedRef.current = false;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  // Nettoyer les suggestions quand resetKey change (changement de page)
  useEffect(() => {
    setAddresses([]);
    setShowSuggestions(false);
    hasUserTypedRef.current = false;
    // NE PAS réinitialiser lastSearchedValueRef pour garder la mémoire de la valeur validée
  }, [resetKey]);

  return (
    <>
      <div className={wrapperClass}>
        <label className={labelClass}>
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className={inputClass}
            placeholder={placeholder || " "}
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              // Si l'utilisateur modifie manuellement, réinitialiser la mémoire pour permettre une nouvelle recherche
              if (newValue !== lastSearchedValueRef.current) {
                lastSearchedValueRef.current = '';
              }
              onChange(newValue);
            }}
            onFocus={() => {
              // Ne montrer les suggestions que si l'utilisateur a déjà tapé
              if (addresses.length > 0 && hasUserTypedRef.current) {
                setShowSuggestions(true);
                updateDropdownPosition();
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
                setAddresses([]);
                hasUserTypedRef.current = false;
                // NE PAS réinitialiser lastSearchedValueRef pour garder la mémoire de la valeur validée
              }, 200);
            }}
            required={required}
            aria-invalid={showError ? 'true' : 'false'}
          />
          {icon && <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">{icon}</span>}
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
              <div className="w-5 h-5 border-2 border-[#a84383] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {showError && (
          <div className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{externalError}</span>
          </div>
        )}
      </div>

      {/* Portail pour les suggestions - monté dans body */}
      {showSuggestions && addresses.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-white dark:bg-[rgb(47,47,47)] border-2 border-[#a84383] dark:border-[#e062b1] rounded-2xl shadow-xl max-h-60 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">Sélectionnez une adresse :</div>
            {addresses.map((feature, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectAddress(feature)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="material-icons text-[#a84383] dark:text-[#e062b1] text-sm mt-0.5">place</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1c1b1f] dark:text-[rgb(255,255,255)] truncate">{feature.properties.name}</div>
                    <div className="text-xs text-gray-500 dark:text-[rgb(229,231,235)] truncate">{feature.properties.postcode} {feature.properties.city}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

