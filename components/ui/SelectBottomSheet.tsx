import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import BottomSheet from './BottomSheet';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectBottomSheetProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  'aria-label'?: string;
  renderTrigger?: (props: {
    value: string;
    label: string;
    isOpen: boolean;
    onClick: () => void;
  }) => React.ReactNode;
}

const SelectBottomSheet: React.FC<SelectBottomSheetProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  className = '',
  buttonClassName = '',
  disabled = false,
  'aria-label': ariaLabel,
  renderTrigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder || 'Sélectionner';

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <>
      {/* Version Desktop - Select natif */}
      <div className={`hidden md:block ${className}`}>
        {renderTrigger ? (
          <div className="relative">
            {renderTrigger({ 
              value, 
              label: displayLabel, 
              isOpen: false,
              onClick: () => {} 
            })}
            <select
              value={value}
              onChange={handleNativeChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
              aria-label={ariaLabel}
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="relative">
            <select
              value={value}
              onChange={handleNativeChange}
              disabled={disabled}
              className={`w-full appearance-none cursor-pointer px-4 py-2.5 pr-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 ${buttonClassName}`}
              aria-label={ariaLabel}
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Version Mobile - Bottom Sheet */}
      <div className={`block md:hidden ${className}`}>
        {renderTrigger ? (
          renderTrigger({ 
            value, 
            label: displayLabel, 
            isOpen,
            onClick: () => !disabled && setIsOpen(true)
          })
        ) : (
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className={`w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
            aria-label={ariaLabel}
          >
            <span>{displayLabel}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </button>
        )}

        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={label || 'Sélectionner une option'}
        >
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all
                  ${value === option.value
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span className="font-medium">{option.label}</span>
                {value === option.value && <Check className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      </div>
    </>
  );
};

export default SelectBottomSheet;
