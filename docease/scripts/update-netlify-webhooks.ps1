# Script pour mettre à jour les URLs des webhooks dans index.html
# Usage: .\scripts\update-netlify-webhooks.ps1 -N8nUrl "https://n8n.votre-domaine.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$N8nUrl
)

Write-Host "🔄 Mise à jour des URLs des webhooks" -ForegroundColor Cyan
Write-Host ""

# Nettoyer l'URL (enlever le slash final)
$N8nUrl = $N8nUrl.TrimEnd('/')

# IDs des webhooks
$webhookMainId = "7f72ac69-35b7-4771-a5c6-7acb18947254"
$webhookEmailId = "1ee6e745-fc31-4fd8-bc59-531bd4a69997"

# URLs complètes
$webhookMainUrl = "$N8nUrl/webhook/$webhookMainId"
$webhookEmailUrl = "$N8nUrl/webhook/$webhookEmailId"

Write-Host "📝 URLs configurées :" -ForegroundColor Yellow
Write-Host "  Webhook principal : $webhookMainUrl" -ForegroundColor White
Write-Host "  Webhook email     : $webhookEmailUrl" -ForegroundColor White
Write-Host ""

# Chemin du fichier index.html
$indexHtmlPath = Join-Path $PSScriptRoot "..\templates\form\index.html"
$indexHtmlPath = Resolve-Path $indexHtmlPath -ErrorAction SilentlyContinue

if (-not $indexHtmlPath) {
    Write-Host "❌ Fichier index.html non trouvé dans templates/form/" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Mise à jour de : $indexHtmlPath" -ForegroundColor Yellow

# Lire le fichier
$content = Get-Content $indexHtmlPath -Raw

# Remplacer les URLs
$content = $content -replace "WEBHOOK_URL: 'http[^']*'", "WEBHOOK_URL: '$webhookMainUrl'"
$content = $content -replace "WEBHOOK_EMAIL_URL: 'http[^']*'", "WEBHOOK_EMAIL_URL: '$webhookEmailUrl'"

# Écrire le fichier
Set-Content -Path $indexHtmlPath -Value $content -NoNewline

Write-Host "✅ Fichier index.html mis à jour" -ForegroundColor Green
Write-Host ""

# Afficher les commandes Netlify
Write-Host "📋 Commandes Netlify à exécuter :" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Configurer les variables d'environnement" -ForegroundColor Yellow
Write-Host "netlify env:set WEBHOOK_URL `"$webhookMainUrl`"" -ForegroundColor White
Write-Host "netlify env:set WEBHOOK_EMAIL_URL `"$webhookEmailUrl`"" -ForegroundColor White
Write-Host ""
Write-Host "# Redéployer (si nécessaire)" -ForegroundColor Yellow
Write-Host "netlify deploy --dir=templates/form --prod --no-build" -ForegroundColor White
Write-Host ""

Write-Host "✅ Mise à jour terminée !" -ForegroundColor Green

