/**
 * Système de Permissions et Rôles
 * Définit les types, hiérarchies et fonctions helper pour le contrôle d'accès
 */

// ================================================
// TYPES
// ================================================

export type UserRole =
    | 'super_admin'
    | 'secretary_general'
    | 'secretary_federal'
    | 'secretary';

export type PermissionCategory =
    | 'documents'
    | 'users'
    | 'stats'
    | 'templates'
    | 'signatures'
    | 'settings';

export interface Permission {
    name: string;
    description: string;
    category: PermissionCategory;
}

// ================================================
// HIÉRARCHIE DES RÔLES
// ================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
    super_admin: 4,
    secretary_general: 3,
    secretary_federal: 2,
    secretary: 1,
};

// ================================================
// LABELS DES RÔLES (pour l'affichage)
// ================================================

export const ROLE_LABELS: Record<UserRole, string> = {
    super_admin: 'Super Administrateur',
    secretary_general: 'Secrétaire Général',
    secretary_federal: 'Secrétaire Fédéral',
    secretary: 'Secrétaire',
};

// ================================================
// PERMISSIONS PAR RÔLE
// ================================================

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    super_admin: ['*'], // Toutes les permissions

    secretary_general: [
        'documents.create',
        'documents.read.all',
        'documents.update.all',
        'documents.delete.all',
        'users.read',
        'stats.view.all',
        'stats.export',
        'templates.read',
        'templates.download',
        'templates.create',
        'templates.update',
        'templates.delete',
        'signatures.create.all',
        'signatures.view.all',
        'settings.view',
    ],

    secretary_federal: [
        'documents.create',
        'documents.read.all',
        'documents.update.all',
        'documents.delete.own',
        'users.read',
        'stats.view.all',
        'stats.export',
        'templates.read',
        'templates.download',
        'signatures.create.own',
        'signatures.view.all',
        'settings.view',
    ],

    secretary: [
        'documents.create',
        'documents.read.own',
        'documents.update.own',
        'documents.delete.own',
        'users.read',
        'stats.view.own',
        'templates.read',
        'templates.download',
        'signatures.create.own',
        'signatures.view.own',
    ],
};

// ================================================
// COULEURS DES RÔLES (pour les badges)
// ================================================

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; border: string }> = {
    super_admin: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
    },
    secretary_general: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800',
    },
    secretary_federal: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
    },
    secretary: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
    },
};

// ================================================
// FONCTIONS HELPER
// ================================================

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];

    // Super admin a toutes les permissions
    if (permissions.includes('*')) {
        return true;
    }

    return permissions.includes(permission);
}

/**
 * Vérifie si un rôle a au moins le niveau minimum requis
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Vérifie si un rôle peut effectuer une action sur une ressource
 */
export function canAccessResource(
    userRole: UserRole,
    resourceOwnerId: string,
    currentUserId: string,
    permission: string
): boolean {
    // Super admin peut absolument tout faire
    if (userRole === 'super_admin') {
        return true;
    }

    // Vérifier si l'utilisateur est propriétaire de la ressource
    const isOwner = resourceOwnerId === currentUserId;

    // Permissions "own" nécessitent d'être propriétaire
    if (permission.endsWith('.own')) {
        return isOwner && hasPermission(userRole, permission);
    }

    // Permissions "all" ne nécessitent pas d'être propriétaire
    if (permission.endsWith('.all')) {
        return hasPermission(userRole, permission);
    }

    // Par défaut, vérifier simplement la permission
    return hasPermission(userRole, permission);
}

/**
 * Récupère toutes les permissions d'un rôle
 */
export function getRolePermissions(userRole: UserRole): string[] {
    return ROLE_PERMISSIONS[userRole];
}

/**
 * Récupère les rôles disponibles pour un utilisateur (pour assignation)
 * Un utilisateur peut assigner des rôles inférieurs au sien
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
    const userLevel = ROLE_HIERARCHY[userRole];

    return (Object.keys(ROLE_HIERARCHY) as UserRole[]).filter(
        role => ROLE_HIERARCHY[role] < userLevel
    );
}

/**
 * Vérifie si un rôle peut gérer un autre rôle (promotion/rétrogradation)
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
    // Seulement si le manager a un niveau supérieur
    return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}
