# ============================================================
# DocEase - Démarrage du bot Telegram
# ============================================================
# Usage: .\start-bot.ps1
# ============================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile   = Join-Path $ScriptDir ".env"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DocEase - Bot Telegram" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérification du fichier .env
if (-not (Test-Path $EnvFile)) {
    Write-Host "[ERREUR] Fichier .env manquant." -ForegroundColor Red
    Write-Host "[INFO]   Copiez .env.example vers .env et remplissez TELEGRAM_BOT_TOKEN" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Etapes:" -ForegroundColor White
    Write-Host "  1. Creez un bot via @BotFather sur Telegram" -ForegroundColor Gray
    Write-Host "  2. Copiez le token dans .env" -ForegroundColor Gray
    Write-Host "  3. Obtenez votre ID Telegram via @userinfobot" -ForegroundColor Gray
    Write-Host "  4. Ajoutez votre ID dans ALLOWED_TELEGRAM_IDS" -ForegroundColor Gray
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}

# Vérification Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERREUR] Node.js n'est pas installe." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] $(node --version)" -ForegroundColor Green

# Vérification / installation des dépendances
$NodeModules = Join-Path $ScriptDir "node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-Host "[INFO] Installation des dependances npm..." -ForegroundColor Yellow
    Push-Location $ScriptDir
    npm install
    Pop-Location
}

# Démarrage du bot
Write-Host ""
Write-Host "[INFO] Demarrage du bot Telegram..." -ForegroundColor Yellow
Write-Host "[INFO] Appuyez sur Ctrl+C pour arreter." -ForegroundColor Gray
Write-Host ""
Push-Location $ScriptDir
node bot.js
Pop-Location
