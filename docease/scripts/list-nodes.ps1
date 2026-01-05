$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
    "Content-Type" = "application/json"
}

$workflowId = "AJtlydAXDxYu7HTq"

$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" -Headers $headers -Method GET

Write-Host "Workflow: $($workflow.name)" -ForegroundColor Green
Write-Host "Nodes: $($workflow.nodes.Count)" -ForegroundColor Gray
Write-Host ""

$index = 1
foreach ($node in $workflow.nodes) {
    Write-Host "[$index] $($node.name)" -ForegroundColor Yellow
    Write-Host "    Type: $($node.type)" -ForegroundColor Cyan
    
    if ($node.type -eq "n8n-nodes-base.function") {
        $codeLength = $node.parameters.functionCode.Length
        Write-Host "    Code: $codeLength caracteres" -ForegroundColor Gray
        
        # Afficher les 3 premieres lignes
        $lines = $node.parameters.functionCode -split "`n"
        Write-Host "    Preview:" -ForegroundColor DarkGray
        for ($i = 0; $i -lt [Math]::Min(3, $lines.Count); $i++) {
            Write-Host "      $($lines[$i])" -ForegroundColor DarkGray
        }
    }
    
    if ($node.type -eq "n8n-nodes-base.webhook") {
        Write-Host "    Path: $($node.parameters.path)" -ForegroundColor Green
    }
    
    if ($node.type -eq "n8n-nodes-docxtemplater.docxTemplater") {
        Write-Host "    Context: $($node.parameters.context)" -ForegroundColor Green
    }
    
    Write-Host ""
    $index++
}

