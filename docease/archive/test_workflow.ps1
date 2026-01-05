$apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzMDM4NDI3LCJleHAiOjE3NjU1ODA0MDB9.whMoo_gRuI9QbB2pdsnaIobePIgMzvWj1sf4odzbTqU'
$headers = @{
    'X-N8N-API-KEY' = $apiKey
    'Content-Type' = 'application/json'
    'Accept' = 'application/json'
}

Write-Host "`n=== EXECUTION DU WORKFLOW ===" -ForegroundColor Cyan

# Données de test
$testData = @{
    body = @{
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
        objet = "Demande de congé"
        texteIa = "Demande de congé pour raisons personnelles du 15 au 20 janvier 2025"
        signatureExp = "FO METAUX"
    }
} | ConvertTo-Json -Depth 5

Write-Host "Données de test préparées"

try {
    # Exécuter le workflow
    $execution = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/TXziodPP3k2lvj1h/run" -Method Post -Headers $headers -Body $testData
    
    $execId = $execution.data.executionId
    Write-Host "Workflow lance ! ID: $execId" -ForegroundColor Green
    
    # Attendre que l'exécution se termine
    Write-Host "Attente de la fin de l'exécution..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Récupérer les détails
    Write-Host "`n=== RECUPERATION DES RESULTATS ===" -ForegroundColor Cyan
    $details = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions/$execId" -Method Get -Headers $headers
    
    Write-Host "`nStatut:" $details.status -ForegroundColor $(if($details.status -eq 'success'){'Green'}elseif($details.status -eq 'error'){'Red'}else{'Yellow'})
    Write-Host "Finished:" $details.finished
    Write-Host "Mode:" $details.mode
    
    # Afficher les nœuds exécutés
    Write-Host "`n=== NOEUDS EXECUTES ===" -ForegroundColor Cyan
    
    if($details.data.resultData.runData) {
        $runData = $details.data.resultData.runData
        
        $runData.PSObject.Properties | ForEach-Object {
            $nodeName = $_.Name
            $nodeData = $_.Value
            
            Write-Host "`n--- $nodeName ---" -ForegroundColor Yellow
            
            if($nodeData -and $nodeData.Count -gt 0) {
                $firstRun = $nodeData[0]
                
                if($firstRun.data -and $firstRun.data.main) {
                    $mainData = $firstRun.data.main[0]
                    
                    if($mainData -and $mainData.Count -gt 0) {
                        Write-Host "Execute avec succes" -ForegroundColor Green
                        Write-Host "Items:" $mainData.Count
                        
                        # Afficher un aperçu du JSON
                        if($mainData[0].json) {
                            $jsonPreview = $mainData[0].json | ConvertTo-Json -Compress -Depth 2
                            if($jsonPreview.Length -gt 300) {
                                $jsonPreview = $jsonPreview.Substring(0, 300) + "..."
                            }
                            Write-Host "Données:" $jsonPreview
                        }
                    }
                }
                
                if($firstRun.error) {
                    Write-Host "ERREUR:" $firstRun.error.message -ForegroundColor Red
                }
            }
        }
    }
    
    # Sauvegarder les détails complets
    $details | ConvertTo-Json -Depth 20 | Out-File "execution_$execId.json" -Encoding UTF8
    Write-Host "`nDetails complets sauvegardes dans execution_$execId.json" -ForegroundColor Green
    
} catch {
    Write-Host "`nERREUR:" $_.Exception.Message -ForegroundColor Red
    if($_.ErrorDetails.Message) {
        Write-Host "Détails:" $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host "`n=== TERMINE ===" -ForegroundColor Cyan

