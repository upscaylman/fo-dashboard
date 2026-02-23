$headers = @{
    "X-N8N-API-KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"
}

Write-Host "Recuperation du workflow..." -ForegroundColor Cyan
$workflow = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/AJtlydAXDxYu7HTq" -Headers $headers

# Ajouter un nœud "Code" pour convertir le binaire en base64
$converterNode = @{
    parameters = @{
        jsCode = @"
// Convertir le binaire en base64
const binaryData = items[0].binary.data;
const base64 = binaryData.data;

return [{
  json: {
    data: base64
  }
}];
"@
    }
    id = "binary-to-base64-converter"
    name = "Convertir en Base64"
    type = "n8n-nodes-base.code"
    typeVersion = 2
    position = @(500, 336)
}

# Ajouter le nœud au workflow
$workflow.nodes += $converterNode

# Modifier la connexion : Remplir Template Docx → Convertir en Base64 → Réponse avec Word
$workflow.connections.'Remplir Template Docx'.main = @(
    @(
        @{
            node = "Convertir en Base64"
            type = "main"
            index = 0
        }
    )
)

# Ajouter la connexion : Convertir en Base64 → Réponse avec Word
$workflow.connections.'Convertir en Base64' = @{
    main = @(
        @(
            @{
                node = "Reponse avec Word"
                type = "main"
                index = 0
            }
        )
    )
}

Write-Host "Mise a jour du workflow..." -ForegroundColor Cyan
$body = $workflow | ConvertTo-Json -Depth 20 -Compress
Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/AJtlydAXDxYu7HTq" -Headers $headers -Method PUT -Body $body -ContentType "application/json" | Out-Null

Write-Host "Workflow mis a jour avec le noeud Convertir en Base64" -ForegroundColor Green

