# Script de test pour le serveur MCP n8n
Write-Host "Test du serveur MCP n8n" -ForegroundColor Cyan
Write-Host ""

# Verifier que n8n est en cours d'execution
Write-Host "1. Verification de n8n..." -ForegroundColor Yellow
try {
    $n8nResponse = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   OK n8n est accessible" -ForegroundColor Green
}
catch {
    Write-Host "   ERREUR n8n n'est pas accessible" -ForegroundColor Red
    Write-Host "   Demarrez n8n avec: .\start.bat" -ForegroundColor Yellow
    exit 1
}

# Verifier que le serveur MCP est compile
Write-Host ""
Write-Host "2. Verification de la compilation..." -ForegroundColor Yellow
if (Test-Path "dist/index.js") {
    Write-Host "   OK Serveur MCP compile" -ForegroundColor Green
}
else {
    Write-Host "   ERREUR Serveur MCP non compile" -ForegroundColor Red
    Write-Host "   Compilez avec: npm run build" -ForegroundColor Yellow
    exit 1
}

# Tester l'API n8n avec la cle API
Write-Host ""
Write-Host "3. Test de l'API n8n..." -ForegroundColor Yellow
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk"

try {
    $headers = @{
        "X-N8N-API-KEY" = $apiKey
        "Accept"        = "application/json"
    }

    $apiResponse = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" -Method GET -Headers $headers -TimeoutSec 10
    Write-Host "   OK API n8n accessible avec la cle" -ForegroundColor Green
    Write-Host "   Workflows trouves: $($apiResponse.data.Count)" -ForegroundColor Cyan
}
catch {
    Write-Host "   ERREUR d'acces a l'API n8n" -ForegroundColor Red
    Write-Host "   Erreur: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Verifiez que:" -ForegroundColor Yellow
    Write-Host "      - n8n est demarre" -ForegroundColor Yellow
    Write-Host "      - La cle API est correcte" -ForegroundColor Yellow
    Write-Host "      - L'API publique est activee dans n8n" -ForegroundColor Yellow
    exit 1
}

# Afficher les informations de configuration
Write-Host ""
Write-Host "4. Configuration du serveur MCP" -ForegroundColor Yellow
Write-Host "   URL de base: http://localhost:5678/api/v1" -ForegroundColor Cyan
Write-Host "   Cle API: Configuree" -ForegroundColor Cyan
Write-Host "   Fichier compile: dist/index.js" -ForegroundColor Cyan

Write-Host ""
Write-Host "OK Tous les tests sont passes !" -ForegroundColor Green
Write-Host ""
Write-Host "Pour demarrer le serveur MCP:" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "Pour plus d'informations, consultez README.md" -ForegroundColor Cyan

