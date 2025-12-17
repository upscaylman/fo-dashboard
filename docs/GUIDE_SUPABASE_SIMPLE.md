# 🚀 Guide Pas à Pas - Configuration Supabase

Suivez exactement ces étapes dans l'ordre. Je vous accompagne ! 😊

---

## ✅ ÉTAPE 1 : Créer un Nouveau Projet

1. **Allez sur votre dashboard Supabase** : https://supabase.com/dashboard
2. Vous devriez voir un écran avec un bouton **"New Project"** (ou "Nouveau Projet")
3. **Cliquez sur "New Project"**

4. Remplissez le formulaire :
   
   📝 **Name (Nom)** : `fo-metaux-dashboard`
   
   🔒 **Database Password** : Choisissez un mot de passe fort
   - Exemple : `FoMetaux2024!Secure`
   - ⚠️ **IMPORTANT** : Notez ce mot de passe quelque part, vous en aurez besoin !
   
   🌍 **Region** : Choisissez **Europe West (Frankfurt)** ou **Europe Central**
   - C'est le plus proche de la France
   
   💰 **Pricing Plan** : Sélectionnez **Free** (gratuit)

5. **Cliquez sur "Create new project"**

6. ⏱️ **Attendez 1-2 minutes** - Supabase crée votre base de données
   - Vous verrez un écran de chargement
   - Ne fermez pas la page !

---

## ✅ ÉTAPE 2 : Récupérer vos Clés API

Une fois le projet créé, vous êtes sur la page d'accueil du projet.

1. Dans le **menu de gauche**, tout en bas, cliquez sur l'icône **⚙️ (Settings)**

2. Dans le sous-menu qui apparaît, cliquez sur **"API"**

3. Vous verrez une page avec deux informations importantes :

   📋 **Project URL** (URL du projet)
   - Exemple : `https://abcdefghijklmnop.supabase.co`
   - **Copiez cette URL** (bouton de copie à droite)
   
   🔑 **anon public** (Clé publique anonyme)
   - C'est une TRÈS longue clé qui commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Copiez cette clé** (bouton de copie à droite)

4. **Collez-les dans un fichier texte temporaire** pour l'instant

---

## ✅ ÉTAPE 3 : Créer les Tables de la Base de Données

Maintenant, nous allons créer toutes les tables nécessaires.

1. Dans le **menu de gauche**, cliquez sur **🗄️ SQL Editor**

2. Cliquez sur le bouton **"+ New query"** (en haut à gauche)

3. Une **zone de texte vide** apparaît

4. **Ouvrez le fichier** `SUPABASE_SCHEMA.sql` dans votre projet
   - Il se trouve à la racine : `C:\Users\INVITE\OneDrive - FO METAUX\Documents\fo-metaux-dashboard\SUPABASE_SCHEMA.sql`

5. **Copiez TOUT le contenu** du fichier (Ctrl+A puis Ctrl+C)

6. **Collez-le** dans la zone de texte de Supabase SQL Editor (Ctrl+V)

7. **Cliquez sur "Run"** (bouton en bas à droite)
   - ⏱️ Attendez quelques secondes

8. ✅ Vous devriez voir un message de succès en vert : **"Success. No rows returned"**
   - C'est normal ! Les tables sont créées.

---

## ✅ ÉTAPE 4 : Insérer les Données de Test

Maintenant, nous allons ajouter des données d'exemple.

1. **Toujours dans SQL Editor**, cliquez sur **"+ New query"**

2. **Ouvrez le fichier** `SUPABASE_SEED.sql` dans votre projet

3. **Copiez TOUT le contenu** (Ctrl+A puis Ctrl+C)

4. **Collez-le** dans la nouvelle requête (Ctrl+V)

5. **Cliquez sur "Run"**

6. ✅ Vous verrez un message de succès

---

## ✅ ÉTAPE 5 : Vérifier que tout s'est bien passé

1. Dans le **menu de gauche**, cliquez sur **📊 Table Editor**

2. Vous devriez voir **7 tables** dans la liste de gauche :
   - ✅ `users`
   - ✅ `documents`
   - ✅ `signatures`
   - ✅ `document_types`
   - ✅ `activities`
   - ✅ `templates`
   - ✅ `bookmarks`

3. **Cliquez sur la table "users"** - Vous devriez voir 5 utilisateurs

4. **Cliquez sur la table "templates"** - Vous devriez voir 5 modèles

**Si vous voyez ces données, BRAVO ! 🎉 Tout est prêt.**

---

## ✅ ÉTAPE 6 : Créer votre Premier Utilisateur

Maintenant, créons votre compte pour vous connecter.

1. Dans le **menu de gauche**, cliquez sur **🔐 Authentication**

2. Cliquez sur **"Users"** (dans le sous-menu)

3. Cliquez sur le bouton **"Add user"** (en haut à droite)

4. Choisissez **"Create new user"**

5. Remplissez :
   - **Email** : Votre email (exemple : `votre.nom@fo-metaux.fr`)
   - **Password** : Choisissez un mot de passe pour vous connecter
   - ✅ **Cochez "Auto Confirm User"** (important !)

6. Cliquez sur **"Create user"**

7. ✅ Votre utilisateur est créé !

---

## 🎯 ÉTAPE FINALE : Donnez-moi vos Clés

Maintenant, **copiez-collez ici vos deux informations** récupérées à l'étape 2 :

```
URL du projet : https://votre-url.supabase.co
Clé anon : eyJhbGci...votre-longue-clé...
```

Et je vais les intégrer dans votre application ! 🚀

---

## ❓ Vous êtes bloqué quelque part ?

**Dites-moi exactement à quelle étape vous êtes et je vous aide !**

Exemples :
- "Je suis à l'étape 3, je ne trouve pas SQL Editor"
- "J'ai une erreur à l'étape 4"
- "Tout est bon, voici mes clés : ..."
