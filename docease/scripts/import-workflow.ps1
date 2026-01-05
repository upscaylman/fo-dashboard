# Script pour importer le workflow corrigé dans n8n
# Usage: .\scripts\import-workflow.ps1

Write-Host "🔧 Import du workflow corrigé dans n8n" -ForegroundColor Cyan
Write-Host ""

$workflowFile = "workflows\dev\gpt_generator.json"

if (-not (Test-Path $workflowFile)) {
    Write-Host "❌ Fichier workflow introuvable: $workflowFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Lecture du workflow depuis: $workflowFile" -ForegroundColor Yellow

# Lire le contenu du workflow
$workflowContent = Get-Content $workflowFile -Raw | ConvertFrom-Json

Write-Host "✅ Workflow chargé: $($workflowContent.name)" -ForegroundColor Green
Write-Host "   ID: $($workflowContent.id)" -ForegroundColor Gray
Write-Host "   Nœuds: $($workflowContent.nodes.Count)" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Instructions pour importer le workflow:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ouvrez n8n dans votre navigateur: http://localhost:5678" -ForegroundColor White
Write-Host "2. Allez dans le workflow 'gpt_generator'" -ForegroundColor White
Write-Host "3. Cliquez sur les 3 points (...) en haut à droite" -ForegroundColor White
Write-Host "4. Sélectionnez 'Import from File'" -ForegroundColor White
Write-Host "5. Sélectionnez le fichier: $workflowFile" -ForegroundColor White
Write-Host "6. Confirmez l'import" -ForegroundColor White
Write-Host ""
Write-Host "✨ Le workflow sera mis à jour avec les nœuds inutiles supprimés" -ForegroundColor Green
Write-Host ""

# Ouvrir n8n dans le navigateur
Write-Host "🌐 Ouverture de n8n dans le navigateur..." -ForegroundColor Cyan
Start-Process "http://localhost:5678/workflow/dai6prI3FQZ3LdSS"

Write-Host ""
Write-Host "✅ Script terminé" -ForegroundColor Green

