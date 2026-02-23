# 🎯 Étapes pour Passer en Production

## ✅ Statut Actuel

- ✅ **Firebase configuré** (Firestore + Storage)
- ✅ **Application fonctionnelle en local**
- ✅ **PDFs stockés dans Storage** (sans limitation)
- ⚠️ **CORS à configurer** pour permettre l'accès aux PDFs
- ⚠️ **Règles Firebase en mode test** (à sécuriser avant production)

---

## 📋 TODO Liste pour Production

### **1. Configurer CORS sur Firebase Storage** ⚠️ OBLIGATOIRE

**Pourquoi ?** Sans CORS, les PDFs ne se chargeront pas en production.

**Fichier :** `docs/CONFIGURATION-CORS.md`

**Résumé :**
```bash
# 1. Installer Google Cloud SDK
# Télécharger : https://cloud.google.com/sdk/docs/install

# 2. Se connecter
gcloud auth login

# 3. Définir le projet
gcloud config set project signeasyfo

# 4. Appliquer CORS
gsutil cors set cors.json gs://signeasyfo.firebasestorage.app
```

**Durée estimée :** 10 minutes

---

### **2. Sécuriser les Règles Firebase** ⚠️ OBLIGATOIRE

**Pourquoi ?** Les règles actuelles expirent le 20/11/2025.

**Firestore Rules :**

Allez sur : **Firebase Console → Firestore → Règles**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true; // À personnaliser selon vos besoins
    }
  }
}
```

**Storage Rules :**

Allez sur : **Firebase Console → Storage → Règles**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /pdfs/{pdfId} {
      allow read: if true;
      allow write: if true; // À personnaliser selon vos besoins
    }
  }
}
```

**Durée estimée :** 5 minutes

---

### **3. Déployer sur Vercel** ✅ FACULTATIF

**Fichier :** `docs/DEPLOIEMENT.md`

**Résumé :**
```bash
# 1. Build
npm run build

# 2. Configurer variables Vercel
# Allez sur le dashboard Vercel > projet fom-signease > Settings > Environment Variables
# Ajoutez toutes les variables VITE_FIREBASE_*, VITE_EMAILJS_*, VITE_SUPABASE_*

# 3. Déployer
vercel --prod
```

**Durée estimée :** 15 minutes

---

## 🚦 Ordre Recommandé

### **Phase 1 : Préparation (AUJOURD'HUI)**

1. ✅ Configurer CORS (voir `docs/CONFIGURATION-CORS.md`)
2. ✅ Tester en local que les PDFs se chargent toujours

### **Phase 2 : Sécurisation (AVANT DÉPLOIEMENT)**

3. ✅ Mettre à jour les règles Firestore
4. ✅ Mettre à jour les règles Storage
5. ✅ Publier les règles

### **Phase 3 : Déploiement (QUAND PRÊT)**

6. ✅ Build de l'application (`npm run build`)
7. ✅ Configurer variables Vercel
8. ✅ Déployer sur Vercel
9. ✅ Tester en production

---

## 🧪 Tests à Effectuer

### **Après Configuration CORS :**
- ✅ Créer un document en local
- ✅ Envoyer pour signature
- ✅ Vérifier que le PDF se charge dans Inbox
- ✅ Tester la signature

### **Après Déploiement Production :**
- ✅ Créer un document sur `fom-signease.vercel.app`
- ✅ Envoyer pour signature
- ✅ Vérifier Inbox
- ✅ Tester la signature
- ✅ Vérifier l'audit trail

---

## 📊 Limites Actuelles

### **Firebase (Plan Gratuit - Spark)**

| Service | Limite Gratuite | Usage Estimé |
|---------|-----------------|--------------|
| **Firestore** | 1 GB stockage | Faible (texte seulement) |
| **Firestore** | 50K lectures/jour | Moyen |
| **Storage** | 5 GB stockage | Moyen (PDFs) |
| **Storage** | 1 GB transfert/jour | Faible-Moyen |

### **Vercel (Plan Gratuit - Hobby)**

| Service | Limite Gratuite |
|---------|------------------|
| **Bande passante** | 100 GB/mois |
| **Builds** | 6000 min/mois |
| **Projets** | Illimité |

---

## ⚠️ Important à Noter

1. **Pas de limitation de taille** pour les PDFs (Firebase Storage)
2. **CORS configuré pour toutes les origines** (`"*"`) - Pour plus de sécurité, limitez aux domaines spécifiques
3. **Règles Firebase permissives** - À personnaliser selon vos besoins de sécurité
4. **Emails simulés** - Pas d'envoi d'emails réels pour l'instant

---

## 📞 En Cas de Problème

### **CORS ne fonctionne pas**
1. Vérifiez que la commande `gsutil cors set` a réussi
2. Attendez 1-2 minutes (propagation)
3. Videz le cache navigateur
4. Vérifiez avec : `gsutil cors get gs://signeasyfo.firebasestorage.app`

### **Erreur en production**
1. Ouvrez la console navigateur (F12)
2. Vérifiez les variables d'environnement sur Vercel
3. Vérifiez les règles Firebase

### **Besoin d'aide**
- Consultez `docs/CONFIGURATION-CORS.md`
- Consultez `docs/DEPLOIEMENT.md`
- Consultez `docs/FIREBASE.md`

---

## ✅ Résumé

**Pour passer en production :**
1. **Configurer CORS** (10 min) ⚠️ OBLIGATOIRE
2. **Sécuriser Firebase** (5 min) ⚠️ OBLIGATOIRE
3. **Déployer sur Vercel** (15 min) ✅ Optionnel

**Total : ~30 minutes**

**L'application sera alors :**
- ✅ Sans limitation de taille pour les PDFs
- ✅ Accessible publiquement sur https://fom-signease.vercel.app
- ✅ Sécurisée (règles Firebase)
- ✅ Performante (CDN Vercel Edge Network)

