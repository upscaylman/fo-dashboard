# 🚀 Guide de Configuration Supabase

Ce guide vous accompagne pas à pas pour configurer Supabase avec **TeamEase** (Dashboard FO Métaux).

## Étape 1 : Créer un compte Supabase

1. Rendez-vous sur [supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"**
3. Connectez-vous avec GitHub, Google ou email
4. Vous arriverez sur le dashboard Supabase

## Étape 2 : Créer un nouveau projet

1. Cliquez sur **"New Project"**
2. Remplissez les informations :
   - **Name** : `teamease` (ou `fo-metaux-dashboard`)
   - **Database Password** : Choisissez un mot de passe fort (notez-le !)
   - **Region** : Sélectionnez `Europe (Frankfurt)` ou `Europe (Paris)` pour la proximité
   - **Pricing Plan** : Sélectionnez **Free** (gratuit)
3. Cliquez sur **"Create new project"**
4. ⏱️ Patientez 1-2 minutes pendant la création

## Étape 3 : Récupérer vos clés API

Une fois le projet créé :

1. Dans le menu de gauche, cliquez sur **⚙️ Settings**
2. Allez dans **API**
3. Vous verrez deux informations importantes :

   - **Project URL** : `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. **Copiez ces deux valeurs** (nous en aurons besoin à l'étape suivante)

## Étape 4 : Configurer les variables d'environnement

1. Ouvrez le fichier `.env` à la racine de votre projet
2. Ajoutez ces deux lignes (en remplaçant par vos vraies valeurs) :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Sauvegardez** le fichier

> ⚠️ **Important** : Ne partagez jamais ces clés publiquement (elles sont déjà dans `.gitignore`)

> 💡 **En production** : Ces mêmes variables sont configurées sur le dashboard **Vercel** du projet `fom-teamease`.

## Étape 5 : Créer les tables de la base de données

1. Dans Supabase, cliquez sur **🗄️ SQL Editor** dans le menu de gauche
2. Cliquez sur **"New query"**
3. Copiez-collez le contenu du fichier `SUPABASE_SCHEMA.sql` (je vais le créer pour vous)
4. Cliquez sur **"Run"** (en bas à droite)
5. ✅ Vous devriez voir un message de succès

## Étape 6 : Vérifier la création des tables

1. Cliquez sur **📊 Table Editor** dans le menu de gauche
2. Vous devriez voir les tables :
   - `users`
   - `documents`
   - `signatures`
   - `document_types`
   - `activities`
   - `templates`

## Étape 7 : Insérer les données initiales

1. Retournez dans **SQL Editor**
2. Créez une nouvelle query
3. Copiez-collez le script d'insertion de données (je vais le préparer)
4. Cliquez sur **"Run"**

## Étape 8 : Configurer l'authentification

1. Cliquez sur **🔐 Authentication** dans le menu
2. Allez dans **Providers**
3. Activez **Email** (déjà activé par défaut normalement)
4. (Optionnel) Configurez **Azure** pour l'authentification Outlook

## Étape 9 : Créer votre premier utilisateur

1. Dans Authentication, allez dans **Users**
2. Cliquez sur **"Add user"**
3. Remplissez :
   - **Email** : `marie.dubois@fo-metaux.fr`
   - **Password** : Choisissez un mot de passe
   - **Auto Confirm User** : ✅ Cochez
4. Cliquez sur **"Create user"**

## Étape 10 : Tester la connexion

1. Redémarrez votre serveur de développement :
   ```bash
   # Arrêtez avec Ctrl+C, puis relancez
   npm run dev
   ```

2. Ouvrez votre dashboard et testez la connexion avec les identifiants créés

---

## 🎯 Prochaines étapes

Une fois Supabase configuré, nous allons :
- ✅ Installer le SDK Supabase dans le projet
- ✅ Créer le client de connexion (`lib/supabase.ts`)
- ✅ Configurer l'Edge Function `db-proxy` v8 (PostgREST est en 503)
- ✅ Configurer l'authentification OAuth Outlook (voir [OAUTH_OUTLOOK_SETUP.md](OAUTH_OUTLOOK_SETUP.md))
- ✅ Configurer le Site URL vers `https://fom-teamease.vercel.app`
- ✅ Déployer sur Vercel (`fom-teamease`)

## 🆘 Besoin d'aide ?

Si vous rencontrez un problème :
1. Vérifiez que les variables d'environnement sont bien configurées
2. Vérifiez que le serveur est bien redémarré
3. Consultez la console du navigateur (F12) pour voir les erreurs
4. Consultez les logs dans Supabase Dashboard → Logs
