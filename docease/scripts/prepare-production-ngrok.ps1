# Script pour préparer la production avec ngrok
# Ce script met à jour index.html avec l'URL ngrok actuelle pour le déploiement Netlify
# Usage: .\scripts\prepare-production-ngrok.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 PRÉPARATION PRODUCTION AVEC NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que ngrok est en cours d'exécution
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if (-not $ngrokProcess) {
    Write-Host "❌ ngrok n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host "   Démarrez ngrok d'abord avec: .\start-ngrok.bat" -ForegroundColor Yellow
    exit 1
}

# Récupérer l'URL ngrok
Write-Host "📡 Récupération de l'URL ngrok..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET -ErrorAction Stop
    
    if ($response.tunnels -and $response.tunnels.Count -gt 0) {
        $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($httpsTunnel) {
            $ngrokUrl = $httpsTunnel.public_url
        } else {
            $ngrokUrl = $response.tunnels[0].public_url
        }
    } else {
        Write-Host "❌ Aucun tunnel ngrok trouvé" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Impossible de récupérer l'URL ngrok: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✅ URL ngrok: $ngrokUrl" -ForegroundColor Green
Write-Host ""

# Mettre à jour index.html
$indexHtmlPath = Join-Path $PSScriptRoot "..\templates\form\index.html"
if (-not (Test-Path $indexHtmlPath)) {
    Write-Host "❌ Fichier index.html non trouvé: $indexHtmlPath" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Mise à jour de index.html..." -ForegroundColor Cyan
$content = Get-Content $indexHtmlPath -Raw -Encoding UTF8

# Extraire les IDs des webhooks
$webhookId = $null
$webhookEmailId = $null

if ($content -match "WEBHOOK_URL:\s*'[^']*/webhook/([^']+)'") {
    $webhookId = $matches[1]
}
if ($content -match "WEBHOOK_EMAIL_URL:\s*'[^']*/webhook/([^']+)'") {
    $webhookEmailId = $matches[1]
}

if (-not $webhookId -or -not $webhookEmailId) {
    Write-Host "⚠️  Impossible d'extraire les IDs des webhooks, utilisation des valeurs par défaut" -ForegroundColor Yellow
    $webhookId = "7f72ac69-35b7-4771-a5c6-7acb18947254"
    $webhookEmailId = "1ee6e745-fc31-4fd8-bc59-531bd4a69997"
}

$newWebhookUrl = "$ngrokUrl/webhook/$webhookId"
$newWebhookEmailUrl = "$ngrokUrl/webhook/$webhookEmailId"

# Remplacer les URLs
$content = $content -replace "(WEBHOOK_URL:\s*')[^']*'", "`$1$newWebhookUrl'"
$content = $content -replace "(WEBHOOK_EMAIL_URL:\s*')[^']*'", "`$1$newWebhookEmailUrl'"

# Sauvegarder
Set-Content -Path $indexHtmlPath -Value $content -Encoding UTF8 -NoNewline

Write-Host "✅ index.html mis à jour" -ForegroundColor Green
Write-Host "   WEBHOOK_URL: $newWebhookUrl" -ForegroundColor Gray
Write-Host "   WEBHOOK_EMAIL_URL: $newWebhookEmailUrl" -ForegroundColor Gray
Write-Host ""

# Afficher les instructions pour Netlify
Write-Host "========================================" -ForegroundColor Green
Write-Host "📋 PROCHAINES ÉTAPES POUR NETLIFY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Configurer les variables d'environnement Netlify:" -ForegroundColor Yellow
Write-Host "   netlify env:set WEBHOOK_URL `"$newWebhookUrl`"" -ForegroundColor White
Write-Host "   netlify env:set WEBHOOK_EMAIL_URL `"$newWebhookEmailUrl`"" -ForegroundColor White
Write-Host ""
Write-Host "2. OU via l'interface Netlify:" -ForegroundColor Yellow
Write-Host "   - Allez sur app.netlify.com" -ForegroundColor White
Write-Host "   - Site settings > Environment variables" -ForegroundColor White
Write-Host "   - Ajoutez WEBHOOK_URL = $newWebhookUrl" -ForegroundColor White
Write-Host "   - Ajoutez WEBHOOK_EMAIL_URL = $newWebhookEmailUrl" -ForegroundColor White
Write-Host ""
Write-Host "3. Déployer sur Netlify:" -ForegroundColor Yellow
Write-Host "   netlify deploy --dir=templates/form --prod" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "   - L'URL ngrok change a chaque redemarrage de ngrok" -ForegroundColor Yellow
Write-Host "   - Vous devrez mettre a jour les URLs a chaque fois" -ForegroundColor Yellow
Write-Host "   - Pour une URL fixe, utilisez Cloudflare Tunnel (voir docs/)" -ForegroundColor Yellow
Write-Host ""

