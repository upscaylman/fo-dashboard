# 🔧 Créer un webhook n8n pour l'amélioration de texte

## Problème
En production, le formulaire ne peut pas appeler Ollama directement sur `localhost:11434`. Il faut créer un workflow n8n qui fait le pont entre le formulaire et Ollama.

## ✅ Solution : Créer un workflow n8n

### Étape 1 : Créer un nouveau workflow dans n8n

1. Ouvrez n8n : http://localhost:5678
2. Cliquez sur **"Add workflow"** (ou **"Nouveau workflow"**)
3. Nommez-le : **"Amélioration Texte IA"**

### Étape 2 : Ajouter un nœud Webhook

1. Dans le workflow, ajoutez un nœud **"Webhook"**
2. Configurez-le :
   - **HTTP Method** : `POST`
   - **Path** : `improve-text`
   - **Response Mode** : `Last Node`
   - **Allowed Origins (CORS)** : 
     - Pour le développement : `*`
     - Pour la production : `https://fo-docgenerateur.netlify.app` (ou votre URL Netlify)
     - **IMPORTANT** : Cliquez sur **"Add Option"** puis **"Allowed Origins (CORS)"** pour voir cette option

### Étape 3 : Ajouter un nœud HTTP Request pour Ollama

1. Ajoutez un nœud **"HTTP Request"** après le Webhook
2. Configurez-le :
   - **Method** : `POST`
   - **URL** : `http://localhost:11434/api/generate`
   - **Authentication** : `None`
   - **Body Content Type** : `JSON`
   - **Body** :
   ```json
   {
     "model": "gemma2:2b",
     "prompt": "={{ $json.prompt }}",
     "stream": false,
     "options": {
       "num_predict": 1000,
       "temperature": 0.5
     }
   }
   ```

### Étape 4 : Ajouter un nœud pour formater la réponse

1. Ajoutez un nœud **"Code"** après le HTTP Request
2. Dans le code, ajoutez :
   ```javascript
   const ollamaResponse = $input.item.json;
   const improvedText = ollamaResponse.response || ollamaResponse.text || '';
   
   return {
     json: {
       improvedText: improvedText.trim(),
       originalText: $('Webhook').item.json.originalText,
       objet: $('Webhook').item.json.objet
     }
   };
   ```

### Étape 5 : Ajouter un nœud Respond to Webhook

1. Ajoutez un nœud **"Respond to Webhook"** à la fin
2. Configurez-le :
   - **Response Code** : `200`
   - **Response Body** : `={{ $json }}`

### Étape 6 : Activer le workflow

1. Cliquez sur **"Save"** pour sauvegarder
2. Activez le workflow (bouton **"Active"** en haut à droite)
3. Notez l'URL du webhook affichée en bas du nœud Webhook

### Étape 7 : Vérifier l'URL

L'URL devrait ressembler à :
- **Test** : `http://localhost:5678/webhook-test/improve-text`
- **Production** : `http://localhost:5678/webhook/improve-text`

En production avec ngrok, l'URL complète sera :
- `https://dee-wakeful-succulently.ngrok-free.dev/webhook/improve-text`

## 📝 Structure du workflow

```
Webhook (POST /improve-text)
  ↓
HTTP Request (Ollama API)
  ↓
Code (Formater la réponse)
  ↓
Respond to Webhook
```

## 🔍 Test

Testez le webhook avec PowerShell :

```powershell
$url = "http://localhost:5678/webhook-test/improve-text"
$data = @{
    prompt = "Tu es un assistant professionnel. Écris un texte complet et professionnel pour un document administratif."
    originalText = "Test de texte à améliorer"
    objet = "Test"
} | ConvertTo-Json

Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $data
```

## ⚠️ Notes importantes

- Le workflow doit être **actif** pour fonctionner
- En production, assurez-vous que ngrok pointe vers votre instance n8n
- Le webhook doit être accessible depuis Netlify (CORS configuré)
- Ollama doit être démarré et accessible depuis n8n

## 🔧 Résoudre les erreurs CORS

Si vous voyez l'erreur :
```
Access to fetch at '...' has been blocked by CORS policy
```

### Solution 1 : Configurer CORS dans le nœud Webhook

1. Ouvrez le workflow dans n8n
2. Cliquez sur le nœud **"Webhook"**
3. Cliquez sur **"Add Option"** (en bas du panneau)
4. Sélectionnez **"Allowed Origins (CORS)"**
5. Dans le champ qui apparaît, entrez :
   - Pour développement : `*`
   - Pour production : `https://fo-docgenerateur.netlify.app`
6. **Sauvegardez** le workflow
7. **Désactivez puis réactivez** le workflow pour appliquer les changements

### Solution 2 : Vérifier que le workflow est actif

1. Vérifiez que le bouton **"Active"** est bien activé (en haut à droite du workflow)
2. Si ce n'est pas le cas, cliquez dessus pour l'activer

### Solution 3 : Tester le webhook

Testez le webhook directement depuis le navigateur ou PowerShell pour vérifier que CORS fonctionne :

```powershell
# Test avec PowerShell
$url = "https://dee-wakeful-succulently.ngrok-free.dev/webhook/improve-text"
$headers = @{
    "Content-Type" = "application/json"
    "ngrok-skip-browser-warning" = "true"
}
$data = @{
    prompt = "Test prompt"
    originalText = "Test"
    objet = "Test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $data
    Write-Host "✅ Webhook accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
```

### Solution 4 : Vérifier ngrok

Assurez-vous que ngrok est bien démarré et pointe vers n8n :

```powershell
# Vérifier que ngrok est actif
ngrok status
```

Si ngrok n'est pas actif, démarrez-le :

```powershell
ngrok http 5678
```

