# Script pour installer ngrok via winget
# Usage: .\scripts\install-ngrok.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALLATION DE NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si ngrok est déjà installé
Write-Host "Vérification de l'installation existante..." -ForegroundColor Cyan
$ngrokCheck = Get-Command "ngrok" -ErrorAction SilentlyContinue
if ($ngrokCheck) {
    Write-Host "ngrok est déjà installé: $($ngrokCheck.Source)" -ForegroundColor Green
    $version = & ngrok version 2>&1
    if ($version) {
        Write-Host "Version: $version" -ForegroundColor Gray
    }
    Write-Host ""
    $reinstall = Read-Host "Voulez-vous réinstaller ngrok? (O/N)"
    if ($reinstall -ne "O" -and $reinstall -ne "o") {
        Write-Host "Installation annulée." -ForegroundColor Yellow
        exit 0
    }
}

# Vérifier si winget est disponible
Write-Host "Vérification de winget..." -ForegroundColor Cyan
try {
    $wingetVersion = winget --version 2>&1
    Write-Host "winget trouvé: $wingetVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ winget n'est pas disponible" -ForegroundColor Red
    Write-Host "   Installez winget depuis le Microsoft Store ou visitez:" -ForegroundColor Yellow
    Write-Host "   https://aka.ms/getwinget" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Installer ngrok avec l'ID spécifique pour éviter l'ambiguïté
Write-Host "Installation de ngrok (package officiel Ngrok.Ngrok)..." -ForegroundColor Cyan
Write-Host ""

try {
    # Utiliser l'ID complet pour éviter l'ambiguïté
    winget install --id Ngrok.Ngrok --accept-package-agreements --accept-source-agreements
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ NGROK INSTALLÉ AVEC SUCCÈS" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        # Vérifier l'installation
        Start-Sleep -Seconds 2
        $ngrokCheck = Get-Command "ngrok" -ErrorAction SilentlyContinue
        if ($ngrokCheck) {
            Write-Host "ngrok est maintenant disponible: $($ngrokCheck.Source)" -ForegroundColor Green
            Write-Host ""
            Write-Host "Prochaines étapes:" -ForegroundColor Cyan
            Write-Host "  1. Configurez votre token ngrok:" -ForegroundColor White
            Write-Host "     ngrok config add-authtoken <VOTRE_TOKEN>" -ForegroundColor Gray
            Write-Host "  2. Démarrez ngrok avec:" -ForegroundColor White
            Write-Host "     .\scripts\start-ngrok.ps1" -ForegroundColor Gray
            Write-Host ""
        } else {
            Write-Host "⚠️  ngrok installé mais non trouvé dans le PATH" -ForegroundColor Yellow
            Write-Host "   Redémarrez votre terminal PowerShell pour actualiser le PATH" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Erreur lors de l'installation" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erreur lors de l'installation: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Téléchargez ngrok manuellement depuis:" -ForegroundColor Yellow
    Write-Host "   https://ngrok.com/download" -ForegroundColor Yellow
    exit 1
}

