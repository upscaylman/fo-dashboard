@echo off

REM Vérifier si le script est exécuté en tant qu'administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Demande d'élévation des privilèges administrateur...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================
echo 🚀 DÉMARRAGE - MODE DÉVELOPPEMENT
echo ========================================
echo.

REM Vérifier que Docker est disponible
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé ou non accessible
    echo    Veuillez installer Docker Desktop et réessayer
    pause
    exit /b 1
)

REM Aller dans le dossier docker
cd /d "%~dp0docker"
if not exist "docker-compose.yml" (
    echo ❌ Fichier docker-compose.yml introuvable dans le dossier docker
    pause
    exit /b 1
)

REM Démarrer Docker (mode développement par défaut)
echo 📦 Démarrage des services Docker...
echo    - PostgreSQL (base de données)
echo    - n8n (orchestrateur de workflows)
echo    - Ollama (IA locale)
echo.
docker compose up -d
if errorlevel 1 (
    echo.
    echo ❌ Erreur lors du démarrage de Docker
    echo    Vérifiez que Docker Desktop est démarré
    pause
    exit /b 1
)

REM Attendre que PostgreSQL soit prêt
echo.
echo ⏳ Attente du démarrage de PostgreSQL et n8n...
timeout /t 10 /nobreak >nul

REM Vérifier que les conteneurs sont bien démarrés
docker compose ps | findstr /C:"Up" >nul
if errorlevel 1 (
    echo ⚠️  Certains conteneurs ne semblent pas démarrés correctement
    echo    Vérifiez avec: docker compose ps
)

REM Retour au répertoire racine
cd /d "%~dp0"

REM Démarrer ngrok automatiquement
echo.
echo 🌐 Démarrage du tunnel ngrok...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\start-ngrok.ps1"
if errorlevel 1 (
    echo    ⚠️  Erreur lors du démarrage de ngrok, utilisation de localhost
    echo    Vous pouvez démarrer ngrok manuellement avec: start-ngrok.bat
)

REM Démarrer ngrok http 8080
echo.
echo 🌐 Démarrage de ngrok http 8080...
start "🌐 ngrok http 8080" /min cmd /c "%~dp0scripts\start-ngrok-8080.bat"
timeout /t 2 /nobreak >nul
echo    ✅ ngrok http 8080 démarré

REM Démarrer le serveur de formulaire en arrière-plan
echo.
echo 🌐 Démarrage du serveur de formulaire...
if exist "templates\form\serve-form-wrapper.ps1" (
    start "Serveur Formulaire" powershell -ExecutionPolicy Bypass -NoExit -Command "cd '%~dp0templates\form'; .\serve-form-wrapper.ps1"
    timeout /t 2 /nobreak >nul
    echo    ✅ Serveur de formulaire démarré
) else (
    echo ⚠️  Script serve-form-wrapper.ps1 introuvable, serveur formulaire non démarré
)

echo.
echo ========================================
echo ✅ TOUT EST DÉMARRÉ !
echo ========================================
echo.
echo 📋 Accès aux services:
echo    - n8n Interface: http://localhost:5678
echo    - Formulaire:     http://localhost:8080
echo    - PostgreSQL:     localhost:5432
echo    - Ollama:         http://localhost:11434
echo.
echo 💡 Commandes utiles:
echo    - Arrêter:        stop.bat
echo    - Voir les logs:  cd docker ^&^& docker compose logs -f
echo    - Redémarrer:     stop.bat puis start.bat
echo    - Démarrer ngrok: start-ngrok.bat
echo    - Arrêter ngrok:  stop-ngrok.bat
echo.
echo 📝 Mode: DÉVELOPPEMENT (docker-compose.yml)
echo    Pour la production: cd docker ^&^& docker compose -f docker-compose.prod.yml up -d
echo.
echo Fermeture automatique dans 3 secondes...
timeout /t 3 /nobreak >nul
