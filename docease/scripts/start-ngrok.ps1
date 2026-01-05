# Script pour démarrer ngrok
# Usage: .\scripts\start-ngrok.ps1

param(
    [int]$Port = 8080,
    [string]$NgrokPath = "ngrok"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DÉMARRAGE DU TUNNEL NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si ngrok est installé
$ngrokCheck = Get-Command $NgrokPath -ErrorAction SilentlyContinue
if (-not $ngrokCheck) {
    $programFilesX86Path = [Environment]::GetFolderPath('ProgramFilesX86')
    $commonPaths = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe",
        "$env:LOCALAPPDATA\Microsoft\WindowsApps\ngrok.exe",
        "$env:ProgramFiles\ngrok\ngrok.exe",
        "$programFilesX86Path\ngrok\ngrok.exe",
        "C:\ngrok\ngrok.exe"
    )
    
    $ngrokFound = $false
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $NgrokPath = $path
            $ngrokFound = $true
            Write-Host "ngrok trouvé: $path" -ForegroundColor Green
            break
        }
    }
    
    if (-not $ngrokFound) {
        Write-Host "ngrok n'est pas installé ou non trouvé dans le PATH" -ForegroundColor Red
        Write-Host "Installez ngrok depuis: https://ngrok.com/download" -ForegroundColor Yellow
        exit 1
    }
}

# Vérifier que le service local est accessible
Write-Host "Vérification que le service est accessible sur le port $Port..." -ForegroundColor Cyan
$serviceAccessible = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $serviceAccessible = $true
    Write-Host "Service local accessible sur http://localhost:$Port" -ForegroundColor Green
}
catch {
    Write-Host "ATTENTION: Le service n'est pas accessible sur http://localhost:$Port" -ForegroundColor Yellow
    Write-Host "Assurez-vous que n8n est démarré avant de lancer ngrok" -ForegroundColor Yellow
    Write-Host "Vous pouvez démarrer n8n avec: .\start.ps1" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Voulez-vous quand même démarrer ngrok? (O/N)"
    if ($continue -ne "O" -and $continue -ne "o") {
        exit 0
    }
}

# Vérifier si ngrok est déjà en cours d'exécution
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Write-Host "ngrok est déjà en cours d'exécution" -ForegroundColor Yellow
    Write-Host "Arrêt de l'instance existante..." -ForegroundColor Yellow
    Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Démarrer ngrok en arrière-plan avec headers CORS
Write-Host "Démarrage de ngrok sur le port $Port avec headers CORS..." -ForegroundColor Cyan

# Arguments ngrok avec headers CORS pour éviter les problèmes de preflight
$ngrokArgs = @(
    "http",
    $Port,
    "--response-header-add=Access-Control-Allow-Origin: *",
    "--response-header-add=Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE",
    "--response-header-add=Access-Control-Allow-Headers: Content-Type, Authorization, ngrok-skip-browser-warning"
)

$ngrokProcess = Start-Process -FilePath $NgrokPath -ArgumentList $ngrokArgs -PassThru -WindowStyle Normal

if (-not $ngrokProcess) {
    Write-Host "Impossible de démarrer ngrok" -ForegroundColor Red
    exit 1
}

# Attendre que ngrok soit prêt
Write-Host "Attente du démarrage de ngrok..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Récupérer l'URL ngrok depuis l'API locale
$maxRetries = 10
$retryCount = 0
$ngrokUrl = $null

while ($retryCount -lt $maxRetries -and -not $ngrokUrl) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET -ErrorAction Stop
        
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            # Prendre le premier tunnel HTTPS
            $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
            if ($httpsTunnel) {
                $ngrokUrl = $httpsTunnel.public_url
            } else {
                # Sinon prendre le premier tunnel disponible
                $ngrokUrl = $response.tunnels[0].public_url
            }
        }
    }
    catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Start-Sleep -Seconds 2
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "NGROK DÉMARRÉ" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($ngrokUrl) {
    Write-Host "URL publique ngrok: $ngrokUrl" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Impossible de récupérer l'URL ngrok automatiquement" -ForegroundColor Yellow
    Write-Host "Consultez l'interface ngrok: http://localhost:4040" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Informations:" -ForegroundColor White
Write-Host "  - Interface ngrok: http://localhost:4040" -ForegroundColor Gray
Write-Host "  - Service local: http://localhost:$Port" -ForegroundColor Gray
if ($ngrokUrl) {
    Write-Host "  - URL publique: $ngrokUrl" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Pour arrêter ngrok: Stop-Process -Name 'ngrok' -Force" -ForegroundColor Gray
Write-Host ""
