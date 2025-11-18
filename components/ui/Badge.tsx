import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const baseClasses = 'px-2.5 py-1 text-xs font-semibold rounded-full';
  
  const variantClasses = {
    default: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    info: 'bg-slate-100 text-slate-700',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return <span className={classes}>{children}</span>;
};

export default Badge;

