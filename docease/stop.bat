@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM === DocEase - Arret de tous les services ===

set "SCRIPT_DIR=%~dp0"
if "!SCRIPT_DIR:~-1!"=="\" set "SCRIPT_DIR=!SCRIPT_DIR:~0,-1!"

REM Verifier privileges administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Elevation des privileges administrateur...
    powershell -Command "Start-Process cmd.exe -ArgumentList '/c cd /d \"!SCRIPT_DIR!\" && \"!SCRIPT_DIR!\stop.bat\"' -Verb RunAs"
    exit /b
)

echo.
echo ========================================
echo  DocEase - ARRET DES SERVICES
echo ========================================
echo.

REM --- 1. Arreter ngrok ---
echo [1/3] Arret de ngrok...
taskkill /F /IM ngrok.exe >nul 2>&1
if %errorLevel% equ 0 (
    echo    [OK] ngrok arrete.
) else (
    echo    [--] Aucun processus ngrok trouve.
)

echo.

REM --- 2. Arreter le serveur formulaire (Node.js serve.cjs sur port 8080) ---
echo [2/3] Arret du serveur formulaire (port 8080)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080.*LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
    echo    [OK] Processus PID %%a arrete.
)
REM Tuer les processus node serve.cjs restants
powershell -ExecutionPolicy Bypass -Command "Get-Process node -ErrorAction SilentlyContinue | ForEach-Object { $cmd = (Get-CimInstance Win32_Process -Filter \"ProcessId = $($_.Id)\" -ErrorAction SilentlyContinue).CommandLine; if ($cmd -match 'serve\.cjs') { Stop-Process -Id $_.Id -Force; Write-Host '   [OK] serve.cjs arrete (PID:' $_.Id ')' } }"
echo    [OK] Serveur formulaire arrete.

echo.

REM --- 3. Arreter Docker ---
echo [3/3] Arret des conteneurs Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo    [ATTENTION] Docker non accessible, conteneurs non arretes.
    goto :end
)

cd /d "!SCRIPT_DIR!\docker"
if not exist "docker-compose.yml" (
    echo    [ATTENTION] docker-compose.yml introuvable.
    cd /d "!SCRIPT_DIR!"
    goto :end
)

docker compose down
if errorlevel 1 (
    echo    [ERREUR] Erreur lors de l'arret de Docker.
) else (
    echo    [OK] Conteneurs Docker arretes (n8n, PostgreSQL, Ollama).
)

cd /d "!SCRIPT_DIR!"

:end
echo.
echo ========================================
echo  ARRET TERMINE
echo ========================================
echo.
echo  Services arretes:
echo    - ngrok (tunnel)
echo    - Serveur formulaire (Node.js)
echo    - Conteneurs Docker
echo.
echo  Pour redemarrer: start.bat
echo.
echo Fermeture dans 5 secondes...
timeout /t 5 /nobreak >nul

