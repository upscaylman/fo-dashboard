# 🚀 Démarrage Rapide : Cloudflare Tunnel + Netlify

Guide ultra-rapide pour connecter votre site Netlify à n8n via Cloudflare Tunnel.

## ⚡ Configuration en 5 minutes

### 1. Créer le tunnel Cloudflare (2 min)

```powershell
# Authentification
cloudflared tunnel login

# Créer le tunnel
cloudflared tunnel create n8n-tunnel

# Notez l'UUID affiché, puis configurez le DNS
cloudflared tunnel route dns n8n-tunnel n8n.votre-domaine.com
```

### 2. Configurer le fichier cloudflared-config.yml (1 min)

Éditez `docker/cloudflared-config.yml` et remplacez :
- `[UUID]` par l'UUID de votre tunnel
- `n8n.votre-domaine.com` par votre domaine

### 3. Démarrer le tunnel (1 min)

```powershell
# Test rapide
cloudflared tunnel --config docker/cloudflared-config.yml run n8n-tunnel
```

Si ça fonctionne, configurez-le en service Docker (voir guide complet).

### 4. Mettre à jour les URLs (1 min)

```powershell
# Mettre à jour index.html
.\scripts\update-netlify-webhooks.ps1 -N8nUrl "https://n8n.votre-domaine.com"

# Configurer Netlify
.\scripts\configure-netlify-env.ps1 -N8nUrl "https://n8n.votre-domaine.com"
```

### 5. Configurer CORS dans n8n (30 sec)

1. Ouvrez `https://n8n.votre-domaine.com`
2. **Settings** > **CORS**
3. Ajoutez : `https://automate-template-form.netlify.app`

### 6. Redéployer (30 sec)

```powershell
netlify deploy --dir=templates/form --prod --no-build
```

## ✅ Vérification

1. Ouvrez `https://automate-template-form.netlify.app`
2. Testez le formulaire
3. Vérifiez que les webhooks fonctionnent

## 🆘 Problème ?

Voir le guide complet : [CONFIGURER_NETLIFY_AVEC_CLOUDFLARE_TUNNEL.md](CONFIGURER_NETLIFY_AVEC_CLOUDFLARE_TUNNEL.md)

