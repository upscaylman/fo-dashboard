$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

Write-Host "Recuperation du workflow..." -ForegroundColor Cyan
$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/AJtlydAXDxYu7HTq" -Headers $headers -Method GET

# Trouver le nœud "Réponse avec Word"
$responseNode = $workflow.nodes | Where-Object { $_.name -eq "Reponse avec Word" }

if ($responseNode) {
    Write-Host "Modification du noeud 'Reponse avec Word'..." -ForegroundColor Cyan
    Write-Host "Ancien: $($responseNode.parameters.responseBody)" -ForegroundColor Red
    
    # Nouvelle expression qui convertit le binaire en base64
    $responseNode.parameters.responseBody = '={{ { "success": true, "data": $binary.data ? Buffer.from($binary.data).toString("base64") : null, "message": "Document généré avec succès" } }}'
    
    Write-Host "Nouveau: $($responseNode.parameters.responseBody)" -ForegroundColor Green
    
    Write-Host "`nEnvoi de la mise a jour..." -ForegroundColor Cyan
    $body = $workflow | ConvertTo-Json -Depth 20
    $result = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$($workflow.id)" -Headers $headers -Method PUT -Body $body -ContentType "application/json"
    Write-Host "Workflow mis a jour !" -ForegroundColor Green
} else {
    Write-Host "Noeud non trouve" -ForegroundColor Red
}

