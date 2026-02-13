# ============================================
# DocEase - Arret de tous les services
# ngrok -> Serveur -> Docker
# ============================================
# Usage: .\stop-docease.ps1
#   ou:  powershell -ExecutionPolicy Bypass -File stop-docease.ps1
# ============================================

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- Couleurs ---
function Write-Step($num, $total, $msg) { Write-Host "[$num/$total] $msg" -ForegroundColor Yellow }
function Write-Ok($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Skip($msg) { Write-Host "  [--] $msg" -ForegroundColor DarkGray }
function Write-Err($msg) { Write-Host "  [ERREUR] $msg" -ForegroundColor Red }

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

Clear-Host
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Red
Write-Host "   DocEase - ARRET DES SERVICES" -ForegroundColor Red
Write-Host "  ============================================" -ForegroundColor Red
Write-Host ""

$totalSteps = 3
$stoppedServices = @()

# ═══════════════════════════════════════════
# ETAPE 1 : Arreter ngrok
# ═══════════════════════════════════════════
Write-Step 1 $totalSteps "Arret de ngrok..."

$ngrok = Get-Process ngrok -ErrorAction SilentlyContinue
if ($ngrok) {
    Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Ok "ngrok arrete (PID: $($ngrok.Id))."
    $stoppedServices += "ngrok"
} else {
    Write-Skip "Aucun processus ngrok en cours."
}

Write-Host ""

# ═══════════════════════════════════════════
# ETAPE 2 : Arreter le serveur formulaire
# ═══════════════════════════════════════════
Write-Step 2 $totalSteps "Arret du serveur formulaire (port 8080)..."

$serverStopped = $false

# Methode 1 : Trouver via le port 8080
$port8080 = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($port8080) {
    foreach ($conn in $port8080) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Ok "$($proc.ProcessName) arrete (PID: $($conn.OwningProcess))."
            $serverStopped = $true
        }
    }
}

# Methode 2 : Trouver les processus node serve.cjs restants
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    $cmdLine = $null
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    } catch {}
    if ($cmdLine -match 'serve\.cjs') {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Ok "serve.cjs arrete (PID: $($_.Id))."
        $serverStopped = $true
    }
}

if ($serverStopped) {
    $stoppedServices += "Serveur formulaire"
} else {
    Write-Skip "Aucun serveur formulaire en cours sur le port 8080."
}

Write-Host ""

# ═══════════════════════════════════════════
# ETAPE 3 : Arreter Docker
# ═══════════════════════════════════════════
Write-Step 3 $totalSteps "Arret des conteneurs Docker..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Skip "Docker non accessible, conteneurs ignores."
} else {
    $dockerDir = Join-Path $ScriptDir "docker"
    if (Test-Path (Join-Path $dockerDir "docker-compose.yml")) {
        Push-Location $dockerDir
        
        # Verifier si des conteneurs tournent
        $running = docker compose ps --format "{{.Name}}" 2>&1 | Where-Object { $_ -match '\S' }
        
        if ($running.Count -gt 0) {
            Write-Host "  Conteneurs en cours : $($running -join ', ')" -ForegroundColor Gray
            docker compose down 2>&1 | ForEach-Object { Write-Host "       $_" -ForegroundColor Gray }
            
            if ($LASTEXITCODE -eq 0) {
                Write-Ok "Conteneurs Docker arretes (n8n, PostgreSQL, Ollama)."
                $stoppedServices += "Docker"
            } else {
                Write-Err "Erreur lors de l'arret de Docker."
            }
        } else {
            Write-Skip "Aucun conteneur Docker en cours."
        }
        
        Pop-Location
    } else {
        Write-Skip "docker-compose.yml introuvable dans $dockerDir"
    }
}

# ═══════════════════════════════════════════
# Resume
# ═══════════════════════════════════════════
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   ARRET TERMINE" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""

if ($stoppedServices.Count -gt 0) {
    Write-Host "  Services arretes :" -ForegroundColor White
    foreach ($svc in $stoppedServices) {
        Write-Host "    - $svc" -ForegroundColor Gray
    }
} else {
    Write-Host "  Aucun service n'etait en cours d'execution." -ForegroundColor Gray
}

Write-Host ""
Write-Host "  Pour redemarrer : " -NoNewline; Write-Host ".\start-docease.ps1" -ForegroundColor Cyan
Write-Host ""

# Fermeture auto apres 5 secondes
Write-Host "Fermeture dans 5 secondes..." -ForegroundColor DarkGray
Start-Sleep -Seconds 5
