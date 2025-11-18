# Script de démarrage pour le serveur de développement
# Utilisez: .\start-dev.ps1

Write-Host "Arrêt des processus Node.js existants..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Démarrage du serveur de développement..." -ForegroundColor Green
npm run dev

