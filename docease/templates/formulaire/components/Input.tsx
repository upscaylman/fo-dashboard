import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { validateField } from '../utils/validation';
import { TimePicker } from './TimePicker';
import { DatePicker } from './DatePicker';

// Fonction pour formater une date en format français (ex: "19 mai 2026")
const formatDateToFrench = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  type?: 'text' | 'email' | 'textarea' | 'date' | 'time' | 'select';
  options?: string[];
  icon?: string;
  error?: string;
  onValidate?: (isValid: boolean, error?: string) => void;
  fieldId?: string;
  hasUppercaseToggle?: boolean;
  onUppercaseChange?: (isUppercase: boolean) => void;
  forceUppercase?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  options,
  icon,
  className = '',
  required,
  error: externalError,
  onValidate,
  fieldId,
  hasUppercaseToggle,
  onUppercaseChange,
  forceUppercase,
  ...props
}) => {
  const [internalError, setInternalError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  // 'none' = pas de transformation, 'upper' = majuscules, 'lower' = minuscules
  const [caseMode, setCaseMode] = useState<'none' | 'upper' | 'lower'>('none');
  // État pour le DatePicker personnalisé
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  // État pour le TimePicker personnalisé
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  // État pour la modal mobile des selects
  const [showMobileSelect, setShowMobileSelect] = useState(false);
  // Détection mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const error = externalError || internalError;
  // Afficher l'erreur si elle vient de l'extérieur (validation globale) OU si le champ a été touché
  const showError = externalError ? true : (touched && internalError);

  const wrapperClass = "relative group";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1 min-h-[28px] flex items-center";
  const baseInputClass = `w-full bg-[#fdfbff] dark:bg-[rgb(37,37,37)] border-2 text-[#1c1b1f] dark:text-white text-base rounded-2xl py-3 outline-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${icon ? 'pl-12 pr-4' : 'px-4'}`;
  const inputClass = `${baseInputClass} ${
    showError
      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
      : 'border-[#e7e0ec] dark:border-[rgb(75,85,99)] focus:border-[#a84383] focus:ring-4 focus:ring-[#a84383]/10'
  }`;

  // Validation en temps réel
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched(true);

    if (fieldId && (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value) {
      const result = validateField(
        (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value,
        fieldId,
        label,
        required
      );

      setInternalError(result.error);
      onValidate?.(result.isValid, result.error);
    }

    // Appeler le onBlur original si fourni
    if (props.onBlur) {
      props.onBlur(e as any);
    }
  }, [fieldId, label, required, onValidate, props]);

  if (type === 'textarea') {
    return (
      <div className={`${wrapperClass} ${className}`}>
        <label className={labelClass}>
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        <div className="relative">
          <textarea
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder={props.placeholder || " "}
            required={required}
            onBlur={handleBlur}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
          {icon && <span className="material-icons absolute left-4 top-4 text-gray-400 dark:text-gray-500 pointer-events-none">{icon}</span>}
        </div>
        {showError && (
          <div id={`${fieldId}-error`} className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'select') {
    // S'assurer que la valeur est toujours une chaîne (jamais undefined)
    const selectValue = (props.value as string) || '';

    // Exclure 'value' des props pour éviter qu'il écrase notre valeur contrôlée
    const { value: _, onChange: originalOnChange, ...selectProps } = props as React.SelectHTMLAttributes<HTMLSelectElement>;

    const handleSelectOption = (optionValue: string) => {
      if (originalOnChange) {
        const syntheticEvent = {
          target: { value: optionValue }
        } as React.ChangeEvent<HTMLSelectElement>;
        originalOnChange(syntheticEvent);
      }
      setShowMobileSelect(false);
    };

    return (
      <div className={`${wrapperClass} ${className}`}>
        <label className={labelClass}>
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        <div className="relative">
          {/* Version desktop: select natif */}
          {!isMobile ? (
            <select
              className={`${inputClass} appearance-none cursor-pointer`}
              required={required}
              onBlur={handleBlur}
              aria-invalid={showError ? 'true' : 'false'}
              aria-describedby={showError ? `${fieldId}-error` : undefined}
              {...selectProps}
              onChange={originalOnChange}
              value={selectValue}
            >
              <option value="">Sélectionner...</option>
              {options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            /* Version mobile: bouton qui ouvre la modal */
            <button
              type="button"
              onClick={() => setShowMobileSelect(true)}
              className={`${inputClass} appearance-none cursor-pointer text-left flex items-center`}
            >
              <span className={selectValue ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                {selectValue || 'Sélectionner...'}
              </span>
            </button>
          )}
          {icon && <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>}
          <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
        </div>
        {showError && (
          <div id={`${fieldId}-error`} className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Modal mobile pour select */}
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

              {/* Liste des options */}
              <div className="flex-1 overflow-y-auto p-2">
                {options?.map((opt, index) => {
                  const isSelected = selectValue === opt;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`
                        w-full text-left px-4 py-4 rounded-xl mb-1
                        flex items-center justify-between transition-colors
                        ${isSelected 
                          ? 'bg-[#ffecf8] dark:bg-[#4a1a36]' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{opt}</span>
                      {isSelected && (
                        <span className="material-icons text-[#a84383] dark:text-[#e062b1]">check_circle</span>
                      )}
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
  }

  // Gestion du toggle majuscules/minuscules (alterne entre none -> upper -> lower -> none)
  const handleCaseToggle = () => {
    const nextMode = caseMode === 'none' ? 'upper' : caseMode === 'upper' ? 'lower' : 'none';
    setCaseMode(nextMode);
    onUppercaseChange?.(nextMode === 'upper');
    
    // Transformer la valeur actuelle seulement si on passe à upper ou lower
    if (props.onChange && props.value && nextMode !== 'none') {
      const currentValue = String(props.value);
      const transformedValue = nextMode === 'upper' 
        ? currentValue.toUpperCase() 
        : currentValue.toLowerCase();
      const syntheticEvent = {
        target: { value: transformedValue }
      } as React.ChangeEvent<HTMLInputElement>;
      (props.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(syntheticEvent);
    }
  };

  // Transformer la casse à la saisie selon le mode actif ou forceUppercase
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ForceUppercase a la priorité
    if (forceUppercase) {
      e.target.value = e.target.value.toUpperCase();
    } else if (hasUppercaseToggle && caseMode !== 'none') {
      if (caseMode === 'upper') {
        e.target.value = e.target.value.toUpperCase();
      } else if (caseMode === 'lower') {
        e.target.value = e.target.value.toLowerCase();
      }
    }
    if (props.onChange) {
      (props.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(e);
    }
  };

  // Gérer le changement de date pour formater en français
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value; // Format YYYY-MM-DD
    const frenchDate = formatDateToFrench(isoDate);
    
    // Créer un événement synthétique avec la date formatée en français
    const syntheticEvent = {
      ...e,
      target: { ...e.target, value: frenchDate }
    } as React.ChangeEvent<HTMLInputElement>;
    
    if (props.onChange) {
      (props.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(syntheticEvent);
    }
  };

  // Formater l'heure en format français (ex: "09h00")
  const formatTimeToFrench = (timeString: string): string => {
    if (!timeString) return '';
    // timeString est au format HH:MM
    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) return timeString;
    return `${hours}h${minutes}`;
  };

  // Obtenir l'icône et le label selon le mode
  const getCaseIcon = () => {
    if (caseMode === 'upper') return 'keyboard_arrow_up';
    if (caseMode === 'lower') return 'keyboard_arrow_down';
    return 'text_format'; // Mode 'none' - icône neutre
  };
  const getCaseLabel = () => {
    if (caseMode === 'upper') return 'ABC';
    if (caseMode === 'lower') return 'abc';
    return 'Aa'; // Mode 'none' - mixte
  };
  const getCaseTitle = () => {
    if (caseMode === 'upper') return 'Majuscules - Cliquer pour minuscules';
    if (caseMode === 'lower') return 'Minuscules - Cliquer pour desactiver';
    return 'Casse libre - Cliquer pour majuscules';
  };

  // Déterminer le handler onChange approprié
  const getOnChangeHandler = () => {
    if (type === 'date') return handleDateChange;
    if (hasUppercaseToggle || forceUppercase) return handleInputChange;
    return props.onChange as any;
  };

  // Gérer la sélection de date depuis le DatePicker
  const handleDatePickerSelect = (date: string) => {
    if (props.onChange) {
      const syntheticEvent = {
        target: { value: date }
      } as React.ChangeEvent<HTMLInputElement>;
      (props.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(syntheticEvent);
    }
  };

  // Rendu spécifique pour les champs de type date
  if (type === 'date') {
    return (
      <div className={`${wrapperClass} ${className}`}>
        <div className="flex items-center justify-between mb-1">
          <label className={labelClass} style={{ marginBottom: 0 }}>
            {label}
            {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
          </label>
        </div>
        <div className="relative">
          {/* Input texte visible qui affiche la date formatée en français */}
          <input
            type="text"
            className={`${inputClass} pr-12`}
            placeholder={props.placeholder || "Ex: 19 mai 2026"}
            required={required}
            onBlur={handleBlur}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            value={(props.value as string) || ''}
            onChange={(e) => {
              if (props.onChange) {
                (props.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(e);
              }
            }}
          />
          {/* Icône calendrier cliquable avec style IA */}
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-[#a84383] dark:hover:text-[#e062b1] hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50 transition-all"
            title="Ouvrir le calendrier"
          >
            <span className="material-icons text-base">calendar_today</span>
          </button>
          {icon && <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">{icon}</span>}
        </div>
        {showError && (
          <div id={`${fieldId}-error`} className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{error}</span>
          </div>
        )}
        
        {/* DatePicker Modal */}
        <DatePicker
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          onDateSelect={handleDatePickerSelect}
          initialDate={(props.value as string) || ''}
        />
      </div>
    );
  }

  // Gérer la sélection d'heure depuis le TimePicker
  const handleTimePickerSelect = (time: string) => {
    if (props.onChange) {
      const syntheticEvent = {
        target: { value: time }
      } as React.ChangeEvent<HTMLInputElement>;
      (props.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(syntheticEvent);
    }
  };

  // Rendu spécifique pour les champs de type time
  if (type === 'time') {
    return (
      <div className={`${wrapperClass} ${className}`}>
        <div className="flex items-center justify-between mb-1">
          <label className={labelClass} style={{ marginBottom: 0 }}>
            {label}
            {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
          </label>
        </div>
        <div className="relative">
          {/* Input texte visible qui affiche l'heure formatée en français */}
          <input
            type="text"
            className={`${inputClass} pr-12`}
            placeholder={props.placeholder || "Ex: 09h00"}
            required={required}
            onBlur={handleBlur}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            value={(props.value as string) || ''}
            onChange={(e) => {
              if (props.onChange) {
                (props.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(e);
              }
            }}
          />
          {/* Icône horloge cliquable avec style IA */}
          <button
            type="button"
            onClick={() => setIsTimePickerOpen(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-[#a84383] dark:hover:text-[#e062b1] hover:bg-[#ffecf8] dark:hover:bg-[#4a1a36]/50 transition-all"
            title="Sélectionner l'heure"
          >
            <span className="material-icons text-base">schedule</span>
          </button>
          {icon && <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">{icon}</span>}
        </div>
        {showError && (
          <div id={`${fieldId}-error`} className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
            <span className="material-icons text-sm">error</span>
            <span>{error}</span>
          </div>
        )}
        
        {/* TimePicker Modal */}
        <TimePicker
          isOpen={isTimePickerOpen}
          onClose={() => setIsTimePickerOpen(false)}
          onTimeSelect={handleTimePickerSelect}
          initialTime={(props.value as string) || ''}
        />
      </div>
    );
  }

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <label className={labelClass} style={{ marginBottom: 0 }}>
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        {hasUppercaseToggle && (
          <button
            type="button"
            onClick={handleCaseToggle}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200
              ${caseMode === 'upper'
                ? 'bg-[#a84383] text-white shadow-sm' 
                : caseMode === 'lower'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
              }
            `}
            title={getCaseTitle()}
          >
            <span className="material-icons text-sm">{getCaseIcon()}</span>
            <span>{getCaseLabel()}</span>
          </button>
        )}
      </div>
      <div className="relative">
        <input
          type={type}
          className={`${inputClass} ${forceUppercase ? 'uppercase' : caseMode === 'upper' ? 'uppercase' : caseMode === 'lower' ? 'lowercase' : ''}`}
          placeholder={props.placeholder || " "}
          required={required}
          onBlur={handleBlur}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={getOnChangeHandler()}
        />
        {icon && <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">{icon}</span>}
      </div>
      {showError && (
        <div id={`${fieldId}-error`} className="flex items-center gap-1 mt-1 ml-1 text-sm text-red-600 animate-[fadeIn_0.2s]" role="alert">
          <span className="material-icons text-sm">error</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Exporter la fonction de formatage pour une utilisation externe
export { formatDateToFrench };
