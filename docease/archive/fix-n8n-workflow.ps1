$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

Write-Host "Recuperation du workflow..." -ForegroundColor Cyan
$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/AJtlydAXDxYu7HTq" -Headers $headers -Method GET

Write-Host "Workflow: $($workflow.name)" -ForegroundColor Green
Write-Host "Noeuds:" -ForegroundColor Yellow
$workflow.nodes | ForEach-Object { Write-Host "  - $($_.name)" }

# Trouver et modifier le nœud de réponse
$modified = $false
foreach ($node in $workflow.nodes) {
    if ($node.type -eq "n8n-nodes-base.respondToWebhook" -and $node.parameters.responseBody -like "*wordBase64*") {
        Write-Host "`nModification du noeud: $($node.name)" -ForegroundColor Cyan
        Write-Host "Ancien: $($node.parameters.responseBody)" -ForegroundColor Red
        $node.parameters.responseBody = '={{ { "success": true, "data": $binary.data.data, "message": "Document généré avec succès" } }}'
        Write-Host "Nouveau: $($node.parameters.responseBody)" -ForegroundColor Green
        $modified = $true
    }
}

if ($modified) {
    Write-Host "`nEnvoi de la mise a jour..." -ForegroundColor Cyan
    $body = $workflow | ConvertTo-Json -Depth 20
    Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$($workflow.id)" -Headers $headers -Method PUT -Body $body -ContentType "application/json"
    Write-Host "Workflow mis a jour avec succes !" -ForegroundColor Green
} else {
    Write-Host "`nAucune modification necessaire" -ForegroundColor Yellow
}

