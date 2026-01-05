@echo off
REM Script pour vérifier les permissions HTTP configurées

echo ========================================
echo Verification des permissions HTTP
echo ========================================
echo.

netsh http show urlacl | findstr "8080"

if %errorLevel% equ 0 (
    echo.
    echo Les permissions sont configurees pour le port 8080
) else (
    echo.
    echo Aucune permission configuree pour le port 8080
    echo.
    echo Pour configurer, executez en tant qu'administrateur:
    echo   scripts\setup-http-permissions.bat
)

echo.
pause

