# Script pour sauvegarder les templates HTML d'un workflow avant réimport
# Usage: .\scripts\backup-workflow-html.ps1 -WorkflowId "dai6prI3FQZ3LdSS"

param(
    [Parameter(Mandatory=$false)]
    [string]$WorkflowId = "dai6prI3FQZ3LdSS",  # ID du workflow gpt_generator
    
    [Parameter(Mandatory=$false)]
    [string]$N8nUrl = "http://localhost:5678/api/v1",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     💾 Sauvegarde des Templates HTML du Workflow          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BackupDir = Join-Path $RootDir "templates\backup"

# Créer le dossier de backup s'il n'existe pas
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "📁 Dossier de backup créé: $BackupDir" -ForegroundColor Green
}

# Fonction pour appeler l'API n8n
function Invoke-N8nApi {
    param(
        [string]$Endpoint,
        [string]$Method = "GET"
    )
    
    $headers = @{
        "X-N8N-API-KEY" = $ApiKey
        "Accept" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$N8nUrl$Endpoint" -Method $Method -Headers $headers
        return $response
    }
    catch {
        Write-Host "❌ Erreur API: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "🔍 Récupération du workflow $WorkflowId..." -ForegroundColor Cyan

# Récupérer le workflow
$workflow = Invoke-N8nApi -Endpoint "/workflows/$WorkflowId"

if (-not $workflow) {
    Write-Host "❌ Impossible de récupérer le workflow" -ForegroundColor Red
    Write-Host "   Vérifiez que n8n est démarré et que l'API Key est correcte" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Workflow récupéré: $($workflow.name)" -ForegroundColor Green
Write-Host ""

# Timestamp pour le backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Chercher les nodes de type "function" qui contiennent du HTML
$htmlNodes = $workflow.nodes | Where-Object { 
    $_.type -eq "n8n-nodes-base.function" -and 
    $_.parameters.functionCode -match "html|HTML"
}

if ($htmlNodes.Count -eq 0) {
    Write-Host "⚠️  Aucun node avec du HTML trouvé" -ForegroundColor Yellow
    exit 0
}

Write-Host "📋 Nodes avec HTML trouvés: $($htmlNodes.Count)" -ForegroundColor Cyan
Write-Host ""

foreach ($node in $htmlNodes) {
    $nodeName = $node.name -replace '[\\/:*?"<>|]', '_'  # Nettoyer le nom pour le fichier
    $backupFile = Join-Path $BackupDir "${timestamp}_${nodeName}.js"
    
    Write-Host "💾 Sauvegarde: $($node.name)" -ForegroundColor Yellow
    Write-Host "   → $backupFile" -ForegroundColor Gray
    
    # Sauvegarder le code
    $node.parameters.functionCode | Out-File -FilePath $backupFile -Encoding UTF8
    
    Write-Host "   ✅ Sauvegardé" -ForegroundColor Green
    Write-Host ""
}

# Sauvegarder aussi le workflow complet
$workflowBackupFile = Join-Path $BackupDir "${timestamp}_workflow_complete.json"
$workflow | ConvertTo-Json -Depth 20 | Out-File -FilePath $workflowBackupFile -Encoding UTF8

Write-Host "💾 Workflow complet sauvegardé:" -ForegroundColor Yellow
Write-Host "   → $workflowBackupFile" -ForegroundColor Gray
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ Sauvegarde Terminée                                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Fichiers sauvegardés dans: $BackupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Pour restaurer après réimport:" -ForegroundColor Yellow
Write-Host "   1. Ouvre n8n: http://localhost:5678" -ForegroundColor Gray
Write-Host "   2. Ouvre le workflow 'gpt_generator'" -ForegroundColor Gray
Write-Host "   3. Pour chaque node sauvegardé:" -ForegroundColor Gray
Write-Host "      - Ouvre le node" -ForegroundColor Gray
Write-Host "      - Copie le contenu du fichier .js" -ForegroundColor Gray
Write-Host "      - Colle dans le champ 'JavaScript Code'" -ForegroundColor Gray
Write-Host "   4. Sauvegarde le workflow" -ForegroundColor Gray
Write-Host ""

# Lister les fichiers de backup
Write-Host "📋 Fichiers de backup disponibles:" -ForegroundColor Cyan
Get-ChildItem $BackupDir -Filter "*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object {
    Write-Host "   - $($_.Name)" -ForegroundColor Gray
}
Write-Host ""

