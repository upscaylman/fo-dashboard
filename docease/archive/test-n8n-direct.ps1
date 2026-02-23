# Test direct de n8n
$testData = @{
    civilite = "M."
    nom = "Test"
    template = "securite"
    destinataires = "test@test.com"
} | ConvertTo-Json

Write-Host "Test direct n8n..." -ForegroundColor Cyan

try {
    $r = Invoke-WebRequest -Uri "http://localhost:5678/webhook/formulaire-doc" `
        -Method POST `
        -Body $testData `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 120
    
    Write-Host "Status: $($r.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Length: $($r.Content.Length)" -ForegroundColor Cyan
    Write-Host "Content-Type: $($r.Headers.'Content-Type')" -ForegroundColor Cyan
    
    if ($r.Content.Length -gt 0) {
        $preview = if ($r.Content.Length -gt 500) { $r.Content.Substring(0, 500) + "..." } else { $r.Content }
        Write-Host "Content: $preview" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ CONTENT EST VIDE !" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    }
}

