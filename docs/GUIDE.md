# 🚀 Guide d'intégration TeamEase
## Dashboard interne FO Métaux

## 📋 Vue d'ensemble

**TeamEase** est le dashboard interne de la Fédération FO Métaux. Il centralise :
1. **Gestion des utilisateurs** — Rôles, permissions, profils
2. **Présence en temps réel** — Qui est connecté, sur quelle page, quel outil
3. **Documents et statistiques** — Suivi des activités syndicales
4. **Intégration SignEase** — Signature électronique de documents
5. **Intégration DocEase** — Génération automatisée de documents

**Production** : https://fom-teamease.vercel.app

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│           TeamEase (React SPA sur Vercel)               │
│         https://fom-teamease.vercel.app                 │
└───────────────────────┬────────────────────────────────┘
                        │ POST /functions/v1/db-proxy
                        ▼
┌────────────────────────────────────────────────────────┐
│     Supabase Edge Function « db-proxy » v8             │
│     Opérations : SELECT, INSERT, UPDATE, DELETE,       │
│                  UPSERT, COUNT                         │
│     Case-insensitive (.toUpperCase())                  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│           Supabase PostgreSQL                          │
│     Tables : users, documents, active_sessions,        │
│     activities, templates, document_types, signatures  │
└────────────────────────────────────────────────────────┘
```

> **⚠️ PostgREST est définitivement en 503** (erreur PGRST002 — schema cache).
> Toutes les opérations base de données passent par l'Edge Function `db-proxy` v8.

---

## 🔌 Edge Function `db-proxy` v8

L'Edge Function est le point d'accès unique à la base de données. Elle est déployée à :
```
https://geljwonckfmdkaywaxly.supabase.co/functions/v1/db-proxy
```

### Opérations supportées

| Opération | Description |
|-----------|-------------|
| `SELECT` | Lecture avec filtres, order, limit |
| `INSERT` | Insertion simple ou multiple |
| `UPDATE` | Mise à jour avec filtres |
| `DELETE` | Suppression avec filtres |
| `UPSERT` | Insert ou Update (onConflict) |
| `COUNT` | Comptage avec filtres |

### Exemple d'appel

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/db-proxy`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    table: 'users',
    operation: 'SELECT',
    filters: { role_level: 'admin' },
    order: { column: 'created_at', ascending: false },
    limit: 10
  })
});
```

### Fonctions Helper (`lib/supabaseRetry.ts`)

```typescript
// Lecture
const users = await queryViaEdgeFunction('users', { role_level: 'admin' });

// Insertion
await insertViaEdgeFunction('activities', { type: 'login', user_id: '...' });

// Suppression
await deleteViaEdgeFunction('active_sessions', { user_id: '...' });
```

---

## 👥 Système de présence en temps réel

Le dashboard affiche les utilisateurs connectés grâce à la table `active_sessions`.

### Table `active_sessions`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | Clé primaire |
| `user_id` | uuid | Référence utilisateur |
| `user_email` | text | Email affiché |
| `user_name` | text | Nom affiché |
| `current_page` | text | Page actuelle (ex: "Dashboard") |
| `current_tool` | text | Outil actuel (TeamEase, SignEase, DocEase) |
| `last_activity` | timestamp | Dernière activité |
| `started_at` | timestamp | Début de session |
| `avatar_url` | text | URL de l'avatar |
| `metadata` | jsonb | Données supplémentaires |

### Hook `usePresence`

Le hook `usePresence` dans chaque application :
1. **Enregistre** la session au montage (INSERT via Edge Function)
2. **Met à jour** `last_activity` toutes les 30s (UPDATE)
3. **Supprime** la session au démontage (DELETE)
4. **Charge** la liste des sessions actives (SELECT)

Les 3 projets (TeamEase, SignEase, DocEase) partagent la même table `active_sessions` avec un champ `current_tool` qui identifie l'application source.

---

## 🔐 Authentification OAuth (Outlook)

Voir [OAUTH_OUTLOOK_SETUP.md](OAUTH_OUTLOOK_SETUP.md) pour le guide complet.

**Flux d'authentification** :
```
1. Utilisateur sur https://fom-teamease.vercel.app → clique "Se connecter avec Outlook"
2. → Redirection vers Azure AD (Microsoft login)
3. → Azure redirige vers https://geljwonckfmdkaywaxly.supabase.co/auth/v1/callback
4. → Supabase traite le token et redirige vers le Site URL
5. → L'utilisateur arrive sur https://fom-teamease.vercel.app (✅ Vercel)
```

**Configuration critique** :
- **Supabase > Authentication > URL Configuration** :
  - Site URL : `https://fom-teamease.vercel.app`
  - Redirect URLs : `https://fom-teamease.vercel.app/**`
- **Azure AD > App registrations > Authentication > Redirect URIs** :
  - `https://geljwonckfmdkaywaxly.supabase.co/auth/v1/callback`

> ⚠️ Si le Site URL pointe vers un ancien domaine (Netlify), l'utilisateur sera redirigé vers un site mort après authentification.

---

## 🛡️ Système de rôles

Voir [ROLES_IMPLEMENTATION_GUIDE.md](ROLES_IMPLEMENTATION_GUIDE.md) pour le guide complet.

| Rôle | Niveau | Permissions |
|------|--------|-------------|
| `super_admin` | 5 | Accès total, gestion des rôles |
| `admin` | 4 | Gestion utilisateurs, documents |
| `secretary` | 3 | Gestion documents, signatures |
| `member` | 2 | Lecture, signature |
| `viewer` | 1 | Lecture seule |

Les rôles sont stockés dans la table `users` (colonne `role_level`) et vérifiés via le hook `usePermissions`.

---

## 📁 Structure du projet

```
fo-metaux-dashboard/
├── components/
│   ├── auth/              # Protected, RoleBadge
│   ├── dashboard/         # Composants dashboard (stats, présence, activité)
│   ├── layout/            # Header, Sidebar, Footer
│   └── ui/                # Composants réutilisables (Button, Card, Modal…)
├── context/
│   ├── AuthContext.tsx     # Authentification Supabase
│   ├── BookmarkContext.tsx # Favoris utilisateur
│   ├── ThemeContext.tsx    # Thème clair/sombre
│   ├── ToastContext.tsx    # Notifications toast
│   └── MobileMenuContext.tsx
├── hooks/
│   ├── usePresence.ts     # Présence temps réel (active_sessions)
│   ├── useStats.ts        # Statistiques dashboard
│   ├── useNotifications.ts # Notifications
│   └── usePermissions.ts  # Vérification des permissions
├── lib/
│   ├── supabase.ts        # Client Supabase
│   ├── supabaseRetry.ts   # Helpers Edge Function (queryViaEdgeFunction…)
│   ├── permissions.ts     # Logique de permissions
│   └── database.types.ts  # Types Supabase générés
├── pages/
│   ├── DashboardPage.tsx   # Page principale
│   ├── LoginPage.tsx       # Connexion (OAuth Outlook)
│   ├── ProfilePage.tsx     # Profil utilisateur
│   └── RegisterPage.tsx    # Inscription
├── signease/              # Sous-projet SignEase (signature électronique)
├── docease/               # Sous-projet DocEase (génération de documents)
├── vercel.json            # Config Vercel (SPA rewrite, headers, cache)
├── vite.config.ts         # Config Vite
├── App.tsx                # Composant racine
├── index.tsx              # Point d'entrée
└── types.ts               # Types TypeScript partagés
```

---

## 🌐 Déploiement Vercel

Les 3 projets sont hébergés sur **Vercel** :

| Projet | Nom Vercel | URL | Dossier source |
|--------|-----------|-----|----------------|
| **TeamEase** (Dashboard) | `fom-teamease` | https://fom-teamease.vercel.app | racine `/` |
| **SignEase** (Signature) | `fom-signease` | https://fom-signease.vercel.app | `signease/` |
| **DocEase** (Documents) | `fom-docease` | https://fom-docease.vercel.app | `docease/templates/formulaire/` |

### Variables d'environnement TeamEase (5 vars sur Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `VITE_API_KEY` | Clé API interne |
| `VITE_GROQ_API_KEY` | Clé API Groq (IA) |
| `VITE_DOCEASE_NGROK_URL` | URL ngrok pour DocEase local |

### Variables d'environnement SignEase (11 vars sur Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Clé API Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine Firebase Auth |
| `VITE_FIREBASE_PROJECT_ID` | ID projet Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID sender Firebase |
| `VITE_FIREBASE_APP_ID` | ID app Firebase |
| `VITE_EMAILJS_SERVICE_ID` | Service EmailJS |
| `VITE_EMAILJS_TEMPLATE_ID` | Template EmailJS |
| `VITE_EMAILJS_PUBLIC_KEY` | Clé publique EmailJS |
| `VITE_SUPABASE_URL` | URL Supabase (présence) |
| `VITE_SUPABASE_ANON_KEY` | Clé Supabase (présence) |

### Commandes de déploiement

```bash
# Build local
npm run build

# Déployer en production
vercel --prod

# Push Git (déclenche déploiement auto si connecté)
git push fo-dashboard master
```

---

## 🚀 Démarrage rapide (développement local)

```bash
# 1. Cloner le repo
git clone https://github.com/upscaylman/fo-dashboard.git
cd fo-dashboard

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
# Créer .env.local avec les 5 variables ci-dessus

# 4. Démarrer le serveur de dev
npm run dev

# 5. Ouvrir http://localhost:5173
```

---

## 📦 Git

```bash
# Remote
git remote -v
# fo-dashboard → https://github.com/upscaylman/fo-dashboard.git

# Commit et push
git add -A
git commit -m "description du changement"
git push fo-dashboard master
```

---

## 📚 Documentation associée

| Fichier | Contenu |
|---------|---------|
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Configuration initiale Supabase |
| [OAUTH_OUTLOOK_SETUP.md](OAUTH_OUTLOOK_SETUP.md) | OAuth Microsoft/Outlook |
| [ROLES_IMPLEMENTATION_GUIDE.md](ROLES_IMPLEMENTATION_GUIDE.md) | Système de rôles |
| [NOTIFICATIONS_GUIDE.md](NOTIFICATIONS_GUIDE.md) | Système de notifications |
| [LOGIQUE_ROLES.md](LOGIQUE_ROLES.md) | Logique métier des rôles |

---

## ✅ Points clés à retenir

1. **PostgREST est mort** — Toutes les opérations passent par Edge Function `db-proxy` v8
2. **Hébergement Vercel** — Projets : `fom-teamease`, `fom-signease`, `fom-docease`
3. **OAuth** — Le Site URL Supabase doit pointer vers `https://fom-teamease.vercel.app`
4. **Présence partagée** — Les 3 apps alimentent la même table `active_sessions`
5. **Pas de backend Node.js** — Tout est serverless (Supabase + Edge Functions)
6. **Pas de Docker** — Déploiement direct sur Vercel
