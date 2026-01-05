# Script pour vérifier tous les nodes du workflow

$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
    "Content-Type" = "application/json"
}

$workflowId = "AJtlydAXDxYu7HTq"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🔍 Vérification de tous les nodes du workflow         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

try {
    $workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" -Headers $headers -Method GET
    
    Write-Host "📋 Workflow: $($workflow.name)" -ForegroundColor Green
    Write-Host "   ID: $workflowId" -ForegroundColor Gray
    Write-Host "   Actif: $($workflow.active)" -ForegroundColor Gray
    Write-Host "   Nodes: $($workflow.nodes.Count)" -ForegroundColor Gray
    Write-Host ""
    
    $index = 1
    foreach ($node in $workflow.nodes) {
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "Node #$index : $($node.name)" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "  Type: $($node.type)" -ForegroundColor Cyan
        Write-Host "  ID: $($node.id)" -ForegroundColor Gray
        Write-Host "  Position: [$($node.position[0]), $($node.position[1])]" -ForegroundColor Gray
        
        if ($node.disabled) {
            Write-Host "  ⚠️  DÉSACTIVÉ" -ForegroundColor Red
        }
        
        # Afficher les paramètres importants
        if ($node.parameters) {
            Write-Host "  Paramètres:" -ForegroundColor Cyan
            
            # Pour les nodes Function, afficher le début du code
            if ($node.type -eq "n8n-nodes-base.function" -and $node.parameters.functionCode) {
                $codePreview = $node.parameters.functionCode.Substring(0, [Math]::Min(200, $node.parameters.functionCode.Length))
                Write-Host "    Code (preview):" -ForegroundColor Gray
                Write-Host "    $($codePreview)..." -ForegroundColor DarkGray
            }
            
            # Pour les webhooks
            if ($node.type -eq "n8n-nodes-base.webhook") {
                Write-Host "    Path: $($node.parameters.path)" -ForegroundColor Green
                Write-Host "    Method: $($node.parameters.httpMethod)" -ForegroundColor Green
            }
            
            # Pour les nodes HTTP Request
            if ($node.type -eq "n8n-nodes-base.httpRequest") {
                Write-Host "    URL: $($node.parameters.url)" -ForegroundColor Green
                Write-Host "    Method: $($node.parameters.method)" -ForegroundColor Green
            }
            
            # Pour les nodes Email
            if ($node.type -like "*email*" -or $node.type -like "*smtp*") {
                Write-Host "    To: $($node.parameters.toEmail)" -ForegroundColor Green
                Write-Host "    Subject: $($node.parameters.subject)" -ForegroundColor Green
            }
            
            # Pour Docxtemplater
            if ($node.type -eq "n8n-nodes-docxtemplater.docxTemplater") {
                Write-Host "    Context: $($node.parameters.context)" -ForegroundColor Green
            }
            
            # Pour les nodes Set
            if ($node.type -eq "n8n-nodes-base.set") {
                Write-Host "    Values: $($node.parameters.values.values.Count) champs" -ForegroundColor Green
            }
        }
        
        Write-Host ""
        $index++
    }
    
    Write-Host "Verification terminee" -ForegroundColor Green
    Write-Host ""
    Write-Host "Nodes critiques a verifier:" -ForegroundColor Cyan
    Write-Host "   1. Webhook (formulaire-doc) - Recoit les donnees" -ForegroundColor Gray
    Write-Host "   2. Preparer Donnees - Formate les variables" -ForegroundColor Gray
    Write-Host "   3. Lire Template Word - Charge le bon fichier" -ForegroundColor Gray
    Write-Host "   4. Remplir Template Docx - Remplit le template" -ForegroundColor Gray
    Write-Host "   5. Convertir en HTML - Preview" -ForegroundColor Gray
    Write-Host "   6. Webhook Preview - Affiche la preview" -ForegroundColor Gray
    Write-Host "   7. Validation (Webhook) - Recoit la validation" -ForegroundColor Gray
    Write-Host "   8. Envoi Email - Envoie le document" -ForegroundColor Gray

} catch {
    Write-Host "Erreur:" -ForegroundColor Red
    Write-Host $_ -ForegroundColor Red
}

