# ✅ SOLUTION - Webhook Retourne une Réponse Vide

## 🔍 Problème Identifié

### Erreur Principale
```
The requested webhook "POST formulaire-doc" is not registered.
```

### Cause
Le workflow **n'est PAS actif** dans n8n !

Le message d'erreur indique clairement :
> "The workflow must be active for a production URL to run successfully. You can activate the workflow using the toggle in the top-right of the editor."

---

## ✅ SOLUTION IMMÉDIATE (30 secondes)

### Étape 1 : Ouvrir n8n
```
http://localhost:5678
```

### Étape 2 : Activer le Workflow

1. Dans n8n, cliquez sur **"Workflows"** dans le menu de gauche
2. Trouvez le workflow **"gpt_generator"**
3. Cliquez dessus pour l'ouvrir
4. **Activez le workflow** avec le toggle en haut à droite
   - Il doit passer de **ROUGE (Inactive)** à **VERT (Active)**

### Étape 3 : Tester

Retournez sur votre formulaire et testez à nouveau :
```
http://localhost:3000
```

---

## 🔍 Diagnostic Complet

### Résultats du Diagnostic

✅ **n8n est accessible**  
✅ **Conteneur n8n-local en cours d'exécution**  
✅ **Conteneur ollama en cours d'exécution**  
✅ **Template Word existe** (`template_principal.docx`)  
❌ **Webhook non enregistré** (workflow inactif)  
⚠️ **Ollama non accessible** (mais pas critique si useIA=false)  

### Logs n8n
```
Received request for unknown webhook: The requested webhook "POST formulaire-doc" is not registered.
{"currentlyRegistered":[]}
```

Le tableau `currentlyRegistered` est **vide**, ce qui confirme qu'aucun webhook n'est enregistré.

---

## 🎯 Pourquoi le Workflow est Inactif ?

### Raisons Possibles

1. **Le workflow n'a jamais été activé** après import
2. **Le workflow a été désactivé** manuellement
3. **Une erreur a désactivé le workflow** automatiquement
4. **Le workflow a été réimporté** sans être réactivé

---

## 🔧 Vérifications Supplémentaires

### 1. Vérifier l'État du Workflow via MCP

Si le serveur MCP est démarré, vous pouvez vérifier :

```
Liste tous les workflows n8n et montre leur statut actif/inactif
```

### 2. Activer le Workflow via MCP

```
Active le workflow "gpt_generator"
```

### 3. Vérifier les Webhooks Enregistrés

Dans n8n, après avoir activé le workflow :
1. Cliquez sur le nœud **"Formulaire (Webhook)"**
2. En bas du panneau, vous verrez l'URL du webhook
3. Elle devrait être : `http://localhost:5678/webhook/formulaire-doc`

---

## ⚠️ Problème Secondaire : Ollama

### Symptôme
```
AVERTISSEMENT Ollama n'est pas accessible
```

### Impact
- Si `useIA = false` : **Pas de problème**, le workflow fonctionne sans IA
- Si `useIA = true` : **Le workflow échouera** au nœud "Appel IA Gemma"

### Solution (si vous utilisez l'IA)

#### Option 1 : Démarrer Ollama
```powershell
docker-compose restart ollama
```

#### Option 2 : Installer le Modèle
```powershell
docker exec ollama ollama pull gemma2:2b
```

#### Option 3 : Vérifier qu'Ollama est Accessible
```powershell
docker exec n8n-local curl http://ollama:11434/api/tags
```

Si cette commande échoue, vérifiez la configuration réseau Docker.

---

## 📋 Checklist de Vérification

Après avoir activé le workflow, vérifiez :

- [ ] Le workflow est **VERT (Active)** dans n8n
- [ ] Le webhook est visible dans le nœud "Formulaire (Webhook)"
- [ ] L'URL du webhook est : `http://localhost:5678/webhook/formulaire-doc`
- [ ] Le formulaire charge correctement : `http://localhost:3000`
- [ ] Le test du webhook fonctionne :

```powershell
.\scripts\test-n8n-webhook.ps1
```

---

## 🧪 Test Complet

### Test 1 : Webhook Simple (sans IA)

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

**Résultat attendu** : Réponse avec du HTML (prévisualisation du document)

### Test 2 : Depuis le Formulaire

1. Ouvrez `http://localhost:3000`
2. Remplissez le formulaire
3. **Décochez** "Utiliser l'IA" (si Ollama n'est pas configuré)
4. Cliquez sur "Générer le document"

**Résultat attendu** : Prévisualisation du document s'affiche

---

## 🔍 Si le Problème Persiste

### Scénario 1 : Le Workflow est Actif mais le Webhook ne Fonctionne Pas

**Vérifications** :
1. Vérifiez l'URL exacte du webhook dans n8n
2. Vérifiez que le path est bien `formulaire-doc` (sans `/` au début)
3. Vérifiez que la méthode est `POST`
4. Vérifiez que CORS est activé (`allowedOrigins: "*"`)

### Scénario 2 : Le Workflow s'Exécute mais Retourne une Réponse Vide

**Causes possibles** :
1. Le nœud "Remplir Template Docx" échoue
2. Le nœud "Convertir en HTML (Preview)" échoue
3. Le nœud "Webhook Preview" ne reçoit pas de données

**Solution** :
1. Ouvrez le workflow dans n8n
2. Cliquez sur "Execute Workflow"
3. Observez quel nœud échoue
4. Consultez `WORKFLOW_ANALYSIS.md` pour plus de détails

### Scénario 3 : Erreur dans un Nœud Spécifique

**Nœud "Remplir Template Docx"** :
- Vérifiez que `n8n-nodes-docxtemplater` est installé
- Settings → Community Nodes → Install → `n8n-nodes-docxtemplater`
- Redémarrez n8n après installation

**Nœud "Convertir en HTML (Preview)"** :
- Vérifiez le code JavaScript dans le nœud
- Testez le nœud individuellement

**Nœud "Appel IA Gemma"** :
- Vérifiez qu'Ollama est accessible
- Vérifiez que le modèle `gemma2:2b` est installé

---

## 📚 Commandes Utiles

### Diagnostic Complet
```powershell
.\scripts\diagnose-workflow.ps1
```

### Logs n8n en Temps Réel
```powershell
docker logs n8n-local -f
```

### Redémarrer n8n
```powershell
docker-compose restart n8n
```

### Vérifier les Workflows Actifs (via MCP)
```
Liste tous les workflows actifs
```

### Activer un Workflow (via MCP)
```
Active le workflow "gpt_generator"
```

---

## 🎉 Résumé

### Problème
Le webhook retourne une réponse vide car le workflow **n'est pas actif**.

### Solution
**Activer le workflow dans n8n** (toggle en haut à droite).

### Vérification
Tester le webhook avec `.\scripts\test-n8n-webhook.ps1`

### Problème Secondaire
Ollama n'est pas accessible (seulement si `useIA = true`).

### Solution Secondaire
Démarrer Ollama et installer le modèle `gemma2:2b`.

---

## 🚀 Prochaines Étapes

1. ✅ **Activer le workflow** dans n8n
2. ✅ **Tester le webhook** depuis le formulaire
3. ⚠️ **Configurer Ollama** (si vous utilisez l'IA)
4. ✅ **Installer n8n-nodes-docxtemplater** (si pas déjà fait)
5. ✅ **Tester le workflow complet**

---

Bon développement ! 🚀

