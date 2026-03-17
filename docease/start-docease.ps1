# ============================================
# DocEase - Demarrage complet
# Docker -> Build -> Serveur (8080) -> ngrok
# ============================================
# Usage: .\start-docease.ps1
#   ou:  powershell -ExecutionPolicy Bypass -File start-docease.ps1
# ============================================

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- Couleurs ---
function Write-Step($num, $total, $msg) { Write-Host "[$num/$total] $msg" -ForegroundColor Yellow }
function Write-Ok($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[!] $msg" -ForegroundColor DarkYellow }
function Write-Err($msg) { Write-Host "[ERREUR] $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Gray }

# --- Privileges administrateur ---
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[INFO] Elevation des privileges administrateur..." -ForegroundColor Yellow
    try {
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
        exit
    } catch {
        Write-Err "Impossible d'obtenir les privileges administrateur."
        Read-Host "Appuyez sur Entree pour fermer"
        exit 1
    }
}

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "   DocEase - DEMARRAGE" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

$totalSteps = 4

# ═══════════════════════════════════════════
# ETAPE 1 : Docker
# ═══════════════════════════════════════════
Write-Step 1 $totalSteps "Verification de Docker..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "Docker n'est pas installe ou Docker Desktop n'est pas lance."
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}
Write-Info (docker --version 2>&1)

$dockerDir = Join-Path $ScriptDir "docker"
if (-not (Test-Path (Join-Path $dockerDir "docker-compose.yml"))) {
    Write-Err "docker-compose.yml introuvable dans: $dockerDir"
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}

# Verifier si les conteneurs tournent deja
$runningContainers = docker compose -f "$dockerDir\docker-compose.yml" ps --format "{{.Name}}" 2>&1
$alreadyRunning = ($runningContainers | Where-Object { $_ -match '\S' }).Count -gt 0

if ($alreadyRunning) {
    Write-Ok "Conteneurs Docker deja en cours d'execution."
    docker compose -f "$dockerDir\docker-compose.yml" ps --format "table {{.Name}}\t{{.Status}}" 2>&1 | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
} else {
    Write-Info "Demarrage des conteneurs (PostgreSQL, n8n, Ollama)..."
    Push-Location $dockerDir
    docker compose up -d 2>&1 | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
    Pop-Location
    Write-Info "Attente du demarrage (8s)..."
    Start-Sleep -Seconds 8
    Write-Ok "Conteneurs Docker demarres."
}

Write-Host ""

# ═══════════════════════════════════════════
# ETAPE 2 : Build du formulaire
# ═══════════════════════════════════════════
Write-Step 2 $totalSteps "Build de l'application formulaire..."

$formulaireDir = Join-Path $ScriptDir "templates\formulaire"

if (-not (Test-Path (Join-Path $formulaireDir "package.json"))) {
    Write-Err "templates\formulaire\package.json introuvable."
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}

Push-Location $formulaireDir

# Verifier si node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Info "Installation des dependances (npm install)..."
    npm install 2>&1 | Select-Object -Last 5 | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
}

Write-Info "Build en cours..."
$buildOutput = npm run build 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

if ($buildSuccess) {
    Write-Ok "Build termine avec succes."
} else {
    Write-Err "Echec du build :"
    $buildOutput | Select-Object -Last 10 | ForEach-Object { Write-Host "       $_" -ForegroundColor Red }
    Pop-Location
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}
Pop-Location

Write-Host ""

# ═══════════════════════════════════════════
# ETAPE 3 : Serveur Node.js (port 8080)
# ═══════════════════════════════════════════
Write-Step 3 $totalSteps "Demarrage du serveur formulaire (port 8080)..."

# Verifier si le port 8080 est deja utilise
$port8080 = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($port8080) {
    $existingPid = $port8080.OwningProcess
    $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    Write-Warn "Port 8080 deja utilise par $($existingProcess.ProcessName) (PID: $existingPid)"
    
    $response = Read-Host "       Arreter le processus existant ? (O/n)"
    if ($response -ne 'n' -and $response -ne 'N') {
        Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Info "Processus arrete."
    } else {
        Write-Warn "Serveur non demarre (port occupe)."
        goto :ngrok
    }
}

$watchdogPath = Join-Path $formulaireDir "watchdog.cjs"
if (-not (Test-Path $watchdogPath)) {
    Write-Err "watchdog.cjs introuvable : $watchdogPath"
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}

Start-Process node -ArgumentList "`"$watchdogPath`"" -WindowStyle Minimized -WorkingDirectory $formulaireDir
Write-Info "Attente du demarrage (5s)..."
Start-Sleep -Seconds 5

# Verifier que le serveur repond (3 tentatives)
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
    Write-Ok "Serveur formulaire demarre : http://localhost:8080 (watchdog actif)"
} else {
    Write-Warn "Le serveur ne repond pas encore sur le port 8080."
    Write-Info "Le watchdog le relancera automatiquement."
}

Write-Host ""

# ═══════════════════════════════════════════
# ETAPE 4 : ngrok (tunnel HTTP)
# ═══════════════════════════════════════════
:ngrok
Write-Step 4 $totalSteps "Demarrage de ngrok (tunnel http 8080)..."

# Verifier si ngrok est deja lance
$ngrokRunning = Get-Process ngrok -ErrorAction SilentlyContinue
if ($ngrokRunning) {
    Write-Ok "ngrok deja en cours d'execution."
} else {
    $ngrokBat = Join-Path $ScriptDir "scripts\start-ngrok-8080.bat"
    if (Test-Path $ngrokBat) {
        Start-Process cmd.exe -ArgumentList "/c `"$ngrokBat`"" -WindowStyle Minimized
        Start-Sleep -Seconds 5
        Write-Ok "ngrok demarre."
    } else {
        # Essayer directement ngrok
        if (Get-Command ngrok -ErrorAction SilentlyContinue) {
            Start-Process ngrok -ArgumentList "http 8080" -WindowStyle Minimized
            Start-Sleep -Seconds 5
            Write-Ok "ngrok demarre."
        } else {
            Write-Warn "ngrok introuvable. Tunnel non demarre."
            Write-Info "Installez ngrok : https://ngrok.com/download"
        }
    }
}

# Recuperer l'URL ngrok
$ngrokUrl = $null
try {
    $r = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5 -ErrorAction Stop
    $ngrokUrl = ($r.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
} catch {}

# ═══════════════════════════════════════════
# Resume
# ═══════════════════════════════════════════
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   DOCEASE DEMARRE AVEC SUCCES" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Services :" -ForegroundColor White
Write-Host "    Formulaire :  " -NoNewline; Write-Host "http://localhost:8080" -ForegroundColor Cyan
Write-Host "    n8n :         " -NoNewline; Write-Host "http://localhost:5678" -ForegroundColor Cyan
Write-Host "    Ollama :      " -NoNewline; Write-Host "http://localhost:11434" -ForegroundColor Cyan
Write-Host "    ngrok panel : " -NoNewline; Write-Host "http://localhost:4040" -ForegroundColor Cyan
if ($ngrokUrl) {
    Write-Host "    URL publique :" -NoNewline; Write-Host " $ngrokUrl" -ForegroundColor Magenta
}
Write-Host ""
Write-Host "  Commandes :" -ForegroundColor White
Write-Host "    Arreter :     " -NoNewline; Write-Host ".\stop-docease.ps1" -ForegroundColor Gray
Write-Host "    Logs Docker : " -NoNewline; Write-Host "cd docker; docker compose logs -f" -ForegroundColor Gray
Write-Host ""

# Ouvrir le navigateur
Start-Process "http://localhost:8080"

Read-Host "Appuyez sur Entree pour fermer cette fenetre"
