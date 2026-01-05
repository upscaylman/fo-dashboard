# Diagnostic complet du webhook
Write-Host "🔍 Diagnostic du webhook n8n" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Verifications a faire dans n8n:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrez http://localhost:5678" -ForegroundColor Cyan
Write-Host "2. Allez dans Workflows" -ForegroundColor Cyan
Write-Host "3. Ouvrez le workflow 'gpt_generator'" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. VERIFIEZ le toggle en haut a droite:" -ForegroundColor Yellow
Write-Host "   - Il doit etre VERT (Active)" -ForegroundColor Green
Write-Host "   - S'il est ROUGE (Inactive), cliquez dessus pour l'activer" -ForegroundColor Red
Write-Host ""
Write-Host "5. Cliquez sur le noeud 'Formulaire (Webhook)'" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Regardez en bas du panneau:" -ForegroundColor Cyan
Write-Host "   - Mode Test: URL avec /webhook-test/" -ForegroundColor Gray
Write-Host "   - Mode Production: URL avec /webhook/" -ForegroundColor Gray
Write-Host ""
Write-Host "7. IMPORTANT - Pour le mode TEST:" -ForegroundColor Yellow
Write-Host "   - Cliquez sur 'Listen for Test Event' en haut du workflow" -ForegroundColor Cyan
Write-Host "   - OU executez le workflow une fois manuellement" -ForegroundColor Cyan
Write-Host "   - Cela active le webhook de test" -ForegroundColor Gray
Write-Host ""
Write-Host "8. Pour le mode PRODUCTION:" -ForegroundColor Yellow
Write-Host "   - Le workflow DOIT etre Active (toggle vert)" -ForegroundColor Cyan
Write-Host "   - L'URL sera /webhook/formulaire-doc" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Le mode TEST necessite 'Listen for Test Event' pour fonctionner!" -ForegroundColor Red
Write-Host ""

$mode = Read-Host "Quel mode utilisez-vous? (Test/Production)"

if ($mode -eq "Test") {
    Write-Host ""
    Write-Host "✅ Pour le mode TEST:" -ForegroundColor Green
    Write-Host "   1. Dans n8n, cliquez sur 'Listen for Test Event' (en haut)" -ForegroundColor Cyan
    Write-Host "   2. OU executez le workflow manuellement une fois" -ForegroundColor Cyan
    Write-Host "   3. L'URL sera: http://localhost:5678/webhook-test/formulaire-doc" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Puis testez:" -ForegroundColor Yellow
    Write-Host "   .\scripts\test-webhook-modes.ps1" -ForegroundColor Cyan
}
else {
    Write-Host ""
    Write-Host "✅ Pour le mode PRODUCTION:" -ForegroundColor Green
    Write-Host "   1. Assurez-vous que le workflow est Active (toggle vert)" -ForegroundColor Cyan
    Write-Host "   2. L'URL sera: http://localhost:5678/webhook/formulaire-doc" -ForegroundColor Gray
    Write-Host "   3. Le formulaire doit utiliser /webhook/ et non /webhook-test/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Si necessaire, mettez a jour form.html:" -ForegroundColor Yellow
    Write-Host "   - Changez /webhook-test/ en /webhook/" -ForegroundColor Cyan
}

Write-Host ""

