import React from 'react';
import { UserRole, ROLE_LABELS, ROLE_COLORS } from '../../lib/permissions';

interface RoleBadgeProps {
    role: UserRole;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

/**
 * Badge visuel pour afficher le rôle d'un utilisateur
 * 
 * Usage:
 * <RoleBadge role="admin" />
 * <RoleBadge role="secretary" size="lg" />
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
    role,
    size = 'md',
    showIcon = false
}) => {
    const colors = ROLE_COLORS[role];
    const label = ROLE_LABELS[role];

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const iconSize = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <span
            className={`
        inline-flex items-center gap-1.5
        rounded-full font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
      `}
        >
            {showIcon && (
                <svg className={iconSize[size]} fill="currentColor" viewBox="0 0 20 20">
                    {role === 'super_admin' && (
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    )}
                    {(role === 'secretary_general' || role === 'secretary_federal') && (
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    )}
                    {role === 'secretary' && (
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    )}
                </svg>
            )}
            {label}
        </span>
    );
};
