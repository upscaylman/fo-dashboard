$testData = @{
    templateType = "negociation"
    emailDestinataire = "test@example.com"
    entreprise = "Test SARL"
    codeDocument = "TEST001"
    civiliteDestinataire = "Madame"
    nomDestinataire = "Dupont"
    statutDestinataire = "Directrice"
    batiment = "Batiment A"
    adresse = "123 Rue Test"
    cpVille = "75001 Paris"
    objet = "Test"
    numeroCourrier = "2024-001"
    signatureExp = "FO METAUX"
} | ConvertTo-Json

Write-Host "TEST WEBHOOK..." -ForegroundColor Cyan
$response = Invoke-WebRequest -Uri "http://localhost:3000/webhook/formulaire-doc" -Method POST -ContentType "application/json" -Body $testData -UseBasicParsing
$result = $response.Content | ConvertFrom-Json
Write-Host "Success: $($result.success)" -ForegroundColor $(if($result.success){'Green'}else{'Red'})
Write-Host "Has data: $($null -ne $result.data)" -ForegroundColor $(if($result.data){'Green'}else{'Red'})
if ($result.data) { Write-Host "OK - Word genere !" -ForegroundColor Green } else { Write-Host "ERREUR - Pas de data" -ForegroundColor Red }

