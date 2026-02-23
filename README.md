# Team<span style="color:red">Ease</span> — Dashboard FO Métaux

> Dashboard interne de la Fédération FO Métaux. Gestion des utilisateurs, documents, présence en temps réel, rôles et permissions.

**Production** : https://fom-teamease.vercel.app

---

## 🏗️ Architecture

```
Navigateur (React SPA)
        │
        ▼
  Vercel (hébergement)
        │
        ▼
  Supabase Edge Function « db-proxy » v8
        │  (INSERT, UPDATE, DELETE, UPSERT, SELECT, COUNT)
        ▼
  Supabase PostgreSQL
```

> **Note** : PostgREST est définitivement en 503 (PGRST002). Toutes les opérations base de données passent par l'Edge Function `db-proxy` v8 déployée sur Supabase.

---

## 🛠️ Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS, Lucide Icons |
| Auth | Supabase Auth (OAuth Azure AD / Outlook) |
| Base de données | Supabase PostgreSQL |
| Data access | Edge Function `db-proxy` v8 (pas de PostgREST) |
| Hébergement | **Vercel** — projet `fom-teamease` |
| Présence temps réel | Table `active_sessions` via Edge Function |

---

## 📁 Structure du projet

```
fo-metaux-dashboard/
├── components/          # Composants React (auth, dashboard, layout, ui)
├── context/             # Contexts React (Auth, Bookmark, Toast, Theme, MobileMenu)
├── docs/                # Documentation technique
├── hooks/               # Custom hooks (usePresence, useStats, useNotifications…)
├── lib/                 # Supabase client, permissions, supabaseRetry (Edge Function helpers)
├── pages/               # Pages (Dashboard, Login, Profile, Register)
├── public/              # PWA assets, manifest, service worker
├── signease/            # Sous-projet SignEase (signature électronique)
├── docease/             # Sous-projet DocEase (génération de documents)
├── App.tsx              # Composant racine
├── index.tsx            # Point d'entrée
├── types.ts             # Types TypeScript
├── vercel.json          # Configuration Vercel (SPA rewrite, headers, cache)
└── vite.config.ts       # Configuration Vite
```

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- Compte Supabase configuré (voir [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md))

### Installation

```bash
npm install
```

### Variables d'environnement

Créez un fichier `.env.local` :

```env
VITE_SUPABASE_URL=https://geljwonckfmdkaywaxly.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_API_KEY=votre_api_key
VITE_GROQ_API_KEY=votre_groq_key
VITE_DOCEASE_NGROK_URL=https://votre-ngrok-url.ngrok-free.app
```

### Développement

```bash
npm run dev
```

### Build production

```bash
npm run build
```

---

## 🌐 Déploiement Vercel

Le projet est déployé sur **Vercel** avec le nom `fom-teamease`.

```bash
# Déployer en production
vercel --prod
```

Les 5 variables d'environnement ci-dessus sont configurées dans le dashboard Vercel.

Le fichier `vercel.json` gère :
- Réécriture SPA (`/*` → `/index.html`)
- Headers de sécurité (X-Frame-Options, CSP…)
- Politique de cache pour les assets

---

## 🔐 Authentification OAuth (Outlook)

Voir [docs/OAUTH_OUTLOOK_SETUP.md](docs/OAUTH_OUTLOOK_SETUP.md) pour la configuration complète.

**Flux d'authentification** :
1. L'utilisateur clique "Se connecter avec Outlook" sur `fom-teamease.vercel.app`
2. Redirection vers Azure AD (Microsoft)
3. Azure redirige vers `https://geljwonckfmdkaywaxly.supabase.co/auth/v1/callback`
4. Supabase redirige vers le **Site URL** configuré → `https://fom-teamease.vercel.app`

> ⚠️ **Important** : Le Site URL dans Supabase > Authentication > URL Configuration doit pointer vers `https://fom-teamease.vercel.app` (pas vers Netlify).

---

## 🔗 Projets liés

| Projet | Vercel | URL |
|--------|--------|-----|
| **TeamEase** (Dashboard) | `fom-teamease` | https://fom-teamease.vercel.app |
| **SignEase** (Signature) | `fom-signease` | https://fom-signease.vercel.app |
| **DocEase** (Documents) | `fom-docease` | https://fom-docease.vercel.app |

---

## 📚 Documentation

- [Guide d'intégration](docs/GUIDE.md)
- [Configuration Supabase](docs/SUPABASE_SETUP.md)
- [OAuth Outlook](docs/OAUTH_OUTLOOK_SETUP.md)
- [Système de rôles](docs/ROLES_IMPLEMENTATION_GUIDE.md)
- [Notifications](docs/NOTIFICATIONS_GUIDE.md)

---

## 📦 Git

```bash
git remote -v
# fo-dashboard → https://github.com/upscaylman/fo-dashboard.git

git push fo-dashboard master
```

