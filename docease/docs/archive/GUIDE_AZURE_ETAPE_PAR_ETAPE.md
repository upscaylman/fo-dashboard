# Guide Étape par Étape : Créer App Registration dans Azure

## 📍 Vous êtes sur Azure Portal - C'est parfait !

Vous voyez la page d'accueil Azure. Nous allons accéder à **Microsoft Entra ID** (gratuit, inclus dans Office 365).

---

## 🎯 Étape 1 : Accéder à Microsoft Entra ID

Sur la page où vous êtes, vous voyez :

**"Gérer Microsoft Entra ID"** → **Cliquez dessus**

OU

**Dans la barre de recherche en haut**, tapez :
- `Entra ID` ou `Azure Active Directory`
- **Sélectionnez "Microsoft Entra ID"** dans les résultats

---

## 🎯 Étape 2 : Aller dans App Registrations

Une fois dans Microsoft Entra ID :

1. **Dans le menu de gauche**, cherchez **"Applications"** ou **"App registrations"** (Inscriptions d'applications)
2. **Cliquez dessus**

Vous verrez une liste (probablement vide au début).

---

## 🎯 Étape 3 : Créer une Nouvelle Application

1. **Cliquez sur le bouton "+ New registration"** (Nouvelle inscription) en haut

---

## 🎯 Étape 4 : Remplir le Formulaire

Un formulaire s'ouvre. Remplissez :

### Name :
- **Tapez** : `n8n Automate` (ou le nom que vous voulez)
- C'est juste un nom pour identifier votre application

### Supported account types :
**Sélectionnez une option** selon votre cas :

**Option A - Si vous utilisez uniquement votre organisation** :
- Cliquez sur : **"Accounts in this organizational directory only"**
  - `(Single tenant)`

**Option B - Si vous voulez que n'importe quel compte Microsoft puisse se connecter** :
- Cliquez sur : **"Accounts in any organizational directory and personal Microsoft accounts"**
  - `(Multitenant)`

**Pour débuter** : Choisissez **Option A** (Single tenant).

### Redirect URI :
**C'est IMPORTANT !**

1. **Platform** : Sélectionnez **"Web"** dans le menu déroulant
2. **URI** : **Tapez exactement** :
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
   ⚠️ **Copiez-collez exactement cette URL** (pas d'espaces, pas d'erreur)

3. **Cliquez sur "Add"** (Ajouter) à côté

### Une fois tout rempli :

4. **En bas**, cliquez sur **"Register"** (Inscrire)

---

## 🎯 Étape 5 : Copier le Client ID

Après avoir cliqué sur "Register", vous êtes sur la page de votre application.

**En haut de la page**, vous verrez :

- **Application (client) ID** : `xxxxx-xxxxx-xxxxx-xxxxx`

**👉 COPIEZ ce Client ID** - Vous en aurez besoin dans n8n !

**C'est votre Client ID !**

---

## 🎯 Étape 6 : Créer le Client Secret

1. **Dans le menu de gauche**, cliquez sur **"Certificates & secrets"** (Certificats et secrets)

2. **Onglet "Client secrets"** (en haut)

3. **Cliquez sur "+ New client secret"** (Nouveau secret client)

4. **Remplissez** :
   - **Description** : `n8n Secret` (ou ce que vous voulez)
   - **Expires** : **Choisissez "24 months"** (ou plus)

5. **Cliquez sur "Add"** (Ajouter)

6. **⚠️ TRÈS IMPORTANT** :
   - Une ligne apparaît avec votre secret
   - **Il y a une colonne "Value"** avec une longue chaîne de caractères
   - **👉 COPIEZ IMMÉDIATEMENT cette valeur** - Vous ne pourrez plus la voir après !
   - C'est votre **Client Secret** !

---

## 🎯 Étape 7 : Configurer les Permissions API

1. **Dans le menu de gauche**, cliquez sur **"API permissions"** (Autorisations des API)

2. **Vous verrez une liste de permissions**

3. **Cliquez sur "+ Add a permission"** (Ajouter une autorisation)

4. **Onglet "Microsoft Graph"** → **Cliquez dessus**

5. **Sélectionnez "Delegated permissions"** (Autorisations déléguées)

6. **Dans la liste**, cochez :
   - ✅ `Mail.Read` (Lire le courrier)
   - ✅ `Mail.Send` (Envoyer le courrier)
   - ✅ `User.Read` (Lire le profil utilisateur)

7. **Cliquez sur "Add permissions"** (Ajouter les autorisations) en bas

8. **Si vous voyez un bouton "Grant admin consent for [votre organisation]"** :
   - **Cliquez dessus**
   - **Acceptez** les permissions

⚠️ **Si vous n'avez pas les droits admin**, contactez votre administrateur IT pour accorder le consentement.

---

## 🎯 Étape 8 : Retourner dans n8n

Maintenant, **retournez dans n8n** :

1. **Ouvrez le credential Microsoft Outlook OAuth2 API**

2. **Remplissez les champs** :

   - **OAuth Redirect URL** : Déjà rempli ✅
     - `http://localhost:5678/rest/oauth2-credential/callback`
   
   - **Authorization URL** : Déjà rempli ✅
     - `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
   
   - **Access Token URL** : Déjà rempli ✅
     - `https://login.microsoftonline.com/common/oauth2/v2.0/token`
   
   - **Client ID** : **Collez le Client ID** copié depuis Azure ✅
   
   - **Client Secret** : **Collez le Client Secret** copié depuis Azure ✅
   
   - **Allowed HTTP Request Domains** : Laissez "All" ✅
   
   - **Use Shared Mailbox** : Décochez (sauf si boîte partagée) ✅

3. **Cliquez sur "Save"** (Sauvegarder)

---

## ✅ C'est Terminé !

Vous avez maintenant :
- ✅ Application créée dans Azure (gratuit)
- ✅ Client ID copié
- ✅ Client Secret copié
- ✅ Permissions configurées
- ✅ Credential configuré dans n8n

**Vous pouvez maintenant utiliser Microsoft Outlook dans vos workflows !**

---

## 🐛 Si Vous Bloquez

### "Grant admin consent" grisé

**Cause** : Vous n'avez pas les droits administrateur

**Solution** : Contactez votre administrateur IT pour :
1. Accorder le consentement admin
2. Ou vous donner les droits nécessaires

### Client Secret non visible

**Cause** : Vous avez fermé la page avant de copier

**Solution** :
1. Retournez dans "Certificates & secrets"
2. Créez un **nouveau** client secret
3. **Copiez immédiatement** cette fois

### Erreur dans n8n après configuration

**Solutions** :
1. Vérifiez que le Redirect URI dans Azure = Redirect URI dans n8n (identiques)
2. Vérifiez qu'il n'y a pas d'espaces dans Client ID et Secret
3. Vérifiez que les permissions ont été accordées (Grant admin consent)

---

**Suivez ces étapes dans l'ordre et ça devrait fonctionner !** 🚀

