# Script pour verifier l'etat de n8n et du workflow
# Usage: .\scripts\check-n8n-status.ps1

Write-Host "Verification de l'etat de n8n" -ForegroundColor Cyan
Write-Host ""

# Verifier si n8n est accessible
Write-Host "1. Verification de la connexion a n8n..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "   OK - n8n est accessible sur http://localhost:5678" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - n8n n'est pas accessible sur http://localhost:5678" -ForegroundColor Red
    Write-Host "   Assurez-vous que n8n est demarre avec: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verifier le webhook
Write-Host "2. Verification du webhook formulaire-doc..." -ForegroundColor Yellow
try {
    $testData = @{
        templateType = "test"
        emailDestinataire = "test@example.com"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:3000/webhook/formulaire-doc" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -TimeoutSec 10 `
        -UseBasicParsing

    Write-Host "   OK - Le webhook repond (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "   Reponse: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "   ERREUR - Le webhook ne repond pas correctement" -ForegroundColor Red
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Actions a effectuer:" -ForegroundColor Yellow
    Write-Host "   1. Ouvrez n8n: http://localhost:5678" -ForegroundColor White
    Write-Host "   2. Allez dans le workflow 'gpt_generator'" -ForegroundColor White
    Write-Host "   3. Verifiez que le workflow est ACTIF (toggle en haut a droite)" -ForegroundColor White
    Write-Host "   4. Verifiez que le noeud 'Formulaire (Webhook)' est bien configure" -ForegroundColor White
    Write-Host "   5. Testez le workflow manuellement en cliquant sur 'Execute Workflow'" -ForegroundColor White
}

Write-Host ""

# Verifier le serveur Express
Write-Host "3. Verification du serveur Express..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "   OK - Le serveur Express est accessible sur http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - Le serveur Express n'est pas accessible" -ForegroundColor Red
    Write-Host "   Demarrez-le avec: node server.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verification terminee" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Cyan
Write-Host "1. Si le webhook ne repond pas, importez le workflow corrige dans n8n" -ForegroundColor White
Write-Host "2. Activez le workflow dans n8n" -ForegroundColor White
Write-Host "3. Testez le formulaire: http://localhost:3000" -ForegroundColor White

