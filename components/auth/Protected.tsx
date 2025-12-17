import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { UserRole } from '../../lib/permissions';

interface ProtectedProps {
    children: React.ReactNode;
    permission?: string;
    role?: UserRole;
    fallback?: React.ReactNode;
    requireAll?: boolean; // Si true, nécessite toutes les permissions
    permissions?: string[]; // Plusieurs permissions
}

/**
 * Composant pour protéger du contenu basé sur les permissions
 * 
 * Usage:
 * <Protected permission="documents.create">
 *   <Button>Créer un document</Button>
 * </Protected>
 * 
 * <Protected role="admin">
 *   <AdminPanel />
 * </Protected>
 */
export const Protected: React.FC<ProtectedProps> = ({
    children,
    permission,
    role,
    permissions,
    requireAll = false,
    fallback = null,
}) => {
    const { can, hasRole } = usePermissions();

    let hasAccess = true;

    // Vérification par permission unique
    if (permission) {
        hasAccess = can(permission);
    }

    // Vérification par rôle
    if (role && hasAccess) {
        hasAccess = hasRole(role);
    }

    // Vérification par permissions multiples
    if (permissions && permissions.length > 0) {
        if (requireAll) {
            // Toutes les permissions requises
            hasAccess = permissions.every(p => can(p));
        } else {
            // Au moins une permission requise
            hasAccess = permissions.some(p => can(p));
        }
    }

    return hasAccess ? <>{children}</> : <>{fallback}</>;
};
