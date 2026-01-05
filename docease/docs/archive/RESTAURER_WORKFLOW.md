# 🔄 Restaurer le Workflow dans n8n

## 🚨 Problème

Votre workflow `TXziodPP3k2lvj1h` n'est plus accessible car :
- n8n a été configuré pour PostgreSQL
- Mais les workflows sont encore dans SQLite
- PostgreSQL est vide (nouvelle base)

## ✅ Solution : Réimporter le Workflow

### Option 1 : Via l'Interface n8n (Recommandé)

1. **Ouvrez n8n** : http://localhost:5678
2. **Créez un compte** si nécessaire (première connexion)
3. **Allez dans Workflows** → **Import from File**
4. **Sélectionnez** : `workflows/dev/gpt_generator.json`
5. **Importez** le workflow
6. **Activez** le workflow (toggle vert en haut à droite)
7. **Reconnectez les credentials** :
   - Cliquez sur le nœud "Envoi Email"
   - Reconnectez le credential SMTP

### Option 2 : Via l'API n8n

Si vous avez une clé API :

```powershell
# Importer le workflow
$workflowJson = Get-Content "workflows/dev/gpt_generator.json" -Raw
$headers = @{
    "X-N8N-API-KEY" = "VOTRE_CLE_API"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" `
    -Method POST `
    -Headers $headers `
    -Body $workflowJson
```

## 🔧 Vérifier la Configuration

Vérifiez que n8n utilise bien PostgreSQL :

```powershell
docker exec n8n-local env | Select-String "DB_TYPE"
# Doit afficher : DB_TYPE=postgresdb
```

Si n8n utilise encore SQLite, redémarrez-le :

```powershell
cd docker
docker compose restart n8n
```

## 📝 Après l'Import

1. **Vérifiez l'ID du workflow** dans n8n (il sera différent de `TXziodPP3k2lvj1h`)
2. **Mettez à jour l'URL** dans votre formulaire si nécessaire
3. **Testez** le workflow avec un document de test

## 🆘 Si le Workflow ne Fonctionne Pas

1. **Vérifiez les credentials** : Tous les nœuds avec 🔒 doivent être reconnectés
2. **Vérifiez les webhooks** : Les URLs peuvent avoir changé
3. **Vérifiez les chemins** : Les templates doivent être accessibles

