$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

Write-Host "Details de l'execution 524:" -ForegroundColor Cyan
$exec = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions/524" -Headers $headers -Method GET

Write-Host "Status: $($exec.status)" -ForegroundColor Red
Write-Host "`nData:" -ForegroundColor Yellow
$exec.data | ConvertTo-Json -Depth 10 | Out-File "execution-524-details.json"
Write-Host "Details sauvegardes dans execution-524-details.json"

# Afficher les erreurs
if ($exec.data.resultData) {
    Write-Host "`nErreurs par noeud:" -ForegroundColor Red
    $exec.data.resultData.runData | Get-Member -MemberType NoteProperty | ForEach-Object {
        $nodeName = $_.Name
        $nodeData = $exec.data.resultData.runData.$nodeName
        if ($nodeData[0].error) {
            Write-Host "`n  Noeud: $nodeName" -ForegroundColor Yellow
            Write-Host "  Erreur: $($nodeData[0].error.message)" -ForegroundColor Red
        }
    }
}

