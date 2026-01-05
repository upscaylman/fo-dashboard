# 🔧 Dépannage Webhook - Formulaire ne communique pas

## Problème
Le workflow est activé dans n8n mais le formulaire ne communique pas (erreur 404).

## ✅ Solutions étape par étape

### 1. Vérifier l'URL exacte du webhook dans n8n

n8n génère parfois des URLs avec des IDs uniques plutôt que d'utiliser directement le path.

**Dans n8n :**
1. Ouvrez le workflow "gpt_generator"
2. Cliquez sur le nœud "Formulaire (Webhook)" (premier nœud)
3. **En bas du panneau**, vous verrez l'URL complète
4. **Copiez l'URL exacte** (elle peut être différente de celle attendue)

Exemples d'URLs possibles :
- `http://localhost:5678/webhook-test/formulaire-doc` ✅ (path simple)
- `http://localhost:5678/webhook-test/abc123-def456-ghi789` ❌ (ID unique généré par n8n)
- `http://localhost:5678/webhook/formulaire-doc` (mode Production)

### 2. Mettre à jour le formulaire avec l'URL correcte

Une fois que vous avez l'URL exacte :

1. Ouvrez `templates/form/form.html`
2. Trouvez les lignes avec les URLs des webhooks (vers la ligne 79 et 120)
3. Remplacez l'URL par celle copiée depuis n8n
4. **Important** : Utilisez le port 3000 (proxy) au lieu de 5678

**Exemple :**
```javascript
// Si n8n montre : http://localhost:5678/webhook-test/abc123-def456
// Dans form.html, utilisez : http://localhost:3000/webhook-test/abc123-def456
const res = await fetch("http://localhost:3000/webhook-test/abc123-def456", {
```

### 3. Utiliser le script de test interactif

Un script est disponible pour vous aider :

```powershell
.\scripts\get-webhook-url.ps1
```

Ce script vous guide pour :
- Trouver l'URL exacte dans n8n
- Tester si elle fonctionne
- Obtenir les instructions pour mettre à jour le formulaire

### 4. Vérifier que le serveur de formulaire est démarré

Le proxy doit être actif sur le port 3000 :

```powershell
Test-NetConnection -ComputerName localhost -Port 3000
```

Si ce n'est pas le cas :
```powershell
.\start.bat
```

### 5. Vérifier les logs

**Logs n8n :**
```powershell
cd docker
docker-compose logs n8n | tail -30
```

**Vérifier les requêtes reçues :**
- Dans n8n, ouvrez le workflow
- Cliquez sur "Executions" en bas
- Vérifiez si des requêtes arrivent au webhook

### 6. Solution alternative : Utiliser le webhook en mode Production

Si le mode Test pose problème :

1. Dans n8n, cliquez sur le nœud Webhook
2. Changez le mode de "Test" à "Production"
3. L'URL changera probablement (généralement `/webhook/formulaire-doc`)
4. Mettez à jour `form.html` avec la nouvelle URL

### 7. Forcer la régénération du webhook

Parfois, forcer la régénération aide :

1. Dans n8n, désactivez le workflow (toggle rouge)
2. Attendez 2-3 secondes
3. Réactivez-le (toggle vert)
4. L'URL peut changer - vérifiez-la à nouveau

## 🔍 Tests à effectuer

### Test 1 : Webhook direct vers n8n
```powershell
$data = '{"test":"data"}'
Invoke-WebRequest -Uri "http://localhost:5678/webhook-test/VOTRE-URL-ICI" `
    -Method POST -ContentType "application/json" -Body $data
```

### Test 2 : Via le proxy
```powershell
$data = '{"test":"data"}'
Invoke-WebRequest -Uri "http://localhost:3000/webhook-test/VOTRE-URL-ICI" `
    -Method POST -ContentType "application/json" -Body $data
```

## 📝 Checklist finale

- [ ] Workflow activé dans n8n (toggle vert)
- [ ] URL exacte du webhook notée depuis n8n
- [ ] `form.html` mis à jour avec l'URL correcte (port 3000)
- [ ] Serveur de formulaire démarré (port 3000 accessible)
- [ ] n8n accessible (port 5678)
- [ ] Test direct vers n8n fonctionne
- [ ] Test via proxy fonctionne

## 🆘 Si rien ne fonctionne

1. Redémarrez tout :
   ```powershell
   .\stop.bat
   .\start.bat
   ```

2. Vérifiez que Docker fonctionne :
   ```powershell
   cd docker
   docker-compose ps
   ```

3. Vérifiez les logs pour les erreurs :
   ```powershell
   cd docker
   docker-compose logs n8n
   ```

