@echo off
echo ========================================
echo 🌐 DÉMARRAGE NGROK HTTP 8080
echo ========================================
echo.

REM Chercher ngrok dans plusieurs emplacements possibles
set "NGROK_PATH="

REM Essayer d'abord avec le PATH système
where ngrok >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('where ngrok') do set "NGROK_PATH=%%i"
    goto :found
)

REM Chercher dans les emplacements communs pour l'utilisateur INVITE
if exist "C:\Users\INVITE\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" (
    set "NGROK_PATH=C:\Users\INVITE\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
    goto :found
)

REM Chercher dans LOCALAPPDATA (utilisateur admin)
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe" (
    set "NGROK_PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"
    goto :found
)

REM Autres emplacements
if exist "%LOCALAPPDATA%\Microsoft\WindowsApps\ngrok.exe" (
    set "NGROK_PATH=%LOCALAPPDATA%\Microsoft\WindowsApps\ngrok.exe"
    goto :found
)

if exist "C:\Program Files\ngrok\ngrok.exe" (
    set "NGROK_PATH=C:\Program Files\ngrok\ngrok.exe"
    goto :found
)

if exist "C:\ngrok\ngrok.exe" (
    set "NGROK_PATH=C:\ngrok\ngrok.exe"
    goto :found
)

REM Si ngrok n'est pas trouvé
echo ❌ ngrok n'est pas trouvé
echo.
echo Emplacements recherchés:
echo    - PATH système
echo    - C:\Users\INVITE\AppData\Local\Microsoft\WinGet\Packages\...
echo    - %LOCALAPPDATA%\Microsoft\WinGet\Packages\...
echo    - %LOCALAPPDATA%\Microsoft\WindowsApps\
echo    - C:\Program Files\ngrok\
echo    - C:\ngrok\
echo.
echo Installez ngrok avec: install-ngrok.bat
pause
exit /b 1

:found
echo ✅ ngrok trouvé: %NGROK_PATH%
echo.
echo Démarrage de ngrok http 8080 avec surveillance...
echo.

REM Afficher une notification Windows
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0notify-and-minimize.ps1" -Title "ngrok http 8080" -Message "ngrok http 8080 est démarré ! Interface: http://localhost:4040" -Duration 10

REM Démarrer ngrok avec surveillance (le script redémarre ngrok s'il se déconnecte)
:loop
echo.
echo ========================================
echo Démarrage de ngrok http 8080...
echo ========================================
echo.

"%NGROK_PATH%" http 8080

echo.
echo ========================================
echo ⚠️  ngrok s'est arrêté - Envoi notification email...
echo ========================================
echo.

REM Envoyer l'email de notification
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command "try { $emailData = @{ emailEnvoi = 'bouvier.jul@gmail.com;aguillermin@fo-metaux.fr'; nomDestinataire = 'Équipe Technique'; customEmailMessage = 'Bonjour,`n`nLe serveur local DocEase (ngrok) s''est déconnecté.`n`nPour redémarrer :`n1. Ouvrez le dossier du projet`n2. Double-cliquez sur start.bat`n3. Mot de passe admin : joubert`n`nCordialement,`nSystème de Monitoring DocEase'; templateName = '⚠️ Déconnexion Serveur Local DocEase' } | ConvertTo-Json -Depth 10; Invoke-RestMethod -Uri 'http://localhost:5678/webhook/1ee6e745-fc31-4fd8-bc59-531bd4a69997' -Method POST -Body $emailData -ContentType 'application/json' -TimeoutSec 30 | Out-Null; Write-Host '✅ Email de notification envoyé' -ForegroundColor Green; } catch { Write-Host '❌ Erreur envoi email : $_' -ForegroundColor Red; }"

echo.
echo Redémarrage dans 10 secondes...
timeout /t 10 /nobreak >nul

goto loop

