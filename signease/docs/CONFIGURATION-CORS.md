# 🔧 Configuration CORS pour Firebase Storage

## 📋 Pourquoi configurer CORS ?

Firebase Storage bloque par défaut les requêtes cross-origin. Pour que votre application puisse télécharger les PDFs depuis Storage, vous devez configurer CORS.

---

## 🚀 Méthode : Configuration avec Google Cloud SDK

### **Étape 1 : Installer Google Cloud SDK**

#### **Windows :**
1. Téléchargez l'installeur : https://cloud.google.com/sdk/docs/install
2. Exécutez `GoogleCloudSDKInstaller.exe`
3. Suivez les instructions d'installation
4. Redémarrez votre terminal/PowerShell

#### **Vérification :**
```bash
gcloud --version
gsutil --version
```

---

### **Étape 2 : Se connecter à Google Cloud**

Ouvrez PowerShell et exécutez :

```bash
gcloud auth login
```

Une fenêtre de navigateur s'ouvrira. Connectez-vous avec le compte Google associé à Firebase.

---

### **Étape 3 : Définir le projet**

```bash
gcloud config set project signeasyfo
```

---

### **Étape 4 : Appliquer la configuration CORS**

Depuis le dossier racine de votre projet (là où se trouve `cors.json`) :

```bash
gsutil cors set cors.json gs://signeasyfo.firebasestorage.app
```

**Résultat attendu :**
```
Setting CORS on gs://signeasyfo.firebasestorage.app/...
```

---

### **Étape 5 : Vérifier la configuration**

```bash
gsutil cors get gs://signeasyfo.firebasestorage.app
```

Vous devriez voir votre configuration CORS affichée.

---

## ✅ Configuration actuelle

Le fichier `cors.json` autorise :
- ✅ Toutes les origines (`*`) - développement et production
- ✅ Méthodes : GET, HEAD, PUT, POST, DELETE
- ✅ Cache : 1 heure (3600 secondes)

---

## 🔒 Sécurité (Recommandation pour production)

Pour plus de sécurité, remplacez `"origin": ["*"]` par vos domaines spécifiques :

```json
{
  "origin": [
    "http://localhost:3000",
    "https://fom-signease.vercel.app",
    "https://votre-domaine-personnalise.com"
  ],
  ...
}
```

Puis réappliquez :
```bash
gsutil cors set cors.json gs://signeasyfo.firebasestorage.app
```

---

## 🧪 Test

Après configuration :
1. Rechargez votre application
2. Créez un document et envoyez-le
3. Allez dans Inbox
4. Cliquez sur "Signer le document"
5. **Le PDF devrait se charger sans erreur CORS** ✅

---

## ❓ Dépannage

### **Erreur : `gsutil: command not found`**
- Vérifiez que Google Cloud SDK est bien installé
- Redémarrez votre terminal
- Vérifiez la variable PATH

### **Erreur : `AccessDeniedException: 403`**
- Vérifiez que vous êtes connecté avec le bon compte Google
- Vérifiez que le compte a les droits sur le projet Firebase

### **CORS ne fonctionne toujours pas**
- Attendez 1-2 minutes (propagation)
- Videz le cache du navigateur (Ctrl+Shift+Delete)
- Vérifiez la configuration avec `gsutil cors get`

---

## 📞 Support

En cas de problème, consultez :
- Documentation Firebase Storage CORS : https://firebase.google.com/docs/storage/web/download-files#cors_configuration
- Documentation gsutil : https://cloud.google.com/storage/docs/gsutil/commands/cors

