# Script pour mettre à jour le node "Lire Template Word" via l'API n8n

$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

$workflowId = "AJtlydAXDxYu7HTq"

Write-Host "🔄 Récupération du workflow..." -ForegroundColor Cyan

try {
    $workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" -Headers $headers -Method GET
    
    Write-Host "✅ Workflow récupéré: $($workflow.name)" -ForegroundColor Green
    Write-Host "   Nodes: $($workflow.nodes.Count)" -ForegroundColor Gray
    
    # Trouver le node "Lire Template Word"
    $nodeIndex = -1
    for ($i = 0; $i -lt $workflow.nodes.Count; $i++) {
        if ($workflow.nodes[$i].name -eq "Lire Template Word") {
            $nodeIndex = $i
            break
        }
    }
    
    if ($nodeIndex -eq -1) {
        Write-Host "❌ Node 'Lire Template Word' non trouvé" -ForegroundColor Red
        Write-Host "   Nodes disponibles:" -ForegroundColor Yellow
        $workflow.nodes | ForEach-Object { Write-Host "     - $($_.name)" -ForegroundColor Gray }
        exit 1
    }
    
    Write-Host "✅ Node trouvé à l'index $nodeIndex" -ForegroundColor Green
    
    # Nouveau code pour le node
    $newCode = @"
// Charger la configuration des templates
const fs = require('fs');
const configPath = '/templates/config/variables.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Récupérer le type de template depuis les données
const templateType = `$('Preparer Donnees').item.json.typeDocument;

if (!templateType || !config.templates[templateType]) {
  throw new Error(``Template '`${templateType}' non trouvé dans la configuration``);
}

// Récupérer le nom du fichier template
const templateFile = config.templates[templateType].fichier;
const templatePath = ``/templates/word/`${templateFile}``;

console.log(``📄 Chargement du template: `${templatePath}``);

// Lire le fichier template
const templateBuffer = fs.readFileSync(templatePath);

return {
  json: `$('Preparer Donnees').item.json,
  binary: {
    data: {
      data: templateBuffer.toString('base64'),
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName: templateFile
    }
  }
};
"@
    
    # Mettre à jour le code du node
    $workflow.nodes[$nodeIndex].parameters.functionCode = $newCode

    Write-Host "🔄 Mise à jour du workflow..." -ForegroundColor Cyan

    # Nettoyer les propriétés en lecture seule
    $workflow.PSObject.Properties.Remove('id')
    $workflow.PSObject.Properties.Remove('createdAt')
    $workflow.PSObject.Properties.Remove('updatedAt')
    $workflow.PSObject.Properties.Remove('versionId')

    # Convertir en JSON
    $body = $workflow | ConvertTo-Json -Depth 50 -Compress

    $result = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" -Headers $headers -Method PUT -Body $body -ContentType "application/json; charset=utf-8"
    
    Write-Host "✅ Workflow mis à jour avec succès!" -ForegroundColor Green
    Write-Host "   Le node 'Lire Template Word' passe maintenant les données JSON au node suivant" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 Tu peux maintenant tester le formulaire!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

