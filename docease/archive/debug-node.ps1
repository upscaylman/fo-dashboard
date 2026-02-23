$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/AJtlydAXDxYu7HTq" -Headers $headers -Method GET

$responseNode = $workflow.nodes | Where-Object { $_.name -eq "Reponse avec Word" }
if ($responseNode) {
    Write-Host "Noeud: $($responseNode.name)" -ForegroundColor Green
    Write-Host "Type: $($responseNode.type)" -ForegroundColor Yellow
    Write-Host "Parameters:" -ForegroundColor Cyan
    $responseNode.parameters | ConvertTo-Json -Depth 5
}

