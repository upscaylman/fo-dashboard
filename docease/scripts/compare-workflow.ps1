# Script pour comparer le workflow local avec celui en ligne
Write-Host "🔍 Comparaison du workflow local avec celui en ligne..." -ForegroundColor Cyan
Write-Host ""

# Workflow local
$localWorkflowPath = "workflows/dev/gpt_generator.json"
$localWorkflow = Get-Content $localWorkflowPath | ConvertFrom-Json

Write-Host "📁 Workflow Local:" -ForegroundColor Yellow
Write-Host "   ID: $($localWorkflow.id)"
Write-Host "   Nom: $($localWorkflow.name)"
Write-Host "   Actif: $($localWorkflow.active)"
Write-Host ""

# Extraire les chemins des webhooks
$webhookPaths = @()
$webhookNames = @()
foreach ($node in $localWorkflow.nodes) {
    if ($node.type -eq "n8n-nodes-base.webhook") {
        $webhookPaths += $node.parameters.path
        $webhookNames += $node.name
    }
}

Write-Host "🔗 Webhooks dans le workflow local:" -ForegroundColor Yellow
for ($i = 0; $i -lt $webhookPaths.Count; $i++) {
    Write-Host "   - $($webhookNames[$i]): /webhook/$($webhookPaths[$i])"
}
Write-Host ""

# Extraire les noms des nœuds principaux
$mainNodes = @()
foreach ($node in $localWorkflow.nodes) {
    $mainNodes += $node.name
}

Write-Host "📋 Nœuds principaux (local):" -ForegroundColor Yellow
$mainNodes | ForEach-Object { Write-Host "   - $_" }
Write-Host ""

# Vérifier si les webhooks sont accessibles
Write-Host "🌐 Vérification des webhooks en ligne..." -ForegroundColor Yellow
$baseUrl = "http://localhost:5678"

foreach ($path in $webhookPaths) {
    $url = "$baseUrl/webhook/$path"
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        Write-Host "   ✅ $url - Accessible" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  $url - Non accessible (normal si POST uniquement)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Vérifier le workflow en ligne
$workflowId = "TXziodPP3k2lvj1h"
$workflowUrl = "$baseUrl/workflow/$workflowId"

Write-Host "🔗 URL du workflow en ligne:" -ForegroundColor Yellow
Write-Host "   $workflowUrl"
Write-Host ""

Write-Host "💡 Pour vérifier manuellement:" -ForegroundColor Cyan
Write-Host "   1. Ouvrez: $workflowUrl"
Write-Host "   2. Comparez les noms des nœuds avec ceux listés ci-dessus"
Write-Host "   3. Vérifiez les chemins des webhooks"
Write-Host ""

# Résumé
Write-Host "📊 Résumé:" -ForegroundColor Cyan
Write-Host "   - Workflow local ID: $($localWorkflow.id)"
Write-Host "   - Workflow en ligne ID: $workflowId"
Write-Host "   - Si les IDs sont différents, c'est normal (IDs de base de données vs export)"
Write-Host "   - Vérifiez que les noms des nœuds et webhooks correspondent"
Write-Host ""

