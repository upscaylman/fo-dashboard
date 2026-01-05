# Script pour arrêter ngrok
# Usage: .\scripts\stop-ngrok.ps1

Write-Host "Arret de ngrok..." -ForegroundColor Cyan

$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue

if ($ngrokProcess) {
    Stop-Process -Name "ngrok" -Force
    Write-Host "ngrok arrete avec succes" -ForegroundColor Green
} else {
    Write-Host "ngrok n'est pas en cours d'execution" -ForegroundColor Yellow
}

