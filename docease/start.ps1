# ============================================
# DocEase - Demarrage complet
# Ordre: Docker -> Formulaire (8080) -> ngrok
# ============================================
# Usage: .\start.ps1
#   ou:  powershell -ExecutionPolicy Bypass -File start.ps1
# ============================================

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- Privileges administrateur ---
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[INFO] Elevation des privileges administrateur..." -ForegroundColor Yellow
    try {
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
        exit
    } catch {
        Write-Host "[ERREUR] Impossible d'obtenir les privileges administrateur." -ForegroundColor Red
        Read-Host "Appuyez sur Entree pour fermer"
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DocEase - DEMARRAGE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# === ETAPE 1: Docker ===
Write-Host "[1/3] Verification de Docker..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERREUR] Docker n'est pas installe ou Docker Desktop n'est pas lance." -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}
Write-Host "[OK] $(docker --version 2>&1)" -ForegroundColor Green

$dockerDir = Join-Path $ScriptDir "docker"
if (-not (Test-Path (Join-Path $dockerDir "docker-compose.yml"))) {
    Write-Host "[ERREUR] docker-compose.yml introuvable dans: $dockerDir" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}

Write-Host "[INFO] Demarrage des conteneurs (PostgreSQL, n8n, Ollama)..." -ForegroundColor Yellow
Push-Location $dockerDir
docker compose up -d 2>&1 | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
Write-Host "[INFO] Attente du demarrage (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$containers = docker compose ps --format "table {{.Name}}\t{{.Status}}" 2>&1
$containers | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
Write-Host "[OK] Conteneurs Docker demarres." -ForegroundColor Green
Pop-Location

# === ETAPE 2: Serveur Formulaire (port 8080) ===
Write-Host ""
Write-Host "[2/3] Demarrage du serveur formulaire (port 8080)..." -ForegroundColor Yellow
$formulaireDir = Join-Path $ScriptDir "templates\formulaire"

if (Test-Path (Join-Path $formulaireDir "package.json")) {
    Write-Host "[INFO] Build de l'application..." -ForegroundColor Yellow
    Push-Location $formulaireDir
    npm run build 2>&1 | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
    Pop-Location
    Write-Host "[INFO] Demarrage du serveur Node.js (avec watchdog)..." -ForegroundColor Yellow
    $watchdogPath = Join-Path $formulaireDir "watchdog.cjs"
    Start-Process node -ArgumentList "`"$watchdogPath`"" -WindowStyle Minimized
    Write-Host "[INFO] Attente du demarrage serveur (5s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Verifier que le port 8080 repond (3 tentatives)
    $serverOk = $false
    for ($i = 1; $i -le 3; $i++) {
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            $serverOk = $true
            break
        } catch {
            if ($i -lt 3) { Start-Sleep -Seconds 2 }
        }
    }
    if ($serverOk) {
        Write-Host "[OK] Serveur formulaire demarre sur http://localhost:8080 (watchdog actif)" -ForegroundColor Green
    } else {
        Write-Host "[ATTENTION] Le port 8080 ne repond pas encore. Le watchdog le relancera automatiquement." -ForegroundColor Yellow
    }
} else {
    Write-Host "[ATTENTION] templates\formulaire introuvable, serveur non demarre." -ForegroundColor Yellow
}

# === ETAPE 3: ngrok (tunnel vers port 8080) ===
Write-Host ""
Write-Host "[3/3] Demarrage de ngrok (tunnel http 8080)..." -ForegroundColor Yellow

$ngrok8080 = Join-Path $ScriptDir "scripts\start-ngrok-8080.bat"
if (Test-Path $ngrok8080) {
    Start-Process cmd.exe -ArgumentList "/c `"$ngrok8080`"" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    
    # Recuperer l'URL ngrok
    $ngrokUrl = $null
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5 -ErrorAction Stop
        $ngrokUrl = ($r.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
    } catch {}
    
    if ($ngrokUrl) {
        Write-Host "[OK] ngrok demarre: $ngrokUrl" -ForegroundColor Green
    } else {
        Write-Host "[OK] ngrok demarre. Voir http://localhost:4040" -ForegroundColor Green
    }
} else {
    Write-Host "[ATTENTION] start-ngrok-8080.bat introuvable, ngrok non demarre." -ForegroundColor Yellow
}

# === Resume ===
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " TOUT EST DEMARRE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host " Services:" -ForegroundColor White
Write-Host "    - n8n:         " -NoNewline; Write-Host "http://localhost:5678" -ForegroundColor Cyan
Write-Host "    - Formulaire:  " -NoNewline; Write-Host "http://localhost:8080" -ForegroundColor Cyan
Write-Host "    - Ollama:      " -NoNewline; Write-Host "http://localhost:11434" -ForegroundColor Cyan
Write-Host "    - ngrok:       " -NoNewline; Write-Host "http://localhost:4040" -ForegroundColor Cyan
if ($ngrokUrl) {
    Write-Host "    - URL publique:" -NoNewline; Write-Host " $ngrokUrl" -ForegroundColor Cyan
}
Write-Host ""
Write-Host " Commandes:" -ForegroundColor White
Write-Host "    - Arreter:     stop.bat" -ForegroundColor Gray
Write-Host "    - Logs:        cd docker; docker compose logs -f" -ForegroundColor Gray
Write-Host ""

Read-Host "Appuyez sur Entree pour fermer"
