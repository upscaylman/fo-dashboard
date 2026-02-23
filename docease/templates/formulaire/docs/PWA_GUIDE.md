# 📱 DocEase PWA - Application Mobile

DocEase est maintenant une **Progressive Web App (PWA)**, ce qui signifie que vous pouvez l'installer sur votre téléphone comme une application native !

## 🚀 Installation sur votre appareil

### Sur iPhone/iPad (Safari)

1. Ouvrez DocEase dans **Safari** (pas Chrome)
2. Appuyez sur l'icône **Partager** (carré avec flèche vers le haut) 
3. Faites défiler et appuyez sur **"Sur l'écran d'accueil"**
4. Donnez un nom à l'app (ou gardez "DocEase")
5. Appuyez sur **"Ajouter"**

### Sur Android (Chrome)

1. Ouvrez DocEase dans **Chrome**
2. Un bandeau apparaîtra en bas vous proposant d'installer
3. Appuyez sur **"Installer"**
4. Ou bien : menu ⋮ > **"Installer l'application"**

### Sur Desktop (Chrome/Edge)

1. Ouvrez DocEase dans Chrome ou Edge
2. Cliquez sur l'icône d'installation dans la barre d'adresse (📥)
3. Cliquez sur **"Installer"**

## ✨ Fonctionnalités PWA

| Fonctionnalité | Description |
|----------------|-------------|
| 📲 Installation | App sur l'écran d'accueil |
| 🔲 Plein écran | Pas de barre d'adresse |
| 🌐 Mode offline | Page d'erreur gracieuse si pas de réseau |
| 🔔 Notifications | Support des notifications push (futur) |
| ⚡ Rapide | Mise en cache des ressources |

## 🛠️ Configuration technique

### Fichiers PWA

```
public/
├── manifest.json      # Métadonnées de l'app
├── sw.js              # Service Worker (cache + offline)
├── offline.html       # Page affichée hors connexion
└── assets/img/
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png
```

### Générer les icônes

Si vous modifiez le logo, régénérez les icônes :

```powershell
cd docease/templates/formulaire
.\scripts\generate-pwa-icons.ps1
```

### Vérifier la PWA

1. Ouvrez DevTools (F12)
2. Allez dans l'onglet **Application**
3. Vérifiez :
   - ✅ Manifest détecté
   - ✅ Service Worker enregistré
   - ✅ Critères d'installabilité respectés

## 🔧 Dépannage

### L'option "Ajouter à l'écran d'accueil" n'apparaît pas

- **Sur iPhone** : utilisez uniquement Safari
- **Sur Android** : utilisez Chrome
- Vérifiez que vous êtes sur HTTPS (Vercel le fournit automatiquement)

### L'app ne se met pas à jour

1. Fermez complètement l'app
2. Rouvrez-la
3. Le Service Worker vérifie automatiquement les mises à jour

### Vider le cache

En cas de problème, videz le cache du Service Worker :
1. DevTools > Application > Service Workers
2. Cliquez sur "Unregister"
3. Rafraîchissez la page

## 📊 Lighthouse Score

Pour vérifier le score PWA :
1. DevTools > Lighthouse
2. Cochez "Progressive Web App"
3. Lancez l'audit
4. Objectif : score vert (90+)

## 🔐 HTTPS obligatoire

Les PWA nécessitent HTTPS. Avec Vercel, c'est automatique.

Pour le développement local, utilisez :
```bash
npm run dev -- --https
```

---

📱 **Profitez de DocEase sur votre mobile !**
