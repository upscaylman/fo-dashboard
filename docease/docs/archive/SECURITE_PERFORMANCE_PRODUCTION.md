# 🔒 Sécurité et Performance pour la Production

Guide complet des ajustements nécessaires pour déployer le projet en production.

---

## 🚨 Problèmes de Sécurité Identifiés

### 1. CORS Trop Permissif

**Problème actuel :**
- `allowedOrigins: "*"` dans les webhooks n8n
- `N8N_ALLOW_CORS=*` dans Docker
- `Access-Control-Allow-Origin: *` dans le serveur PowerShell

**Risque :** N'importe quel site web peut appeler vos webhooks et générer des documents.

**Solution :**

#### A. Restreindre CORS dans les Webhooks n8n

Modifiez `workflows/dev/gpt_generator.json` :

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "formulaire-doc",
    "responseMode": "responseNode",
    "options": {
      "allowedOrigins": "https://votre-domaine.com,https://www.votre-domaine.com"
    }
  }
}
```

Faites de même pour le webhook "Validation" (ligne 270).

#### B. Configuration Docker Production

Créez `docker/.env.prod` :

```env
# CORS restrictif pour production
N8N_CORS_ENABLED=true
N8N_CORS_ALLOW_ORIGIN=https://votre-domaine.com,https://www.votre-domaine.com
```

#### C. Serveur PowerShell avec Origines Spécifiques

Modifiez `templates/form/serve-form.ps1` :

```powershell
# Liste des origines autorisées
$AllowedOrigins = @(
    "https://votre-domaine.com",
    "https://www.votre-domaine.com",
    "http://localhost:3000"  # Pour développement local
)

# Dans Handle-Request, remplacez :
$Origin = $Request.Headers["Origin"]
if ($AllowedOrigins -contains $Origin) {
    $Response.Headers.Add("Access-Control-Allow-Origin", $Origin)
} else {
    $Response.Headers.Add("Access-Control-Allow-Origin", "null")
}
$Response.Headers.Add("Access-Control-Allow-Credentials", "true")
```

---

### 2. Absence d'Authentification sur le Formulaire

**Problème actuel :** Le formulaire est accessible à tous sans authentification.

**Solutions possibles :**

#### Option A : Authentification Basique HTTP

Créez `templates/form/serve-form-auth.ps1` :

```powershell
# Configuration
$AuthUser = "admin"
$AuthPassword = "mot_de_passe_securise_ici"  # À changer !

function Check-Auth {
    param([System.Net.HttpListenerContext]$Context)
    
    $AuthHeader = $Context.Request.Headers["Authorization"]
    
    if ($AuthHeader) {
        $Encoded = $AuthHeader -replace "Basic ", ""
        $Decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($Encoded))
        $Credentials = $Decoded -split ":"
        
        if ($Credentials[0] -eq $AuthUser -and $Credentials[1] -eq $AuthPassword) {
            return $true
        }
    }
    
    # Demander l'authentification
    $Context.Response.StatusCode = 401
    $Context.Response.Headers.Add("WWW-Authenticate", "Basic realm=`"Formulaire Documents`"")
    $Context.Response.Close()
    return $false
}

# Dans Handle-Request, ajoutez en premier :
if (-not (Check-Auth -Context $Context)) {
    return
}
```

#### Option B : Token JWT (Recommandé)

Créez un système d'authentification avec tokens :

```javascript
// Dans templates/form/assets/js/core/auth.js
export async function authenticate() {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
        // Rediriger vers page de login
        window.location.href = '/login.html';
        return false;
    }
    
    // Vérifier le token avec le serveur
    try {
        const response = await fetch('/api/verify-token', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur authentification:', error);
        return false;
    }
}
```

---

### 3. Logs en Mode Debug

**Problème actuel :** `N8N_LOG_LEVEL=debug` expose trop d'informations.

**Solution :**

Dans `docker/.env.prod` :

```env
N8N_LOG_LEVEL=info
N8N_DIAGNOSTICS_ENABLED=false
```

---

### 4. Base de Données PostgreSQL (✅ DÉJÀ IMPLÉMENTÉ)

**Statut actuel :** ✅ PostgreSQL est maintenant utilisé pour **les deux environnements** (développement et production).

**Configuration :**

PostgreSQL est configuré dans :
- `docker-compose.yml` (développement)
- `docker-compose.prod.yml` (production)

**Variables d'environnement :**

```env
# docker/.env
POSTGRES_DB=n8n
POSTGRES_USER=n8n
POSTGRES_PASSWORD=changez_moi_mot_de_passe_securise
```

**Important pour la production :** 
- Changez `POSTGRES_PASSWORD` pour un mot de passe fort (minimum 20 caractères)
- Les deux environnements utilisent des volumes séparés (`postgres_data_dev` et `postgres_data`)

---

### 5. Pas de Rate Limiting

**Problème actuel :** Aucune protection contre les abus (spam, DoS).

**Solution :** Ajouter un reverse proxy avec rate limiting (Nginx ou Caddy)

#### Avec Caddy (✅ ACTIVÉ) :

Le rate limiting est **activé** dans `docker/Caddyfile` et `docker-compose.prod.yml` :

```caddy
votre-domaine.com {
    route {
        rate_limit {
            zone webhook {
                key {remote_ip}
                events 10
                window 1m
            }
        }
        
        reverse_proxy n8n:5678 {
            # ... config
        }
    }
}
```

**✅ Statut :** 
- Image Caddy compilée avec le module `http.handlers.rate_limit` ✅
- Configuration dans `Caddyfile` ✅
- `docker-compose.prod.yml` utilise l'image compilée ✅

**Limite :** 10 requêtes par minute par IP

Voir `docs/RATE_LIMITING_CADDY.md` pour plus de détails.

---

## ⚡ Problèmes de Performance Identifiés

### 1. Timeout IA Trop Long

**Problème actuel :** `timeout: 120000` (2 minutes) peut bloquer le workflow.

**Solution :** Réduire et ajouter un fallback

Dans le workflow n8n, modifiez le nœud "Appel IA Gemma" :

```json
{
  "parameters": {
    "options": {
      "timeout": 30000  // 30 secondes
    }
  }
}
```

**Configuration complète du nœud Ollama (nœud HTTP Request dans n8n) :**

**1. Dans le champ "JSON Body" (jsonBody) :**

```json
{
  "model": "gemma2:2b",
  "prompt": "Rédige un document professionnel en français basé sur ces informations : {{ $json.texteIa }}",
  "stream": false,
  "options": {
    "num_predict": 1000,
    "temperature": 0.5,
    "top_p": 0.9,
    "top_k": 40,
    "repeat_penalty": 1.1,
    "seed": -1
  }
}
```

**2. Dans les "Options" du nœud HTTP Request :**

```json
{
  "timeout": 30000,
  "redirect": {
    "followRedirects": true,
    "maxRedirects": 5
  },
  "response": {
    "response": {
      "responseFormat": "json",
      "fullResponse": false
    }
  }
}
```

**3. Configuration complète du nœud (structure n8n) :**

```json
{
  "parameters": {
    "method": "POST",
    "url": "http://ollama:11434/api/generate",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"model\": \"gemma2:2b\",\n  \"prompt\": \"Rédige un document professionnel en français basé sur ces informations : {{ $json.texteIa }}\",\n  \"stream\": false,\n  \"options\": {\n    \"num_predict\": 500,\n    \"temperature\": 0.7,\n    \"top_p\": 0.9,\n    \"top_k\": 40,\n    \"repeat_penalty\": 1.1,\n    \"seed\": -1\n  }\n}",
    "options": {
      "timeout": 30000,
      "redirect": {
        "followRedirects": true,
        "maxRedirects": 5
      },
      "response": {
        "response": {
          "responseFormat": "json",
          "fullResponse": false
        }
      }
    }
  },
  "name": "Appel IA Gemma",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
```

**Paramètres expliqués :**

- **timeout** : 30000ms (30 secondes) - Évite les blocages
- **num_predict** : 500 - Nombre maximum de tokens à générer
- **temperature** : 0.7 - Créativité (0.0 = déterministe, 1.0 = créatif)
- **top_p** : 0.9 - Filtrage par probabilité cumulative (qualité)
- **top_k** : 40 - Limite le nombre de tokens candidats
- **repeat_penalty** : 1.1 - Réduit la répétition (1.0 = neutre, >1.0 = moins de répétition)
- **seed** : -1 - Aléatoire (fixez une valeur pour reproduire les résultats)

**Note :** Dans n8n, le `jsonBody` doit être une expression (commence par `=`) pour permettre l'utilisation des variables `{{ $json.texteIa }}`.

Ajoutez un nœud "IF" après pour gérer les timeouts :

```javascript
// Si l'IA échoue, utiliser le texte original
if ($json.error || !$json.response) {
    return { json: { response: $('Préparer Données').item.json.texteIa } };
}
```

---

### 2. Pas de Cache pour les Templates

**Problème actuel :** Les templates Word sont relus à chaque requête.

**Solution :** Implémenter un cache en mémoire

Créez un nœud Function "Cache Template" avant "Lire Template Word" :

```javascript
// Cache simple en mémoire (pour n8n, utilisez Redis en production)
const templateCache = global.templateCache || {};
const templateType = $('Préparer Données').item.json.typeDocument;
const templatePath = `/templates/word/template_${templateType}.docx`;

// Vérifier le cache
if (templateCache[templatePath]) {
    const cached = templateCache[templatePath];
    const now = Date.now();
    
    // Cache valide 1 heure
    if (now - cached.timestamp < 3600000) {
        return {
            binary: {
                data: {
                    data: cached.data,
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    fileName: `template_${templateType}.docx`
                }
            }
        };
    }
}

// Lire le fichier et mettre en cache
const fs = require('fs');
const templateBuffer = fs.readFileSync(templatePath);
const base64 = templateBuffer.toString('base64');

global.templateCache = global.templateCache || {};
global.templateCache[templatePath] = {
    data: base64,
    timestamp: Date.now()
};

return {
    binary: {
        data: {
            data: base64,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileName: `template_${templateType}.docx`
        }
    }
};
```

**Pour la production :** Utilisez Redis avec un nœud Redis dans n8n.

---

### 3. Ollama Non Optimisé

**Problème actuel :** Configuration Ollama basique.

**Solution :** Optimiser dans `docker-compose-prod.yml` :

```yaml
ollama:
  environment:
    # Performance
    - OLLAMA_KEEP_ALIVE=1h              # Garde le modèle plus longtemps
    - OLLAMA_NUM_PARALLEL=4              # Plus de requêtes simultanées
    - OLLAMA_MAX_LOADED_MODELS=1
    - OLLAMA_FLASH_ATTENTION=1
    - OLLAMA_NUM_GPU=1                   # Si GPU disponible
    - OLLAMA_NUM_THREAD=8                # Plus de threads CPU
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 8G
      reservations:
        cpus: '2'
        memory: 4G
```

---

### 4. Pas de Queue pour les Emails (✅ REDIS CONFIGURÉ)

**Problème actuel :** Les emails sont envoyés directement, peuvent bloquer.

**Solution :** Utiliser un système de queue (RabbitMQ ou Redis Queue)

Ajoutez dans `docker-compose-prod.yml` :

```yaml
redis:
  image: redis:7-alpine
  container_name: n8n-redis
  restart: unless-stopped
  volumes:
    - redis_data:/data
  networks:
    - n8n-network

# Dans n8n, ajoutez un nœud "Redis" pour la queue
```

**✅ Redis est maintenant configuré dans `docker-compose.prod.yml`** avec persistance, healthcheck et limite mémoire.

**Prochaines étapes :** Voir `docs/QUEUE_EMAILS_REDIS.md` pour l'implémentation complète avec plusieurs options (webhook interne, Redis direct, etc.).

---

## 📋 Checklist de Déploiement Production

### Sécurité

- [ ] CORS restreint aux domaines autorisés
- [ ] Authentification activée (Basic Auth ou JWT)
- [ ] Logs en mode `info` (pas `debug`)
- [x] PostgreSQL configuré (développement et production)
- [ ] Mots de passe forts (20+ caractères)
- [ ] HTTPS activé (Caddy avec Let's Encrypt)
- [x] Rate limiting configuré (10 req/min par IP)
- [ ] Headers de sécurité (HSTS, XSS Protection, etc.)
- [ ] `.env` dans `.gitignore` (vérifié)
- [ ] Secrets dans un gestionnaire de secrets (Vault, AWS Secrets Manager)

### Performance

- [ ] Timeout IA réduit (30s) avec fallback
- [ ] Cache des templates (Redis ou mémoire)
- [ ] Ollama optimisé (GPU si disponible)
- [x] Redis configuré pour la queue des emails
- [ ] Workflow modifié pour utiliser la queue (voir `docs/QUEUE_EMAILS_REDIS.md`)
- [ ] Monitoring configuré (Prometheus, Grafana)
- [ ] Logs rotatifs configurés
- [ ] Backup automatique de la base de données

### Infrastructure

- [ ] Docker Compose production (`docker-compose-prod.yml`)
- [ ] Reverse proxy (Caddy/Nginx) configuré
- [ ] Certificats SSL automatiques (Let's Encrypt)
- [ ] Firewall configuré (ports 80, 443 uniquement)
- [ ] Monitoring des ressources (CPU, RAM, disque)
- [ ] Alertes configurées (email, Slack, etc.)

---

## 🔧 Scripts d'Aide

### Script de Vérification Sécurité

Créez `scripts/check-security.ps1` :

```powershell
Write-Host "🔒 Vérification de la sécurité..." -ForegroundColor Cyan

$Issues = @()

# Vérifier CORS
$CorsConfig = Get-Content "docker\.env" | Select-String "CORS_ALLOW_ORIGIN"
if ($CorsConfig -match '\*') {
    $Issues += "❌ CORS autorise toutes les origines (*)"
}

# Vérifier authentification
$AuthConfig = Get-Content "docker\.env" | Select-String "BASIC_AUTH_ACTIVE"
if ($AuthConfig -notmatch 'true') {
    $Issues += "❌ Authentification basique désactivée"
}

# Vérifier logs
$LogLevel = Get-Content "docker\.env" | Select-String "LOG_LEVEL"
if ($LogLevel -match 'debug') {
    $Issues += "⚠️  Logs en mode debug (à changer en production)"
}

# Vérifier PostgreSQL
$PostgresPassword = Get-Content "docker\.env" | Select-String "POSTGRES_PASSWORD"
if ($PostgresPassword -match "changez_moi|n8n_dev_password") {
    $Warnings += "⚠️  Mot de passe PostgreSQL par défaut détecté - changez-le en production"
}

if ($Issues.Count -eq 0) {
    Write-Host "✅ Aucun problème de sécurité détecté" -ForegroundColor Green
} else {
    Write-Host "`nProblèmes détectés :" -ForegroundColor Yellow
    $Issues | ForEach-Object { Write-Host $_ }
}
```

---

## 📚 Ressources

- [Documentation n8n Production](https://docs.n8n.io/hosting/installation/docker/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)

---

## 🆘 Support

En cas de problème, consultez :
- `docs/TROUBLESHOOTING.md`
- Logs n8n : `docker logs n8n-prod`
- Logs Caddy : `docker logs caddy`

