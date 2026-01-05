import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'tonal';
  icon?: string;
  label?: string;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  label,
  className = '',
  fullWidth,
  isLoading = false,
  loadingText,
  disabled,
  ...props
}) => {
  const baseStyles = "relative inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium transition-all duration-300 rounded-full overflow-hidden ripple disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

  const variants = {
    primary: "bg-[#a84383] text-white hover:bg-[#8f366e] shadow-md hover:shadow-lg",
    secondary: "bg-[#dd60b0] text-white hover:bg-[#c24a96] shadow-md hover:shadow-lg",
    tonal: "bg-[#ffd8ec] text-[#a84383] hover:bg-[#ffcce4]",
    outlined: "border-2 border-[#2f2f2f] text-[#a64182] hover:bg-[#a64182]/5 bg-white",
    text: "text-[#a84383] hover:bg-[#a84383]/10 bg-transparent px-3",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-live="polite"
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" color={variant === 'outlined' ? '#a64182' : '#ffffff'} />
          <span>{loadingText || label || 'Chargement...'}</span>
        </>
      ) : (
        <>
          {icon && <span className="material-icons text-xl leading-none">{icon}</span>}
          {label && <span>{label}</span>}
          {props.children}
        </>
      )}
    </button>
  );
};
