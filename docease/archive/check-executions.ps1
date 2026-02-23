$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

Write-Host "Dernieres executions:" -ForegroundColor Cyan
$executions = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions?limit=5&workflowId=AJtlydAXDxYu7HTq" -Headers $headers -Method GET

foreach ($exec in $executions.data) {
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "ID: $($exec.id)" -ForegroundColor White
    Write-Host "Status: $($exec.status)" -ForegroundColor $(if($exec.status -eq 'success'){'Green'}else{'Red'})
    Write-Host "Date: $($exec.startedAt)" -ForegroundColor Gray
    
    if ($exec.status -ne 'success') {
        Write-Host "ERREUR:" -ForegroundColor Red
        if ($exec.data) {
            $exec.data | ConvertTo-Json -Depth 3
        }
    }
}

