# Script pour vérifier si le webhook existe dans n8n
Write-Host "🔍 Vérification du webhook dans n8n..." -ForegroundColor Cyan
Write-Host ""

$webhookPath = "formulaire-doc"
$n8nUrl = "http://localhost:5678/webhook-test/$webhookPath"

Write-Host "📋 Test du webhook: $n8nUrl" -ForegroundColor Yellow

try {
    $testData = @{
        test = "check"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri $n8nUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Webhook accessible !" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "   URL utilisable: $n8nUrl" -ForegroundColor Green
}
catch {
    $statusCode = "?"
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode.value__
    }
    
    Write-Host "❌ Webhook non accessible (Status: $statusCode)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Solutions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Vérifiez que n8n est démarré:" -ForegroundColor Cyan
    Write-Host "   http://localhost:5678" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Dans n8n, vérifiez que:" -ForegroundColor Cyan
    Write-Host "   - Le workflow est importé" -ForegroundColor Gray
    Write-Host "   - Le workflow est ACTIVÉ (toggle vert)" -ForegroundColor Gray
    Write-Host "   - Le nœud Webhook a le path: 'formulaire-doc'" -ForegroundColor Gray
    Write-Host "   - Le webhook est en mode 'Public'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Si le workflow n'existe pas:" -ForegroundColor Cyan
    Write-Host "   - Importez workflows/dev/gpt_generator.json" -ForegroundColor Gray
    Write-Host "   - Activez le workflow" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Si l'URL du webhook est différente:" -ForegroundColor Cyan
    Write-Host "   - Notez l'URL exacte dans n8n" -ForegroundColor Gray
    Write-Host "   - Modifiez templates/form/form.html avec la bonne URL" -ForegroundColor Gray
}

Write-Host ""

