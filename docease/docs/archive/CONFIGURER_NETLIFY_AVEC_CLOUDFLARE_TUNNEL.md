# 🌐 Configuration Netlify avec Cloudflare Tunnel

Guide rapide pour connecter votre site Netlify à n8n via Cloudflare Tunnel.

## 📋 Prérequis

- ✅ Site déployé sur Netlify : `https://automate-template-form.netlify.app`
- ✅ Cloudflare Tunnel installé
- ✅ Instance n8n locale fonctionnelle sur `http://localhost:5678`

## 🚀 Étapes de Configuration

### Étape 1 : Configurer Cloudflare Tunnel

#### 1.1 Authentification Cloudflare

```powershell
cloudflared tunnel login
```

#### 1.2 Créer un tunnel

```powershell
cloudflared tunnel create n8n-tunnel
```

Notez l'UUID du tunnel affiché.

#### 1.3 Configurer le DNS

Remplacez `n8n.votre-domaine.com` par votre domaine Cloudflare :

```powershell
cloudflared tunnel route dns n8n-tunnel n8n.votre-domaine.com
```

**OU** configurez manuellement dans Cloudflare Dashboard :
- Allez sur [dash.cloudflare.com](https://dash.cloudflare.com)
- Sélectionnez votre domaine
- **DNS** > **Records** > **Add record**
- Type : `CNAME`
- Nom : `n8n`
- Cible : `[UUID].cfargotunnel.com` (remplacez [UUID] par votre UUID)
- Proxy : **Activé** (nuage orange)

#### 1.4 Mettre à jour la configuration

Éditez `docker/cloudflared-config.yml` :

```yaml
tunnel: [VOTRE-UUID]
credentials-file: /etc/cloudflared/[VOTRE-UUID].json

ingress:
  - hostname: n8n.votre-domaine.com
    service: http://n8n:5678
    originRequest:
      httpHostHeader: n8n.votre-domaine.com
      connectTimeout: 30s
  - service: http_status:404
```

#### 1.5 Démarrer le tunnel

**Option A : Ligne de commande (test)**

```powershell
cloudflared tunnel --config docker/cloudflared-config.yml run n8n-tunnel
```

**Option B : Docker (production)**

1. Décommentez le service `cloudflared` dans `docker/docker-compose.prod.yml`
2. Copiez les credentials dans Docker :

```powershell
# Créer le volume
docker volume create cloudflared_credentials

# Copier les credentials (remplacez [UUID] par votre UUID)
$uuid = "[VOTRE-UUID]"
docker run --rm -v cloudflared_credentials:/data -v "$env:USERPROFILE\.cloudflared\$uuid.json:/source.json" alpine sh -c "cp /source.json /data/$uuid.json"
```

3. Démarrer :

```powershell
cd docker
docker compose -f docker-compose.prod.yml up -d cloudflared
```

#### 1.6 Vérifier que le tunnel fonctionne

```powershell
# Tester l'accès
curl https://n8n.votre-domaine.com
```

Vous devriez voir l'interface n8n.

### Étape 2 : Configurer n8n pour Cloudflare Tunnel

Modifiez `docker/.env` :

```env
N8N_HOST=n8n.votre-domaine.com
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://n8n.votre-domaine.com
WEBHOOK_URL=https://n8n.votre-domaine.com

# CORS - Autoriser Netlify
N8N_CORS_ENABLED=true
N8N_CORS_ALLOW_ORIGIN=https://automate-template-form.netlify.app,https://n8n.votre-domaine.com
```

Redémarrez n8n :

```powershell
cd docker
docker compose -f docker-compose.prod.yml restart n8n
```

### Étape 3 : Configurer CORS dans n8n

1. Ouvrez n8n : `https://n8n.votre-domaine.com`
2. Allez dans **Settings** > **CORS**
3. Ajoutez : `https://automate-template-form.netlify.app`
4. Activez CORS si nécessaire

### Étape 4 : Mettre à jour les URLs dans le code

Utilisez le script PowerShell :

```powershell
.\scripts\update-netlify-webhooks.ps1 -N8nUrl "https://n8n.votre-domaine.com"
```

Ce script :
- Met à jour `templates/form/index.html` avec les nouvelles URLs
- Prépare les commandes Netlify CLI

### Étape 5 : Configurer les variables Netlify

#### Option A : Via le script PowerShell

```powershell
.\scripts\configure-netlify-env.ps1 -N8nUrl "https://n8n.votre-domaine.com"
```

#### Option B : Via Netlify CLI

```powershell
netlify env:set WEBHOOK_URL "https://n8n.votre-domaine.com/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254"
netlify env:set WEBHOOK_EMAIL_URL "https://n8n.votre-domaine.com/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997"
```

#### Option C : Via l'interface Netlify

1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Sélectionnez votre site
3. **Site settings** > **Environment variables**
4. Ajoutez :
   - `WEBHOOK_URL` = `https://n8n.votre-domaine.com/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254`
   - `WEBHOOK_EMAIL_URL` = `https://n8n.votre-domaine.com/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997`

### Étape 6 : Redéployer sur Netlify

**Important** : Les variables d'environnement Netlify ne sont pas automatiquement injectées dans le HTML côté client. Vous devez soit :

#### Option A : Utiliser le script de build (recommandé)

Créez un fichier `templates/form/package.json` :

```json
{
  "name": "form",
  "version": "1.0.0",
  "scripts": {
    "build": "node netlify-config.js"
  }
}
```

Puis configurez Netlify pour exécuter le build :
- **Build command** : `cd templates/form && npm run build`
- **Publish directory** : `templates/form`

#### Option B : Mettre à jour manuellement et redéployer

```powershell
# Mettre à jour index.html avec les URLs
.\scripts\update-netlify-webhooks.ps1 -N8nUrl "https://n8n.votre-domaine.com"

# Redéployer
netlify deploy --dir=templates/form --prod --no-build
```

### Étape 7 : Tester

1. Ouvrez `https://automate-template-form.netlify.app`
2. Remplissez le formulaire
3. Testez la génération de document
4. Vérifiez les logs n8n pour confirmer la réception des webhooks

## 🐛 Dépannage

### Les webhooks ne fonctionnent pas

1. **Vérifiez que le tunnel fonctionne** :
   ```powershell
   curl https://n8n.votre-domaine.com
   ```

2. **Vérifiez les logs du tunnel** :
   ```powershell
   docker logs n8n-cloudflared
   ```

3. **Vérifiez les logs n8n** :
   ```powershell
   docker logs n8n-prod
   ```

4. **Vérifiez CORS dans n8n** :
   - Settings > CORS
   - Vérifiez que `https://automate-template-form.netlify.app` est autorisé

5. **Testez les webhooks directement** :
   ```powershell
   curl -X POST https://n8n.votre-domaine.com/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254 -H "Content-Type: application/json" -d '{"test": "data"}'
   ```

### Erreur CORS dans la console du navigateur

- Vérifiez que CORS est activé dans n8n
- Vérifiez que l'URL Netlify est dans la liste des origines autorisées
- Vérifiez que `N8N_CORS_ALLOW_ORIGIN` dans `.env` contient l'URL Netlify

### Le tunnel ne démarre pas

- Vérifiez que les credentials sont présents : `~/.cloudflared/[UUID].json`
- Vérifiez la configuration : `cloudflared tunnel validate --config docker/cloudflared-config.yml`
- Vérifiez les logs : `cloudflared tunnel info n8n-tunnel`

## 📝 URLs Finales

Une fois configuré, vous aurez :

- **Site Netlify** : `https://automate-template-form.netlify.app`
- **n8n via Cloudflare Tunnel** : `https://n8n.votre-domaine.com`
- **Webhook principal** : `https://n8n.votre-domaine.com/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254`
- **Webhook email** : `https://n8n.votre-domaine.com/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997`

## 🔄 Mise à jour

Si vous changez l'URL de n8n :

1. Mettez à jour `docker/.env`
2. Redémarrez n8n : `docker compose -f docker-compose.prod.yml restart n8n`
3. Mettez à jour les URLs dans le code : `.\scripts\update-netlify-webhooks.ps1 -N8nUrl "nouvelle-url"`
4. Mettez à jour les variables Netlify : `.\scripts\configure-netlify-env.ps1 -N8nUrl "nouvelle-url"`
5. Redéployez : `netlify deploy --dir=templates/form --prod --no-build`

