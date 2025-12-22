import React, { useState, useCallback } from 'react';
import { validateField } from '../utils/validation';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label: string;
  type?: 'text' | 'email' | 'textarea' | 'date' | 'select';
  options?: string[];
  icon?: string;
  error?: string;
  onValidate?: (isValid: boolean, error?: string) => void;
  fieldId?: string;
  hasUppercaseToggle?: boolean;
  onUppercaseChange?: (isUppercase: boolean) => void;
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
  ...props
}) => {
  const [internalError, setInternalError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  // 'upper' = majuscules, 'lower' = minuscules
  const [caseMode, setCaseMode] = useState<'upper' | 'lower'>('lower');

  const error = externalError || internalError;
  // Afficher l'erreur si elle vient de l'extérieur (validation globale) OU si le champ a été touché
  const showError = externalError ? true : (touched && internalError);

  const wrapperClass = "relative group";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1";
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
    const { value: _, ...selectProps } = props as React.SelectHTMLAttributes<HTMLSelectElement>;

    return (
      <div className={`${wrapperClass} ${className}`}>
        <label className={labelClass}>
          {label}
          {required && <span style={{ color: 'rgb(196, 35, 45)' }}> *</span>}
        </label>
        <div className="relative">
          <select
            className={`${inputClass} appearance-none cursor-pointer`}
            required={required}
            onBlur={handleBlur}
            aria-invalid={showError ? 'true' : 'false'}
            aria-describedby={showError ? `${fieldId}-error` : undefined}
            {...selectProps}
            value={selectValue}
          >
            <option value="">Sélectionner...</option>
            {options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {icon && <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>}
          <span className="material-icons absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
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

  // Gestion du toggle majuscules/minuscules (alterne entre upper et lower)
  const handleCaseToggle = () => {
    const newMode = caseMode === 'upper' ? 'lower' : 'upper';
    setCaseMode(newMode);
    onUppercaseChange?.(newMode === 'upper');
    
    // Transformer la valeur actuelle
    if (props.onChange && props.value) {
      const currentValue = String(props.value);
      const transformedValue = newMode === 'upper' 
        ? currentValue.toUpperCase() 
        : currentValue.toLowerCase();
      const syntheticEvent = {
        target: { value: transformedValue }
      } as React.ChangeEvent<HTMLInputElement>;
      (props.onChange as (e: React.ChangeEvent<HTMLInputElement>) => void)(syntheticEvent);
    }
  };

  // Transformer la casse à la saisie selon le mode actif
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasUppercaseToggle) {
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

  // Obtenir l'icône et le label selon le mode
  const getCaseIcon = () => caseMode === 'upper' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  const getCaseLabel = () => caseMode === 'upper' ? 'ABC' : 'abc';
  const getCaseTitle = () => caseMode === 'upper' 
    ? 'Majuscules - Cliquer pour minuscules' 
    : 'Minuscules - Cliquer pour majuscules';

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
                : 'bg-blue-500 text-white shadow-sm'
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
          className={`${inputClass} ${caseMode === 'upper' ? 'uppercase' : caseMode === 'lower' ? 'lowercase' : ''}`}
          placeholder={props.placeholder || " "}
          required={required}
          onBlur={handleBlur}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={hasUppercaseToggle ? handleInputChange : props.onChange as any}
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
