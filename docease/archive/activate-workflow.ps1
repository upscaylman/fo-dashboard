$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

Write-Host "Recuperation du workflow..." -ForegroundColor Cyan
$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/AJtlydAXDxYu7HTq" -Headers $headers -Method GET

Write-Host "Workflow: $($workflow.name)" -ForegroundColor Yellow
Write-Host "Actif: $($workflow.active)" -ForegroundColor $(if($workflow.active){'Green'}else{'Red'})

if (-not $workflow.active) {
    Write-Host "`nActivation du workflow..." -ForegroundColor Cyan
    $workflow.active = $true
    $body = $workflow | ConvertTo-Json -Depth 20
    $result = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$($workflow.id)" -Headers $headers -Method PUT -Body $body -ContentType "application/json"
    Write-Host "Workflow active: $($result.active)" -ForegroundColor Green
} else {
    Write-Host "`nWorkflow deja actif" -ForegroundColor Green
}

