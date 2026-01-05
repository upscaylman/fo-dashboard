# Script d'aide pour configurer et démarrer ngrok
# Usage: .\scripts\setup-ngrok.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION ET DÉMARRAGE DE NGROK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Vérifier l'installation de ngrok
Write-Host "Étape 1: Vérification de ngrok..." -ForegroundColor Cyan
$ngrokCheck = Get-Command "ngrok" -ErrorAction SilentlyContinue
if (-not $ngrokCheck) {
    # Actualiser le PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    $ngrokCheck = Get-Command "ngrok" -ErrorAction SilentlyContinue
}

if (-not $ngrokCheck) {
    Write-Host "❌ ngrok n'est pas trouvé dans le PATH" -ForegroundColor Red
    Write-Host "   Installez ngrok avec: .\scripts\install-ngrok.ps1" -ForegroundColor Yellow
    exit 1
}

$ngrokVersion = & ngrok version 2>&1
Write-Host "✅ ngrok installé: $ngrokVersion" -ForegroundColor Green
Write-Host ""

# Étape 2: Vérifier la configuration du token
Write-Host "Étape 2: Vérification du token ngrok..." -ForegroundColor Cyan
$configPath = "$env:LOCALAPPDATA\ngrok\ngrok.yml"
$tokenConfigured = $false

if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    if ($configContent -match "authtoken") {
        $tokenConfigured = $true
        Write-Host "✅ Token ngrok déjà configuré" -ForegroundColor Green
    }
}

if (-not $tokenConfigured) {
    Write-Host "⚠️  Token ngrok non configuré" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour obtenir votre token ngrok:" -ForegroundColor White
    Write-Host "  1. Visitez: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Gray
    Write-Host "  2. Connectez-vous ou créez un compte gratuit" -ForegroundColor Gray
    Write-Host "  3. Copiez votre token" -ForegroundColor Gray
    Write-Host ""
    
    $hasToken = Read-Host "Avez-vous déjà un token ngrok? (O/N)"
    if ($hasToken -eq "O" -or $hasToken -eq "o") {
        $token = Read-Host "Collez votre token ngrok"
        if ($token) {
            Write-Host ""
            Write-Host "Configuration du token..." -ForegroundColor Cyan
            & ngrok config add-authtoken $token
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Token configuré avec succès" -ForegroundColor Green
                $tokenConfigured = $true
            } else {
                Write-Host "❌ Erreur lors de la configuration du token" -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-Host ""
        Write-Host "Ouvrez votre navigateur pour obtenir le token..." -ForegroundColor Cyan
        Start-Process "https://dashboard.ngrok.com/get-started/your-authtoken"
        Write-Host ""
        Write-Host "Une fois que vous avez le token, relancez ce script ou configurez-le avec:" -ForegroundColor Yellow
        Write-Host "  ngrok config add-authtoken <VOTRE_TOKEN>" -ForegroundColor Gray
        exit 0
    }
}

Write-Host ""

# Étape 3: Vérifier que n8n est démarré
Write-Host "Étape 3: Vérification que n8n est accessible..." -ForegroundColor Cyan
$port = 5678
$serviceAccessible = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $serviceAccessible = $true
    Write-Host "✅ n8n est accessible sur http://localhost:$port" -ForegroundColor Green
} catch {
    Write-Host "⚠️  n8n n'est pas accessible sur http://localhost:$port" -ForegroundColor Yellow
    Write-Host "   Démarrez n8n avec: .\start.ps1" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Voulez-vous quand même démarrer ngrok? (O/N)"
    if ($continue -ne "O" -and $continue -ne "o") {
        exit 0
    }
}

Write-Host ""

# Étape 4: Vérifier si ngrok est déjà en cours d'exécution
Write-Host "Étape 4: Vérification des instances ngrok existantes..." -ForegroundColor Cyan
$ngrokProcess = Get-Process -Name "ngrok" -ErrorAction SilentlyContinue
if ($ngrokProcess) {
    Write-Host "⚠️  ngrok est déjà en cours d'exécution" -ForegroundColor Yellow
    Write-Host "   Arrêt de l'instance existante..." -ForegroundColor Yellow
    Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host ""

# Étape 5: Démarrer ngrok
Write-Host "Étape 5: Démarrage de ngrok..." -ForegroundColor Cyan
Write-Host "   Port: $port" -ForegroundColor Gray
Write-Host ""

$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", $port -PassThru -WindowStyle Hidden

if (-not $ngrokProcess) {
    Write-Host "❌ Impossible de démarrer ngrok" -ForegroundColor Red
    exit 1
}

# Attendre que ngrok soit prêt
Write-Host "Attente du démarrage de ngrok..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Récupérer l'URL ngrok
$maxRetries = 10
$retryCount = 0
$ngrokUrl = $null

while ($retryCount -lt $maxRetries -and -not $ngrokUrl) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method GET -ErrorAction Stop
        
        if ($response.tunnels -and $response.tunnels.Count -gt 0) {
            $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
            if ($httpsTunnel) {
                $ngrokUrl = $httpsTunnel.public_url
            } else {
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
Write-Host "✅ NGROK DÉMARRÉ AVEC SUCCÈS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($ngrokUrl) {
    Write-Host "🌐 URL publique ngrok: $ngrokUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Utilisez cette URL pour:" -ForegroundColor White
    Write-Host "   - Configurer vos webhooks n8n" -ForegroundColor Gray
    Write-Host "   - Tester votre formulaire depuis Internet" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⚠️  Impossible de récupérer l'URL automatiquement" -ForegroundColor Yellow
    Write-Host "   Consultez l'interface ngrok: http://localhost:4040" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Informations:" -ForegroundColor White
Write-Host "  - Interface ngrok: http://localhost:4040" -ForegroundColor Gray
Write-Host "  - Service local: http://localhost:$port" -ForegroundColor Gray
if ($ngrokUrl) {
    Write-Host "  - URL publique: $ngrokUrl" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Pour arrêter ngrok: .\scripts\stop-ngrok.ps1" -ForegroundColor Gray
Write-Host ""

