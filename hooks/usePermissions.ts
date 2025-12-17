import { useAuth } from '../context/AuthContext';
import { hasPermission, hasMinimumRole, canAccessResource, UserRole } from '../lib/permissions';

/**
 * Hook personnalisé pour gérer les permissions dans les composants React
 */
export const usePermissions = () => {
    const { user } = useAuth();

    /**
     * Vérifie si l'utilisateur a une permission spécifique
     * @param permission - Nom de la permission (ex: 'documents.create')
     * @returns boolean
     */
    const can = (permission: string): boolean => {
        if (!user || !user.role) return false;
        return hasPermission(user.role as UserRole, permission);
    };

    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     * @param role - Le rôle exact à vérifier
     * @returns boolean
     */
    const isRole = (role: UserRole): boolean => {
        if (!user || !user.role) return false;
        return user.role === role;
    };

    /**
     * Vérifie si l'utilisateur a au moins le niveau de rôle minimum
     * @param minimumRole - Le rôle minimum requis
     * @returns boolean
     */
    const hasRole = (minimumRole: UserRole): boolean => {
        if (!user || !user.role) return false;
        return hasMinimumRole(user.role as UserRole, minimumRole);
    };

    /**
     * Vérifie si l'utilisateur peut accéder à une ressource
     * @param resourceOwnerId - ID du propriétaire de la ressource
     * @param permission - Permission requise
     * @returns boolean
     */
    const canAccess = (resourceOwnerId: string, permission: string): boolean => {
        if (!user || !user.role) return false;
        return canAccessResource(
            user.role as UserRole,
            resourceOwnerId,
            user.id || '',
            permission
        );
    };

    /**
     * Vérifie si l'utilisateur est super admin
     */
    const isSuperAdmin = (): boolean => {
        return isRole('super_admin');
    };

    /**
     * Vérifie si l'utilisateur est admin (admin ou super_admin)
     */
    const isAdmin = (): boolean => {
        return hasRole('admin');
    };

    return {
        can,
        isRole,
        hasRole,
        canAccess,
        isSuperAdmin,
        isAdmin,
        userRole: user?.role as UserRole | undefined
    };
};
