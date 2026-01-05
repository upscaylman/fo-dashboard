# Script pour configurer les variables d'environnement Netlify
# Usage: .\scripts\configure-netlify-env.ps1 -N8nUrl "https://n8n.votre-domaine.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$N8nUrl
)

Write-Host "🌐 Configuration des variables d'environnement Netlify" -ForegroundColor Cyan
Write-Host ""

# Vérifier si netlify CLI est installé
try {
    $netlifyVersion = netlify --version 2>&1
    Write-Host "✅ Netlify CLI installé : $netlifyVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Netlify CLI n'est pas installé" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour installer Netlify CLI :" -ForegroundColor Yellow
    Write-Host "  npm install -g netlify-cli" -ForegroundColor Cyan
    Write-Host "  Ou : scoop install netlify" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Nettoyer l'URL
$N8nUrl = $N8nUrl.TrimEnd('/')

# IDs des webhooks
$webhookMainId = "7f72ac69-35b7-4771-a5c6-7acb18947254"
$webhookEmailId = "1ee6e745-fc31-4fd8-bc59-531bd4a69997"

# URLs complètes
$webhookMainUrl = "$N8nUrl/webhook/$webhookMainId"
$webhookEmailUrl = "$N8nUrl/webhook/$webhookEmailId"

Write-Host "📝 Configuration des variables :" -ForegroundColor Yellow
Write-Host "  WEBHOOK_URL      : $webhookMainUrl" -ForegroundColor White
Write-Host "  WEBHOOK_EMAIL_URL : $webhookEmailUrl" -ForegroundColor White
Write-Host ""

# Demander confirmation
$continue = Read-Host "Continuer ? (O/N)"
if ($continue -ne "O" -and $continue -ne "o") {
    Write-Host "Configuration annulée." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Configurer WEBHOOK_URL
Write-Host "🔧 Configuration de WEBHOOK_URL..." -ForegroundColor Yellow
$result = netlify env:set WEBHOOK_URL $webhookMainUrl 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ WEBHOOK_URL configuré" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la configuration de WEBHOOK_URL" -ForegroundColor Red
    Write-Host $result
}

Write-Host ""

# Configurer WEBHOOK_EMAIL_URL
Write-Host "🔧 Configuration de WEBHOOK_EMAIL_URL..." -ForegroundColor Yellow
$result = netlify env:set WEBHOOK_EMAIL_URL $webhookEmailUrl 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ WEBHOOK_EMAIL_URL configuré" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la configuration de WEBHOOK_EMAIL_URL" -ForegroundColor Red
    Write-Host $result
}

Write-Host ""

# Afficher les variables configurées
Write-Host "📋 Variables d'environnement configurées :" -ForegroundColor Cyan
netlify env:list

Write-Host ""
Write-Host "✅ Configuration terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Note : Les variables d'environnement Netlify ne sont pas automatiquement" -ForegroundColor Yellow
Write-Host "   injectées dans le HTML côté client. Vous devez soit :" -ForegroundColor Yellow
Write-Host "   1. Utiliser un script de build (voir netlify-config.js)" -ForegroundColor Yellow
Write-Host "   2. Mettre à jour manuellement index.html et redéployer" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Pour mettre à jour index.html :" -ForegroundColor Cyan
Write-Host "   .\scripts\update-netlify-webhooks.ps1 -N8nUrl `"$N8nUrl`"" -ForegroundColor White

