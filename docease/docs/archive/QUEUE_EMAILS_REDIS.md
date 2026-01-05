# 📧 Queue pour les Emails avec Redis

## 🎯 Objectif

Implémenter une queue pour les emails afin d'éviter que l'envoi d'emails bloque le workflow principal et d'améliorer la performance et la fiabilité.

## ✅ Configuration

### 1. Redis ajouté dans `docker-compose.prod.yml`

Redis est maintenant configuré avec :
- Persistance activée (`appendonly yes`)
- Limite mémoire : 256MB
- Politique d'éviction : `allkeys-lru`
- Healthcheck configuré

### 2. Structure de la Queue

La queue utilise Redis List avec la clé `email:queue`.

## 🔧 Implémentation dans n8n

### Option A : Utiliser le nœud HTTP Request avec Redis REST API (Recommandé)

Si vous avez un service Redis REST API (comme `redis-commander` ou un service personnalisé), vous pouvez utiliser le nœud HTTP Request.

### Option B : Utiliser un Webhook Interne n8n (Solution Simple)

**Étape 1 : Modifier le workflow principal**

Remplacez le nœud "Envoi Email" par un nœud "HTTP Request" qui appelle un webhook interne :

1. **Supprimez** le nœud "Envoi Email" actuel
2. **Ajoutez** un nœud "HTTP Request" nommé "Mettre Email en Queue"
3. **Configurez** :
   - **Method** : `POST`
   - **URL** : `={{ $env.WEBHOOK_URL }}/webhook/email-queue`
   - **Body** : 
   ```json
   {
     "fromEmail": "contact@fo-metaux.fr",
     "toEmail": "={{ $json.emailDestinataire }}",
     "subject": "={{ 'Document généré - ' + ($json.objet || 'Votre document') }}",
     "text": "={{ $json.customEmailMessage || ('Bonjour ' + ($json.nomDestinataire || 'Madame, Monsieur') + ',\\n\\nVeuillez trouver ci-joint le document généré.\\n\\nCordialement,\\nFO METAUX') }}",
     "attachment": {
       "data": "={{ $binary.data.data }}",
       "mimeType": "={{ $binary.data.mimeType }}",
       "fileName": "={{ $binary.data.fileName }}"
     }
   }
   ```
   - **Options** → **Timeout** : `5000` (5 secondes max)
   - **Options** → **Ignore SSL Issues** : `true` (si auto-signed)

### Option C : Utiliser le nœud Function avec Redis (Avancé)

Si vous avez accès à Redis directement depuis n8n, vous pouvez utiliser le nœud Function :

1. **Ajoutez** un nœud "Function" nommé "Mettre Email en Queue"
2. **Code** :
```javascript
const https = require('https');
const http = require('http');

// Données de l'email
const emailData = {
  fromEmail: $json.fromEmail || "contact@fo-metaux.fr",
  toEmail: $json.emailDestinataire,
  subject: $json.subject || `Document généré - ${$json.objet || 'Votre document'}`,
  text: $json.customEmailMessage || `Bonjour ${$json.nomDestinataire || 'Madame, Monsieur'},\n\nVeuillez trouver ci-joint le document généré.\n\nCordialement,\nFO METAUX`,
  attachment: $binary.data ? {
    data: $binary.data.data,
    mimeType: $binary.data.mimeType,
    fileName: $binary.data.fileName
  } : null,
  timestamp: Date.now()
};

// Appeler le webhook interne de manière asynchrone (ne bloque pas)
const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:5678';
const url = new URL(`${webhookUrl}/webhook/email-queue`);

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000
};

const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
  // Ignorer la réponse (asynchrone)
});

req.on('error', (error) => {
  console.error('Erreur lors de la mise en queue:', error);
  // Ne pas bloquer le workflow en cas d'erreur
});

req.on('timeout', () => {
  req.destroy();
});

req.write(JSON.stringify(emailData));
req.end();

// Retourner immédiatement (ne pas attendre la réponse)
return {
  json: {
    success: true,
    message: "Email mis en queue avec succès",
    queued: true
  }
};
```

## 📋 Workflow Worker pour Traiter la Queue

Créez un **nouveau workflow** dans n8n nommé **"Email Queue Worker"** :

### Structure du Workflow

1. **Trigger : Cron** (toutes les 30 secondes)
   - **Cron Expression** : `*/30 * * * * *`
   - **Timezone** : `Europe/Paris`

2. **HTTP Request : Récupérer Email de la Queue**
   - **Method** : `GET`
   - **URL** : `http://redis:6379` (via un service proxy ou directement si accessible)
   - **Note** : Si Redis n'est pas accessible directement, utilisez un webhook qui lit Redis

3. **IF : Email Disponible**
   - **Condition** : `{{ $json.email }}` existe

4. **Email Send : Envoyer Email**
   - **From** : `={{ $json.fromEmail }}`
   - **To** : `={{ $json.toEmail }}`
   - **Subject** : `={{ $json.subject }}`
   - **Text** : `={{ $json.text }}`
   - **Attachments** : `={{ $json.attachment }}`

5. **Function : Logger Succès**
   ```javascript
   console.log('Email envoyé avec succès:', $json.toEmail);
   return { json: { success: true } };
   ```

### Alternative : Webhook pour Traiter la Queue

Si vous préférez, créez un webhook qui sera appelé par un cron externe ou un service :

1. **Webhook** : `email-queue-processor`
2. **HTTP Request** : Appeler Redis pour récupérer un email
3. **Email Send** : Envoyer l'email
4. **Réponse** : Confirmer le traitement

## 🔄 Solution Recommandée : Webhook Interne Simple

**La solution la plus simple** est d'utiliser un webhook interne n8n :

### Workflow 1 : Mettre en Queue (modifier le workflow principal)

Remplacez "Envoi Email" par "HTTP Request" qui appelle :
- **URL** : `={{ $env.WEBHOOK_URL }}/webhook/email-queue`
- **Method** : `POST`
- **Body** : Données de l'email (JSON)

### Workflow 2 : Traiter la Queue (nouveau workflow)

1. **Webhook** : `email-queue` (POST)
2. **Email Send** : Envoyer l'email avec les données reçues
3. **Réponse** : Confirmer

**Avantage** : Simple, pas besoin de Redis directement, utilise l'infrastructure n8n existante.

## 📊 Monitoring

Pour surveiller la queue :

```bash
# Se connecter à Redis
docker exec -it n8n-redis redis-cli

# Voir la taille de la queue
LLEN email:queue

# Voir les emails en attente (sans les retirer)
LRANGE email:queue 0 -1

# Vider la queue (si nécessaire)
DEL email:queue
```

## ✅ Checklist

- [x] Redis ajouté dans `docker-compose.prod.yml`
- [ ] Workflow principal modifié pour mettre les emails en queue
- [ ] Workflow worker créé pour traiter la queue
- [ ] Testé avec un email de test
- [ ] Monitoring configuré

## 🚀 Déploiement

1. **Redémarrer les services** :
   ```bash
   cd docker
   docker compose -f docker-compose.prod.yml up -d
   ```

2. **Vérifier Redis** :
   ```bash
   docker logs n8n-redis
   ```

3. **Modifier le workflow principal** dans n8n
4. **Créer le workflow worker** dans n8n
5. **Tester** avec un email de test

## 📝 Notes

- Les emails sont traités de manière asynchrone
- Le workflow principal ne bloque plus sur l'envoi d'email
- En cas d'erreur d'envoi, l'email reste dans la queue pour retry
- La queue peut être surveillée via Redis CLI

