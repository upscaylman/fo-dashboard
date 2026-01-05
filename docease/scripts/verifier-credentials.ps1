# Script pour vérifier les credentials SMTP dans n8n
param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$headers = @{
    "X-N8N-API-KEY" = $ApiKey
    "Content-Type" = "application/json"
}

Write-Host "🔍 Vérification des workflows et credentials..." -ForegroundColor Cyan

try {
    # Récupérer tous les workflows
    $workflows = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" -Method Get -Headers $headers
    
    Write-Host "`n✅ Workflows trouvés: $($workflows.data.Count)" -ForegroundColor Green
    
    foreach ($workflow in $workflows.data) {
        Write-Host "`n📋 Workflow: $($workflow.name) (ID: $($workflow.id))" -ForegroundColor Yellow
        
        # Récupérer le workflow complet
        $workflowDetail = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$($workflow.id)" -Method Get -Headers $headers
        
        # Chercher les nœuds Email
        $emailNodes = $workflowDetail.nodes | Where-Object { $_.type -eq "n8n-nodes-base.emailSend" }
        
        if ($emailNodes) {
            Write-Host "  📧 Nœuds Email:" -ForegroundColor Cyan
            foreach ($node in $emailNodes) {
                Write-Host "    - $($node.name)" -ForegroundColor White
                if ($node.credentials -and $node.credentials.smtp) {
                    Write-Host "      ✅ Credential SMTP: $($node.credentials.smtp.name)" -ForegroundColor Green
                } else {
                    Write-Host "      ❌ PAS de credential SMTP connecté !" -ForegroundColor Red
                    Write-Host "      → Vous devez créer et connecter un credential SMTP" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "  ℹ️  Aucun nœud Email dans ce workflow" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n✅ Vérification terminée" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Réponse: $responseBody" -ForegroundColor Red
    }
}

