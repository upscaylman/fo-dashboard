@echo off
REM Script pour configurer les permissions HTTP pour le serveur PowerShell
REM Permet au serveur d'écouter sur toutes les interfaces sans droits admin

echo ========================================
echo Configuration des permissions HTTP
echo ========================================
echo.
echo Ce script va configurer Windows pour permettre au serveur
echo PowerShell d'ecouter sur le port 8080 sans droits admin.
echo.
echo IMPORTANT: Ce script doit etre execute EN TANT QU'ADMINISTRATEUR
echo.
pause

REM Vérifier les droits admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERREUR: Ce script doit etre execute en tant qu'administrateur
    echo.
    echo Faites un clic droit sur ce fichier et selectionnez:
    echo "Executer en tant qu'administrateur"
    echo.
    pause
    exit /b 1
)

echo.
echo Configuration de la reservation d'URL...
echo Tentative 1: Utilisateur actuel (%USERNAME%)
netsh http add urlacl url=http://+:8080/ user=%USERDOMAIN%\%USERNAME%

if %errorLevel% neq 0 (
    echo.
    echo Tentative 2: Groupe Utilisateurs (SID universel)
    netsh http add urlacl url=http://+:8080/ user="NT AUTHORITY\Authenticated Users"
)

if %errorLevel% neq 0 (
    echo.
    echo Tentative 3: Tous les utilisateurs (SID S-1-1-0)
    netsh http add urlacl url=http://+:8080/ sddl=D:(A;;GX;;;S-1-1-0)
)

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCES !
    echo ========================================
    echo.
    echo Le serveur PowerShell peut maintenant ecouter sur toutes
    echo les interfaces reseau sans droits administrateur.
    echo.
    echo Vous pouvez maintenant lancer start.bat normalement.
    echo.
) else (
    echo.
    echo ERREUR lors de la configuration
    echo.
)

pause

