# Script pour redémarrer le serveur de formulaire
# Usage: .\scripts\restart-form-server.ps1

Write-Host "Redemarrage du serveur de formulaire..." -ForegroundColor Cyan
Write-Host ""

# Arrêter les processus serve-form existants
$processes = Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*serve-form*" -or $_.MainWindowTitle -like "*serve-form*"
}

if ($processes) {
    Write-Host "Arret des processus serve-form existants..." -ForegroundColor Yellow
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Vérifier si le port 3000 est libre
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Le port 3000 est encore utilise. Attente..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

Write-Host "Demarrage du serveur..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Le serveur sera accessible sur: http://localhost:3000" -ForegroundColor Green
Write-Host ""

# Démarrer le serveur
$scriptPath = Join-Path $PSScriptRoot "..\templates\form\serve-form-background.ps1"
if (Test-Path $scriptPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "`"$scriptPath`""
    Write-Host "Serveur demarre en arriere-plan" -ForegroundColor Green
    Write-Host "Ouvrez http://localhost:3000 dans votre navigateur" -ForegroundColor Cyan
} else {
    Write-Host "Erreur: Fichier serve-form-background.ps1 non trouve" -ForegroundColor Red
    exit 1
}

