# Changelog - Dashboard FO Métaux

Toutes les modifications notables du projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Non publié] - 2025-12-18

### ✨ Ajouté
- **Téléchargement des documents DocEase** : Ajout d'un bouton de téléchargement dans l'onglet DocEase
  - Colonne "Actions" avec icône Download dans le tableau des documents
  - Support pour les documents avec `file_url` (téléchargement direct)
  - Alternative pour les documents sans URL : proposition d'ouvrir DocEase ou télécharger les métadonnées JSON
  - Bandeau informatif expliquant le fonctionnement du téléchargement
  - Migration SQL `MIGRATION_DOCEASE_FILE_URL.sql` pour ajouter la colonne `file_url`
  - Création du bucket Supabase Storage `docease-files` avec policies RLS
  - Guide d'intégration complet : `docs/INTEGRATION_DOCEASE_STORAGE.md`
  - Script de test PowerShell : `test-docease-upload.ps1` pour tester l'upload manuel

### 📝 Documentation
- Ajout de `docs/INTEGRATION_DOCEASE_STORAGE.md` : Guide complet d'intégration du stockage DocEase
- Mise à jour de `docease/docs/UTILISATION.md` : Intégration complète DocEase + Dashboard
- Nouvelle section "Dashboard FO Métaux : Suivi en Temps Réel" avec :
  - Centre de notifications détaillé
  - Explication des onglets du dashboard
  - Fonctionnalités en temps réel
  - Section technique pour administrateurs
- Script de test d'upload : `test-docease-upload.ps1`

### 🔧 Technique
- Interface `DoceaseDocument` mise à jour avec support `file_url` optionnel
- Fonction `handleDownloadDocument()` dans `DoceaseDocumentsTable.tsx`
- Gestion des cas : URL disponible vs URL manquante
- Toast informatif avec proposition d'ouvrir DocEase
- Export JSON des métadonnées en fallback

---

## [1.2.0] - 2025-12-17

### ✨ Ajouté
- **Système de notifications en temps réel** avec triggers PostgreSQL
- **Upload de fichiers** pour documents partagés (PDF, Word, Excel, Images, Vidéos)
- **Centre de notifications** avec badge, filtres par type, actions (marquer lu, supprimer)
- **Vue d'ensemble** réservée aux admins et super admins uniquement
- **Statistiques DocEase** avec tracking en temps réel des documents générés
- **Badge "Nouveau"** sur l'onglet DocEase montrant les documents des 7 derniers jours
- **Chatbot assistant** avec notifications et animation de rebond
- **Salariés actifs** : compteur basé sur l'activité réelle des 30 derniers jours

### 🎨 Interface
- **Avatars Dicebear** : Remplacement des emojis par 18 avatars générés (Felix, Aneka, Marie, etc.)
- **Logo cliquable** : Retour à l'accueil en cliquant sur le logo FO Métaux
- **Thème persistant** : Sauvegarde du thème sombre/clair dans le profil utilisateur
- **Badge notifications** : Animation pulse sur le centre de notifications

### 🔒 Sécurité
- **RLS policies** pour notifications : Admins voient tout, secrétaires voient uniquement leurs notifications
- **Triggers automatiques** : Création de notifications sur documents et signatures
- **Storage policies** : Public read, admin-only write/delete pour documents partagés

### 🗄️ Base de Données
- Table `notifications` avec colonnes : user_id, actor_id, type, title, message, data (JSONB), read
- Table `shared_documents` pour modèles et documents partagés
- Bucket Storage `shared-documents` (50MB limit)
- Triggers : `notify_on_document_created`, `notify_on_signature_created`
- Function : `notify_admins()` pour notifier tous les admins

### 📊 Migrations
- `MIGRATION_NOTIFICATIONS.sql` : Système de notifications complet
- `MIGRATION_STORAGE_BUCKET.sql` : Configuration Storage pour documents partagés
- `MIGRATION_ROLES.sql` : Système de rôles hiérarchiques
- `AUTO_ROLE_TRIGGER.sql` : Attribution automatique des rôles
- `UPDATE_USERS_RLS.sql` : Policies RLS sur la table users

### 🔧 Hooks & Composants
- Hook `useNotifications` : Gestion notifications avec Realtime
- Hook `useDoceaseStatus` : Vérification statut backend DocEase (ngrok)
- Composant `NotificationPanel` : Centre de notifications avec actions
- Composant `DoceaseDocumentsTable` : Tableau temps réel des documents DocEase
- Formatage date personnalisé (sans date-fns) : "à l'instant", "il y a X min/h/j"

### 🐛 Corrections
- **Loading state** : Centre de notifications affiche "Aucune notification" au lieu de "Chargement..." quand vide
- **Avatar persistence** : Fonction `refreshUser()` pour mettre à jour l'avatar immédiatement après sauvegarde
- **Real-time DocEase** : Ajout de `docease_documents` à la publication Realtime
- **Chatbot notification** : Badge disparaît quand chat ouvert, animation 1 seconde sur nouveau message

### 📝 Documentation
- `docs/NOTIFICATIONS_GUIDE.md` : Guide complet des notifications
- `docs/INTEGRATION_DOCEASE_TRACKING.md` : Intégration tracking DocEase
- `test-realtime.ps1` : Script de diagnostic pour vérifier Realtime et triggers
- Mise à jour `SUPABASE_SETUP.md` avec nouvelles tables et triggers

---

## [1.1.0] - 2025-12-16

### ✨ Ajouté
- **Authentification OAuth Outlook** pour connexion entreprise
- **Tableau de bord principal** avec statistiques globales
- **Onglets de navigation** : Vue d'ensemble, Salariés, Documents, DocEase
- **Profil utilisateur** avec sélection d'avatar et téléphone
- **Thème sombre/clair** avec persistance
- **Modèles & Documents** : Section de partage de fichiers

### 🎨 Interface
- Design moderne avec Tailwind CSS
- Cartes statistiques avec gradients et animations
- Sidebar responsive avec navigation mobile
- Footer avec liens vers DocEase

### 🔒 Sécurité
- Système de rôles : secretary, admin, super_admin
- Row Level Security (RLS) sur toutes les tables
- Authentification Supabase Auth

### 🗄️ Base de Données
- Tables : users, documents, signatures, templates, bookmarks
- Indexes pour optimisation des performances
- Triggers pour updated_at automatique

---

## [1.0.0] - 2025-12-15

### ✨ Initial Release
- Configuration initiale du projet React + Vite + TypeScript
- Connexion à Supabase
- Structure de base du dashboard
- Authentification simple par email
