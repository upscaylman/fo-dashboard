# Script to diagnose the form + n8n webhook setup

Write-Host "`n🔍 DIAGNOSTIC DU SYSTÈME DE FORMULAIRE" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Check if Docker containers are running
Write-Host "`n1️⃣  Vérification des conteneurs Docker..." -ForegroundColor Yellow
$n8nContainer = docker ps --filter "name=n8n-local" --format "{{.Names}}" 2>$null
$ollamaContainer = docker ps --filter "name=ollama" --format "{{.Names}}" 2>$null

if ($n8nContainer) {
    Write-Host "   ✅ n8n container is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ n8n container NOT running - run 'cd docker; docker-compose up -d'" -ForegroundColor Red
}

if ($ollamaContainer) {
    Write-Host "   ✅ Ollama container is running" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Ollama container NOT running (required for AI)" -ForegroundColor Yellow
}

# 2. Check if n8n is accessible
Write-Host "`n2️⃣  Vérification de l'accès à n8n..." -ForegroundColor Yellow
try {
    $n8nResponse = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ n8n accessible on http://localhost:5678" -ForegroundColor Green
} catch {
    Write-Host "   ❌ n8n NOT accessible - check Docker containers" -ForegroundColor Red
}

# 3. Check if proxy server is running on port 3000
Write-Host "`n3️⃣  Vérification du serveur proxy (port 3000)..." -ForegroundColor Yellow
$proxyPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($proxyPort) {
    Write-Host "   ✅ Proxy server running on port 3000" -ForegroundColor Green
    Write-Host "   📋 Form accessible at: http://localhost:3000/" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ Proxy server NOT running" -ForegroundColor Red
    Write-Host "   💡 Start it with: .\templates\form\serve-form-background.ps1" -ForegroundColor Yellow
}

# 4. Test webhook endpoints
Write-Host "`n4️⃣  Test des webhooks n8n..." -ForegroundColor Yellow

$webhooksToTest = @(
    @{Path = "/webhook/formulaire-doc"; Name = "Production webhook (gpt_generator)"},
    @{Path = "/webhook-test/formulaire-doc"; Name = "Test webhook (gpt_generator)"},
    @{Path = "/webhook/validate-doc"; Name = "Validation webhook"}
)

foreach ($webhook in $webhooksToTest) {
    try {
        $testUrl = "http://localhost:5678$($webhook.Path)"
        $response = Invoke-WebRequest -Uri $testUrl -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "   ✅ $($webhook.Name) - ACTIVE" -ForegroundColor Green
        Write-Host "      URL: $testUrl" -ForegroundColor Gray
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 404) {
            Write-Host "   ❌ $($webhook.Name) - NOT FOUND (404)" -ForegroundColor Red
            Write-Host "      → Workflow not imported or not activated" -ForegroundColor Yellow
        } elseif ($statusCode -eq 500) {
            Write-Host "   ⚠️  $($webhook.Name) - ERROR (500)" -ForegroundColor Yellow
            Write-Host "      → Workflow has configuration issues" -ForegroundColor Yellow
        } else {
            Write-Host "   ⚠️  $($webhook.Name) - Status: $statusCode" -ForegroundColor Yellow
        }
    }
}

# 5. Check workflow files
Write-Host "`n5️⃣  Vérification des fichiers workflow..." -ForegroundColor Yellow
$workflowPath = "workflows\dev\gpt_generator.json"
if (Test-Path $workflowPath) {
    Write-Host "   ✅ gpt_generator.json found" -ForegroundColor Green
} else {
    Write-Host "   ❌ gpt_generator.json NOT FOUND" -ForegroundColor Red
}

$ollamaWorkflow = "workflows\dev\Générateur Document avec Validation (Ollama).json"
if (Test-Path $ollamaWorkflow) {
    Write-Host "   ✅ Ollama workflow found" -ForegroundColor Green
} else {
    Write-Host "   ❌ Ollama workflow NOT FOUND" -ForegroundColor Red
}

# Summary
Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "📋 RÉSUMÉ ET ACTIONS RECOMMANDÉES" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

if (-not $n8nContainer) {
    Write-Host "`n❗ ACTION REQUISE:" -ForegroundColor Red
    Write-Host "   1. Démarrer les conteneurs Docker:" -ForegroundColor Yellow
    Write-Host "      cd docker" -ForegroundColor Gray
    Write-Host "      docker-compose up -d" -ForegroundColor Gray
}

if (-not $proxyPort) {
    Write-Host "`n❗ ACTION REQUISE:" -ForegroundColor Red
    Write-Host "   2. Démarrer le serveur proxy:" -ForegroundColor Yellow
    Write-Host "      Start-Process powershell -ArgumentList '-File templates\form\serve-form-background.ps1' -WindowStyle Hidden" -ForegroundColor Gray
}

Write-Host "`n❗ ACTION REQUISE:" -ForegroundColor Red
Write-Host "   3. Importer et activer le workflow dans n8n:" -ForegroundColor Yellow
Write-Host "      a. Ouvrir http://localhost:5678" -ForegroundColor Gray
Write-Host "      b. Aller dans 'Workflows' → 'Import from File'" -ForegroundColor Gray
Write-Host "      c. Sélectionner: workflows\dev\gpt_generator.json" -ForegroundColor Gray
Write-Host "      d. ACTIVER le workflow (toggle vert en haut à droite)" -ForegroundColor Gray
Write-Host "      e. Vérifier que le webhook path est 'formulaire-doc'" -ForegroundColor Gray

Write-Host "`n✅ Après activation, tester avec:" -ForegroundColor Green
Write-Host "   http://localhost:3000/" -ForegroundColor Cyan

Write-Host "`n"
