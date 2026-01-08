# Script pour tester les webhooks via Cloudflare Tunnel
# Usage: .\scripts\test-webhook-cloudflare.ps1 -N8nUrl "https://n8n.votre-domaine.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$N8nUrl
)

Write-Host "🧪 Test des webhooks Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host ""

# Nettoyer l'URL
$N8nUrl = $N8nUrl.TrimEnd('/')

# IDs des webhooks
$webhookMainId = "7f72ac69-35b7-4771-a5c6-7acb18947254"
$webhookEmailId = "1ee6e745-fc31-4fd8-bc59-531bd4a69997"

# URLs complètes
$webhookMainUrl = "$N8nUrl/webhook/$webhookMainId"
$webhookEmailUrl = "$N8nUrl/webhook/$webhookEmailId"

Write-Host "📋 URLs à tester :" -ForegroundColor Yellow
Write-Host "  Webhook principal : $webhookMainUrl" -ForegroundColor White
Write-Host "  Webhook email     : $webhookEmailUrl" -ForegroundColor White
Write-Host ""

# Test 1 : Vérifier que n8n est accessible
Write-Host "1️⃣ Test de l'accès à n8n..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $N8nUrl -Method Get -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ n8n est accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  n8n répond avec le code : $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur : n8n n'est pas accessible" -ForegroundColor Red
    Write-Host "   Vérifiez que le tunnel Cloudflare est démarré" -ForegroundColor Yellow
    Write-Host "   Erreur : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2 : Test du webhook principal
Write-Host "2️⃣ Test du webhook principal..." -ForegroundColor Cyan
$testData = @{
    test = $true
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $webhookMainUrl -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Webhook principal répond (code: $($response.StatusCode))" -ForegroundColor Green
    if ($response.Content) {
        Write-Host "   Réponse : $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur lors du test du webhook principal" -ForegroundColor Red
    Write-Host "   Erreur : $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Code HTTP : $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 3 : Test du webhook email
Write-Host "3️⃣ Test du webhook email..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri $webhookEmailUrl -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Webhook email répond (code: $($response.StatusCode))" -ForegroundColor Green
    if ($response.Content) {
        Write-Host "   Réponse : $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erreur lors du test du webhook email" -ForegroundColor Red
    Write-Host "   Erreur : $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Code HTTP : $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 4 : Vérifier CORS
Write-Host "4️⃣ Test CORS depuis Netlify..." -ForegroundColor Cyan
$netlifyUrl = "https://automate-template-form.netlify.app"
Write-Host "   Test depuis : $netlifyUrl" -ForegroundColor Gray

try {
    $headers = @{
        "Origin" = $netlifyUrl
        "Referer" = $netlifyUrl
    }
    $response = Invoke-WebRequest -Uri $webhookMainUrl -Method Options -Headers $headers -TimeoutSec 10 -UseBasicParsing
    
    $corsHeaders = @()
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        $corsHeaders += "Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])"
    }
    if ($response.Headers["Access-Control-Allow-Methods"]) {
        $corsHeaders += "Access-Control-Allow-Methods: $($response.Headers['Access-Control-Allow-Methods'])"
    }
    
    if ($corsHeaders.Count -gt 0) {
        Write-Host "✅ CORS configuré :" -ForegroundColor Green
        $corsHeaders | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "⚠️  Pas de headers CORS détectés" -ForegroundColor Yellow
        Write-Host "   Vérifiez la configuration CORS dans n8n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Impossible de tester CORS (normal si OPTIONS n'est pas supporté)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Tests terminés !" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Si des erreurs apparaissent :" -ForegroundColor Cyan
Write-Host "   1. Vérifiez que le tunnel Cloudflare est démarré" -ForegroundColor Yellow
Write-Host "   2. Vérifiez que n8n est démarré : docker ps" -ForegroundColor Yellow
Write-Host "   3. Vérifiez la configuration CORS dans n8n" -ForegroundColor Yellow
Write-Host "   4. Vérifiez les logs : docker logs n8n-prod" -ForegroundColor Yellow

