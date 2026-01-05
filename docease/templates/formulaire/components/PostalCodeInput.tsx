import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PostalCodeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  skipAutoSearch?: boolean;
  resetKey?: string | number; // Pour forcer le reset quand on change de page
}

interface City {
  nom: string;
  code: string;
  codesPostaux: string[];
}

export const PostalCodeInput: React.FC<PostalCodeInputProps> = ({
  label,
  value,
  onChange,
  icon,
  required,
  error: externalError,
  placeholder,
  skipAutoSearch,
  resetKey
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [isManualInput, setIsManualInput] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUserTypedRef = useRef(false);
  const lastSearchedValueRef = useRef<string>('');

  const showError = !!externalError;

  const wrapperClass = "relative group";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1 ml-1";
  const baseInputClass = `w-full bg-[#fdfbff] border-2 text-[#1c1b1f] text-base rounded-2xl py-3 outline-none transition-all duration-200 placeholder:text-gray-400 ${icon ? 'pl-12 pr-4' : 'px-4'}`;
  const inputClass = `${baseInputClass} ${
    showError
      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
      : 'border-[#e7e0ec] focus:border-[#a84383] focus:ring-4 focus:ring-[#a84383]/10'
  }`;

  // Extraire le code postal du champ (5 premiers chiffres)
  const extractPostalCode = (text: string): string => {
    const match = text.match(/^\d{5}/);
    return match ? match[0] : '';
  };

  // Rechercher les villes à partir du code postal
  const searchCities = useCallback(async (postalCode: string) => {
    if (postalCode.length !== 5) {
      setCities([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux&format=json&geometry=centre`);
      if (response.ok) {
        const data: City[] = await response.json();
        setCities(data);
        if (data.length > 0) {
          setShowSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de ville:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Détecter le code postal et rechercher automatiquement (seulement si input manuel)
  useEffect(() => {
    if (skipAutoSearch || !isManualInput) {
      if (!isManualInput) setIsManualInput(true);
      return;
    }

    // NE PAS rechercher si la valeur n'a pas changé depuis la dernière recherche
    // Cela évite de relancer la recherche quand on revient sur la page avec une valeur déjà remplie
    if (value === lastSearchedValueRef.current) {
      return;
    }

    const postalCode = extractPostalCode(value);
    if (postalCode.length === 5) {
      hasUserTypedRef.current = true;
      lastSearchedValueRef.current = value;
      searchCities(postalCode);
    } else {
      setCities([]);
      setShowSuggestions(false);
      hasUserTypedRef.current = false;
      lastSearchedValueRef.current = '';
    }
  }, [value, searchCities, isManualInput, skipAutoSearch]);

  // Sélectionner une ville
  const selectCity = (city: City) => {
    const postalCode = extractPostalCode(value) || city.codesPostaux[0];
    const newValue = `${postalCode} ${city.nom}`;
    hasUserTypedRef.current = false;
    lastSearchedValueRef.current = newValue; // Marquer cette valeur comme déjà recherchée
    onChange(newValue);
    setShowSuggestions(false);
    setCities([]);
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

  // Nettoyer les suggestions quand resetKey change (changement de page)
  useEffect(() => {
    setCities([]);
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
              if (cities.length > 0 && hasUserTypedRef.current) {
                setShowSuggestions(true);
                updateDropdownPosition();
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
                setCities([]);
                hasUserTypedRef.current = false;
                // NE PAS réinitialiser lastSearchedValueRef pour garder la mémoire de la valeur validée
              }, 200);
            }}
            required={required}
            aria-invalid={showError ? 'true' : 'false'}
          />
          {icon && <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>}
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
      {showSuggestions && cities.length > 0 && createPortal(
        <div
          style={dropdownStyle}
          className="bg-white border-2 border-[#a84383] rounded-2xl shadow-xl max-h-60 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 font-medium">Sélectionnez une ville :</div>
            {cities.map((city) => (
              <button
                key={city.code}
                type="button"
                onClick={() => selectCity(city)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#ffecf8] transition-colors flex items-center gap-2"
              >
                <span className="material-icons text-[#a84383] text-sm">location_city</span>
                <span className="font-medium text-[#1c1b1f]">{city.nom}</span>
                <span className="text-xs text-gray-500 ml-auto">{city.codesPostaux[0]}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

