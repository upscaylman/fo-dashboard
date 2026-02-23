$testData = @{
    templateType = "designation"
    emailDestinataire = "test@example.com"
    entreprise = "Solutions SARL"
    codeDocument = "TechCo"
    civiliteDestinataire = "Madame"
    nomDestinataire = "Dupont"
    statutDestinataire = "Directrice"
    batiment = "Bat A"
    adresse = "123 Rue"
    cpVille = "75001 Paris"
    objet = "Test"
    numeroCourrier = "001"
    signatureExp = "FO"
} | ConvertTo-Json

Write-Host "Test webhook n8n..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/webhook/formulaire-doc" -Method POST -ContentType "application/json" -Body $testData -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Yellow
    Write-Host "Content Length: $($response.Content.Length)" -ForegroundColor Yellow
    
    if ($response.Content.Length -gt 0) {
        Write-Host "Content:" -ForegroundColor Yellow
        $response.Content
    } else {
        Write-Host "REPONSE VIDE !" -ForegroundColor Red
    }
} catch {
    Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

Write-Host "`nVerification derniere execution..." -ForegroundColor Cyan
$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}
$executions = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions?limit=1&workflowId=AJtlydAXDxYu7HTq" -Headers $headers
$lastExec = $executions.data[0]
Write-Host "ID: $($lastExec.id)" -ForegroundColor Yellow
Write-Host "Status: $($lastExec.status)" -ForegroundColor $(if($lastExec.status -eq 'success'){'Green'}else{'Red'})
Write-Host "Started: $($lastExec.startedAt)" -ForegroundColor Gray
Write-Host "Stopped: $($lastExec.stoppedAt)" -ForegroundColor Gray

