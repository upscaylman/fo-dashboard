@echo off

REM Vérifier si le script est exécuté en tant qu'administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Demande d'élévation des privilèges administrateur...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================
echo 🛑 ARRÊT DE TOUS LES SERVICES
echo ========================================
echo.

REM Arrêter tous les processus ngrok
echo 🔍 Arrêt de ngrok...
powershell -ExecutionPolicy Bypass -Command "Get-Process ngrok -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force; Write-Host '   ✅ ngrok arrêté (PID:' $_.Id ')' -ForegroundColor Green }"
if errorlevel 1 (
    echo    ℹ️  Aucun processus ngrok trouvé
) else (
    echo    ✅ Tous les processus ngrok arrêtés
)

echo.

REM Arrêter le serveur de formulaire (processus PowerShell)
echo 🔍 Arrêt du serveur de formulaire...
powershell -ExecutionPolicy Bypass -Command "$found = $false; Get-Process powershell -ErrorAction SilentlyContinue | ForEach-Object { $cmdLine = (Get-WmiObject Win32_Process -Filter \"ProcessId = $($_.Id)\" -ErrorAction SilentlyContinue).CommandLine; if ($cmdLine -match 'serve-form') { Stop-Process -Id $_.Id -Force; Write-Host '   ✅ Serveur formulaire arrêté (PID:' $_.Id ')' -ForegroundColor Green; $found = $true } }; if (-not $found) { Write-Host '   ℹ️  Aucun serveur de formulaire trouvé' -ForegroundColor Gray }"

echo.

REM Vérifier que Docker est disponible
docker --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker n'est pas accessible, impossible d'arrêter les conteneurs
    echo    Les conteneurs peuvent toujours être en cours d'exécution
    goto :end
)

REM Aller dans le dossier docker
cd /d "%~dp0docker"
if not exist "docker-compose.yml" (
    echo ❌ Fichier docker-compose.yml introuvable dans le dossier docker
    cd /d "%~dp0"
    goto :end
)

REM Arrêter Docker (mode développement par défaut)
echo 📦 Arrêt des conteneurs Docker...
echo    - n8n
echo    - PostgreSQL
echo    - Ollama
echo.
docker compose down
if errorlevel 1 (
    echo.
    echo ❌ Erreur lors de l'arrêt de Docker
    echo    Certains conteneurs peuvent encore être en cours d'exécution
) else (
    echo.
    echo ✅ Conteneurs Docker arrêtés avec succès
)

REM Retour au répertoire racine
cd /d "%~dp0"

:end
echo.
echo ========================================
echo ✅ ARRÊT TERMINÉ
echo ========================================
echo.
echo 📋 Services arrêtés:
echo    ✅ ngrok (tous les tunnels)
echo    ✅ Serveur de formulaire PowerShell
echo    ✅ Conteneurs Docker (n8n, PostgreSQL, Ollama)
echo.
echo 💡 Pour redémarrer: start.bat
echo.
echo Fermeture automatique dans 5 secondes...
timeout /t 5 /nobreak >nul

