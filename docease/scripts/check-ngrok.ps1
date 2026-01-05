# Script pour vérifier et afficher l'URL ngrok
# Usage: .\scripts\check-ngrok.ps1

Write-Host "Vérification de ngrok..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET -ErrorAction Stop
    
    if ($response.tunnels -and $response.tunnels.Count -gt 0) {
        Write-Host "Ngrok est actif!" -ForegroundColor Green
        Write-Host ""
        
        foreach ($tunnel in $response.tunnels) {
            Write-Host "Tunnel: $($tunnel.proto) -> $($tunnel.config.addr)" -ForegroundColor White
            Write-Host "URL publique: $($tunnel.public_url)" -ForegroundColor Cyan
            Write-Host ""
        }
        
        # Prendre le premier tunnel HTTPS
        $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($httpsTunnel) {
            Write-Host "URL HTTPS principale: $($httpsTunnel.public_url)" -ForegroundColor Green
        }
    } else {
        Write-Host "Aucun tunnel ngrok actif" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Ngrok n'est pas accessible sur localhost:4040" -ForegroundColor Red
    Write-Host ""
    Write-Host "Démarrez ngrok avec: .\scripts\start-ngrok.ps1" -ForegroundColor Yellow
}

