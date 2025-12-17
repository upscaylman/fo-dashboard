# 🔐 Guide : Configuration Authentification Outlook/Microsoft

Ce guide vous permet de configurer l'authentification OAuth avec Microsoft pour que vos utilisateurs se connectent avec leur compte Outlook professionnel.

---

## 📋 Vue d'ensemble

**Durée estimée** : 15-20 minutes  
**Prérequis** : Compte Microsoft (professionnel ou personnel)

**Étapes** :
1. Créer une application dans Azure AD
2. Configurer les permissions
3. Configurer Supabase avec les identifiants Azure
4. Tester la connexion

---

## 🚀 PARTIE 1 : Configuration Azure AD (Microsoft)

### Étape 1 : Accéder au Portail Azure

1. Allez sur : https://portal.azure.com/
2. Connectez-vous avec votre compte Microsoft
3. Si vous n'avez pas accès à Azure AD, utilisez un compte Microsoft 365 professionnel

> **Alternative** : Si vous n'avez pas Azure, utilisez https://aad.portal.azure.com/ (Azure AD uniquement)

---

### Étape 2 : Créer une Application

1. Dans le menu de gauche, cherchez **"Azure Active Directory"** (ou "Microsoft Entra ID")
2. Cliquez sur **"App registrations"** (Inscriptions d'applications)
3. Cliquez sur **"+ New registration"** (Nouvelle inscription)

**Remplissez le formulaire** :
- **Name** : `FO Métaux Dashboard`
- **Supported account types** : Sélectionnez :
  - "Accounts in any organizational directory and personal Microsoft accounts"
  - (Si seulement pour votre organisation : choisissez la première option)
- **Redirect URI** :
  - Type : **Web**
  - URL : Laissez vide pour l'instant (on le fera à l'étape suivante)

4. Cliquez sur **"Register"**

---

### Étape 3 : Récupérer le Client ID

Après l'enregistrement, vous arrivez sur la page de l'application.

1. Vous voyez **"Application (client) ID"** : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
2. **COPIEZ cette valeur** et gardez-la dans un fichier texte

**📝 Client ID** : `_________________________`

---

### Étape 4 : Créer un Client Secret

1. Dans le menu de gauche, cliquez sur **"Certificates & secrets"**
2. Sous **"Client secrets"**, cliquez sur **"+ New client secret"**
3. Remplissez :
   - **Description** : `Supabase Auth Secret`
   - **Expires** : Choisissez **24 months** (ou selon votre politique)
4. Cliquez sur **"Add"**

5. ⚠️ **IMPORTANT** : Une valeur apparaît sous **"Value"**
   - **COPIEZ IMMÉDIATEMENT cette valeur** (elle ne sera plus visible après !)
   - Format : `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**📝 Client Secret** : `_________________________`

---

### Étape 5 : Configurer les Permissions API

1. Dans le menu de gauche, cliquez sur **"API permissions"**
2. Vous devriez voir `Microsoft Graph` avec `User.Read`
3. C'est suffisant pour l'authentification de base

**Optionnel** : Pour récupérer l'email, ajoutez :
- Cliquez sur **"+ Add a permission"**
- Sélectionnez **"Microsoft Graph"**
- Sélectionnez **"Delegated permissions"**
- Cherchez et cochez : `email`, `profile`, `openid`
- Cliquez sur **"Add permissions"**

---

### Étape 6 : Configuration URL de Redirection (À FAIRE APRÈS SUPABASE)

On reviendra ici après avoir configuré Supabase pour ajouter l'URL de callback.

---

## 🗄️ PARTIE 2 : Configuration Supabase

### Étape 1 : Activer le Provider Azure

1. Allez sur https://supabase.com/dashboard
2. Ouvrez votre projet **fo-metaux-dashboard**
3. Dans le menu de gauche, cliquez sur **🔐 Authentication**
4. Cliquez sur **"Providers"**
5. Faites défiler jusqu'à **"Azure"**
6. Activez le toggle **"Azure enabled"**

---

### Étape 2 : Configurer Azure dans Supabase

Vous verrez un formulaire avec plusieurs champs :

**1. Azure Client ID**
- Collez le **Client ID** récupéré à l'Étape 3 d'Azure

**2. Azure Client Secret**
- Collez le **Client Secret** récupéré à l'Étape 4 d'Azure

**3. Azure Tenant** (optionnel)
- Pour un compte personnel : Laissez vide OU mettez `common`
- Pour un compte organisationnel : Mettez votre Tenant ID
  - Trouvable dans Azure AD → Overview → "Tenant ID"

**4. Callback URL (Redirect URL)**
- Supabase affiche une URL comme :
  ```
  https://geljwonckfmdkaywaxly.supabase.co/auth/v1/callback
  ```
- **COPIEZ cette URL** - on en aura besoin !

5. Cliquez sur **"Save"**

---

### Étape 3 : Retour sur Azure - Ajouter l'URL de Redirection

1. Retournez sur https://portal.azure.com/
2. Allez dans votre application **FO Métaux Dashboard**
3. Cliquez sur **"Authentication"** dans le menu de gauche
4. Sous **"Platform configurations"**, cliquez sur **"+ Add a platform"**
5. Sélectionnez **"Web"**
6. Dans **"Redirect URIs"**, collez l'URL de callback Supabase :
   ```
   https://geljwonckfmdkaywaxly.supabase.co/auth/v1/callback
   ```
7. Cochez **"ID tokens"** (pour le flux implicit)
8. Cliquez sur **"Configure"**

---

## ✅ PARTIE 3 : Test

### Vérifier que tout est configuré

**Dans Azure AD** :
- ✅ Application créée
- ✅ Client ID récupéré
- ✅ Client Secret créé
- ✅ URL de redirection ajoutée

**Dans Supabase** :
- ✅ Provider Azure activé
- ✅ Client ID configuré
- ✅ Client Secret configuré

---

### Tester la connexion

1. Allez sur votre application : http://localhost:4081/
2. Sur la page de login, cliquez sur **"Se connecter avec Outlook"**
3. Vous serez redirigé vers Microsoft
4. Connectez-vous avec votre compte Microsoft/Outlook
5. Acceptez les permissions
6. Vous serez redirigé vers votre dashboard

**Si ça marche** : 🎉 Authentification Outlook configurée !

**Si erreur** :
- Vérifiez les Client ID/Secret
- Vérifiez l'URL de callback
- Consultez les logs Supabase (Dashboard → Logs)

---

## 🔧 Résumé des Valeurs

| Élément | Valeur |
|---------|--------|
| Client ID Azure | `à remplir` |
| Client Secret Azure | `à remplir` |
| Callback URL Supabase | `https://geljwonckfmdkaywaxly.supabase.co/auth/v1/callback` |

---

## 📝 Checklist Finale

- [ ] Application Azure créée
- [ ] Client ID copié
- [ ] Client Secret copié
- [ ] Permissions API configurées
- [ ] Provider Azure activé dans Supabase
- [ ] Client ID/Secret ajoutés dans Supabase
- [ ] URL de callback ajoutée dans Azure
- [ ] Test de connexion réussi

---

## 🆘 Problèmes Courants

### Erreur "redirect_uri_mismatch"
➜ L'URL de callback dans Azure ne correspond pas à celle de Supabase  
✅ Vérifiez que les URLs sont EXACTEMENT identiques

### Erreur "invalid_client"
➜ Client ID ou Secret incorrect  
✅ Revérifiez les valeurs copiées

### Pas d'accès à Azure AD
➜ Besoin d'un compte Microsoft 365 professionnel  
✅ Contactez votre administrateur IT

---

## 🚀 Une fois terminé

Dites-moi : **"Configuration Outlook terminée"** et on pourra tester ensemble !
