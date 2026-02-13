import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Liste des regions metropolitaines et ultramarines de France
const REGIONS_FRANCE = [
  'Auvergne-Rhone-Alpes',
  'Bourgogne-Franche-Comte',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Ile-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Cote d\'Azur',
  'Guadeloupe',
  'Guyane',
  'Martinique',
  'La Reunion',
  'Mayotte',
];

interface RegionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  resetKey?: string | number;
}

export const RegionInput: React.FC<RegionInputProps> = ({
  label,
  value,
  onChange,
  icon,
  required,
  error: externalError,
  placeholder,
  resetKey,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  const showError = !!externalError;

  const wrapperClass = "relative group";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1 min-h-[28px] flex items-center";
  const baseInputClass = `w-full bg-[#fdfbff] dark:bg-[rgb(37,37,37)] border-2 text-[#1c1b1f] dark:text-white text-base rounded-2xl py-3 outline-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${icon ? 'pl-12 pr-4' : 'px-4'}`;
  const inputClass = `${baseInputClass} ${
    showError
      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
      : 'border-[#e7e0ec] dark:border-[rgb(75,85,99)] focus:border-[#a84383] focus:ring-4 focus:ring-[#a84383]/10'
  }`;

  // Filtrer les regions selon la saisie
  const filterRegions = useCallback((query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const normalizedQuery = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const filtered = REGIONS_FRANCE.filter((region) => {
      const normalizedRegion = region
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return normalizedRegion.includes(normalizedQuery);
    });

    setSuggestions(filtered);
    if (filtered.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  // Reagir aux changements de valeur
  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }
    filterRegions(value);
  }, [value, filterRegions]);

  // Selectionner une region
  const selectRegion = (region: string) => {
    isSelectingRef.current = true;
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(region);
  };

  // Calculer la position du dropdown
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current && showSuggestions) {
      const rect = inputRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      const shouldFlip = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      if (shouldFlip) {
        setDropdownStyle({
          position: 'absolute',
          bottom: `${viewportHeight - rect.top + 8}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 10000,
          maxHeight: `${Math.min(spaceAbove - 16, 256)}px`,
        });
      } else {
        setDropdownStyle({
          position: 'absolute',
          top: `${rect.bottom + 8}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 10000,
          maxHeight: `${Math.min(spaceBelow - 16, 256)}px`,
        });
      }
    }
  }, [showSuggestions]);

  // Mettre a jour la position
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
      const isInInput = inputRef.current?.contains(target);
      const isInDropdown = dropdownRef.current?.contains(target);

      if (!isInInput && !isInDropdown) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  // Nettoyer les suggestions quand resetKey change
  useEffect(() => {
    setSuggestions([]);
    setShowSuggestions(false);
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
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (value.length >= 1) {
                filterRegions(value);
              } else {
                // Afficher toutes les regions si le champ est vide
                setSuggestions(REGIONS_FRANCE);
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
                setSuggestions([]);
              }, 200);
            }}
            required={required}
            aria-invalid={showError ? 'true' : 'false'}
          />
          {icon && <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">{icon}</span>}
        </div>

        {showError && (
          <div className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{externalError}</span>
          </div>
        )}
      </div>

      {/* Portail pour les suggestions */}
      {showSuggestions && suggestions.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-white dark:bg-[rgb(47,47,47)] border-2 border-[#a84383] dark:border-[#e062b1] rounded-2xl shadow-xl overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">Selectionnez une region :</div>
            {suggestions.map((region, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectRegion(region)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="material-icons text-[#a84383] dark:text-[#e062b1] text-sm mt-0.5">map</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1c1b1f] dark:text-[rgb(255,255,255)] truncate">{region}</div>
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
