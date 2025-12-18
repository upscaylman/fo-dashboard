# Guide d'installation du système de notifications

## 📋 Prérequis
- Supabase projet configuré
- npm installé

## 🚀 Étapes d'installation

### 1. Installer les dépendances
```bash
npm install date-fns
```

### 2. Appliquer la migration SQL

Connectez-vous à votre projet Supabase et exécutez le fichier `MIGRATION_NOTIFICATIONS.sql` dans l'éditeur SQL.

Ou via la ligne de commande :
```powershell
# Contenu du fichier MIGRATION_NOTIFICATIONS.sql
Get-Content .\MIGRATION_NOTIFICATIONS.sql | Out-String
```

Copiez le contenu et exécutez-le dans le SQL Editor de Supabase Dashboard.

### 3. Vérifier l'installation

Vérifiez que la table `notifications` a été créée :
```sql
SELECT * FROM notifications LIMIT 10;
```

Vérifiez que les politiques RLS sont actives :
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

## ⚙️ Fonctionnement du système

### Rôles et permissions

#### Super Admin et Admin
- ✅ Voient **TOUTES** les notifications de **TOUS** les utilisateurs
- ✅ Reçoivent des notifications en temps réel pour chaque action effectuée par n'importe quel utilisateur
- ✅ Peuvent supprimer toutes les notifications

#### Secretary
- ✅ Voit **UNIQUEMENT** ses propres notifications
- ✅ Reçoit des notifications uniquement pour ses propres actions
- ✅ Peut supprimer uniquement ses propres notifications

### Types de notifications automatiques

Le système génère automatiquement des notifications pour :

1. **Document créé** (`document_created`)
   - Déclenché quand un utilisateur génère un document via DocEase
   - Les admins voient qui a créé quel document
   - L'utilisateur reçoit une confirmation

2. **Signature créée** (`signature_created`)
   - Déclenché quand un utilisateur signe un document via SignEase
   - Les admins voient qui a signé quel document
   - L'utilisateur reçoit une confirmation

### Notifications en temps réel

Le système utilise Supabase Realtime pour :
- ✅ Mise à jour instantanée du badge de notification
- ✅ Affichage immédiat des nouvelles notifications
- ✅ Synchronisation automatique entre onglets

## 🎨 Interface utilisateur

### Panneau de notifications
- **Badge rouge** : Nombre de notifications non lues
- **Liste scrollable** : Jusqu'à 50 dernières notifications
- **Actions rapides** :
  - Marquer comme lu (icône verte ✓)
  - Supprimer (icône rouge 🗑️)
  - Tout marquer comme lu
  - Supprimer toutes les notifications lues

### Informations affichées
- Icône selon le type (document, signature, etc.)
- Titre de la notification
- Message descriptif
- Nom de l'utilisateur qui a effectué l'action
- Temps relatif ("il y a 2 minutes", "il y a 1 heure", etc.)
- Point bleu pour les notifications non lues

## 📊 Données stockées

Chaque notification contient :
```typescript
{
  id: string;              // UUID unique
  user_id: string;         // Destinataire de la notification
  actor_id: string;        // Utilisateur qui a fait l'action
  type: string;            // Type de notification
  title: string;           // Titre court
  message?: string;        // Description détaillée
  data?: any;              // Données JSON additionnelles
  read: boolean;           // État de lecture
  created_at: string;      // Date de création
}
```

## 🔧 Ajouter des notifications personnalisées

### Dans votre code TypeScript/React
```typescript
import { supabase } from '../lib/supabase';

// Créer une notification manuelle
await supabase.from('notifications').insert({
  user_id: 'uuid-du-destinataire',
  actor_id: 'uuid-de-lacteur',
  type: 'user_action',
  title: 'Action effectuée',
  message: 'Description de l\'action',
  data: { custom: 'data' }
});
```

### Depuis SQL (pour notifier tous les admins)
```sql
SELECT notify_admins(
  'uuid-de-lacteur'::UUID,
  'custom_event',
  'Titre de la notification',
  'Message détaillé',
  '{"key": "value"}'::JSONB
);
```

## 🐛 Troubleshooting

### Les notifications n'apparaissent pas
1. Vérifier que la migration a été appliquée : `SELECT * FROM notifications;`
2. Vérifier les politiques RLS : `SELECT * FROM pg_policies WHERE tablename = 'notifications';`
3. Vérifier que Realtime est activé : `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`

### Les admins ne voient pas toutes les notifications
Vérifier le rôle dans la table users :
```sql
SELECT id, email, role_level FROM users;
```

### Erreur "permission denied"
Vérifier que les politiques RLS sont bien créées et que l'utilisateur a le bon rôle.

## ✅ Test du système

### Test avec un secretary
1. Se connecter avec un compte secretary
2. Créer un document via DocEase
3. Vérifier qu'une notification apparaît dans le panneau
4. La notification doit être visible uniquement pour ce secretary

### Test avec un admin
1. Se connecter avec un compte admin
2. Créer un document via DocEase
3. Vérifier qu'une notification apparaît
4. Demander à un secretary de créer un document
5. L'admin doit voir les deux notifications (la sienne + celle du secretary)

## 📝 Notes importantes

- Les notifications sont limitées à 50 par utilisateur (affichage)
- Les notifications supprimées sont définitivement perdues
- Les admins peuvent supprimer n'importe quelle notification
- Le système est extensible : ajoutez facilement de nouveaux types de notifications
- Realtime fonctionne même avec plusieurs onglets ouverts
