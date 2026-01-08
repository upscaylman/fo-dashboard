# Script de test complet du workflow

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLET DU WORKFLOW N8N" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Données de test
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
    objet = "Test Negociation"
    numeroCourrier = "2024-001"
    signatureExp = "FO METAUX"
} | ConvertTo-Json -Compress

Write-Host "Donnees de test preparees" -ForegroundColor Green
Write-Host ""

# TEST 1: Générer le Word via /webhook/formulaire-doc
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "TEST 1: Generation du Word" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Endpoint: http://localhost:3000/webhook/formulaire-doc" -ForegroundColor Cyan
Write-Host ""

try {
    $response1 = Invoke-WebRequest -Uri "http://localhost:3000/webhook/formulaire-doc" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing `
        -TimeoutSec 60

    Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
    
    $result1 = $response1.Content | ConvertFrom-Json
    
    if ($result1.success -and $result1.data) {
        Write-Host "SUCCESS: Word genere !" -ForegroundColor Green
        Write-Host "Taille base64: $($result1.data.Length) caracteres" -ForegroundColor Cyan
        
        # Sauvegarder le Word pour le test 2
        $global:wordBase64 = $result1.data
        
        Write-Host ""
        Write-Host "TEST 1: REUSSI" -ForegroundColor Green
    } else {
        Write-Host "ERREUR: Reponse invalide" -ForegroundColor Red
        Write-Host "Reponse: $($response1.Content)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "TEST 1: ECHOUE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "TEST 1: ECHOUE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Attente de 2 secondes..." -ForegroundColor Gray
Start-Sleep -Seconds 2
Write-Host ""

# TEST 2: Envoyer l'email via /webhook/validate-doc
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "TEST 2: Envoi de l'email" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Endpoint: http://localhost:3000/webhook/validate-doc" -ForegroundColor Cyan
Write-Host ""

# Ajouter le Word au payload
$testDataWithWord = $testData | ConvertFrom-Json
$testDataWithWord | Add-Member -NotePropertyName "wordfile" -NotePropertyValue $global:wordBase64
$testDataWithWordJson = $testDataWithWord | ConvertTo-Json -Compress

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:3000/webhook/validate-doc" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testDataWithWordJson `
        -UseBasicParsing `
        -TimeoutSec 60

    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    
    $result2 = $response2.Content | ConvertFrom-Json
    
    if ($result2.success) {
        Write-Host "SUCCESS: Email envoye !" -ForegroundColor Green
        Write-Host "Message: $($result2.message)" -ForegroundColor Cyan
        Write-Host "Destinataire: $($result2.destinataire)" -ForegroundColor Cyan
        Write-Host "Objet: $($result2.objet)" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "TEST 2: REUSSI" -ForegroundColor Green
    } else {
        Write-Host "ERREUR: Reponse invalide" -ForegroundColor Red
        Write-Host "Reponse: $($response2.Content)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "TEST 2: ECHOUE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "TEST 2: ECHOUE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "TOUS LES TESTS SONT REUSSIS !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resume:" -ForegroundColor Yellow
Write-Host "1. Generation du Word: OK" -ForegroundColor White
Write-Host "2. Envoi de l'email: OK" -ForegroundColor White
Write-Host ""
Write-Host "Le workflow est fonctionnel !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. Ouvre le formulaire: http://localhost:3000" -ForegroundColor White
Write-Host "2. Teste les boutons 'Telecharger' et 'Generer et envoyer'" -ForegroundColor White
Write-Host "3. Verifie les emails recus" -ForegroundColor White

