# 🤔 Pourquoi CORS bloque-t-il ?

## Explication simple

CORS (Cross-Origin Resource Sharing) est une sécurité du navigateur qui **bloque les requêtes entre origines différentes**.

### Qu'est-ce qu'une "origine" ?

Une origine = **protocole + domaine + port**

Exemples d'origines différentes :
- `http://localhost:3000` (formulaire)
- `http://localhost:5678` (n8n)

**Ce sont des origines différentes** car les **ports sont différents** (3000 ≠ 5678)

### Pourquoi le navigateur bloque ?

Le navigateur protège votre sécurité en empêchant :
- Un site malveillant d'appeler vos APIs
- Le vol de données entre sites
- Les attaques CSRF

### Que fait le navigateur ?

1. Avant d'envoyer la requête POST, il envoie une requête **OPTIONS** (preflight)
2. Il vérifie si le serveur renvoie `Access-Control-Allow-Origin`
3. Si non → **BLOQUE la requête** (erreur CORS)

## ✅ Solutions

### Solution 1 : Proxy (déjà mis en place)

Le proxy sur le port 3000 :
- Sert le formulaire (même origine = pas de CORS)
- Fait le proxy vers n8n (serveur → serveur, pas de CORS)
- Ajoute les headers CORS aux réponses

**Avantages :** Fonctionne toujours
**Inconvénient :** Nécessite un serveur proxy

### Solution 2 : CORS dans n8n (recommandé si vous voulez appeler directement)

Configurez CORS directement dans le nœud Webhook n8n :

1. Dans n8n → Workflow → Nœud Webhook
2. Ajoutez l'option **"Allowed Origins (CORS)"**
3. Mettez `http://localhost:3000` ou `*`

**Avantages :** Appel direct possible
**Inconvénient :** Configuration par nœud webhook

## 📝 Résumé

- **Avec proxy** : Formulaire → Proxy (3000) → n8n (5678) ✅
- **Sans proxy** : Formulaire (3000) → n8n (5678) ❌ (CORS bloque)
- **Avec CORS configuré dans n8n** : Formulaire (3000) → n8n (5678) ✅

Voir `docs/CONFIGURER_CORS_N8N.md` pour configurer CORS dans n8n.

