$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

$executions = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions?limit=1&workflowId=AJtlydAXDxYu7HTq" -Headers $headers
$lastExec = $executions.data[0]

Write-Host "Derniere execution:" -ForegroundColor Cyan
Write-Host "ID: $($lastExec.id)" -ForegroundColor Yellow
Write-Host "Status: $($lastExec.status)" -ForegroundColor $(if($lastExec.status -eq 'success'){'Green'}else{'Red'})
Write-Host "Date: $($lastExec.startedAt)" -ForegroundColor Gray

$execDetails = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/executions/$($lastExec.id)" -Headers $headers
$execDetails | ConvertTo-Json -Depth 20 | Out-File "last-execution.json"
Write-Host "`nDetails sauvegardes dans last-execution.json" -ForegroundColor Green

