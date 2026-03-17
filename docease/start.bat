@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM ============================================
REM DocEase - Demarrage complet
REM Ordre: Docker -> Formulaire (8080) -> ngrok
REM ============================================

REM Sauvegarder le repertoire du script
set "SCRIPT_DIR=%~dp0"

REM Verifier les privileges administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Elevation des privileges administrateur...
    powershell -Command "Start-Process cmd.exe -ArgumentList '/c cd /d \"%SCRIPT_DIR%.\" && \"%SCRIPT_DIR%start.bat\"' -Verb RunAs"
    exit /b
)

echo.
echo ========================================
echo  DocEase - DEMARRAGE
echo ========================================
echo.

REM === ETAPE 1: Docker ===
echo [1/3] Verification de Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas installe ou Docker Desktop n'est pas lance.
    pause
    exit /b 1
)
echo [OK] Docker disponible

cd /d "%SCRIPT_DIR%docker"
if not exist "docker-compose.yml" (
    echo [ERREUR] docker-compose.yml introuvable dans %SCRIPT_DIR%docker
    pause
    exit /b 1
)

echo [INFO] Demarrage des conteneurs (PostgreSQL, n8n, Ollama)...
docker compose up -d 2>nul
echo [INFO] Attente du demarrage (10s)...
timeout /t 10 /nobreak >nul
docker compose ps 2>nul | findstr /C:"Up" >nul
if errorlevel 1 (
    echo [ATTENTION] Certains conteneurs ne semblent pas demarres.
    echo             Verifiez : cd docker ^& docker compose ps
) else (
    echo [OK] Conteneurs Docker demarres
)

cd /d "%SCRIPT_DIR%"

REM === ETAPE 2: Serveur Formulaire (port 8080) ===
echo.
echo [2/3] Build + demarrage du serveur formulaire (port 8080)...
if exist "%SCRIPT_DIR%templates\formulaire\package.json" (
    echo [INFO] Build de l'application...
    cd /d "%SCRIPT_DIR%templates\formulaire"
    call npm run build
    cd /d "%SCRIPT_DIR%"
    echo [INFO] Demarrage du serveur Node.js (avec watchdog)...
    start "DocEase - Formulaire (watchdog)" /min node "%SCRIPT_DIR%templates\formulaire\watchdog.cjs"
    echo [INFO] Attente du demarrage serveur (5s)...
    timeout /t 5 /nobreak >nul
    echo [OK] Serveur formulaire demarre sur http://localhost:8080 (watchdog actif)
) else (
    echo [ATTENTION] templates\formulaire introuvable, serveur non demarre
)

REM === ETAPE 3: ngrok (tunnel vers port 8080) ===
echo.
echo [3/3] Demarrage de ngrok (tunnel http 8080)...
start "DocEase - ngrok" /min cmd /c ""%SCRIPT_DIR%scripts\start-ngrok-8080.bat""
timeout /t 5 /nobreak >nul

REM Recuperer l'URL ngrok
set "NGROK_URL="
for /f "delims=" %%u in ('powershell -ExecutionPolicy Bypass -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:4040/api/tunnels' -TimeoutSec 5 -ErrorAction Stop; ($r.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1).public_url } catch { '' }" 2^>nul') do set "NGROK_URL=%%u"

echo.
echo ========================================
echo  TOUT EST DEMARRE !
echo ========================================
echo.
echo  Services:
echo    - n8n:         http://localhost:5678
echo    - Formulaire:  http://localhost:8080
echo    - Ollama:      http://localhost:11434
echo    - ngrok:       http://localhost:4040
if defined NGROK_URL (
    echo    - URL publique: %NGROK_URL%
)
echo.
echo  Commandes:
echo    - Arreter:     stop.bat
echo    - Logs:        cd docker ^& docker compose logs -f
echo.
pause
