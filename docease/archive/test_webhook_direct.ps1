Write-Host "`n=== TEST DIRECT DU WEBHOOK ===" -ForegroundColor Cyan

# Données de test
$testData = @{
    templateType = "custom"
    entreprise = "FO METAUX"
    civiliteDestinataire = "Madame"
    nomDestinataire = "Dupont"
    statutDestinataire = "Directrice RH"
    batiment = ""
    adresse = "123 Rue de Test"
    cpVille = "75001 Paris"
    emailDestinataire = "test@example.com"
    codeDocument = "TEST-001"
    objet = "Demande de conge"
    texteIa = "Demande de conge pour raisons personnelles du 15 au 20 janvier 2025"
    signatureExp = "FO METAUX"
} | ConvertTo-Json

Write-Host "Donnees de test preparees"
Write-Host $testData

Write-Host "`nAppel du webhook de test..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5678/webhook-test/7f72ac69-35b7-4771-a5c6-7acb18947254" -Method Post -Body $testData -ContentType "application/json"
    
    Write-Host "`nReponse recue !" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "`nERREUR:" $_.Exception.Message -ForegroundColor Red
    if($_.ErrorDetails.Message) {
        Write-Host "Details:" $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host "`n=== TERMINE ===" -ForegroundColor Cyan

