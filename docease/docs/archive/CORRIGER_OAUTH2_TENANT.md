# Corriger l'Erreur OAuth2 : Single Tenant vs Multi-Tenant

## 🐛 Erreur "not configured as a multi-tenant application"

Cette erreur se produit quand :
- ✅ Votre application Azure est configurée en **Single tenant** (une seule organisation)
- ❌ Mais n8n utilise l'endpoint `/common` (pour multi-tenant)

---

## ✅ Solution : Utiliser l'Endpoint Tenant-Specific

Au lieu d'utiliser `/common`, utilisez l'endpoint spécifique à votre tenant.

---

## 🔧 Solution 1 : Modifier les URLs dans n8n (Recommandé)

Dans n8n, **modifiez le credential Microsoft Outlook OAuth2 API** :

### URLs à Modifier :

**Remplacez** ces URLs dans n8n :

**Anciennes URLs (avec /common)** :
```
Authorization URL: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
Access Token URL: https://login.microsoftonline.com/common/oauth2/v2.0/token
```

**Nouvelles URLs (tenant-specific)** :
```
Authorization URL: https://login.microsoftonline.com/{votre-tenant-id}/oauth2/v2.0/authorize
Access Token URL: https://login.microsoftonline.com/{votre-tenant-id}/oauth2/v2.0/token
```

### Comment Trouver votre Tenant ID ?

**Option A - Depuis Azure Portal** :
1. **Azure Portal** → **Microsoft Entra ID**
2. **Menu gauche** → **Properties** (Propriétés)
3. **Copiez le "Tenant ID"** (format : `xxxx-xxxx-xxxx-xxxx`)

**Option B - Depuis l'Application** :
1. Dans votre **App Registration** (n8n Automate)
2. **Menu gauche** → **Overview**
3. Regardez **"Directory (tenant) ID"** - C'est votre Tenant ID

**Option C - Utiliser votre domaine** :
Si vous connaissez votre domaine Office 365 :
```
Authorization URL: https://login.microsoftonline.com/fo-metaux.fr/oauth2/v2.0/authorize
Access Token URL: https://login.microsoftonline.com/fo-metaux.fr/oauth2/v2.0/token
```

---

## 🔧 Solution 2 : Modifier l'Application en Multi-Tenant

Si vous préférez garder `/common`, modifiez l'application Azure :

1. **Azure Portal** → **Microsoft Entra ID** → **App registrations**
2. **Cliquez sur votre application** "n8n Automate"
3. **Menu gauche** → **Authentication** (Authentification)
4. **Section "Supported account types"** :
   - Changez de "Single tenant" à :
   - **"Accounts in any organizational directory and personal Microsoft accounts"** (Multi-tenant)
5. **Sauvegardez**

⚠️ **Note** : Cette option permet à n'importe quel compte Microsoft de se connecter. Pour une organisation, la Solution 1 est plus sécurisée.

---

## ✅ Étapes Détaillées - Solution 1 (Recommandée)

### Étape 1 : Trouver le Tenant ID

1. **Azure Portal** → **Microsoft Entra ID**
2. **Menu gauche** → **Properties**
3. **Copiez le Tenant ID**

OU

1. Dans votre **App Registration "n8n Automate"**
2. **Menu gauche** → **Overview**
3. **Copiez "Directory (tenant) ID"**

### Étape 2 : Modifier les URLs dans n8n

1. **Dans n8n** → **Settings** → **Credentials**
2. **Ouvrez votre credential** "Microsoft Outlook OAuth2 API"
3. **Modifiez l'Authorization URL** :
   - Remplacez : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
   - Par : `https://login.microsoftonline.com/{votre-tenant-id}/oauth2/v2.0/authorize`
   - Remplacez `{votre-tenant-id}` par le Tenant ID copié

4. **Modifiez l'Access Token URL** :
   - Remplacez : `https://login.microsoftonline.com/common/oauth2/v2.0/token`
   - Par : `https://login.microsoftonline.com/{votre-tenant-id}/oauth2/v2.0/token`

5. **Sauvegardez**

### Étape 3 : Réessayer la Connexion

1. **Retournez dans le workflow**
2. **Réessayez de connecter** le credential Outlook OAuth2
3. Ça devrait fonctionner maintenant !

---

## 🔍 Alternative : Utiliser le Domaine

Si vous préférez utiliser votre domaine au lieu du Tenant ID :

```
Authorization URL: https://login.microsoftonline.com/fo-metaux.fr/oauth2/v2.0/authorize
Access Token URL: https://login.microsoftonline.com/fo-metaux.fr/oauth2/v2.0/token
```

**Avantage** : Plus lisible et plus facile à retenir.

---

## ✅ Checklist

- [ ] Tenant ID trouvé (Azure Portal → Entra ID → Properties)
- [ ] URLs modifiées dans n8n (remplacer `/common` par `/{tenant-id}`)
- [ ] Credential sauvegardé
- [ ] Connexion OAuth2 réessayée
- [ ] Connexion réussie !

---

**La solution la plus rapide : Remplacez `/common` par votre Tenant ID dans les URLs n8n !** 🚀

