# 🔍 Analyse du Workflow n8n - Problèmes Identifiés

## ❌ Problème Principal : Réponse Vide du Webhook

### Symptômes
```
[PROXY] Empty response from n8n for /webhook/formulaire-doc
[PROXY] Transmission: Status=200, BodyLength=0
[PROXY] WARNING: Empty body sent to client
```

Le webhook retourne un **Status 200** (succès) mais avec un **body vide** (0 bytes).

---

## 🔍 Analyse du Workflow

### Structure Actuelle

```
Formulaire (Webhook) [responseMode: responseNode]
    ↓
Préparer Données
    ↓
Condition IA
    ↓ (si useIA=true)        ↓ (si useIA=false)
Appel IA Gemma              Lire Template Word
    ↓
Extraire Texte IA
    ↓
Lire Template Word
    ↓
Remplir Template Docx
    ↓
Convertir en HTML (Preview)
    ↓
Webhook Preview [respondToWebhook]  ← RÉPONSE ICI
```

### Workflow de Validation (Séparé)

```
Validation (Webhook)
    ↓
Générer Word Final
    ↓
Envoi Email
    ↓
Réponse Finale [respondToWebhook]
```

---

## 🐛 Problèmes Identifiés

### 1. **Flux de Réponse Cassé** ⚠️

**Problème** : Le webhook `Formulaire (Webhook)` est configuré avec `responseMode: "responseNode"` mais le nœud de réponse `Webhook Preview` n'est **PAS connecté** au webhook initial.

**Explication** :
- Le webhook attend une réponse du nœud `respondToWebhook`
- Mais `Webhook Preview` est à la fin d'une chaîne qui n'est **jamais exécutée** si le workflow s'arrête avant
- Le webhook timeout et retourne une réponse vide

**Connexions actuelles** :
```json
"Formulaire (Webhook)": {
  "main": [[{"node": "Préparer Données", "type": "main", "index": 0}]]
}
```

Le flux va vers `Préparer Données` → ... → `Webhook Preview`, mais si une erreur se produit en cours de route, le webhook ne reçoit jamais de réponse.

---

### 2. **Nœuds Potentiellement Défaillants** ⚠️

#### A. Nœud "Remplir Template Docx"

**Problème potentiel** : Ce nœud utilise probablement `n8n-nodes-docxtemplater` qui peut échouer silencieusement.

**Vérifications nécessaires** :
- Le nœud `n8n-nodes-docxtemplater` est-il installé ?
- Le template `/templates/word/template_principal.docx` existe-t-il ?
- Les variables dans le template correspondent-elles aux données ?

#### B. Nœud "Convertir en HTML (Preview)"

**Type** : `n8n-nodes-base.function` (Code JavaScript)

**Problème potentiel** : Le code JavaScript peut échouer et bloquer le workflow.

**Code attendu** :
```javascript
// Convertir le document Word en HTML pour prévisualisation
const docxBuffer = $input.item.json.data;
// ... conversion ...
return { html: htmlContent };
```

Si ce nœud échoue, `Webhook Preview` ne reçoit jamais de données.

---

### 3. **Condition IA Non Testée** ⚠️

**Problème** : La condition `useIA` peut ne pas fonctionner correctement.

**Nœud "Condition IA"** :
```json
{
  "conditions": {
    "boolean": [
      {
        "value1": "={{ $json.useIA }}",
        "value2": true
      }
    ]
  }
}
```

**Vérifications** :
- Le champ `useIA` est-il bien envoyé depuis le formulaire ?
- Est-il de type `boolean` ou `string` ?
- Si c'est une string "true", la condition échouera

---

### 4. **Appel IA Ollama** ⚠️

**URL** : `http://ollama:11434/api/generate`

**Problèmes potentiels** :
- Ollama n'est pas démarré
- Le modèle `gemma2:2b` n'est pas téléchargé
- Timeout (120 secondes configuré)
- Le conteneur `ollama` n'est pas accessible depuis n8n

**Test nécessaire** :
```powershell
docker exec n8n-local curl http://ollama:11434/api/generate -X POST -d '{"model":"gemma2:2b","prompt":"test","stream":false}'
```

---

### 5. **Lecture du Template Word** ⚠️

**Chemin** : `/templates/word/template_principal.docx`

**Problèmes potentiels** :
- Le fichier n'existe pas
- Le chemin n'est pas monté correctement dans Docker
- Permissions de lecture insuffisantes

**Vérification** :
```powershell
docker exec n8n-local ls -la /templates/word/
```

---

## 🔧 Solutions Recommandées

### Solution 1 : Ajouter une Gestion d'Erreur

**Ajouter un nœud "Error Trigger"** qui capture les erreurs et retourne une réponse au webhook.

```
Workflow Principal
    ↓ (en cas d'erreur)
Error Trigger
    ↓
Respond to Webhook (Erreur)
```

---

### Solution 2 : Simplifier le Flux de Réponse

**Option A : Réponse Immédiate**

Changer le webhook en mode `responseMode: "onReceived"` pour répondre immédiatement :

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "formulaire-doc",
    "responseMode": "onReceived",
    "options": {
      "allowedOrigins": "*"
    }
  }
}
```

Puis traiter le document en arrière-plan.

**Option B : Ajouter un Timeout**

Ajouter un nœud "Wait" avant la réponse pour s'assurer que tout est terminé.

---

### Solution 3 : Ajouter des Logs de Débogage

**Ajouter des nœuds "Set" pour logger** :

```
Préparer Données
    ↓
Log 1: Données préparées
    ↓
Condition IA
    ↓
Log 2: Après condition
    ↓
...
```

Chaque nœud "Set" enregistre l'état actuel dans les données.

---

### Solution 4 : Tester Chaque Nœud Individuellement

**Utiliser le mode "Execute Node"** dans n8n :

1. Ouvrez le workflow dans n8n
2. Cliquez sur chaque nœud
3. Cliquez sur "Execute Node" pour tester individuellement
4. Vérifiez les données en sortie

---

### Solution 5 : Vérifier les Dépendances

**Checklist** :

- [ ] Ollama est démarré et accessible
- [ ] Le modèle `gemma2:2b` est téléchargé
- [ ] Le nœud `n8n-nodes-docxtemplater` est installé
- [ ] Le template Word existe et est accessible
- [ ] Les volumes Docker sont correctement montés
- [ ] Les credentials SMTP sont configurés

---

## 🧪 Tests à Effectuer

### Test 1 : Vérifier le Workflow dans n8n

```powershell
# Ouvrir n8n
start http://localhost:5678

# Vérifier que le workflow est actif (toggle vert)
# Cliquer sur "Execute Workflow" pour tester
```

### Test 2 : Tester le Webhook Directement

```powershell
$testData = @{
    civiliteDestinataire = "Monsieur"
    nomDestinataire = "Test"
    statutDestinataire = "Délégué Syndical"
    adresse = "123 Rue Test"
    cpVille = "75001 Paris"
    objet = "Test Document"
    useIA = $false
    texte_ia = ""
    emailDestinataire = "test@example.com"
    emailDelegue = "delegue@example.com"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5678/webhook/formulaire-doc" `
    -Method POST `
    -ContentType "application/json" `
    -Body $testData `
    -UseBasicParsing
```

### Test 3 : Vérifier les Logs n8n

```powershell
docker logs n8n-local --tail 50 -f
```

### Test 4 : Vérifier Ollama

```powershell
docker exec n8n-local curl http://ollama:11434/api/tags
```

### Test 5 : Vérifier le Template

```powershell
docker exec n8n-local ls -la /templates/word/template_principal.docx
```

---

## 📋 Plan d'Action Recommandé

### Étape 1 : Diagnostic (5 minutes)

1. Ouvrir n8n : http://localhost:5678
2. Ouvrir le workflow "gpt_generator"
3. Vérifier que le workflow est **actif** (toggle vert)
4. Cliquer sur "Execute Workflow" avec des données de test
5. Observer où le workflow s'arrête

### Étape 2 : Identifier le Nœud Défaillant (5 minutes)

1. Regarder les logs de chaque nœud
2. Identifier le premier nœud qui échoue ou ne retourne pas de données
3. Noter le message d'erreur

### Étape 3 : Corriger le Problème (10-30 minutes)

**Si c'est Ollama** :
```powershell
docker-compose restart ollama
docker exec ollama ollama pull gemma2:2b
```

**Si c'est le Template** :
```powershell
# Vérifier que le fichier existe
ls templates/word/template_principal.docx

# Vérifier les volumes Docker
docker-compose down
docker-compose up -d
```

**Si c'est Docxtemplater** :
```
Settings → Community Nodes → Install → n8n-nodes-docxtemplater
Redémarrer n8n
```

### Étape 4 : Tester la Correction (2 minutes)

1. Retester le workflow dans n8n
2. Tester depuis le formulaire
3. Vérifier que la réponse n'est plus vide

---

## 🔍 Commandes de Diagnostic Rapide

```powershell
# Vérifier tous les conteneurs
docker ps

# Vérifier les logs n8n
docker logs n8n-local --tail 50

# Vérifier les logs Ollama
docker logs ollama --tail 50

# Tester le webhook
.\scripts\test-n8n-webhook.ps1

# Diagnostic complet
.\scripts\diagnostic-webhook.ps1
```

---

## 📚 Ressources

- **Documentation n8n** : https://docs.n8n.io/
- **Docxtemplater** : https://docxtemplater.com/
- **Ollama API** : https://github.com/ollama/ollama/blob/main/docs/api.md

---

## 🎯 Prochaines Étapes

1. **Exécuter le diagnostic** avec les commandes ci-dessus
2. **Identifier le nœud défaillant** dans n8n
3. **Appliquer la solution appropriée**
4. **Tester et valider**

Utilisez le serveur MCP pour analyser et modifier le workflow si nécessaire !

