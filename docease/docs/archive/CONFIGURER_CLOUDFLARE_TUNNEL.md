# 🌐 Configuration Cloudflare Tunnel

Guide pour exposer votre instance n8n publiquement via Cloudflare Tunnel (anciennement Argo Tunnel).

## 📋 Avantages de Cloudflare Tunnel

- ✅ **Pas besoin d'ouvrir de ports** sur votre routeur/firewall
- ✅ **HTTPS automatique** avec certificats Cloudflare
- ✅ **Gratuit** pour un usage personnel
- ✅ **Pas besoin de domaine** (vous pouvez utiliser un sous-domaine Cloudflare)
- ✅ **Protection DDoS** incluse
- ✅ **Masque votre IP** réelle

## 🔧 Prérequis

1. Un compte Cloudflare (gratuit)
2. Cloudflare Tunnel installé (`cloudflared`)
3. Un domaine géré par Cloudflare (ou utilisez un sous-domaine Cloudflare)

## 📦 Installation de Cloudflare Tunnel

### Windows

```powershell
# Télécharger depuis le site officiel
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Ou via Chocolatey
choco install cloudflared

# Ou via Scoop
scoop install cloudflared
```

### Linux/Mac

```bash
# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Mac
brew install cloudflared
```

## 🚀 Configuration Étape par Étape

### Étape 1 : Authentification Cloudflare

```bash
cloudflared tunnel login
```

Cette commande :
- Ouvre votre navigateur
- Vous demande de vous connecter à Cloudflare
- Autorise le tunnel à créer des routes DNS

### Étape 2 : Créer un Tunnel

```bash
cloudflared tunnel create n8n-tunnel
```

Cela crée un tunnel nommé `n8n-tunnel` et génère :
- Un fichier de credentials (généralement dans `~/.cloudflared/`)
- Un UUID de tunnel

### Étape 3 : Créer un fichier de configuration

Créez le fichier `docker/cloudflared-config.yml` (voir le fichier exemple fourni).

### Étape 4 : Configurer le DNS

#### Option A : Via la ligne de commande

```bash
cloudflared tunnel route dns n8n-tunnel n8n.votre-domaine.com
```

#### Option B : Via l'interface Cloudflare

1. Allez sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sélectionnez votre domaine
3. Allez dans **DNS** > **Records**
4. Créez un enregistrement CNAME :
   - **Nom** : `n8n` (ou ce que vous voulez)
   - **Cible** : `[UUID-du-tunnel].cfargotunnel.com`
   - **Proxy** : Activé (nuage orange)

### Étape 5 : Démarrer le Tunnel

#### Option A : Ligne de commande (test)

```bash
cloudflared tunnel --config docker/cloudflared-config.yml run n8n-tunnel
```

#### Option B : Service Windows (recommandé)

```powershell
# Installer comme service
cloudflared service install

# Démarrer le service
Start-Service cloudflared

# Vérifier le statut
Get-Service cloudflared
```

#### Option C : Docker (recommandé pour production)

Ajoutez le service `cloudflared` à votre `docker-compose.prod.yml` (voir la section Docker ci-dessous).

## 🐳 Configuration Docker

### Ajouter Cloudflare Tunnel à docker-compose.prod.yml

Ajoutez ce service à votre fichier `docker-compose.prod.yml` :

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: n8n-cloudflared
    restart: unless-stopped
    command: tunnel --config /etc/cloudflared/config.yml run
    volumes:
      - ./cloudflared-config.yml:/etc/cloudflared/config.yml:ro
      - cloudflared_credentials:/etc/cloudflared:ro
    networks:
      - n8n-network
    depends_on:
      - n8n
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  # ... autres volumes ...
  cloudflared_credentials:
    driver: local
```

**Important** : Vous devez copier vos credentials Cloudflare dans le volume Docker.

### Copier les credentials dans Docker

```bash
# Créer le volume
docker volume create cloudflared_credentials

# Copier les credentials (remplacez [UUID] par votre UUID de tunnel)
docker run --rm -v cloudflared_credentials:/data -v ~/.cloudflared:/source alpine sh -c "cp /source/[UUID].json /data/[UUID].json"
```

## ⚙️ Configuration n8n pour Cloudflare Tunnel

### Modifier les variables d'environnement

Dans votre fichier `.env` (production), configurez :

```env
# URL publique via Cloudflare Tunnel
N8N_HOST=n8n.votre-domaine.com
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://n8n.votre-domaine.com
WEBHOOK_URL=https://n8n.votre-domaine.com

# CORS - Autoriser votre domaine
N8N_CORS_ENABLED=true
N8N_CORS_ALLOW_ORIGIN=https://votre-site.netlify.app,https://n8n.votre-domaine.com
```

### Important : Désactiver Caddy si vous utilisez Cloudflare Tunnel

Si vous utilisez Cloudflare Tunnel, vous n'avez **pas besoin** de Caddy car :
- Cloudflare Tunnel gère déjà HTTPS
- Cloudflare Tunnel fait déjà le reverse proxy

Vous pouvez commenter le service `caddy` dans `docker-compose.prod.yml` :

```yaml
  # caddy:
  #   ... (commenté)
```

## 🔒 Sécurité

### Authentification Cloudflare Access (optionnel)

Pour ajouter une couche de sécurité supplémentaire :

1. Allez dans **Cloudflare Zero Trust** > **Access** > **Applications**
2. Créez une nouvelle application
3. Configurez les règles d'accès (email, OAuth, etc.)
4. Ajoutez la route dans votre `cloudflared-config.yml` :

```yaml
ingress:
  - hostname: n8n.votre-domaine.com
    service: http://n8n:5678
    originRequest:
      access:
        required: true
        teamName: votre-team-name
```

### Authentification basique n8n

Même avec Cloudflare Tunnel, activez l'authentification basique n8n :

```env
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=mot_de_passe_securise
```

## 🧪 Tester la Configuration

### 1. Vérifier que le tunnel fonctionne

```bash
# Voir les logs du tunnel
cloudflared tunnel info n8n-tunnel

# Ou si en Docker
docker logs n8n-cloudflared
```

### 2. Tester l'accès

```bash
# Tester l'URL publique
curl https://n8n.votre-domaine.com

# Tester un webhook
curl -X POST https://n8n.votre-domaine.com/webhook/votre-webhook-id
```

### 3. Vérifier les certificats SSL

Ouvrez `https://n8n.votre-domaine.com` dans votre navigateur et vérifiez que :
- Le cadenas vert est présent
- Le certificat est émis par Cloudflare

## 🐛 Dépannage

### Le tunnel ne démarre pas

```bash
# Vérifier les logs
cloudflared tunnel info n8n-tunnel

# Vérifier la configuration
cloudflared tunnel validate --config docker/cloudflared-config.yml
```

### Erreur "No such hostname"

- Vérifiez que le DNS est bien configuré
- Vérifiez que le proxy Cloudflare est activé (nuage orange)
- Attendez quelques minutes pour la propagation DNS

### Erreur "Connection refused"

- Vérifiez que n8n est bien démarré : `docker ps`
- Vérifiez que n8n écoute sur le port 5678
- Vérifiez que le tunnel pointe vers `http://n8n:5678` (nom du service Docker)

### Les webhooks ne fonctionnent pas

- Vérifiez que `WEBHOOK_URL` dans `.env` utilise l'URL Cloudflare
- Vérifiez les logs n8n : `docker logs n8n-prod`
- Vérifiez les logs du tunnel : `docker logs n8n-cloudflared`

## 📝 Fichiers de Configuration

- `docker/cloudflared-config.yml` : Configuration du tunnel
- `docker/.env` : Variables d'environnement n8n
- `~/.cloudflared/[UUID].json` : Credentials du tunnel (ne pas partager !)

## 🔄 Mise à jour

Pour mettre à jour Cloudflare Tunnel :

```bash
# Windows (Chocolatey)
choco upgrade cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Docker (automatique avec latest)
docker pull cloudflare/cloudflared:latest
docker compose -f docker-compose.prod.yml up -d cloudflared
```

## 📚 Ressources

- [Documentation officielle Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Guide de démarrage rapide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)
- [Configuration avancée](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/configuration/)

## ⚠️ Notes Importantes

1. **Gratuité** : Cloudflare Tunnel est gratuit pour un usage personnel, mais il y a des limites de bande passante
2. **Performance** : Cloudflare Tunnel ajoute une petite latence (généralement < 50ms)
3. **Backup** : Sauvegardez vos credentials de tunnel (`~/.cloudflared/[UUID].json`)
4. **Sécurité** : Ne partagez jamais vos credentials de tunnel
5. **Alternative** : Si vous avez déjà un domaine avec DNS configuré, Caddy reste une excellente option

