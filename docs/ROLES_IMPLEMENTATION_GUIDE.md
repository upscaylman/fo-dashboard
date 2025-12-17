# 🎯 Guide d'Implémentation du Système de Rôles

## ✅ Ce qui a été créé

### Fichiers SQL
- **MIGRATION_ROLES.sql** - Script de migration complet

### Fichiers TypeScript
- **lib/permissions.ts** - Logique des permissions et rôles
- **hooks/usePermissions.ts** - Hook React pour vérifier les permissions
- **components/auth/Protected.tsx** - Composant pour protéger du contenu
- **components/auth/RoleBadge.tsx** - Badge visuel pour afficher les rôles
- **context/AuthContext.tsx** (modifié) - Récupère `role_level` depuis Supabase

---

## 📊 Hiérarchie des Rôles

| Rôle | Niveau | Description |
|------|--------|-------------|
| **Super Admin** | 6 | Accès total + gestion utilisateurs et paramètres |
| **Admin** | 5 | Gestion documents/templates/stats de tous |
| **Secrétaire Général** | 4 | Gestion documents + consultation stats globales |
| **Secrétaire** | 3 | Gestion de ses propres documents |
| **Assistant** | 2 | Permissions limitées |
| **Invité** | 1 | Lecture seule |

---

## 🚀 Étapes d'Installation

### 1. Exécuter la Migration SQL

1. Allez sur https://supabase.com/dashboard
2. Ouvrez votre projet
3. Cliquez sur **SQL Editor**
4. Créez une nouvelle query
5. Copiez-collez le contenu de **MIGRATION_ROLES.sql**
6. Cliquez sur **Run**
7. ✅ Attendez le message de succès

### 2. Assigner les Rôles aux Utilisateurs

Dans Supabase SQL Editor, exécutez :

```sql
-- Voir les utilisateurs actuels
SELECT id, email, name, role, role_level FROM users;

-- Assigner un rôle super_admin à votre compte
UPDATE users 
SET role_level = 'super_admin'
WHERE email = 'votre.email@fo-metaux.fr';

-- Exemples d'assignation
UPDATE users SET role_level = 'admin' WHERE email = 'admin@fo-metaux.fr';
UPDATE users SET role_level = 'secretary' WHERE email = 'secretary@fo-metaux.fr';
```

### 3. Redémarrer l'Application

Le serveur doit être redémarré pour prendre en compte les nouveaux fichiers :

```bash
# Arrêtez le serveur (Ctrl+C dans le terminal)
# Puis relancez
npm run dev
```

---

## 💻 Comment Utiliser dans le Code

### 1. Hook usePermissions

```tsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { can, hasRole, isAdmin, userRole } = usePermissions();
  
  // Vérifier une permission
  if (can('documents.create')) {
    // Afficher le bouton créer
  }
  
  // Vérifier un rôle
  if (hasRole('admin')) {
    // Afficher le panneau admin
  }
  
  // Vérifier si l'utilisateur est admin
  if (isAdmin()) {
    // Fonctionnalités admin
  }
  
  return <div>...</div>;
}
```

### 2. Composant Protected

```tsx
import { Protected } from '../components/auth/Protected';

function Dashboard() {
  return (
    <div>
      {/* Protéger par permission */}
      <Protected permission="documents.create">
        <button>Créer un document</button>
      </Protected>
      
      {/* Protéger par rôle */}
      <Protected role="admin">
        <AdminPanel />
      </Protected>
      
      {/* Avec fallback */}
      <Protected 
        permission="stats.view.all"
        fallback={<p>Accès refusé</p>}
      >
        <StatsPanel />
      </Protected>
      
      {/* Plusieurs permissions (au moins une) */}
      <Protected permissions={['documents.read.all', 'documents.read.own']}>
        <DocumentList />
      </Protected>
    </div>
  );
}
```

### 3. Badge de Rôle

```tsx
import { RoleBadge } from '../components/auth/RoleBadge';

function UserProfile({ user }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <RoleBadge role={user.role} size="md" showIcon />
    </div>
  );
}
```

---

## 🧪 Tests à Effectuer

### Test 1 : Vérifier les Rôles

1. Connectez-vous avec différents comptes
2. Vérifiez que le rôle s'affiche correctement dans le header
3. Testez chaque niveau de rôle

### Test 2 : Permissions Documents

**Super Admin / Admin / Secrétaire Général** :
- ✅ Peut voir tous les documents
- ✅ Peut créer des documents
- ✅ Peut modifier tous les documents

**Secrétaire / Assistant** :
- ✅ Peut créer des documents
- ✅ Peut voir ses propres documents uniquement
- ❌ Ne peut pas voir les documents des autres

**Invité** :
- ❌ Ne peut pas créer de documents
- ❌ Ne peut pas voir les documents

### Test 3 : Permissions Stats

**Admin / Secrétaire Général** :
- ✅ Voit toutes les statistiques

**Secrétaire / Assistant** :
- ✅ Voit ses propres statistiques uniquement

**Invité** :
- ❌ Ne voit pas les statistiques

---

## 🎨 Exemple d'Intégration dans le Header

```tsx
// components/layout/Header.tsx
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/auth/RoleBadge';

export const Header = () => {
  const { user } = useAuth();
  
  return (
    <header>
      <div>
        <span>{user?.name}</span>
        {user?.role && <RoleBadge role={user.role} />}
      </div>
    </header>
  );
};
```

## 🎨 Exemple dans la Sidebar

```tsx
// components/dashboard/Sidebar.tsx
import { Protected } from '../components/auth/Protected';

export const Sidebar = () => {
  return (
    <nav>
      {/* Visible par tous */}
      <Link to="/dashboard">Tableau de bord</Link>
      
      {/* Seulement pour ceux qui peuvent créer */}
      <Protected permission="documents.create">
        <Link to="/documents/new">Créer un document</Link>
      </Protected>
      
      {/* Seulement pour les admins */}
      <Protected role="admin">
        <Link to="/admin/users">Gestion utilisateurs</Link>
      </Protected>
      
      {/* Seulement pour admin et secrétaires généraux */}
      <Protected permissions={['stats.view.all']}>
        <Link to="/stats">Statistiques globales</Link>
      </Protected>
    </nav>
  );
};
```

---

## 🔧 Dépannage

### Erreur : "Property 'role' does not exist"
➜ Vérifiez que la migration SQL a bien été exécutée  
➜ Vérifiez que l'utilisateur a un `role_level` dans la table `users`

### Les permissions ne fonctionnent pas
➜ Vérifiez que `role_level` est bien récupéré depuis Supabase  
➜ Consultez la console : `console.log(user?.role)`

### Le badge ne s'affiche pas
➜ Vérifiez que le rôle est bien passé en props  
➜ Vérifiez dans `lib/permissions.ts` que le rôle existe

---

## ✅ Checklist de Vérification

- [ ] Migration SQL exécutée
- [ ] Rôles assignés aux utilisateurs existants
- [ ] Application redémarrée
- [ ] Badge de rôle visible dans le header
- [ ] Permissions testées pour chaque rôle
- [ ] Composants Protected fonctionnent
- [ ] RLS policies mises à jour

---

## 🎉 Prochaines Étapes

Une fois les rôles en place, vous pourrez :
1. Créer une interface de gestion des utilisateurs (CRUD)
2. Ajouter un système d'audit (qui a fait quoi)
3. Créer des rapports basés sur les rôles
4. Implémenter des workflows d'approbation

**Testez et dites-moi si tout fonctionne !** 🚀
