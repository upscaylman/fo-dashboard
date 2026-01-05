# 🔍 Vérifier l'URL exacte du webhook dans n8n

## Problème
Le formulaire retourne 404 même si le workflow est activé dans n8n.

## ✅ Solution : Trouver l'URL exacte

n8n peut générer des URLs de webhook différentes selon le mode (Test/Production) et la configuration.

### Étape 1 : Trouver l'URL exacte dans n8n

1. **Ouvrez n8n** : http://localhost:5678

2. **Allez dans Workflows** (menu de gauche)

3. **Cliquez sur le workflow "gpt_generator"**

4. **Cliquez sur le nœud "Formulaire (Webhook)"** (premier nœud, généralement à gauche)

5. **Dans le panneau de droite, regardez en bas** - vous verrez :
   - **"Test URL"** ou **"Production URL"** 
   - L'URL complète du webhook

   **Exemples d'URLs possibles :**
   - `http://localhost:5678/webhook-test/formulaire-doc` ✅
   - `http://localhost:5678/webhook-test/abc123-def456-ghi789` ⚠️ (ID unique)
   - `http://localhost:5678/webhook/formulaire-doc` (mode Production)

6. **COPIEZ l'URL exacte affichée**

### Étape 2 : Tester l'URL

Testez directement cette URL avec PowerShell :

```powershell
# Remplacez [VOTRE-URL] par l'URL copiée depuis n8n
$url = "http://localhost:5678/webhook-test/formulaire-doc"  # Exemple
$data = '{"civilite":"Monsieur","nom":"Test","adresse":"123","template":"securite","texte_ai":"test","destinataires":"test@test.com"}'

Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $data -UseBasicParsing
```

Si ça fonctionne, vous verrez une réponse avec Status 200 ou 201.

### Étape 3 : Mettre à jour le formulaire

Une fois l'URL qui fonctionne trouvée :

1. **Ouvrez** `templates/form/form.html`

2. **Trouvez la ligne ~79** avec :
   ```javascript
   const res = await fetch("http://localhost:3000/webhook-test/formulaire-doc", {
   ```

3. **Remplacez** la partie après `/webhook-test/` par celle de votre URL n8n
   
   **Exemple :**
   - Si n8n montre : `http://localhost:5678/webhook-test/abc123-def456`
   - Dans form.html, utilisez : `http://localhost:3000/webhook-test/abc123-def456`

4. **Faites de même** pour le webhook de validation (ligne ~120)

### Étape 4 : Alternative - Mode Production

Si le mode Test ne fonctionne pas :

1. Dans n8n, **cliquez sur le nœud Webhook**
2. **Changez le mode** de "Test" à **"Production"**
3. L'URL changera probablement vers `/webhook/formulaire-doc`
4. **Désactivez puis réactivez** le workflow
5. **Testez** avec la nouvelle URL

### 🔍 Vérification rapide

Exécutez ce script pour tester automatiquement :

```powershell
.\scripts\test-webhook-modes.ps1
```

## 💡 Conseil

**Important :** L'URL dans `form.html` doit utiliser le **port 3000** (proxy) et non 5678 (n8n direct).

- ✅ Correct : `http://localhost:3000/webhook-test/formulaire-doc`
- ❌ Incorrect : `http://localhost:5678/webhook-test/formulaire-doc`

