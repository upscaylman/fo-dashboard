# Script pour restaurer automatiquement les templates HTML dans un workflow
# Usage: .\scripts\restore-workflow-html.ps1 -BackupTimestamp "20250106_143022"

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupTimestamp,
    
    [Parameter(Mandatory=$false)]
    [string]$WorkflowId = "dai6prI3FQZ3LdSS",
    
    [Parameter(Mandatory=$false)]
    [string]$N8nUrl = "http://localhost:5678/api/v1",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🔄 Restauration des Templates HTML du Workflow        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackupDir = Join-Path $RootDir "templates\backup"

# Vérifier que le dossier de backup existe
if (-not (Test-Path $BackupDir)) {
    Write-Host "❌ Aucun dossier de backup trouvé: $BackupDir" -ForegroundColor Red
    exit 1
}

# Si pas de timestamp fourni, lister les backups disponibles
if (-not $BackupTimestamp) {
    Write-Host "📋 Backups disponibles:" -ForegroundColor Cyan
    Write-Host ""
    
    $backups = Get-ChildItem $BackupDir -Filter "*_workflow_complete.json" | 
               Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "❌ Aucun backup trouvé" -ForegroundColor Red
        exit 1
    }
    
    $index = 1
    foreach ($backup in $backups) {
        $timestamp = $backup.Name -replace '_workflow_complete\.json$', ''
        $date = [DateTime]::ParseExact($timestamp, "yyyyMMdd_HHmmss", $null)
        Write-Host "  $index. $timestamp - $($date.ToString('dd/MM/yyyy HH:mm:ss'))" -ForegroundColor Yellow
        $index++
    }
    
    Write-Host ""
    $choice = Read-Host "Choisissez un backup (1-$($backups.Count))"
    
    if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $backups.Count) {
        $selectedBackup = $backups[[int]$choice - 1]
        $BackupTimestamp = $selectedBackup.Name -replace '_workflow_complete\.json$', ''
    }
    else {
        Write-Host "❌ Choix invalide" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔍 Restauration du backup: $BackupTimestamp" -ForegroundColor Cyan
Write-Host ""

# Fonction pour appeler l'API n8n
function Invoke-N8nApi {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )
    
    $headers = @{
        "X-N8N-API-KEY" = $ApiKey
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    try {
        $params = @{
            Uri = "$N8nUrl$Endpoint"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 20)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "❌ Erreur API: $_" -ForegroundColor Red
        return $null
    }
}

# Récupérer le workflow actuel
Write-Host "📥 Récupération du workflow actuel..." -ForegroundColor Cyan
$currentWorkflow = Invoke-N8nApi -Endpoint "/workflows/$WorkflowId"

if (-not $currentWorkflow) {
    Write-Host "❌ Impossible de récupérer le workflow" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Workflow actuel: $($currentWorkflow.name)" -ForegroundColor Green
Write-Host ""

# Charger les backups
$backupFiles = Get-ChildItem $BackupDir -Filter "${BackupTimestamp}_*.js"

if ($backupFiles.Count -eq 0) {
    Write-Host "❌ Aucun fichier de backup trouvé pour $BackupTimestamp" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Fichiers de backup trouvés: $($backupFiles.Count)" -ForegroundColor Cyan
Write-Host ""

$restored = 0

foreach ($backupFile in $backupFiles) {
    # Extraire le nom du node du nom de fichier
    $nodeName = $backupFile.Name -replace "^${BackupTimestamp}_", '' -replace '\.js$', ''
    $nodeName = $nodeName -replace '_', ' '  # Restaurer les espaces
    
    Write-Host "🔄 Restauration: $nodeName" -ForegroundColor Yellow
    
    # Trouver le node correspondant dans le workflow actuel
    $node = $currentWorkflow.nodes | Where-Object { $_.name -eq $nodeName }
    
    if (-not $node) {
        Write-Host "   ⚠️  Node '$nodeName' non trouvé dans le workflow actuel" -ForegroundColor Yellow
        Write-Host "   Recherche par similarité..." -ForegroundColor Gray
        
        # Essayer de trouver un node similaire
        $similarNode = $currentWorkflow.nodes | Where-Object { 
            $_.type -eq "n8n-nodes-base.function" -and 
            $_.name -like "*$($nodeName.Split(' ')[0])*"
        } | Select-Object -First 1
        
        if ($similarNode) {
            $node = $similarNode
            Write-Host "   ✅ Node similaire trouvé: $($node.name)" -ForegroundColor Green
        }
        else {
            Write-Host "   ❌ Aucun node correspondant trouvé" -ForegroundColor Red
            continue
        }
    }
    
    # Charger le code du backup
    $backupCode = Get-Content $backupFile.FullName -Raw -Encoding UTF8
    
    # Mettre à jour le code du node
    $node.parameters.functionCode = $backupCode
    
    Write-Host "   ✅ Code restauré" -ForegroundColor Green
    $restored++
}

Write-Host ""

if ($restored -eq 0) {
    Write-Host "❌ Aucun node restauré" -ForegroundColor Red
    exit 1
}

# Mettre à jour le workflow via l'API
Write-Host "💾 Mise à jour du workflow sur n8n..." -ForegroundColor Cyan

$updateResult = Invoke-N8nApi -Endpoint "/workflows/$WorkflowId" -Method "PUT" -Body $currentWorkflow

if ($updateResult) {
    Write-Host "✅ Workflow mis à jour avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║     ✅ Restauration Terminée                               ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Résumé:" -ForegroundColor Cyan
    Write-Host "   - Nodes restaurés: $restored" -ForegroundColor Gray
    Write-Host "   - Workflow: $($currentWorkflow.name)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Vérifiez le workflow dans n8n: http://localhost:5678" -ForegroundColor Yellow
}
else {
    Write-Host "❌ Erreur lors de la mise à jour du workflow" -ForegroundColor Red
    Write-Host "   Les modifications n'ont pas été appliquées" -ForegroundColor Yellow
    exit 1
}

