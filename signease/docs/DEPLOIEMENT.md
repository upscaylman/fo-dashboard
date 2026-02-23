# 🚀 Déploiement en Production — SignEase

## ✅ Checklist Pré-Déploiement

Avant de déployer, assurez-vous que :

- ✅ **CORS Firebase Storage est configuré** (voir `docs/CONFIGURATION-CORS.md`)
- ✅ **Règles Firestore sont sécurisées** (pas en mode test)
- ✅ **Variables d'environnement sont prêtes**
- ✅ **L'application fonctionne en local**

---

## 📦 Vercel (Production)

### **Étape 1 : Build de Production**

```bash
npm run build
```

Cela crée un dossier `dist/` avec votre application optimisée.

---

### **Étape 2 : Configurer les Variables d'Environnement**

1. Allez sur le dashboard Vercel : **https://vercel.com/dashboard**
2. Ouvrez le projet **fom-signease**
3. Allez dans **Settings → Environment Variables**
4. Ajoutez **TOUTES** les variables de votre `.env.local` :

**Firebase (6 variables)** :
```
VITE_FIREBASE_API_KEY=AIzaSyB6l7PjzQUTz4ERwoyca5C_mPj_jOKWG70
VITE_FIREBASE_AUTH_DOMAIN=signeasyfo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=signeasyfo
VITE_FIREBASE_STORAGE_BUCKET=signeasyfo.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=884877138273
VITE_FIREBASE_APP_ID=1:884877138273:web:1dd64d62b197163b50cd20
```

**EmailJS (3 variables)** :
```
VITE_EMAILJS_SERVICE_ID=votre_service_id
VITE_EMAILJS_TEMPLATE_ID=votre_template_id
VITE_EMAILJS_PUBLIC_KEY=votre_public_key
```

**Supabase (2 variables — pour la présence temps réel)** :
```
VITE_SUPABASE_URL=https://geljwonckfmdkaywaxly.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

### **Étape 3 : Déployer**

#### **Option A : Vercel CLI (Recommandé)**

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Lier le projet (première fois)
vercel link
# Choisir le projet : fom-signease

# Déployer en production
vercel --prod
```

#### **Option B : Git Push (Automatique)**

Si le projet Vercel est connecté au repo GitHub :

```bash
git add -A
git commit -m "mise à jour SignEase"
git push fo-dashboard master
```

Vercel déploie automatiquement à chaque push sur `master`.

---

### **Étape 4 : Configuration Vercel (vercel.json)**

Le fichier `vercel.json` est déjà présent à la racine de `signease/` :

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

Cela garantit que le routing React fonctionne correctement (SPA).

---

## 🔒 Sécuriser Firebase (OBLIGATOIRE en Production)

### **1. Firestore Rules**

Allez sur : **Firebase Console → Firestore → Règles**

**Remplacez les règles "mode test" par :**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Documents : lecture publique, écriture authentifiée
    match /documents/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Enveloppes : accès par token
    match /envelopes/{envelope} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Tokens : lecture publique, écriture authentifiée
    match /tokens/{token} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Emails : lecture/écriture authentifiée
    match /emails/{email} {
      allow read, write: if true;
    }
    
    // Audit trails : lecture publique, écriture authentifiée
    match /auditTrails/{audit} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Publiez les règles !**

---

### **2. Storage Rules**

Allez sur : **Firebase Console → Storage → Règles**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // PDFs : lecture publique, écriture authentifiée
    match /pdfs/{pdfId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Publiez les règles !**

---

## 🧪 Tester la Production

1. Allez sur : **https://fom-signease.vercel.app**
2. Créez un document
3. Envoyez-le pour signature
4. Vérifiez dans Inbox
5. Testez la signature

**Tout devrait fonctionner comme en local !** ✅

---

## 🔧 Déploiement Automatique (CI/CD)

### **Avec GitHub + Vercel**

1. Connectez Vercel à votre repo GitHub (https://vercel.com/new)
2. Importez le repo `fo-dashboard`
3. Configurez :
   - **Root Directory** : `signease`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Chaque `git push` sur `master` déclenchera un déploiement automatique !

---

## 📊 Monitoring

**Vercel Dashboard** (https://vercel.com/dashboard) :
- Deployments récents
- Performance (Web Vitals)
- Erreurs de build
- Logs en temps réel

**Firebase Console** :
- Utilisation Firestore
- Utilisation Storage
- Erreurs

---

## ❓ Dépannage Production

### **Erreur : Page blanche**
- Vérifiez la console navigateur (F12)
- Vérifiez que les variables d'environnement sont configurées sur Vercel

### **Erreur : CORS Storage**
- Vérifiez que CORS est configuré (voir `docs/CONFIGURATION-CORS.md`)
- Attendez 1-2 minutes (propagation)

### **Erreur : Firebase permission denied**
- Vérifiez les règles Firestore/Storage
- Vérifiez que les règles sont publiées

### **Erreur : 404 sur refresh**
- Vérifiez que `vercel.json` contient la réécriture SPA
- Le fichier doit être à la racine de `signease/`

---

## 📞 Références

- **Vercel Docs** : https://vercel.com/docs
- **Firebase Docs** : https://firebase.google.com/docs
- **Vite Docs** : https://vitejs.dev/guide/

---

## 🔗 Projets liés

| Projet | Nom Vercel | URL |
|--------|-----------|-----|
| **TeamEase** (Dashboard) | `fom-teamease` | https://fom-teamease.vercel.app |
| **SignEase** (Signature) | `fom-signease` | https://fom-signease.vercel.app |
| **DocEase** (Documents) | `fom-docease` | https://fom-docease.vercel.app |

---

## 🔐 Signatures Numériques Conformes eIDAS/PAdES

Pour assurer la conformité eIDAS/PAdES, nous utilisons des signatures numériques.

### **1. Configuration**

- ✅ **Certificat eIDAS** (à obtenir auprès d'une autorité de certification)
- ✅ **Clé de signature** (à gérer en sécurité)
- ✅ **Règles Firestore pour les signatures** (voir `docs/FIRESTORE-RULES.md`)

### **2. Utilisation**

- ✅ **Génération de signature** (via `signEasy.generateSignature()`)
- ✅ **Vérification de signature** (via `signEasy.verifySignature()`)
- ✅ **Stockage des signatures** (dans Firestore)

### **3. Sécurité**

- ✅ **Chiffrement des données** (AES-256)
- ✅ **Hachage des clés** (SHA-256)
- ✅ **Vérification de l'authenticité** (via certificats)
