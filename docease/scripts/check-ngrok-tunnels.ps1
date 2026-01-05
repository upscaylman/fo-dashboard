# Script pour vérifier les tunnels ngrok actifs

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "TUNNELS NGROK ACTIFS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($tunnel in $response.tunnels) {
        Write-Host "Tunnel: $($tunnel.public_url)" -ForegroundColor Green
        Write-Host "  -> Local: $($tunnel.config.addr)" -ForegroundColor Gray
        Write-Host "  -> Proto: $($tunnel.proto)" -ForegroundColor Gray
        Write-Host ""
    }
    
} catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
}

