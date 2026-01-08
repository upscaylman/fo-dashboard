# Script de test pour vérifier le proxy
Write-Host "🧪 Test du proxy webhook..." -ForegroundColor Cyan

$testData = @{
    civilite = "Monsieur"
    nom = "Test"
    adresse = "123 Test St"
    template = "securite"
    texte_ai = "Test IA"
    destinataires = "test@example.com"
} | ConvertTo-Json

try {
    Write-Host "📤 Envoi de la requête vers le proxy..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "http://localhost:3000/webhook-test/formulaire-doc" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing
    
    Write-Host "✅ Réponse reçue:" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "   Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Cyan
    Write-Host "   Body (premiers 200 caractères):" -ForegroundColor Cyan
    Write-Host "   $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Erreur:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode.value__
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $errorReader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $errorReader.ReadToEnd()
            $errorReader.Close()
            Write-Host "   Réponse:" -ForegroundColor Red
            Write-Host "   $errorBody" -ForegroundColor Gray
        }
        catch {
            Write-Host "   Impossible de lire la réponse d'erreur" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🔍 Vérification du webhook n8n direct..." -ForegroundColor Cyan
try {
    $n8nResponse = Invoke-WebRequest -Uri "http://localhost:5678/webhook-test/formulaire-doc" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testData `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Webhook n8n accessible directement (Status: $($n8nResponse.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "❌ Webhook n8n non accessible directement" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Vérifiez que:" -ForegroundColor Yellow
    Write-Host "   1. Le workflow est activé dans n8n" -ForegroundColor Yellow
    Write-Host "   2. Le webhook est public" -ForegroundColor Yellow
    Write-Host "   3. L'URL du webhook est bien: /webhook/formulaire-doc" -ForegroundColor Yellow
}

