# Script pour configurer CORS dans n8n pour autoriser localhost:3000 et ngrok
# Usage: .\scripts\configure-cors-ngrok.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION CORS POUR NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pour résoudre l'erreur CORS, vous devez configurer CORS dans n8n." -ForegroundColor Yellow
Write-Host ""
Write-Host "ÉTAPES MANUELLES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ouvrez n8n dans votre navigateur:" -ForegroundColor White
Write-Host "   http://localhost:5678" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ouvrez votre workflow (gpt_generator ou le workflow principal)" -ForegroundColor White
Write-Host ""
Write-Host "3. Pour CHAQUE nœud Webhook utilisé:" -ForegroundColor Yellow
Write-Host "   a. Cliquez sur le nœud Webhook" -ForegroundColor White
Write-Host "   b. Cliquez sur 'Add Option' (en bas du panneau)" -ForegroundColor White
Write-Host "   c. Sélectionnez 'Allowed Origins (CORS)'" -ForegroundColor White
Write-Host "   d. Dans le champ, entrez:" -ForegroundColor White
Write-Host "      http://localhost:3000" -ForegroundColor Green
Write-Host "   e. OU pour autoriser toutes les origines (développement uniquement):" -ForegroundColor White
Write-Host "      *" -ForegroundColor Green
Write-Host "   f. Sauvegardez le workflow" -ForegroundColor White
Write-Host "   g. Réactivez le workflow (désactivez puis réactivez)" -ForegroundColor White
Write-Host ""
Write-Host "4. Répétez pour TOUS les nœuds Webhook:" -ForegroundColor Yellow
Write-Host "   - Webhook principal (formulaire-doc)" -ForegroundColor Gray
Write-Host "   - Webhook email" -ForegroundColor Gray
Write-Host "   - Tout autre webhook utilisé" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ALTERNATIVE: Utiliser le proxy local" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Si vous préférez utiliser le proxy local (localhost:3000):" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Remettez les URLs dans index.html à:" -ForegroundColor White
Write-Host "   WEBHOOK_URL: 'http://localhost:3000/webhook/...'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Le proxy redirigera automatiquement vers n8n" -ForegroundColor White
Write-Host ""
Write-Host "Voulez-vous que je remette les URLs à localhost:3000? (O/N)" -ForegroundColor Cyan
$choice = Read-Host
if ($choice -eq "O" -or $choice -eq "o") {
    $indexHtmlPath = Join-Path $PSScriptRoot "..\templates\form\index.html"
    if (Test-Path $indexHtmlPath) {
        $content = Get-Content $indexHtmlPath -Raw -Encoding UTF8
        $content = $content -replace "WEBHOOK_URL:\s*'[^']*'", "WEBHOOK_URL: 'http://localhost:3000/webhook/7f72ac69-35b7-4771-a5c6-7acb18947254'"
        $content = $content -replace "WEBHOOK_EMAIL_URL:\s*'[^']*'", "WEBHOOK_EMAIL_URL: 'http://localhost:3000/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997'"
        Set-Content -Path $indexHtmlPath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✅ URLs remises à localhost:3000" -ForegroundColor Green
        Write-Host "   Assurez-vous que le serveur proxy est démarré (serve-form.ps1)" -ForegroundColor Yellow
    }
}

