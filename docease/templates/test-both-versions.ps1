# Script pour tester les deux versions en parallèle
# Version 1 (classique) sur le port 8080
# Version 2 (React) sur le port 3000

Write-Host "🚀 Démarrage des deux versions..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si les dépendances sont installées
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow

# Version classique
if (-not (Test-Path "form/node_modules")) {
    Write-Host "Installation des dépendances pour la version classique..." -ForegroundColor Yellow
    Set-Location form
    npm install
    Set-Location ..
}

# Version React
if (-not (Test-Path "formulaire/node_modules")) {
    Write-Host "Installation des dépendances pour la version React..." -ForegroundColor Yellow
    Set-Location formulaire
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "✅ Dépendances installées" -ForegroundColor Green
Write-Host ""

# Démarrer la version classique
Write-Host "🌐 Démarrage de la version classique (v1)..." -ForegroundColor Cyan
$v1Process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\form'; npx serve -p 8080 ." -PassThru

Start-Sleep -Seconds 2

# Démarrer la version React
Write-Host "⚛️  Démarrage de la version React (v2)..." -ForegroundColor Cyan
$v2Process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\formulaire'; npm run dev" -PassThru

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Les deux versions sont démarrées !" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs d'accès :" -ForegroundColor Yellow
Write-Host "   Version 1 (classique) : http://localhost:8080" -ForegroundColor White
Write-Host "   Version 2 (React)     : http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Pour arrêter les serveurs, fermez les fenêtres PowerShell ouvertes" -ForegroundColor Cyan
Write-Host ""

# Ouvrir les navigateurs
Start-Sleep -Seconds 2
Write-Host "🌐 Ouverture des navigateurs..." -ForegroundColor Cyan
Start-Process "http://localhost:8080"
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✨ Prêt pour les tests !" -ForegroundColor Green

