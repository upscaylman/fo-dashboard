# Script pour ajouter la variable 'entreprise' dans le workflow n8n

$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
$workflowId = "AJtlydAXDxYu7HTq"
$headers = @{
    "X-N8N-API-KEY" = $apiKey
}

Write-Host "Récupération du workflow..." -ForegroundColor Cyan
$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" -Headers $headers -Method Get

Write-Host "Modification du workflow pour ajouter la variable 'entreprise'..." -ForegroundColor Yellow

# Parcourir tous les nœuds
foreach ($node in $workflow.nodes) {
    
    # 1. Nœud "Generer Word Final" (Function) - Ajouter entreprise dans le code
    if ($node.name -eq "Generer Word Final" -and $node.type -eq "n8n-nodes-base.function") {
        Write-Host "  ✓ Modification du nœud 'Generer Word Final'" -ForegroundColor Green
        
        $oldCode = $node.parameters.functionCode
        
        # Ajouter la récupération de entreprise après codeDocument
        $newCode = $oldCode -replace 
            '(const codeDocument = \$json\.body\?\.codeDocument \|\| \$json\.codeDocument;)',
            '$1`nconst entreprise = $json.body?.entreprise || $json.entreprise;'
        
        # Ajouter entreprise dans le return json après codeDocument
        $newCode = $newCode -replace 
            '(codeDocument,)',
            '$1`n    entreprise,'
        
        $node.parameters.functionCode = $newCode
    }
    
    # 2. Nœud "Remplir Template Docx" - Ajouter entreprise dans les variables
    if ($node.name -eq "Remplir Template Docx" -and $node.type -eq "n8n-nodes-base.microsoftExcel") {
        Write-Host "  ✓ Modification du nœud 'Remplir Template Docx'" -ForegroundColor Green
        
        # Vérifier si la variable entreprise existe déjà
        $hasEntreprise = $false
        foreach ($var in $node.parameters.dataPropertyName.value) {
            if ($var.name -eq "entreprise") {
                $hasEntreprise = $true
                break
            }
        }
        
        if (-not $hasEntreprise) {
            # Ajouter la variable entreprise après codeDocument
            $entrepriseVar = @{
                id = "entreprise"
                name = "entreprise"
                value = "={{ `$('Formulaire (Webhook)').item.json.body.entreprise }}"
                type = "string"
            }
            
            # Trouver l'index de codeDocument et insérer après
            $variables = @($node.parameters.dataPropertyName.value)
            $insertIndex = -1
            for ($i = 0; $i -lt $variables.Count; $i++) {
                if ($variables[$i].name -eq "codeDocument") {
                    $insertIndex = $i + 1
                    break
                }
            }
            
            if ($insertIndex -gt 0) {
                $newVariables = @()
                $newVariables += $variables[0..($insertIndex-1)]
                $newVariables += $entrepriseVar
                $newVariables += $variables[$insertIndex..($variables.Count-1)]
                $node.parameters.dataPropertyName.value = $newVariables
            } else {
                # Si codeDocument n'est pas trouvé, ajouter à la fin
                $node.parameters.dataPropertyName.value += $entrepriseVar
            }
        }
    }
}

Write-Host "`nSauvegarde du workflow modifié..." -ForegroundColor Cyan

$body = $workflow | ConvertTo-Json -Depth 20 -Compress

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" `
        -Headers $headers `
        -Method Put `
        -ContentType "application/json; charset=utf-8" `
        -Body $body
    
    Write-Host "✅ Workflow mis à jour avec succès !" -ForegroundColor Green
    Write-Host "La variable 'entreprise' a été ajoutée au workflow." -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la mise à jour : $_" -ForegroundColor Red
    Write-Host "Détails : $($_.Exception.Message)" -ForegroundColor Red
}

