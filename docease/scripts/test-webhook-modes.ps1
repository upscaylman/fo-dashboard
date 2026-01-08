# Test des differents modes de webhook dans n8n
Write-Host "🧪 Test des modes webhook n8n..." -ForegroundColor Cyan
Write-Host ""

$testData = @{
    civilite = "Monsieur"
    nom = "Test"
    adresse = "123 Test"
    template = "securite"
    texte_ai = "test"
    destinataires = "test@example.com"
} | ConvertTo-Json

$baseUrls = @(
    "http://localhost:5678/webhook/formulaire-doc",
    "http://localhost:5678/webhook-test/formulaire-doc"
)

foreach ($url in $baseUrls) {
    Write-Host "Test: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $testData -UseBasicParsing -ErrorAction Stop
        
        Write-Host "   Status OK: $($response.StatusCode)" -ForegroundColor Green
        $preview = if ($response.Content.Length -gt 100) { $response.Content.Substring(0, 100) + "..." } else { $response.Content }
        Write-Host "   Reponse: $preview" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "Webhook fonctionnel trouve: $url" -ForegroundColor Green
        Write-Host ""
        $proxyUrl = $url -replace "http://localhost:5678", "http://localhost:3000"
        Write-Host "Mettez a jour templates/form/form.html avec:" -ForegroundColor Yellow
        Write-Host "   $proxyUrl" -ForegroundColor Cyan
        break
    }
    catch {
        $statusCode = "?"
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
        }
        Write-Host "   Erreur Status: $statusCode" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "Si aucun test ne fonctionne:" -ForegroundColor Yellow
Write-Host "   1. Verifiez que le workflow est ACTIVE dans n8n" -ForegroundColor Gray
Write-Host "   2. Dans n8n, cliquez sur le noeud Webhook" -ForegroundColor Gray
Write-Host "   3. Verifiez le mode (Test/Production)" -ForegroundColor Gray
Write-Host "   4. Essayez de changer le mode et reactivez le workflow" -ForegroundColor Gray
Write-Host ""
