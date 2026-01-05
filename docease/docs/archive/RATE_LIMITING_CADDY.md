# 🛡️ Configuration Rate Limiting avec Caddy

## ⚠️ Important

Caddy v2 standard (`caddy:2-alpine`) **ne contient pas** le module `http.ratelimit` par défaut.

## ✅ Solutions

### Option 1 : Utiliser une image Caddy avec le module (Recommandé)

Un `Dockerfile` est disponible dans `docker/Dockerfile.caddy` :

```bash
cd docker
docker build -f Dockerfile.caddy -t caddy-ratelimit:latest .
```

Puis dans `docker-compose.prod.yml`, remplacez :
```yaml
image: caddy:2-alpine
```
par :
```yaml
image: caddy-ratelimit:latest
```

**Note :** Le module exact peut varier. Vérifiez la documentation Caddy pour le module rate limiting compatible avec votre version.

### Option 2 : Utiliser le rate limiting au niveau n8n

Configurez le rate limiting directement dans n8n via un middleware ou un plugin.

### Option 3 : Utiliser Nginx en reverse proxy (Alternative)

Si vous préférez, vous pouvez utiliser Nginx qui a le rate limiting natif :

```nginx
limit_req_zone $binary_remote_addr zone=webhook:10m rate=10r/m;

server {
    location / {
        limit_req zone=webhook burst=5;
        proxy_pass http://n8n:5678;
    }
}
```

## 📝 Configuration Actuelle

**✅ Rate limiting ACTIVÉ**

- Image Caddy compilée : `caddy-ratelimit:latest` ✅
- Module inclus : `http.handlers.rate_limit` ✅
- Configuration dans `Caddyfile` ✅
- `docker-compose.prod.yml` utilise l'image compilée ✅

**Le rate limiting est maintenant actif en production !**

## 🔧 Rate Limiting Activé

Le rate limiting est **déjà activé** :

1. ✅ Image Caddy compilée avec le module
2. ✅ Configuration dans `Caddyfile`
3. ✅ `docker-compose.prod.yml` utilise l'image compilée

**Pour redémarrer Caddy avec le rate limiting :**
```bash
cd docker
docker compose -f docker-compose.prod.yml up -d --build caddy
```

## 📊 Vérification

Pour vérifier si le rate limiting fonctionne :

```bash
# Tester avec plusieurs requêtes rapides
for i in {1..15}; do curl -I https://votre-domaine.com; done

# Vous devriez voir des erreurs 429 (Too Many Requests) après 10 requêtes
```

