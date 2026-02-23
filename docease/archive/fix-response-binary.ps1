$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

Write-Host "Recuperation du workflow..." -ForegroundColor Cyan
$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/AJtlydAXDxYu7HTq" -Headers $headers

# Trouver le nœud "Réponse avec Word"
$responseNode = $workflow.nodes | Where-Object { $_.name -eq "Reponse avec Word" }

if ($responseNode) {
    Write-Host "Modification du noeud 'Reponse avec Word'..." -ForegroundColor Yellow
    
    # Changer en mode "Binary File"
    $responseNode.parameters.respondWith = "binaryFile"
    $responseNode.parameters.PSObject.Properties.Remove('responseBody')
    
    Write-Host "Mise a jour du workflow..." -ForegroundColor Cyan
    $body = $workflow | ConvertTo-Json -Depth 20 -Compress
    Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/AJtlydAXDxYu7HTq" -Headers $headers -Method PUT -Body $body -ContentType "application/json" | Out-Null
    
    Write-Host "Workflow mis a jour - mode Binary File active" -ForegroundColor Green
} else {
    Write-Host "Noeud 'Reponse avec Word' NON TROUVE" -ForegroundColor Red
}

