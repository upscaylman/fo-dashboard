# Test the form submission to n8n webhook

Write-Host "`n🧪 TESTING FORM WEBHOOK" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$testData = @{
    civilite = "Monsieur"
    nom = "Dupont"
    adresse = "123 Rue de Test"
    template = "securite"
    texte_ai = "Test de generation automatique"
    destinataires = "test@example.com"
} | ConvertTo-Json

Write-Host "`n📤 Sending test data to webhook..." -ForegroundColor Yellow
Write-Host "Data: $testData" -ForegroundColor Gray

try {
    # Test via proxy (port 3000)
    Write-Host "`n1️⃣  Testing via PROXY (http://localhost:3000)..." -ForegroundColor Yellow
    $proxyResponse = Invoke-WebRequest -Uri "http://localhost:3000/webhook/formulaire-doc" `
        -Method POST `
        -Body $testData `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 10
    
    Write-Host "   ✅ Proxy Response: $($proxyResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Content: $($proxyResponse.Content)" -ForegroundColor Gray
}
catch {
    Write-Host "   ❌ Proxy Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error details: $errorBody" -ForegroundColor Yellow
    }
}

try {
    # Test direct n8n (port 5678)
    Write-Host "`n2️⃣  Testing DIRECT n8n (http://localhost:5678)..." -ForegroundColor Yellow
    $n8nResponse = Invoke-WebRequest -Uri "http://localhost:5678/webhook/formulaire-doc" `
        -Method POST `
        -Body $testData `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 10
    
    Write-Host "   ✅ n8n Response: $($n8nResponse.StatusCode)" -ForegroundColor Green
    Write-Host "   Content: $($n8nResponse.Content)" -ForegroundColor Gray
}
catch {
    Write-Host "   ❌ n8n Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error details: $errorBody" -ForegroundColor Yellow
    }
}

Write-Host "`n" + "=" * 60 -ForegroundColor Gray
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "If you see errors above:" -ForegroundColor Yellow
Write-Host "1. Open n8n: http://localhost:5678" -ForegroundColor Gray
Write-Host "2. Delete existing 'gpt_generator' workflow (if any)" -ForegroundColor Gray
Write-Host "3. Import: workflows/dev/gpt_generator.json" -ForegroundColor Gray
Write-Host "4. ACTIVATE the workflow (green toggle)" -ForegroundColor Gray
Write-Host "5. Run this test again" -ForegroundColor Gray
Write-Host ""
Write-Host "If successful, open the form at: http://localhost:3000/" -ForegroundColor Green
Write-Host ""
