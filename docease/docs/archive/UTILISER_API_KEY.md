# 🔑 Utiliser la Clé API n8n

## ✅ Votre Clé API

Votre clé API n8n est configurée et fonctionne !

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZWFjMmMzZi01YzJjLTQ0MDctODNlYi0zYzEyYTk4MjE2ZDYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzMzc3ODQzfQ.-CtKtXzhIvp16gvuf4l_TQUcJOQz452Dt7YZS7UW2lo
```

## 📋 Ce que vous pouvez faire avec

### 1. Vérifier les Workflows

```powershell
$apiKey = "VOTRE_CLE_API"
$headers = @{ "X-N8N-API-KEY" = $apiKey }

# Lister tous les workflows
$workflows = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" -Method Get -Headers $headers
$workflows.data | ForEach-Object { Write-Host "$($_.name) - $($_.id)" }
```

### 2. Vérifier un Workflow Spécifique

```powershell
$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/ZyXU27lERg0DYq9J" -Method Get -Headers $headers
```

### 3. Activer/Désactiver un Workflow

```powershell
# Activer
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/ZyXU27lERg0DYq9J/activate" -Method POST -Headers $headers

# Désactiver
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/ZyXU27lERg0DYq9J/deactivate" -Method POST -Headers $headers
```

### 4. Exécuter un Workflow

```powershell
$body = @{
    workflowId = "ZyXU27lERg0DYq9J"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/ZyXU27lERg0DYq9J/execute" -Method POST -Headers $headers -Body $body
```

## 🔒 Sécurité

⚠️ **Important** : Ne partagez jamais votre clé API publiquement !

- Gardez-la secrète
- Ne la commitez pas dans Git
- Utilisez-la uniquement pour vos scripts locaux

## 📝 Note

L'API n8n ne permet pas de créer des credentials directement (pour des raisons de sécurité). Vous devez créer le credential SMTP manuellement dans l'interface n8n.

