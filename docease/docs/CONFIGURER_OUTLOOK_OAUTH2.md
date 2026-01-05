# Configuration Microsoft Outlook OAuth2 API - Office 365

## 🔧 Étapes pour Obtenir Client ID et Client Secret

Pour utiliser Microsoft Outlook OAuth2, vous devez créer une application dans Azure AD.

---

## 📋 Étape 1 : Accéder à Azure Portal

1. **Allez sur** : https://portal.azure.com
2. **Connectez-vous** avec votre compte `contact@fo-metaux.fr` (ou compte admin)
3. **Cherchez "Azure Active Directory"** dans la barre de recherche
4. **Cliquez sur "App registrations"** (Inscriptions d'applications)

---

## 📋 Étape 2 : Créer une Nouvelle Application

1. **Cliquez sur "New registration"** (Nouvelle inscription)
2. **Remplissez** :
   - **Name** : `n8n Automate` (ou le nom que vous voulez)
   - **Supported account types** : 
     - Sélectionnez selon votre cas :
       - ✅ **"Accounts in any organizational directory and personal Microsoft accounts"** (si multi-tenant)
       - ✅ **"Accounts in this organizational directory only"** (si votre organisation uniquement)
   - **Redirect URI** :
     - **Platform** : `Web`
     - **URI** : `http://localhost:5678/rest/oauth2-credential/callback`
     - ⚠️ **Important** : C'est l'URL fournie par n8n que vous avez copiée !

3. **Cliquez sur "Register"**

---

## 📋 Étape 3 : Obtenir le Client ID

1. **Après la création**, vous êtes sur la page de l'application
2. **Copiez le "Application (client) ID"** - C'est votre **Client ID**

---

## 📋 Étape 4 : Créer le Client Secret

1. **Dans le menu de gauche**, cliquez sur **"Certificates & secrets"** (Certificats et secrets)
2. **Onglet "Client secrets"**
3. **Cliquez sur "New client secret"** (Nouveau secret client)
4. **Remplissez** :
   - **Description** : `n8n Secret` (ou ce que vous voulez)
   - **Expires** : Choisissez une durée (ex: 24 months)

5. **Cliquez sur "Add"**
6. **⚠️ IMPORTANT** : **Copiez immédiatement la valeur du secret** (vous ne pourrez plus la voir après !)
   - C'est votre **Client Secret**

---

## 📋 Étape 5 : Configurer les API Permissions

1. **Dans le menu de gauche**, cliquez sur **"API permissions"** (Autorisations des API)
2. **Cliquez sur "Add a permission"**
3. **Onglet "Microsoft Graph"**
4. **Sélectionnez "Delegated permissions"** (Autorisations déléguées)
5. **Ajoutez ces permissions** :
   - ✅ `Mail.Read` (Lire le courrier)
   - ✅ `Mail.Send` (Envoyer le courrier)
   - ✅ `User.Read` (Lire le profil utilisateur)
6. **Cliquez sur "Add permissions"**

**Optionnel - Si vous utilisez des calendriers** :
- `Calendars.ReadWrite`

---

## 📋 Étape 6 : Consentement Admin (Si nécessaire)

Si vous voyez un message "Grant admin consent" :

1. **Cliquez sur "Grant admin consent for [votre organisation]"**
2. **Acceptez** les permissions

⚠️ **Note** : Seul un administrateur peut faire cela. Si vous n'êtes pas admin, contactez votre admin IT.

---

## 📋 Étape 7 : Configurer dans n8n

Maintenant, retournez dans n8n et remplissez le formulaire :

### Champs dans n8n :

1. **OAuth Redirect URL** :
   - Déjà rempli : `http://localhost:5678/rest/oauth2-credential/callback`
   - ✅ **Vérifiez que c'est bien cette URL** (doit correspondre à celle dans Azure)

2. **Authorization URL** :
   - Déjà rempli : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
   - ✅ **Correct pour Office 365**

3. **Access Token URL** :
   - Déjà rempli : `https://login.microsoftonline.com/common/oauth2/v2.0/token`
   - ✅ **Correct pour Office 365**

4. **Client ID** :
   - ✅ **Collez le Client ID** copié depuis Azure Portal

5. **Client Secret** :
   - ✅ **Collez le Client Secret** copié depuis Azure Portal

6. **Allowed HTTP Request Domains** :
   - ✅ **Laissez "All"** (ou spécifiez si votre organisation a des restrictions)

7. **Use Shared Mailbox** :
   - ✅ **Cochez seulement si vous utilisez une boîte partagée**
   - Sinon, laissez décoché

---

## ✅ Vérifications Importantes

### 1. Redirect URI doit correspondre

Dans Azure Portal :
- Redirect URI doit être : `http://localhost:5678/rest/oauth2-credential/callback`

Dans n8n :
- OAuth Redirect URL doit être : `http://localhost:5678/rest/oauth2-credential/callback`

✅ **Ils doivent être identiques !**

### 2. Pour la Production (VPS)

Si plus tard vous déployez sur un VPS, vous devrez :
1. Ajouter une nouvelle Redirect URI dans Azure :
   - `https://votre-domaine.com/rest/oauth2-credential/callback`
2. Modifier la configuration dans n8n pour utiliser la nouvelle URL

---

## 🧪 Tester la Configuration

1. **Sauvegardez le credential** dans n8n
2. **Ouvrez votre workflow**
3. **Cliquez sur le nœud "Envoyer via Outlook"**
4. **Connectez le credential** que vous venez de créer
5. **Lors de la première utilisation**, n8n vous redirigera vers Microsoft pour vous connecter
6. **Connectez-vous** avec `contact@fo-metaux.fr`
7. **Autorisez** l'application

---

## 🐛 Problèmes Courants

### Erreur : "redirect_uri_mismatch"

**Cause** : L'URL de redirection dans Azure ne correspond pas à celle dans n8n

**Solution** :
1. Vérifiez dans Azure Portal → App registrations → Votre app → Authentication
2. Vérifiez que l'URL `http://localhost:5678/rest/oauth2-credential/callback` est bien ajoutée

### Erreur : "insufficient privileges"

**Cause** : Les permissions ne sont pas accordées

**Solution** :
1. Dans Azure Portal → API permissions
2. Vérifiez que les permissions sont ajoutées
3. Cliquez sur "Grant admin consent" si nécessaire

### Erreur : "invalid_client"

**Cause** : Client ID ou Client Secret incorrect

**Solution** :
1. Vérifiez que vous avez copié correctement depuis Azure
2. Vérifiez qu'il n'y a pas d'espaces en début/fin
3. Recréez le Client Secret si nécessaire

---

## 📝 Checklist Complète

- [ ] Application Azure AD créée
- [ ] Redirect URI configurée : `http://localhost:5678/rest/oauth2-credential/callback`
- [ ] Client ID copié
- [ ] Client Secret créé et copié (⚠️ immédiatement !)
- [ ] API Permissions configurées (Mail.Read, Mail.Send, User.Read)
- [ ] Admin consent accordé (si nécessaire)
- [ ] Credential configuré dans n8n avec toutes les valeurs
- [ ] Credential testé dans un workflow

---

## 💡 Notes Importantes

1. **Client Secret** : Vous ne pourrez voir la valeur qu'une seule fois. Si vous perdez le secret, créez-en un nouveau.

2. **Expiration** : Les Client Secrets ont une date d'expiration. Notez-la pour renouveler avant expiration.

3. **Multi-tenant** : Si vous sélectionnez "Accounts in any organizational directory", n'importe quel compte Microsoft pourra se connecter (utile pour tester).

4. **Production** : Pour la production, utilisez un compte dédié et des secrets avec une expiration plus longue.

---

**Une fois configuré, vous pourrez utiliser Microsoft Outlook pour envoyer les emails !** 🚀

