# SignEase - Plateforme de Signature Électronique FO Métaux

**Production** : https://fom-signease.vercel.app

## 🚀 Démarrage Rapide

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

Application accessible sur : **http://localhost:3000**

### Production

```bash
npm run build
vercel --prod
```

---

## 📚 Documentation

Toute la documentation se trouve dans le dossier **`docs/`** :

### **🔥 Configuration**
- **`docs/FIREBASE.md`** - Configuration complète Firebase (Firestore + Storage)
- **`docs/CONFIGURATION-CORS.md`** - Configuration CORS pour Firebase Storage ⚠️ **OBLIGATOIRE**

### **🚀 Production**
- **`docs/ETAPES-PRODUCTION.md`** - ⭐ **GUIDE COMPLET** - Liste des étapes pour passer en production
- **`docs/DEPLOIEMENT.md`** - Guide détaillé de déploiement sur Vercel

### **📖 Ordre de Lecture Recommandé**
1. `docs/ETAPES-PRODUCTION.md` - Vue d'ensemble
2. `docs/CONFIGURATION-CORS.md` - Configuration CORS (obligatoire)
3. `docs/DEPLOIEMENT.md` - Déploiement sur Vercel

---

## ⚙️ Configuration

Créez un fichier `.env.local` à la racine avec :

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# EmailJS
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

---

## 🛠️ Technologies

- React + TypeScript
- Firebase (Firestore + Storage)
- Vite
- Tailwind CSS
- PDF.js + pdf-lib
- EmailJS

---

## 🌐 Déploiement Vercel

Le projet est déployé sur **Vercel** sous le nom `fom-signease`.

Les 11 variables d'environnement (Firebase x6, EmailJS x3, Supabase x2) sont configurées dans le dashboard Vercel.

| Projet | URL |
|--------|-----|
| **SignEase** | https://fom-signease.vercel.app |
| **TeamEase** (Dashboard) | https://fom-teamease.vercel.app |
| **DocEase** (Documents) | https://fom-docease.vercel.app |

---

**📖 Pour plus d'informations, consultez le dossier `docs/`**

