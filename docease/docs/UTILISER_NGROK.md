# 🌐 Utilisation de ngrok avec DocEase

Guide pour utiliser ngrok afin d'exposer votre instance n8n publiquement.

## 📋 Prérequis

1. **ngrok installé** : Téléchargez depuis [ngrok.com](https://ngrok.com/download)
2. **Compte ngrok** (gratuit) : Créez un compte sur [ngrok.com](https://dashboard.ngrok.com/signup)
3. **Authentification** : Configurez votre token ngrok :
   ```powershell
   ngrok config add-authtoken VOTRE_TOKEN
   ```

## 🚀 Démarrage rapide

### Option 1 : Script automatique (recommandé)

```powershell
.\start-ngrok.bat
```

Ce script va :
- ✅ Démarrer ngrok sur le port 5678 (n8n)
- ✅ Récupérer automatiquement l'URL publique
- ✅ Mettre à jour les URLs dans `templates/form/index.html`
- ✅ Afficher l'URL ngrok pour utilisation

### Option 2 : Script PowerShell

```powershell
.\scripts\start-ngrok.ps1
```

### Option 3 : Ligne de commande manuelle

```powershell
ngrok http 5678
```

Puis mettez à jour manuellement les URLs dans `templates/form/index.html`.

## 🛑 Arrêter ngrok

```powershell
.\stop-ngrok.bat
```

Ou :

```powershell
.\scripts\stop-ngrok.ps1
```

Ou manuellement :

```powershell
Stop-Process -Name "ngrok" -Force
```

## 📝 Mise à jour automatique des URLs

Le script `start-ngrok.ps1` met automatiquement à jour les URLs dans `templates/form/index.html` :

- **WEBHOOK_URL** : `https://votre-url-ngrok.ngrok-free.dev/webhook/[ID]`
- **WEBHOOK_EMAIL_URL** : `https://votre-url-ngrok.ngrok-free.dev/webhook/[ID]`

Les IDs des webhooks sont automatiquement détectés depuis le fichier `index.html`.

## 🔧 Configuration avancée

### Changer le port

Si n8n n'écoute pas sur le port 5678 :

```powershell
.\scripts\start-ngrok.ps1 -Port 8080
```

### Spécifier le chemin de ngrok

Si ngrok n'est pas dans le PATH :

```powershell
.\scripts\start-ngrok.ps1 -NgrokPath "C:\chemin\vers\ngrok.exe"
```

### Intégration dans start.bat

Pour démarrer ngrok automatiquement avec `start.bat`, décommentez les lignes dans `start.bat` :

```batch
echo.
echo 🌐 Démarrage du tunnel ngrok...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\start-ngrok.ps1"
```

## 📋 Vérification

### Vérifier que ngrok fonctionne

1. **Interface web ngrok** : http://localhost:4040
2. **Vérifier l'URL** : L'URL ngrok est affichée dans la console
3. **Tester le webhook** : Utilisez l'URL ngrok dans votre formulaire

### Vérifier les URLs dans index.html

Ouvrez `templates/form/index.html` et vérifiez que les URLs dans `window.ENV` pointent vers ngrok :

```javascript
window.ENV = {
  WEBHOOK_URL: 'https://votre-url-ngrok.ngrok-free.dev/webhook/...',
  WEBHOOK_EMAIL_URL: 'https://votre-url-ngrok.ngrok-free.dev/webhook/...'
};
```

## ⚠️ Notes importantes

1. **URL changeante** : Avec ngrok gratuit, l'URL change à chaque redémarrage. Vous devrez mettre à jour les URLs à chaque fois.

2. **Header ngrok** : Le code gère automatiquement le header `ngrok-skip-browser-warning` pour éviter l'avertissement ngrok.

3. **CORS** : Assurez-vous que n8n a CORS activé dans `docker-compose.yml` :
   ```yaml
   N8N_CORS_ENABLED=true
   N8N_CORS_ALLOW_ORIGIN=*
   ```

4. **Limites ngrok gratuit** :
   - URL change à chaque redémarrage
   - Limite de connexions simultanées
   - Pour un usage en production, considérez ngrok payant ou Cloudflare Tunnel

## 🔄 Workflow complet

1. Démarrer Docker et n8n :
   ```batch
   .\start.bat
   ```

2. Démarrer ngrok :
   ```batch
   .\start-ngrok.bat
   ```

3. Vérifier l'URL ngrok affichée

4. Utiliser l'application - les URLs sont automatiquement mises à jour

5. Arrêter ngrok quand terminé :
   ```batch
   .\stop-ngrok.bat
   ```

## 🆘 Dépannage

### ngrok ne démarre pas

- Vérifiez que ngrok est installé : `ngrok version`
- Vérifiez votre token : `ngrok config check`
- Vérifiez que le port 5678 est libre

### URLs non mises à jour

- Vérifiez que le fichier `templates/form/index.html` existe
- Vérifiez les permissions d'écriture
- Vérifiez les logs dans la console

### Erreur CORS

- Vérifiez que CORS est activé dans n8n
- Vérifiez que l'URL ngrok est correcte
- Vérifiez que le header `ngrok-skip-browser-warning` est envoyé

