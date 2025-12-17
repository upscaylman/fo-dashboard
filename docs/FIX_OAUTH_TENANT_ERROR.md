# 🔧 Solution : Erreur Azure OAuth Tenant

## 🔴 Erreur Rencontrée

```
AADSTS700016: Application with identifier 'bd896106-6cd1-43bf-96fb-9d4e991ffe4e' 
was not found in the directory 'FO METAUX'
```

**Cause** : L'application Azure AD cherche dans le mauvais tenant.

---

## ✅ Solution 1 : Configurer pour Multi-Tenant (RECOMMANDÉ)

### Dans Azure Portal

1. Allez sur https://portal.azure.com/
2. Ouvrez votre application **FO Métaux Dashboard**
3. Cliquez sur **"Authentication"** dans le menu de gauche
4. En haut, sous **"Supported account types"**, vérifiez la configuration :

**Option A - Multi-tenant (Recommandé pour vous)** :
- Sélectionnez : **"Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts"**

**OU Option B - Tenant unique** :
- Si vous voulez UNIQUEMENT les comptes FO METAUX :
- Sélectionnez : **"Accounts in this organizational directory only (FO METAUX only - Single tenant)"**

5. Cliquez sur **"Save"**

---

## ✅ Solution 2 : Configurer le Tenant dans Supabase

### Dans Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Ouvrez votre projet **fo-metaux-dashboard**
3. Allez dans **Authentication** → **Providers** → **Azure**
4. Modifiez le champ **"Azure Tenant"** :

**Si vous avez choisi Multi-tenant (Option A)** :
```
common
```

**Si vous voulez uniquement FO METAUX (Option B)** :
- Récupérez votre Tenant ID dans Azure :
  - Azure Portal → Azure Active Directory → Overview → **Tenant ID**
  - Exemple : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Collez ce Tenant ID dans Supabase

5. Cliquez sur **"Save"**

---

## ✅ Solution 3 : Vérifier les Supported Account Types

### Dans Azure Portal

1. Allez dans votre application
2. Cliquez sur **"Manifest"** dans le menu de gauche
3. Cherchez la ligne `"signInAudience"`

**Pour Multi-tenant** :
```json
"signInAudience": "AzureADandPersonalMicrosoftAccount"
```

**Pour Single-tenant** :
```json
"signInAudience": "AzureADMyOrg"
```

4. Si ce n'est pas correct, modifiez et cliquez sur **"Save"**

---

## 🎯 Configuration Recommandée

Pour votre cas (comptes professionnels FO METAUX) :

### Dans Azure
- **Supported account types** : "Accounts in any organizational directory (Multitenant)"
- OU si vous voulez être restrictif : "Single tenant (FO METAUX only)"

### Dans Supabase
- **Azure Tenant** : `common` (pour multi-tenant)
- OU : Votre Tenant ID spécifique (pour single-tenant)

---

## 🧪 Tester à Nouveau

1. Retournez sur votre application : http://localhost:4081/
2. Cliquez sur **"Se connecter avec Outlook"**
3. Ça devrait maintenant fonctionner ! ✅

---

## 📝 Checklist de Vérification

- [ ] Azure : Supported account types configuré (Multi ou Single tenant)
- [ ] Supabase : Azure Tenant configuré (`common` ou Tenant ID)
- [ ] Les modifications sont sauvegardées dans les deux plateformes
- [ ] Test de connexion réussi

---

## 🆘 Si ça ne marche toujours pas

**Erreur possible** : Client ID incorrect

Vérifiez que le Client ID dans Supabase correspond EXACTEMENT à celui dans Azure :
- Azure Portal → Votre App → Overview → **Application (client) ID**
- Doit correspondre à ce qui est dans Supabase → Authentication → Providers → Azure

**Autres vérifications** :
- Client Secret encore valide (pas expiré)
- URL de callback correctement configurée dans Azure

---

**Dites-moi une fois que vous avez fait les modifications et on testera ensemble !** 🚀
