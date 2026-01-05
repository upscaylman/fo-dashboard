# Script de démarrage complet du système de formulaire

Write-Host "`n🚀 DÉMARRAGE DU SYSTÈME D'AUTOMATISATION" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Vérifier Docker
Write-Host "`n1️⃣  Vérification de Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Docker n'est pas démarré. Lancez Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Docker est actif" -ForegroundColor Green

# 2. Démarrer les conteneurs
Write-Host "`n2️⃣  Démarrage des conteneurs..." -ForegroundColor Yellow
Set-Location "docker"
docker-compose up -d
Set-Location ".."

Start-Sleep -Seconds 5

# 3. Vérifier n8n
Write-Host "`n3️⃣  Vérification de n8n..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$n8nReady = $false

while (-not $n8nReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        $n8nReady = $true
        Write-Host "   ✅ n8n est accessible sur http://localhost:5678" -ForegroundColor Green
    }
    catch {
        $retryCount++
        Write-Host "   ⏳ Attente de n8n... ($retryCount/$maxRetries)" -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

if (-not $n8nReady) {
    Write-Host "   ❌ n8n n'a pas démarré. Vérifiez les logs avec: docker logs n8n-local" -ForegroundColor Red
    exit 1
}

# 4. Vérifier Ollama
Write-Host "`n4️⃣  Vérification d'Ollama..." -ForegroundColor Yellow
try {
    $ollamaModels = docker exec -it ollama ollama list 2>&1
    if ($ollamaModels -match "gemma2:2b") {
        Write-Host "   ✅ Ollama prêt avec gemma2:2b" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  gemma2:2b non installé. Installation en cours..." -ForegroundColor Yellow
        docker exec -it ollama ollama pull gemma2:2b
    }
}
catch {
    Write-Host "   ❌ Erreur Ollama: $_" -ForegroundColor Red
}

# 5. Démarrer le serveur proxy
Write-Host "`n5️⃣  Démarrage du serveur proxy..." -ForegroundColor Yellow
$proxyRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($proxyRunning) {
    Write-Host "   ✅ Proxy déjà actif sur port 3000" -ForegroundColor Green
} else {
    Write-Host "   🔄 Démarrage du proxy en arrière-plan..." -ForegroundColor Cyan
    $proxyScriptPath = Join-Path $PSScriptRoot "..\templates\form\serve-form-background.ps1"
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$proxyScriptPath`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Proxy démarré sur http://localhost:3000" -ForegroundColor Green
}

# 6. Récapitulatif
Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "✅ SYSTÈME PRÊT" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Accès :" -ForegroundColor Cyan
Write-Host "   • Interface n8n : http://localhost:5678" -ForegroundColor White
Write-Host "   • Formulaire    : http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📝 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "   1. Ouvrir n8n : http://localhost:5678" -ForegroundColor Gray
Write-Host "   2. Supprimer le workflow 'gpt_generator' (si existant)" -ForegroundColor Gray
Write-Host "   3. Importer : workflows/dev/generateur_formulaire_html.json" -ForegroundColor Gray
Write-Host "   4. ACTIVER le workflow (toggle vert)" -ForegroundColor Gray
Write-Host "   5. Tester le formulaire : http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "🔍 Commandes utiles :" -ForegroundColor Cyan
Write-Host "   • Logs n8n  : docker logs n8n-local -f" -ForegroundColor Gray
Write-Host "   • Arrêter   : cd docker; docker-compose down" -ForegroundColor Gray
Write-Host ""
