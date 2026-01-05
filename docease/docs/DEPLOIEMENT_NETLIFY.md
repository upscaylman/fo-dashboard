# 🚀 Déploiement sur Netlify

Guide pour déployer le formulaire sur Netlify.

## 📋 Prérequis

1. Un compte Netlify (gratuit)
2. Un dépôt Git (GitHub, GitLab ou Bitbucket)
3. Votre instance n8n accessible publiquement (ou via tunnel)

## 🔧 Configuration

### 1. Variables d'environnement dans Netlify

Dans les paramètres de votre site Netlify, ajoutez ces variables d'environnement :

```
WEBHOOK_URL=https://votre-n8n.com/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254
WEBHOOK_EMAIL_URL=https://votre-n8n.com/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997
```

**Note :** Remplacez `https://votre-n8n.com` par l'URL publique de votre instance n8n.

### 2. Modifier le fichier de configuration

Le fichier `templates/form/assets/js/core/config.js` doit utiliser les variables d'environnement :

```javascript
export const CONFIG = {
  // URLs des webhooks - depuis les variables d'environnement
  WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:5678/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254',
  WEBHOOK_EMAIL_URL: import.meta.env.VITE_WEBHOOK_EMAIL_URL || 'http://localhost:5678/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997',
  // ...
}
```

### 3. Déploiement

#### Option A : Via l'interface Netlify

1. Connectez votre dépôt Git à Netlify
2. Configurez le build :
   - **Build command** : (laissez vide)
   - **Publish directory** : `templates/form`
3. Ajoutez les variables d'environnement (voir étape 1)
4. Cliquez sur "Deploy"

#### Option B : Via Netlify CLI

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
netlify deploy --prod --dir=templates/form
```

## 🔒 Configuration CORS dans n8n

Assurez-vous que votre instance n8n autorise les requêtes depuis votre domaine Netlify :

1. Dans n8n, allez dans **Settings** > **CORS**
2. Ajoutez votre domaine Netlify (ex: `https://votre-site.netlify.app`)
3. Activez CORS si nécessaire

## 📁 Structure des fichiers

```
.
├── netlify.toml          # Configuration Netlify
├── templates/
│   └── form/
│       ├── _redirects   # Redirections Netlify
│       ├── index.html    # Point d'entrée
│       └── assets/       # CSS, JS, images
└── docs/
    └── DEPLOIEMENT_NETLIFY.md  # Ce fichier
```

## 🐛 Dépannage

### Les webhooks ne fonctionnent pas

- Vérifiez que les URLs dans les variables d'environnement sont correctes
- Vérifiez que votre instance n8n est accessible publiquement
- Vérifiez les logs Netlify pour les erreurs CORS

### Le fichier variables.json n'est pas trouvé

- Assurez-vous que `templates/config/variables.json` est copié dans `templates/form/config/`
- Ou configurez un proxy dans `netlify.toml` pour pointer vers votre serveur

### Erreurs 404 sur les routes

- Vérifiez que le fichier `_redirects` est présent dans `templates/form/`
- Vérifiez la configuration dans `netlify.toml`

## 🔄 Mises à jour

Après chaque modification, poussez vos changements sur Git. Netlify déploiera automatiquement si vous avez activé le déploiement automatique.

## 📝 Notes importantes

- Netlify est gratuit pour les sites statiques
- Les fonctions serverless Netlify peuvent être utilisées pour créer un proxy vers n8n si nécessaire
- Pour la production, considérez d'utiliser un tunnel (ngrok, Cloudflare Tunnel) pour n8n

