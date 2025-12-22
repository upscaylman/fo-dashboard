import { useAuth } from '../context/AuthContext';
import { hasPermission, hasMinimumRole, canAccessResource, UserRole } from '../lib/permissions';

/**
 * Hook personnalisé pour gérer les permissions dans les composants React
 * IMPORTANT: Lors de l'impersonation, utilise le rôle de l'utilisateur impersonné
 * pour refléter fidèlement son expérience
 */
export const usePermissions = () => {
    const { user, realUser, isImpersonating } = useAuth();

    // Lors de l'impersonation, on utilise le rôle de l'utilisateur impersonné
    // pour que le super_admin voie exactement ce que l'utilisateur voit
    const effectiveRole = user?.role as UserRole | undefined;

    /**
     * Vérifie si l'utilisateur a une permission spécifique
     * Utilise le rôle effectif (impersonné si applicable)
     */
    const can = (permission: string): boolean => {
        if (!effectiveRole) return false;
        return hasPermission(effectiveRole, permission);
    };

    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     * Utilise le rôle effectif (impersonné si applicable)
     */
    const isRole = (role: UserRole): boolean => {
        if (!effectiveRole) return false;
        return effectiveRole === role;
    };

    /**
     * Vérifie si l'utilisateur a au moins le niveau de rôle minimum
     * Utilise le rôle effectif (impersonné si applicable)
     */
    const hasRole = (minimumRole: UserRole): boolean => {
        if (!effectiveRole) return false;
        return hasMinimumRole(effectiveRole, minimumRole);
    };

    /**
     * Vérifie si l'utilisateur peut accéder à une ressource
     */
    const canAccess = (resourceOwnerId: string, permission: string): boolean => {
        if (!effectiveRole) return false;
        return canAccessResource(
            effectiveRole,
            resourceOwnerId,
            user?.id || '',
            permission
        );
    };

    /**
     * Vérifie si l'utilisateur effectif est super admin
     * Retourne false si on impersonne un autre rôle
     */
    const isSuperAdmin = (): boolean => {
        return isRole('super_admin');
    };

    /**
     * Vérifie si l'utilisateur effectif est au moins secrétaire général
     * Retourne false si on impersonne un rôle inférieur
     */
    const isAdmin = (): boolean => {
        return hasRole('secretary_general');
    };

    /**
     * Vérifie si le VRAI utilisateur (pas l'impersonné) est super admin
     * Utile pour les actions qui doivent rester accessibles pendant l'impersonation
     * (comme le bouton pour arrêter l'impersonation)
     */
    const isRealSuperAdmin = (): boolean => {
        if (isImpersonating && realUser) {
            return realUser.role === 'super_admin';
        }
        return effectiveRole === 'super_admin';
    };

    /**
     * Mode lecture seule: actif quand le super_admin impersonne un utilisateur
     * En mode lecture seule, aucune action ne doit être possible (création, modification, suppression)
     * Le super_admin peut uniquement observer l'interface
     */
    const isReadOnly = isImpersonating && isRealSuperAdmin();

    return {
        can,
        isRole,
        hasRole,
        canAccess,
        isSuperAdmin,
        isAdmin,
        isRealSuperAdmin,
        isImpersonating,
        isReadOnly,
        userRole: effectiveRole,
        effectiveUserId: user?.id
    };
};
