# Test simple du webhook n8n

Write-Host "Test du webhook n8n..." -ForegroundColor Cyan

$testData = @{
    templateType = "negociation"
    emailDestinataire = "test@example.com"
    entreprise = "Test SARL"
    codeDocument = "DOC-2024-001"
    civiliteDestinataire = "Madame"
    nomDestinataire = "Dupont"
    statutDestinataire = "Directrice"
    adresse = "123 Rue Test"
    cpVille = "75001 Paris"
    objet = "Test"
    numeroCourrier = "2024-001"
    signatureExp = "FO METAUX"
} | ConvertTo-Json -Compress

Write-Host "Envoi des donnees..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/formulaire-doc" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing `
        -TimeoutSec 120
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Taille reponse: $($response.Content.Length) caracteres" -ForegroundColor Cyan
    
    if ($response.Content.Length -eq 0) {
        Write-Host "PROBLEME: Reponse vide!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Logs n8n:" -ForegroundColor Yellow
        docker logs n8n-local --tail 30
    }
    else {
        Write-Host "OK: Reponse recue" -ForegroundColor Green
        $response.Content | Out-File -FilePath "debug-output.txt" -Encoding UTF8
        Write-Host "Sauvegarde dans debug-output.txt" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "ERREUR: $_" -ForegroundColor Red
}

